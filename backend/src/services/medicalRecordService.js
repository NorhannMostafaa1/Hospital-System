const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const AppError = require('../utils/AppError');
const { logAction } = require('./auditService');
const { createNotification } = require('./notificationService');

const canAccessRecord = (user, record) => {
  if (user.role === 'doctor') return record.doctor.toString() === user.id;
  return record.patient.toString() === user.id;
};

const createRecord = async (payload, user, req) => {
  const appointment = await Appointment.findOne({ _id: payload.appointment, isDeleted: false });
  if (!appointment) throw new AppError('Appointment not found.', 404, 'APPOINTMENT_NOT_FOUND');
  if (appointment.status !== 'completed') {
    throw new AppError('Medical records can only be created for completed appointments.', 409, 'APPOINTMENT_NOT_COMPLETED');
  }
  if (appointment.doctor.toString() !== user.id) {
    throw new AppError('Only the treating doctor can create this record.', 403, 'FORBIDDEN');
  }

  const existing = await MedicalRecord.findOne({ appointment: appointment._id, isDeleted: false });
  if (existing) throw new AppError('A record already exists for this appointment.', 409, 'RECORD_EXISTS');

  const record = await MedicalRecord.create({
    appointment: appointment._id,
    patient: appointment.patient,
    doctor: appointment.doctor,
    diagnosis: payload.diagnosis,
    symptoms: payload.symptoms || [],
    medications: payload.medications || [],
    prescriptions: payload.prescriptions || [],
    notes: payload.notes,
    labResults: payload.labResults || [],
    finalizedAt: payload.locked ? new Date() : undefined,
    locked: Boolean(payload.locked),
  });

  await logAction({
    actor: user.id,
    action: 'record.created',
    entityType: 'MedicalRecord',
    entityId: record._id,
    newState: record.toObject(),
    req,
  });
  await createNotification({
    recipient: record.patient,
    type: 'record.created',
    title: 'Medical record added',
    message: 'A doctor added a medical record to your timeline.',
    entityType: 'MedicalRecord',
    entityId: record._id,
  });
  return record;
};

const listRecords = (user, filters = {}) => {
  const query = { isDeleted: false };
  if (user.role === 'patient') query.patient = user.id;
  if (user.role === 'doctor') query.doctor = user.id;
  return MedicalRecord.find(query).populate('patient doctor appointment', 'fullName email startsAt endsAt status').sort({ createdAt: -1 });
};

const getRecord = async (id, user) => {
  const record = await MedicalRecord.findOne({ _id: id, isDeleted: false });
  if (!record) throw new AppError('Medical record not found.', 404, 'RECORD_NOT_FOUND');
  if (!canAccessRecord(user, record)) throw new AppError('Not permitted to access this record.', 403, 'FORBIDDEN');
  return record;
};

const amendRecord = async (id, payload, user, req) => {
  const record = await getRecord(id, user);
  if (user.role === 'patient') throw new AppError('Patients cannot amend medical records.', 403, 'FORBIDDEN');
  if (record.locked) throw new AppError('Locked medical records cannot be amended.', 409, 'RECORD_LOCKED');

  const mutableFields = ['diagnosis', 'symptoms', 'medications', 'prescriptions', 'notes', 'labResults'];
  const previousValues = {};
  const newValues = {};
  mutableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      previousValues[field] = record[field];
      newValues[field] = payload[field];
      record[field] = payload[field];
    }
  });

  record.amendments.push({
    previousValues,
    newValues,
    reason: payload.reason,
    amendedBy: user.id,
  });
  await record.save();
  await logAction({
    actor: user.id,
    action: 'record.amended',
    entityType: 'MedicalRecord',
    entityId: record._id,
    previousState: previousValues,
    newState: newValues,
    req,
  });
  return record;
};

const lockRecord = async (id, user, req) => {
  const record = await getRecord(id, user);
  if (user.role === 'patient') throw new AppError('Patients cannot lock medical records.', 403, 'FORBIDDEN');
  const previousState = { locked: record.locked, finalizedAt: record.finalizedAt };
  record.locked = true;
  record.finalizedAt = new Date();
  await record.save();
  await logAction({
    actor: user.id,
    action: 'record.locked',
    entityType: 'MedicalRecord',
    entityId: record._id,
    previousState,
    newState: { locked: record.locked, finalizedAt: record.finalizedAt },
    req,
  });
  return record;
};

const addAttachments = async (id, files, user, req) => {
  const record = await getRecord(id, user);
  if (user.role === 'patient') throw new AppError('Patients cannot upload clinical attachments.', 403, 'FORBIDDEN');
  const attachments = (files || []).map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedBy: user.id,
  }));
  record.attachments.push(...attachments);
  await record.save();
  await logAction({
    actor: user.id,
    action: 'record.attachments_added',
    entityType: 'MedicalRecord',
    entityId: record._id,
    newState: attachments,
    req,
  });
  return record;
};

const getAttachment = async (recordId, attachmentId, user) => {
  const record = await getRecord(recordId, user);
  const attachment = record.attachments.id(attachmentId);
  if (!attachment) throw new AppError('Attachment not found.', 404, 'ATTACHMENT_NOT_FOUND');
  return attachment;
};

module.exports = {
  addAttachments,
  amendRecord,
  createRecord,
  getAttachment,
  getRecord,
  listRecords,
  lockRecord,
};
