const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const {
  ACTIVE_APPOINTMENT_STATUSES,
} = require('../utils/lifecycle');
const {
  addMinutes,
  combineDateAndMinutes,
  dateKey,
  enumerateDates,
  parseTimeToMinutes,
  rangesOverlap,
  toDateOnly,
} = require('../utils/dates');
const { logAction } = require('./auditService');

const getDoctorOrThrow = async (doctorId) => {
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isDeleted: false });
  if (!doctor) throw new AppError('Doctor not found.', 404, 'DOCTOR_NOT_FOUND');
  return doctor;
};

const getAppointmentType = (doctor, code = 'consultation') => {
  const types = doctor.doctorProfile?.appointmentTypes || [];
  const type = types.find((item) => item.code === String(code).toLowerCase());
  if (!type) throw new AppError('Unsupported appointment type for this doctor.', 400, 'INVALID_APPOINTMENT_TYPE');
  return type;
};

const normalizeSchedule = (weeklySchedule = []) => {
  return weeklySchedule.map((day) => ({
    dayOfWeek: Number(day.dayOfWeek),
    enabled: Boolean(day.enabled),
    windows: (day.windows || []).map((window) => ({
      start: window.start,
      end: window.end,
    })),
  }));
};

const validateWindows = (windows) => {
  const normalized = (windows || []).map((window) => ({
    start: parseTimeToMinutes(window.start),
    end: parseTimeToMinutes(window.end),
  }));
  normalized.forEach((window) => {
    if (!Number.isFinite(window.start) || !Number.isFinite(window.end) || window.start >= window.end) {
      throw new AppError('Schedule windows must have valid start and end times.', 400, 'INVALID_TIME_WINDOW');
    }
  });
  for (let i = 0; i < normalized.length; i += 1) {
    for (let j = i + 1; j < normalized.length; j += 1) {
      if (normalized[i].start < normalized[j].end && normalized[j].start < normalized[i].end) {
        throw new AppError('Schedule windows cannot overlap.', 400, 'WINDOW_OVERLAP');
      }
    }
  }
};

const assertScheduleEditAllowed = async (doctorId, weeklySchedule, freezeDays) => {
  normalizeSchedule(weeklySchedule).forEach((day) => validateWindows(day.windows));

  const freezeUntil = addMinutes(new Date(), Number(freezeDays || 0) * 24 * 60);
  const activeAppointments = await Appointment.find({
    doctor: doctorId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startsAt: { $lte: freezeUntil },
    isDeleted: false,
  }).lean();

  if (activeAppointments.length) {
    throw new AppError(
      'Schedule is frozen because active appointments exist inside the configured freeze window.',
      409,
      'SCHEDULE_FROZEN'
    );
  }

  const futureAppointments = await Appointment.countDocuments({
    doctor: doctorId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startsAt: { $gt: new Date() },
    isDeleted: false,
  });
  if (futureAppointments) {
    throw new AppError(
      'Schedule changes are rejected while future active appointments exist. Reschedule or cancel affected appointments first.',
      409,
      'SCHEDULE_HAS_ACTIVE_APPOINTMENTS'
    );
  }
};

const updateWeeklySchedule = async (doctorId, payload, actor, req) => {
  const doctor = await getDoctorOrThrow(doctorId);
  const previousState = doctor.doctorProfile;
  await assertScheduleEditAllowed(
    doctorId,
    payload.weeklySchedule,
    payload.scheduleFrozenUntilDays ?? doctor.doctorProfile?.scheduleFrozenUntilDays
  );

  doctor.doctorProfile.weeklySchedule = normalizeSchedule(payload.weeklySchedule);
  if (payload.bufferMinutes !== undefined) doctor.doctorProfile.bufferMinutes = payload.bufferMinutes;
  if (payload.appointmentTypes) doctor.doctorProfile.appointmentTypes = payload.appointmentTypes;
  if (payload.scheduleFrozenUntilDays !== undefined) {
    doctor.doctorProfile.scheduleFrozenUntilDays = payload.scheduleFrozenUntilDays;
  }

  await doctor.save();
  await logAction({
    actor,
    action: 'schedule.changed',
    entityType: 'User',
    entityId: doctor._id,
    previousState,
    newState: doctor.doctorProfile,
    req,
  });
  return doctor.doctorProfile;
};

const upsertAvailabilityOverride = async (doctorId, payload, actor, req) => {
  const doctor = await getDoctorOrThrow(doctorId);
  const key = dateKey(payload.date);
  validateWindows(payload.blocks || []);
  validateWindows(payload.extraWindows || []);

  const dayStart = toDateOnly(payload.date);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const appointmentsForDay = await Appointment.find({
    doctor: doctorId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startsAt: { $lt: dayEnd },
    endsAt: { $gt: dayStart },
    isDeleted: false,
  }).lean();
  if (payload.unavailable && appointmentsForDay.length) {
    throw new AppError('Cannot mark a day unavailable while active appointments exist.', 409, 'OVERRIDE_CONFLICT');
  }
  const blockRanges = (payload.blocks || []).map((block) => ({
    startsAt: combineDateAndMinutes(payload.date, parseTimeToMinutes(block.start)),
    endsAt: combineDateAndMinutes(payload.date, parseTimeToMinutes(block.end)),
  }));
  const blockedAppointment = appointmentsForDay.find((appointment) =>
    slotConflicts(appointment.startsAt, appointment.endsAt, blockRanges)
  );
  if (blockedAppointment) {
    throw new AppError('Blocked period conflicts with an active appointment.', 409, 'OVERRIDE_CONFLICT');
  }

  const previousState = doctor.doctorProfile.availabilityOverrides.find((item) => dateKey(item.date) === key);
  const next = {
    date: toDateOnly(payload.date),
    unavailable: Boolean(payload.unavailable),
    blocks: payload.blocks || [],
    extraWindows: payload.extraWindows || [],
    reason: payload.reason,
  };

  const index = doctor.doctorProfile.availabilityOverrides.findIndex((item) => dateKey(item.date) === key);
  if (index >= 0) doctor.doctorProfile.availabilityOverrides[index] = next;
  else doctor.doctorProfile.availabilityOverrides.push(next);

  await doctor.save();
  await logAction({
    actor,
    action: 'schedule.override.changed',
    entityType: 'User',
    entityId: doctor._id,
    previousState,
    newState: next,
    req,
  });
  return next;
};

const getWindowsForDate = (doctor, date) => {
  const key = dateKey(date);
  const override = (doctor.doctorProfile?.availabilityOverrides || []).find((item) => dateKey(item.date) === key);
  if (override?.unavailable) return { windows: [], blocks: [], override };

  const dayOfWeek = toDateOnly(date).getUTCDay();
  const recurring = (doctor.doctorProfile?.weeklySchedule || []).find((day) => day.dayOfWeek === dayOfWeek);
  const windows = recurring?.enabled ? [...(recurring.windows || [])] : [];
  if (override?.extraWindows?.length) windows.push(...override.extraWindows);
  return { windows, blocks: override?.blocks || [], override };
};

const slotConflicts = (slotStart, slotEnd, ranges) => {
  return ranges.some((range) => rangesOverlap(slotStart, slotEnd, range.startsAt, range.endsAt));
};

const generateAvailableSlots = async ({ doctorId, from, to, appointmentType = 'consultation' }) => {
  const doctor = await getDoctorOrThrow(doctorId);
  const type = getAppointmentType(doctor, appointmentType);
  const buffer = doctor.doctorProfile?.bufferMinutes || 0;
  const dates = enumerateDates(from, to || from);
  const rangeStart = toDateOnly(dates[0]);
  const rangeEnd = addMinutes(toDateOnly(dates[dates.length - 1]), 24 * 60);

  const appointments = await Appointment.find({
    doctor: doctorId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startsAt: { $lt: rangeEnd },
    endsAt: { $gt: rangeStart },
    isDeleted: false,
  }).lean();

  const slots = [];
  dates.forEach((date) => {
    const { windows, blocks } = getWindowsForDate(doctor, date);
    const blockRanges = blocks.map((block) => ({
      startsAt: combineDateAndMinutes(date, parseTimeToMinutes(block.start)),
      endsAt: combineDateAndMinutes(date, parseTimeToMinutes(block.end)),
    }));

    windows.forEach((window) => {
      const windowStart = parseTimeToMinutes(window.start);
      const windowEnd = parseTimeToMinutes(window.end);
      for (
        let cursor = windowStart;
        cursor + type.durationMinutes <= windowEnd;
        cursor += type.durationMinutes + buffer
      ) {
        const startsAt = combineDateAndMinutes(date, cursor);
        const endsAt = addMinutes(startsAt, type.durationMinutes);
        if (startsAt < new Date()) continue;
        if (slotConflicts(startsAt, endsAt, appointments)) continue;
        if (slotConflicts(startsAt, endsAt, blockRanges)) continue;
        slots.push({
          doctor: doctor._id,
          appointmentType: type.code,
          durationMinutes: type.durationMinutes,
          startsAt,
          endsAt,
          isEmergency: Boolean(type.isEmergency),
        });
      }
    });
  });

  return slots;
};

const assertSlotIsBookable = async ({ doctorId, patientId, startsAt, endsAt, session, excludeAppointmentId }) => {
  const exclude = excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {};
  const doctorConflict = await Appointment.findOne({
    ...exclude,
    doctor: doctorId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
    isDeleted: false,
  }).session(session);
  if (doctorConflict) throw new AppError('Doctor already has an appointment in this time range.', 409, 'DOCTOR_CONFLICT');

  const patientConflict = await Appointment.findOne({
    ...exclude,
    patient: patientId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
    isDeleted: false,
  }).session(session);
  if (patientConflict) throw new AppError('Patient already has an appointment in this time range.', 409, 'PATIENT_CONFLICT');
};

module.exports = {
  assertSlotIsBookable,
  generateAvailableSlots,
  getAppointmentType,
  getDoctorOrThrow,
  getWindowsForDate,
  updateWeeklySchedule,
  upsertAvailabilityOverride,
};
