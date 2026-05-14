const mongoose = require('mongoose');

const waitlistEntrySchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    appointmentType: { type: String, required: true, lowercase: true },
    desiredDate: Date,
    reason: String,
    status: {
      type: String,
      enum: ['waiting', 'offered', 'booked', 'expired', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    offeredSlot: {
      startsAt: Date,
      endsAt: Date,
      offeredAt: Date,
      expiresAt: Date,
    },
    resolution: {
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: Date,
      reason: String,
    },
  },
  { timestamps: true }
);

waitlistEntrySchema.index({ doctor: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('WaitlistEntry', waitlistEntrySchema);
