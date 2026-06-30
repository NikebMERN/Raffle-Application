const nodemailer = require('nodemailer');
const notificationsRepo = require('../repositories/notificationsRepo');
const usersRepo = require('../repositories/usersRepo');
const { getMessaging } = require('../config/firebase');
const { COLLECTIONS, collection, FieldValue } = require('../lib/firestore');
const logger = require('../config/logger');

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
const transporter = smtpConfigured
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  : null;

async function sendInApp(userId, category, title, body, metadata = {}) {
  if (!userId) return null;
  return notificationsRepo.create({
    userId,
    channel: 'in_app',
    category,
    title,
    body,
    read: false,
    sentAt: new Date(),
    metadata,
  });
}

async function sendEmail(user, template, { subject, body }) {
  if (!user?.email) return null;
  if (user?.notificationPreferences?.email === false) return sendInApp(user.id || user._id, 'system', subject, body);

  try {
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to: user.email,
        subject,
        text: body,
      });
      logger.info(`Email sent: ${template} -> ${user.email}`);
    } else {
      logger.info(`[DEV EMAIL] ${subject} -> ${user.email}: ${body}`);
    }
  } catch (err) {
    logger.error('Email send failed', { error: err.message });
  }

  return sendInApp(user.id || user._id, 'system', subject, body);
}

async function sendPush(userId, { title, body, data = {} }) {
  const messaging = getMessaging();
  if (!messaging) return null;

  const user = await usersRepo.getById(userId);
  const tokens = (user?.fcmTokens || []).filter(Boolean);
  if (!tokens.length) return null;

  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
    return { successCount: res.successCount, failureCount: res.failureCount };
  } catch (err) {
    logger.error('Push send failed', { error: err.message });
    return null;
  }
}

async function getUserNotifications(userId, query = {}) {
  return notificationsRepo.listForUser(userId, { unreadOnly: query.unread === 'true' });
}

async function markRead(notificationId, userId) {
  const notification = await notificationsRepo.getById(notificationId);
  if (!notification || notification.userId !== userId) {
    throw Object.assign(new Error('Notification not found'), { status: 404 });
  }
  return notificationsRepo.update(notificationId, { read: true });
}

async function markAllRead(userId) {
  await notificationsRepo.markAllRead(userId);
  return { message: 'All notifications marked as read' };
}

async function registerFcmToken(userId, token) {
  if (!token) throw Object.assign(new Error('Token required'), { status: 400 });
  await collection(COLLECTIONS.users).doc(userId).set(
    { fcmTokens: FieldValue.arrayUnion(token), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return { message: 'Token registered' };
}

async function removeFcmToken(userId, token) {
  if (!token) return { message: 'No token provided' };
  await collection(COLLECTIONS.users).doc(userId).set(
    { fcmTokens: FieldValue.arrayRemove(token), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return { message: 'Token removed' };
}

module.exports = {
  sendInApp,
  sendEmail,
  sendPush,
  getUserNotifications,
  markRead,
  markAllRead,
  registerFcmToken,
  removeFcmToken,
};
