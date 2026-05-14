const Appointment = require('../models/Appointment');
const User = require('../models/User');
const WaitlistEntry = require('../models/WaitlistEntry');
const AppError = require('../utils/AppError');
const { assertTransition } = require('../utils/lifecycle');
const { addMinutes } = require('../utils/dates');
const { assertSlotIsBookable, generateAvailableSlots, getAppointmentType, getDoctorOrThrow } = require('./scheduleService');
const { logAction } = require('./auditService');
const { createNotification } = require('./notificationService');

const canAccessAppointment = (user, appointment) => {
  if (user.role === 'doctor') return appointment.doctor.toString() === user.id;
  return appointment.patient.toString() === user.id;
};

const getAppointmentOrThrow = async (id) => {
  const appointment = await Appointment.findOne({ _id: id, isDeleted: false });
  if (!appointment) throw new AppError('Appointment not found.', 404, 'APPOINTMENT_NOT_FOUND');
  return appointment;
};

const listAppointments = (user, filters = {}) => {
  const query = { isDeleted: false };
  if (user.role === 'patient') query.patient = user.id;
  if (user.role === 'doctor') query.doctor = user.id;
  if (filters.status) query.status = filters.status;
  return Appointment.find(query).populate('patient doctor waitlistEntry', 'fullName email role doctorProfile.specialization desiredDate reason status').sort({ startsAt: -1 });
};

const listWaitlistEntries = (user, filters = {}) => {
  const query = {};
  if (user.role === 'patient') query.patient = user.id;
  if (user.role === 'doctor') query.doctor = user.id;
  if (filters.status) query.status = filters.status;
  return WaitlistEntry.find(query)
    .populate('patient doctor', 'fullName email role doctorProfile.specialization')
    .sort({ createdAt: -1 });
};

const bookAppointment = async ({ patientId, doctorId, startsAt, appointmentType, reason, isEmergency = false }, actor, req) => {
  const doctor = await getDoctorOrThrow(doctorId);
  const patient = await User.findOne({ _id: patientId, role: 'patient', isDeleted: false });
  if (!patient) throw new AppError('Patient not found.', 404, 'PATIENT_NOT_FOUND');

  const type = getAppointmentType(doctor, appointmentType);
  const startDate = new Date(startsAt);
  const endDate = addMinutes(startDate, type.durationMinutes);

  const slots = await generateAvailableSlots({
    doctorId,
    from: startDate,
    to: startDate,
    appointmentType: type.code,
  });
  const matchesDynamicSlot = slots.some((slot) => slot.startsAt.getTime() === startDate.getTime());
  if (!matchesDynamicSlot && !isEmergency) {
    throw new AppError('Requested slot is not available.', 409, 'SLOT_UNAVAILABLE');
  }

  await assertSlotIsBookable({ doctorId, patientId, startsAt: startDate, endsAt: endDate });

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    appointmentType: type.code,
    reason,
    specialty: doctor.doctorProfile?.specialization,
    room: doctor.doctorProfile?.room,
    startsAt: startDate,
    endsAt: endDate,
    durationMinutes: type.durationMinutes,
    isEmergency: Boolean(isEmergency || type.isEmergency),
    status: 'pending',
    statusHistory: [{ toStatus: 'pending', reason: 'Appointment requested', changedBy: actor }],
  });

  await logAction({
    actor,
    action: 'appointment.booked',
    entityType: 'Appointment',
    entityId: appointment._id,
    newState: appointment.toObject(),
    req,
  });
  await createNotification({
    recipient: doctorId,
    type: 'appointment.booking',
    title: 'New appointment request',
    message: `${patient.fullName} requested an appointment.`,
    entityType: 'Appointment',
    entityId: appointment._id,
  });

  return appointment;
};

const transitionAppointment = async ({ id, status, reason }, user, req) => {
  const appointment = await getAppointmentOrThrow(id);
  if (!canAccessAppointment(user, appointment)) throw new AppError('Not permitted to access this appointment.', 403, 'FORBIDDEN');
  if (status === 'completed' && user.role !== 'doctor') {
    throw new AppError('Only doctors can complete appointments.', 403, 'FORBIDDEN');
  }
  if (status === 'confirmed' && user.role === 'patient') {
    throw new AppError('Patients cannot confirm appointments.', 403, 'FORBIDDEN');
  }

  assertTransition(appointment.status, status);
  const previousState = appointment.toObject();
  appointment.statusHistory.push({
    fromStatus: appointment.status,
    toStatus: status,
    reason,
    changedBy: user.id,
  });
  appointment.status = status;
  appointment.statusReason = reason;

  if (status === 'no-show') {
    appointment.noShow = { markedBy: user.id, markedAt: new Date() };
    await User.updateOne({ _id: appointment.patient }, { $inc: { 'patientProfile.noShowCount': 1 } });
    await User.updateOne({ _id: appointment.doctor }, { $inc: { 'doctorProfile.analytics.noShowCount': 1 } });
  }
  if (status === 'completed') {
    await User.updateOne({ _id: appointment.doctor }, { $inc: { 'doctorProfile.analytics.completedCount': 1 } });
  }

  await appointment.save();
  await logAction({
    actor: user.id,
    action: `appointment.${status}`,
    entityType: 'Appointment',
    entityId: appointment._id,
    previousState,
    newState: appointment.toObject(),
    req,
  });
  return appointment;
};

const cancelAppointment = async ({ id, reason }, user, req) => {
  const appointment = await getAppointmentOrThrow(id);
  if (!canAccessAppointment(user, appointment)) throw new AppError('Not permitted to cancel this appointment.', 403, 'FORBIDDEN');

  const hoursBefore = (appointment.startsAt.getTime() - Date.now()) / (60 * 60 * 1000);
  if (user.role === 'patient' && hoursBefore < 4) {
    throw new AppError('Patient cancellations must be at least 4 hours before the appointment.', 409, 'CANCELLATION_WINDOW_CLOSED');
  }

  assertTransition(appointment.status, 'cancelled');
  const previousState = appointment.toObject();
  appointment.status = 'cancelled';
  appointment.cancellation = {
    cancelledBy: user.id,
    cancelledAt: new Date(),
    reason,
  };
  appointment.statusHistory.push({
    fromStatus: previousState.status,
    toStatus: 'cancelled',
    reason,
    changedBy: user.id,
  });
  await appointment.save();

  await User.updateOne({ _id: appointment.doctor }, { $inc: { 'doctorProfile.analytics.cancellationCount': 1 } });
  await offerCancelledSlotToWaitlist(appointment, req);
  await logAction({
    actor: user.id,
    action: 'appointment.cancelled',
    entityType: 'Appointment',
    entityId: appointment._id,
    previousState,
    newState: appointment.toObject(),
    req,
  });
  return appointment;
};

const rescheduleAppointment = async ({ id, startsAt, reason }, user, req) => {
  const appointment = await Appointment.findOne({ _id: id, isDeleted: false });
  if (!appointment) throw new AppError('Appointment not found.', 404, 'APPOINTMENT_NOT_FOUND');
  if (!canAccessAppointment(user, appointment)) throw new AppError('Not permitted to reschedule.', 403, 'FORBIDDEN');
  assertTransition(appointment.status, 'rescheduled');

  const doctor = await getDoctorOrThrow(appointment.doctor);
  const type = getAppointmentType(doctor, appointment.appointmentType);
  const newStart = new Date(startsAt);
  const newEnd = addMinutes(newStart, type.durationMinutes);
  await assertSlotIsBookable({
    doctorId: appointment.doctor,
    patientId: appointment.patient,
    startsAt: newStart,
    endsAt: newEnd,
    excludeAppointmentId: appointment._id,
  });

  const previousState = appointment.toObject();
  appointment.reschedule = {
    previousStartsAt: appointment.startsAt,
    previousEndsAt: appointment.endsAt,
    newStartsAt: newStart,
    newEndsAt: newEnd,
    reason,
    rescheduledBy: user.id,
    rescheduledAt: new Date(),
  };
  appointment.startsAt = newStart;
  appointment.endsAt = newEnd;
  appointment.status = user.role === 'patient' ? 'pending' : 'confirmed';
  appointment.statusHistory.push({
    fromStatus: previousState.status,
    toStatus: 'rescheduled',
    reason,
    changedBy: user.id,
  });
  appointment.statusHistory.push({
    fromStatus: 'rescheduled',
    toStatus: appointment.status,
    reason: 'Rescheduled time applied',
    changedBy: user.id,
  });
  await appointment.save();

  await logAction({
    actor: user.id,
    action: 'appointment.rescheduled',
    entityType: 'Appointment',
    entityId: appointment._id,
    previousState,
    newState: appointment.toObject(),
    req,
  });
  return appointment;
};

const joinWaitlist = async ({ patientId, doctorId, appointmentType, desiredDate, reason }) => {
  await getDoctorOrThrow(doctorId);
  return WaitlistEntry.create({
    patient: patientId,
    doctor: doctorId,
    appointmentType,
    desiredDate,
    reason,
  });
};

const getManageableWaitlistEntry = async (id, user, populate = false) => {
  const query = { _id: id, doctor: user.id };
  const request = WaitlistEntry.findOne(query);
  if (populate) {
    request.populate(
      'patient doctor',
      'fullName email role doctorProfile.specialization doctorProfile.room doctorProfile.appointmentTypes'
    );
  }
  const entry = await request;
  if (!entry) throw new AppError('Waitlist entry not found or not assigned to this doctor.', 404, 'WAITLIST_NOT_FOUND');
  return entry;
};

const acceptWaitlistEntry = async ({ id, startsAt }, user, req) => {
  const entry = await getManageableWaitlistEntry(id, user, true);
  if (!['waiting', 'offered'].includes(entry.status)) {
    throw new AppError('This waitlist entry has already been resolved.', 409, 'WAITLIST_RESOLVED');
  }

  const type = getAppointmentType(entry.doctor, entry.appointmentType);
  const startDate = new Date(startsAt || entry.offeredSlot?.startsAt || entry.desiredDate);
  if (Number.isNaN(startDate.getTime())) {
    throw new AppError('A valid appointment time is required to accept a waitlist entry.', 400, 'INVALID_START_TIME');
  }
  const endDate = addMinutes(startDate, type.durationMinutes);
  await assertSlotIsBookable({
    doctorId: entry.doctor._id,
    patientId: entry.patient._id,
    startsAt: startDate,
    endsAt: endDate,
  });

  const appointment = await Appointment.create({
    patient: entry.patient._id,
    doctor: entry.doctor._id,
    appointmentType: type.code,
    reason: entry.reason,
    specialty: entry.doctor.doctorProfile?.specialization,
    room: entry.doctor.doctorProfile?.room,
    startsAt: startDate,
    endsAt: endDate,
    durationMinutes: type.durationMinutes,
    isEmergency: Boolean(type.isEmergency),
    source: 'waitlist',
    waitlistEntry: entry._id,
    status: 'confirmed',
    statusReason: 'Accepted from waitlist',
    statusHistory: [{ toStatus: 'confirmed', reason: 'Accepted from waitlist', changedBy: user.id }],
  });

  entry.status = 'booked';
  entry.resolution = { resolvedBy: user.id, resolvedAt: new Date(), reason: 'Accepted from waitlist' };
  await entry.save();

  await createNotification({
    recipient: entry.patient._id,
    type: 'waitlist.accepted',
    title: 'Waitlist appointment confirmed',
    message: 'Your waitlist request was accepted and an appointment was created.',
    entityType: 'Appointment',
    entityId: appointment._id,
  });
  await logAction({
    actor: user.id,
    action: 'waitlist.accepted',
    entityType: 'WaitlistEntry',
    entityId: entry._id,
    newState: { entry: entry.toObject(), appointment: appointment.toObject() },
    req,
  });
  return { entry, appointment };
};

const rejectWaitlistEntry = async ({ id, reason }, user, req) => {
  const entry = await getManageableWaitlistEntry(id, user);
  if (!['waiting', 'offered'].includes(entry.status)) {
    throw new AppError('This waitlist entry has already been resolved.', 409, 'WAITLIST_RESOLVED');
  }

  const previousState = entry.toObject();
  entry.status = 'cancelled';
  entry.resolution = { resolvedBy: user.id, resolvedAt: new Date(), reason };
  await entry.save();

  await createNotification({
    recipient: entry.patient,
    type: 'waitlist.rejected',
    title: 'Waitlist request declined',
    message: reason || 'Your waitlist request was declined.',
    entityType: 'WaitlistEntry',
    entityId: entry._id,
  });
  await logAction({
    actor: user.id,
    action: 'waitlist.rejected',
    entityType: 'WaitlistEntry',
    entityId: entry._id,
    previousState,
    newState: entry.toObject(),
    req,
  });
  return entry;
};

const offerCancelledSlotToWaitlist = async (appointment, req) => {
  const entry = await WaitlistEntry.findOne({
    doctor: appointment.doctor,
    appointmentType: appointment.appointmentType,
    status: 'waiting',
  }).sort({ createdAt: 1 });
  if (!entry) return;
  entry.status = 'offered';
  entry.offeredSlot = {
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    offeredAt: new Date(),
    expiresAt: addMinutes(new Date(), 60),
  };
  await entry.save();
  await createNotification({
    recipient: entry.patient,
    type: 'waitlist.slot_available',
    title: 'Appointment slot available',
    message: 'A requested appointment slot is now available.',
    entityType: 'WaitlistEntry',
    entityId: entry._id,
  });
  await logAction({
    action: 'waitlist.slot_offered',
    entityType: 'WaitlistEntry',
    entityId: entry._id,
    newState: entry.toObject(),
    req,
  });
};

const runAutomaticTransitions = async () => {
  const now = new Date();
  const pendingExpiry = addMinutes(now, -24 * 60);
  const pending = await Appointment.updateMany(
    { status: 'pending', createdAt: { $lt: pendingExpiry }, isDeleted: false },
    { $set: { status: 'rejected' }, $push: { statusHistory: { fromStatus: 'pending', toStatus: 'rejected', reason: 'Pending request expired' } } }
  );
  const noShows = await Appointment.updateMany(
    { status: 'confirmed', endsAt: { $lt: now }, isDeleted: false },
    { $set: { status: 'no-show', 'noShow.markedAt': now }, $push: { statusHistory: { fromStatus: 'confirmed', toStatus: 'no-show', reason: 'Automatically marked after missed appointment' } } }
  );
  return { expiredPending: pending.modifiedCount, noShows: noShows.modifiedCount };
};

module.exports = {
  acceptWaitlistEntry,
  bookAppointment,
  cancelAppointment,
  getAppointmentOrThrow,
  joinWaitlist,
  listAppointments,
  listWaitlistEntries,
  rescheduleAppointment,
  rejectWaitlistEntry,
  runAutomaticTransitions,
  transitionAppointment,
};
