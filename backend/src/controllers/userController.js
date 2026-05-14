const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { assertObjectId } = require('../validators/validate');
const { getPatientTimeline } = require('../services/timelineService');
const { getAppointmentAnalytics } = require('../services/analyticsService');
const { listForUser, markAllAsRead, markAsRead } = require('../services/notificationService');

const listDoctors = asyncHandler(async (_req, res) => {
  const doctors = await User.find({ role: 'doctor', isDeleted: false }).select('-password').sort({ fullName: 1 });
  res.json({ success: true, data: doctors });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({ isDeleted: false }).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

const softDeleteUser = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id },
    { new: true }
  ).select('-password');
  res.json({ success: true, data: user });
});

const patientTimeline = asyncHandler(async (req, res) => {
  assertObjectId(req.params.patientId);
  const timeline = await getPatientTimeline(req.params.patientId, req.user);
  res.json({ success: true, data: timeline });
});

const analytics = asyncHandler(async (_req, res) => {
  const data = await getAppointmentAnalytics();
  res.json({ success: true, data });
});

const notifications = asyncHandler(async (req, res) => {
  const data = await listForUser(req.user.id);
  res.json({ success: true, data });
});

const readNotification = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const data = await markAsRead(req.params.id, req.user.id);
  if (!data) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, data });
});

const readAllNotifications = asyncHandler(async (req, res) => {
  const data = await markAllAsRead(req.user.id);
  res.json({ success: true, data });
});

module.exports = {
  analytics,
  listDoctors,
  listUsers,
  notifications,
  patientTimeline,
  readAllNotifications,
  readNotification,
  softDeleteUser,
};
