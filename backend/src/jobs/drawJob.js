const logger = require('../config/logger');

async function processDrawJob(data) {
  logger.info('Draw job processed', data);
  return { success: true };
}

module.exports = { processDrawJob };
