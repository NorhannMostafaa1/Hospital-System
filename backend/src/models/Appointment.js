const mongoose = require('mongoose');
const { APPOINTMENT_STATUSES } = require('../utils/lifecycle');

const historySchema = new mongoose.Schema(
  {
    fromStatus: String,
    toStatus: String,
    reason: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointmentType: { type: String, required: true, trim: true, lowercase: true },
    reason: { type: String, trim: true },
    specialty: { type: String, trim: true },
    room: String,
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, required: true, min: 5 },
    isEmergency: { type: Boolean, default: false },
    source: { type: String, enum: ['direct', 'waitlist'], default: 'direct', index: true },
    waitlistEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'WaitlistEntry' },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending', index: true },
    statusReason: String,
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      cancelledAt: Date,
      reason: String,
    },
    reschedule: {
      previousStartsAt: Date,
      previousEndsAt: Date,
      newStartsAt: Date,
      newEndsAt: Date,
      reason: String,
      rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rescheduledAt: Date,
    },
    noShow: {
      markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      markedAt: Date,
    },
    statusHistory: { type: [historySchema], default: [] },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, startsAt: 1, endsAt: 1, status: 1, isDeleted: 1 });
appointmentSchema.index({ patient: 1, startsAt: 1, endsAt: 1, status: 1, isDeleted: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
