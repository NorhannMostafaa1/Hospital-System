const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const { logAction } = require('./auditService');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET || 'development_secret',
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
};

const register = async (payload, role, req) => {
  const exists = await User.findOne({ email: payload.email.toLowerCase(), isDeleted: false });
  if (exists) throw new AppError('Email is already registered.', 409, 'EMAIL_EXISTS');

  const user = await User.create({
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    phone: payload.phone,
    role,
    patientProfile: role === 'patient' ? payload.patientProfile || {} : undefined,
    doctorProfile: role === 'doctor' ? payload.doctorProfile || {} : undefined,
  });

  await logAction({
    actor: user._id,
    action: 'user.registered',
    entityType: 'User',
    entityId: user._id,
    newState: user.toSafeObject(),
    req,
  });

  return { user: user.toSafeObject(), token: signToken(user) };
};

const login = async ({ email, password, role }) => {
  const query = { email: email.toLowerCase(), isDeleted: false };
  if (role) query.role = role;

  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  return { user: user.toSafeObject(), token: signToken(user) };
};

const getProfile = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  return user;
};

const updateProfile = async (userId, payload, actor, req) => {
  const user = await getProfile(userId);
  const previousState = user.toSafeObject();

  ['fullName', 'phone', 'profileImage'].forEach((field) => {
    if (payload[field] !== undefined) user[field] = payload[field];
  });
  if (user.role === 'patient' && payload.patientProfile) {
    user.patientProfile = { ...user.patientProfile?.toObject?.(), ...payload.patientProfile };
  }
  if (user.role === 'doctor' && payload.doctorProfile) {
    user.doctorProfile = { ...user.doctorProfile?.toObject?.(), ...payload.doctorProfile };
  }

  await user.save();
  await logAction({
    actor,
    action: 'user.updated',
    entityType: 'User',
    entityId: user._id,
    previousState,
    newState: user.toSafeObject(),
    req,
  });
  return user;
};

module.exports = { getProfile, login, register, updateProfile };
