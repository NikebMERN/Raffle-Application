const Ticket = require('../models/Ticket');
const { TICKET_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

async function processCleanupJob() {
  const result = await Ticket.updateMany(
    { status: TICKET_STATUS.RESERVED, reservedUntil: { $lt: new Date() } },
    { status: TICKET_STATUS.AVAILABLE, userId: null, reservedUntil: null },
  );
  logger.info(`Cleanup job: released ${result.modifiedCount} expired reservations`);
}

module.exports = { processCleanupJob };
