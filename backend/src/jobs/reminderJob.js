const logger = require('../config/logger');
const Raffle = require('../models/Raffle');

async function processReminderJob() {
  const endingSoon = await Raffle.find({
    status: 'active',
    endDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  logger.info(`Reminder job: ${endingSoon.length} raffles ending soon`);
}

module.exports = { processReminderJob };
