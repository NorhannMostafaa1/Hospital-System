const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, title, message, entityType, entityId, session }) => {
  if (!recipient) return null;
  const [notification] = await Notification.create(
    [{ recipient, type, title, message, entityType, entityId }],
    { session }
  );
  return notification;
};

const listForUser = (userId) => {
  return Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(100);
};

const markAsRead = async (id, userId) => {
  return Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { recipient: userId, readAt: { $exists: false } },
    { readAt: new Date() }
  );
};

module.exports = { createNotification, listForUser, markAllAsRead, markAsRead };
