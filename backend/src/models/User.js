const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const timeWindowSchema = new mongoose.Schema(
  {
    start: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    end: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
  },
  { _id: false }
);

const weeklyScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    enabled: { type: Boolean, default: false },
    windows: { type: [timeWindowSchema], default: [] },
  },
  { _id: false }
);

const appointmentTypeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 240 },
    isEmergency: { type: Boolean, default: false },
  },
  { _id: false }
);

const overrideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    unavailable: { type: Boolean, default: false },
    blocks: { type: [timeWindowSchema], default: [] },
    extraWindows: { type: [timeWindowSchema], default: [] },
    reason: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['patient', 'doctor'], required: true },
    profileImage: String,
    patientProfile: {
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] },
      allergies: [String],
      chronicConditions: [String],
      medicalHistory: String,
      noShowCount: { type: Number, default: 0 },
    },
    doctorProfile: {
      specialization: String,
      department: String,
      licenseNumber: String,
      room: String,
      bufferMinutes: { type: Number, default: 0, min: 0, max: 120 },
      scheduleFrozenUntilDays: { type: Number, default: 1, min: 0, max: 30 },
      weeklySchedule: { type: [weeklyScheduleSchema], default: [] },
      appointmentTypes: {
        type: [appointmentTypeSchema],
        default: [
          { code: 'consultation', label: 'Consultation', durationMinutes: 30 },
          { code: 'follow-up', label: 'Follow-up', durationMinutes: 15 },
          { code: 'detailed-review', label: 'Detailed review', durationMinutes: 60 },
        ],
      },
      availabilityOverrides: { type: [overrideSchema], default: [] },
      analytics: {
        completedCount: { type: Number, default: 0 },
        noShowCount: { type: Number, default: 0 },
        cancellationCount: { type: Number, default: 0 },
      },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
