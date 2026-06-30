const { shuffleArray, hashParticipants, generateDrawSeed } = require('../utils/crypto');
const Raffle = require('../models/Raffle');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { RAFFLE_STATUS, TICKET_STATUS, PRIZE_DISTRIBUTION, DEFAULTS } = require('../utils/constants');
const notificationService = require('./notificationService');
const raffleService = require('./raffleService');

async function executeDraw(raffleId, userId, io) {
  const raffle = await Raffle.findById(raffleId);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  if (raffle.status !== RAFFLE_STATUS.ACTIVE) {
    throw Object.assign(new Error('Raffle must be active to draw'), { status: 400 });
  }

  const soldTickets = await Ticket.find({
    raffleId,
    status: TICKET_STATUS.SOLD,
  }).populate('userId', 'firstName lastName email');

  if (soldTickets.length < raffle.requiredSold) {
    throw Object.assign(
      new Error(`Need at least ${raffle.requiredSold} sold tickets, have ${soldTickets.length}`),
      { status: 400 },
    );
  }

  raffle.status = RAFFLE_STATUS.DRAWING;
  await raffle.save();

  if (io) io.to(`raffle:${raffleId}`).emit('draw_started', { raffleId });

  const seed = generateDrawSeed();
  const shuffled = shuffleArray(soldTickets);
  const winnersCount = Math.min(raffle.winnersCount, PRIZE_DISTRIBUTION.length, shuffled.length);
  const selected = shuffled.slice(0, winnersCount);

  const winners = selected.map((ticket, index) => {
    const dist = PRIZE_DISTRIBUTION[index] || { rank: index + 1, percentage: 3 };
    const prizeAmount = (raffle.prizePool * dist.percentage) / 100;
    return {
      rank: dist.rank,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      userId: ticket.userId?._id,
      prizeAmount,
      prizePercentage: dist.percentage,
      claimDeadline: new Date(Date.now() + DEFAULTS.CLAIM_DEADLINE_DAYS * 24 * 60 * 60 * 1000),
    };
  });

  const participantHash = hashParticipants(soldTickets.map((t) => t._id.toString()));

  raffle.winners = winners;
  raffle.status = RAFFLE_STATUS.COMPLETED;
  raffle.drawDate = new Date();
  raffle.drawSeed = seed;
  raffle.drawHash = participantHash;
  await raffle.save();

  await AuditLog.create({
    userId,
    action: 'EXECUTE_DRAW',
    entity: 'raffle',
    entityId: raffleId,
    newValue: { winnersCount, participantHash, seed },
  });

  for (const winner of winners) {
    if (winner.userId) {
      await notificationService.sendInApp(
        winner.userId,
        'wins',
        'Congratulations! You Won!',
        `You won rank #${winner.rank} with ticket #${winner.ticketNumber}. Prize: £${winner.prizeAmount.toFixed(2)}`,
      );
      await notificationService.sendEmail(
        await require('../models/User').findById(winner.userId),
        'winner',
        {
          subject: 'You Won the SF Football Club Raffle!',
          body: `Congratulations! Ticket #${winner.ticketNumber} won £${winner.prizeAmount.toFixed(2)}`,
        },
      );
    }
  }

  if (io) {
    io.to(`raffle:${raffleId}`).emit('draw_completed', { raffleId, winners });
    io.emit('new_winner', { raffleId, winners });
  }

  await autoStartNewRound(userId);

  return { raffle, winners, participantCount: soldTickets.length, participantHash };
}

async function autoStartNewRound(userId) {
  const lastRaffle = await Raffle.findOne().sort({ roundNumber: -1 });
  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const newRaffle = await raffleService.createRaffle(
    {
      title: `Round ${(lastRaffle?.roundNumber || 0) + 1} - SF Football Club Raffle`,
      description: 'Auto-started new round after previous draw',
      totalTickets: DEFAULTS.TOTAL_TICKETS,
      ticketPrice: DEFAULTS.TICKET_PRICE,
      requiredSold: DEFAULTS.REQUIRED_SOLD,
      winnersCount: DEFAULTS.WINNERS_COUNT,
      startDate,
      endDate,
      maxTicketsPerUser: DEFAULTS.MAX_TICKETS_PER_USER,
    },
    userId,
  );

  await raffleService.publishRaffle(newRaffle._id, userId);
  return newRaffle;
}

async function claimPrize(raffleId, userId) {
  const raffle = await Raffle.findById(raffleId);
  const winner = raffle?.winners?.find(
    (w) => w.userId?.toString() === userId.toString() && !w.claimed,
  );
  if (!winner) throw Object.assign(new Error('No claimable prize found'), { status: 404 });
  if (winner.claimDeadline < new Date()) {
    throw Object.assign(new Error('Claim deadline has passed'), { status: 400 });
  }

  winner.claimed = true;
  winner.claimedAt = new Date();
  await raffle.save();

  return { message: 'Prize claim submitted for admin approval', winner };
}

module.exports = { executeDraw, autoStartNewRound, claimPrize };
