const logger = require('../config/logger');
const notificationService = require('../services/notificationService');

async function processEmailJob({ userId, subject, body, category }) {
  const User = require('../models/User');
  const user = await User.findById(userId);
  if (user) {
    await notificationService.sendEmail(user, category || 'system', { subject, body });
  }
  logger.info(`Email job sent to ${userId}`);
}

module.exports = { processEmailJob };
