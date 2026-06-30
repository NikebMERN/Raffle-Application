const rafflesRepo = require('../repositories/rafflesRepo');
const drawService = require('../services/drawService');
const { RAFFLE_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

// Automatically execute the draw for any active round that has sold out or
// reached its deadline (and met the minimum required sold count).
async function processAutoDraws(io) {
  const active = await rafflesRepo.find({ filters: [['status', '==', RAFFLE_STATUS.ACTIVE]] });

  for (const raffle of active) {
    const { drawable } = drawService.getDrawEligibility(raffle, raffle.soldCount || 0);
    if (!drawable) continue;

    try {
      const result = await drawService.executeDraw(raffle.id, 'system', io);
      logger.info(`Auto-draw executed for round #${raffle.roundNumber}: ${result.winners.length} winners`);
    } catch (err) {
      logger.error('Auto-draw failed', { raffleId: raffle.id, error: err.message });
    }
  }
}

module.exports = { processAutoDraws };
