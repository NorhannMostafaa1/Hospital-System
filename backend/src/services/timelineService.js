const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const AppError = require('../utils/AppError');

const getPatientTimeline = async (patientId, user) => {
  if (user.role === 'patient' && user.id !== patientId) {
    throw new AppError('Patients can only access their own timeline.', 403, 'FORBIDDEN');
  }
  const appointmentScope = { patient: patientId, isDeleted: false };
  const recordScope = { patient: patientId, isDeleted: false };
  if (user.role === 'doctor') {
    appointmentScope.doctor = user.id;
    recordScope.doctor = user.id;
  }

  const [appointments, records] = await Promise.all([
    Appointment.find(appointmentScope).lean(),
    MedicalRecord.find(recordScope).lean(),
  ]);

  const events = [
    ...appointments.map((item) => ({
      type: 'appointment',
      occurredAt: item.startsAt,
      data: item,
    })),
    ...records.map((item) => ({
      type: 'medical_record',
      occurredAt: item.createdAt,
      data: item,
    })),
    ...records.flatMap((record) =>
      (record.amendments || []).map((amendment) => ({
        type: 'record_amendment',
        occurredAt: amendment.amendedAt,
        data: { record: record._id, amendment },
      }))
    ),
  ];

  return events.sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
};

module.exports = { getPatientTimeline };
