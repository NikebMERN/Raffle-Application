const rafflesRepo = require('../repositories/rafflesRepo');
const { RAFFLE_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

// Surface raffles ending within the next 24h (hook for reminder emails/push).
async function processReminderJob() {
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const active = await rafflesRepo.find({ filters: [['status', '==', RAFFLE_STATUS.ACTIVE]] });
  const endingSoon = active.filter((r) => r.endDate && new Date(r.endDate) <= cutoff);
  logger.info(`Reminder job: ${endingSoon.length} raffles ending soon`);
  return endingSoon;
}

module.exports = { processReminderJob };
