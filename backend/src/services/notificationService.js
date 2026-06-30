const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const { getMessaging } = require('../config/firebase');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
});

function isPushAllowed(user) {
  if (!user?.notificationPreferences || user.notificationPreferences.push === false) return false;
  const { quietHoursStart, quietHoursEnd } = user.notificationPreferences;
  if (!quietHoursStart || !quietHoursEnd) return true;

  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (quietHoursStart <= quietHoursEnd) {
    return current < quietHoursStart || current >= quietHoursEnd;
  }
  return current >= quietHoursEnd && current < quietHoursStart;
}

function toFcmData(metadata = {}) {
  const data = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined && value !== null) {
      data[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
  }
  return data;
}

async function removeInvalidTokens(userId, tokens) {
  if (!tokens.length) return;
  await User.updateOne({ _id: userId }, { $pull: { fcmTokens: { token: { $in: tokens } } } });
}

async function sendPush(user, { category, title, body, metadata = {} }) {
  if (!user || !isPushAllowed(user)) {
    return { sent: 0, skipped: true, reason: 'push_disabled' };
  }

  const messaging = getMessaging();
  if (!messaging) {
    logger.info(`[DEV PUSH] ${title} -> ${user.email}: ${body}`);
    return { sent: 0, skipped: true, reason: 'firebase_not_configured' };
  }

  const tokens = [...new Set((user.fcmTokens || []).map((entry) => entry.token).filter(Boolean))];
  if (!tokens.length) {
    return { sent: 0, skipped: true, reason: 'no_tokens' };
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: toFcmData({ category: category || 'system', title, body, ...metadata }),
    webpush: {
      fcmOptions: { link: metadata.link || process.env.FRONTEND_URL || '/' },
      notification: {
        title,
        body,
        icon: '/favicon.ico',
      },
    },
  });

  const invalidTokens = [];
  response.responses.forEach((result, index) => {
    if (!result.success) {
      const code = result.error?.code;
      if (code === 'messaging/registration-token-not-registered'
        || code === 'messaging/invalid-registration-token') {
        invalidTokens.push(tokens[index]);
      }
      logger.warn('FCM delivery failed', { token: tokens[index], code, message: result.error?.message });
    }
  });

  await removeInvalidTokens(user._id, invalidTokens);

  await Notification.create({
    userId: user._id,
    channel: 'push',
    category: category || 'system',
    title,
    body,
    sentAt: new Date(),
    metadata,
  });

  return {
    sent: response.successCount,
    failed: response.failureCount,
    invalidTokensRemoved: invalidTokens.length,
  };
}

async function sendInApp(userId, category, title, body, metadata = {}) {
  const notification = await Notification.create({
    userId,
    channel: 'in_app',
    category,
    title,
    body,
    sentAt: new Date(),
    metadata,
  });

  const user = await User.findById(userId);
  if (user) {
    await sendPush(user, {
      category,
      title,
      body,
      metadata: { ...metadata, notificationId: notification._id.toString() },
    });
  }

  return notification;
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

async function registerFcmToken(userId, token, deviceId) {
  if (!token) throw Object.assign(new Error('FCM token is required'), { status: 400 });

  await User.updateOne(
    { _id: userId },
    { $pull: { fcmTokens: { token } } },
  );

  await User.updateOne(
    { _id: userId },
    {
      $push: {
        fcmTokens: {
          $each: [{ token, deviceId, platform: 'web', updatedAt: new Date() }],
          $slice: -10,
        },
      },
    },
  );

  return { registered: true };
}

async function removeFcmToken(userId, token) {
  if (!token) throw Object.assign(new Error('FCM token is required'), { status: 400 });
  await User.updateOne({ _id: userId }, { $pull: { fcmTokens: { token } } });
  return { removed: true };
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

module.exports = {
  sendInApp,
  sendEmail,
  sendPush,
  registerFcmToken,
  removeFcmToken,
  getUserNotifications,
  markRead,
  markAllRead,
};
