const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

async function sendInApp(userId, category, title, body, metadata = {}) {
  return Notification.create({
    userId,
    channel: 'in_app',
    category,
    title,
    body,
    sentAt: new Date(),
    metadata,
  });
}

async function sendEmail(user, template, { subject, body }) {
  if (user?.notificationPreferences?.email !== false) {
    try {
      if (process.env.SENDGRID_API_KEY) {
        logger.info(`Email queued: ${template} to ${user.email}`);
      } else {
        logger.info(`[DEV EMAIL] ${subject} -> ${user.email}: ${body}`);
      }
    } catch (err) {
      logger.error('Email send failed', { error: err.message });
    }
  }
  return sendInApp(user._id, 'system', subject, body);
}

async function getUserNotifications(userId, query = {}) {
  const filter = { userId };
  if (query.unread === 'true') filter.read = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
}

async function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true },
  );
}

async function markAllRead(userId) {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { message: 'All notifications marked as read' };
}

module.exports = { sendInApp, sendEmail, getUserNotifications, markRead, markAllRead };
