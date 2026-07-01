const { getDb } = require('../config/firebase');
const { COLLECTIONS, FieldValue } = require('../lib/firestore');
const { shuffleArray, hashParticipants, generateDrawSeed } = require('../utils/crypto');
const rafflesRepo = require('../repositories/rafflesRepo');
const ticketsRepo = require('../repositories/ticketsRepo');
const usersRepo = require('../repositories/usersRepo');
const auditLogsRepo = require('../repositories/auditLogsRepo');
const { RAFFLE_STATUS, TICKET_STATUS, PRIZE_DISTRIBUTION } = require('../utils/constants');
const notificationService = require('./notificationService');
const raffleService = require('./raffleService');
const settingsService = require('./settingsService');

// A round may only be drawn once it has SOLD OUT or its deadline has passed,
// and only if it has met the minimum required sold count (e.g. 800).
function getDrawEligibility(raffle, soldCount) {
  const sold = soldCount ?? raffle.soldCount ?? 0;
  const soldOut = sold >= raffle.totalTickets;
  const deadlinePassed = Boolean(raffle.endDate) && new Date(raffle.endDate) <= new Date();

  if (!soldOut && !deadlinePassed) {
    return { drawable: false, reason: 'Draw runs only when all tickets are sold out or the deadline has passed' };
  }
  if (sold < raffle.requiredSold) {
    return { drawable: false, reason: `Need at least ${raffle.requiredSold} sold tickets to draw, have ${sold}` };
  }
  return { drawable: true };
}

// Acquire an exclusive draw lock by flipping ACTIVE -> DRAWING in a transaction.
// A second concurrent draw will see a non-ACTIVE status and abort.
async function acquireDrawLock(raffleId) {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.raffles).doc(raffleId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw Object.assign(new Error('Raffle not found'), { status: 404 });
    const raffle = snap.data();
    if (raffle.status === RAFFLE_STATUS.DRAWING) {
      throw Object.assign(new Error('Draw already in progress'), { status: 409 });
    }
    if (raffle.status !== RAFFLE_STATUS.ACTIVE) {
      throw Object.assign(new Error('Raffle must be active to draw'), { status: 400 });
    }
    tx.update(ref, { status: RAFFLE_STATUS.DRAWING, updatedAt: FieldValue.serverTimestamp() });
    return { id: snap.id, ...raffle };
  });
}

async function executeDraw(raffleId, userId, io) {
  const raffle = await acquireDrawLock(raffleId);

  try {
    const soldTickets = await ticketsRepo.findByRaffleAndStatus(raffleId, TICKET_STATUS.SOLD);

    const eligibility = getDrawEligibility(raffle, soldTickets.length);
    if (!eligibility.drawable) {
      // Roll the lock back so the raffle can be drawn later.
      await rafflesRepo.update(raffleId, { status: RAFFLE_STATUS.ACTIVE });
      throw Object.assign(new Error(eligibility.reason), { status: 400 });
    }

    if (io) io.to(`raffle:${raffleId}`).emit('draw_started', { raffleId });

    const { claimDeadlineDays } = await settingsService.getRaffleConfig();
    const seed = generateDrawSeed();
    const shuffled = shuffleArray(soldTickets);
    // Prefer the round's own configured prize split; fall back to the global default.
    const distribution = Array.isArray(raffle.prizeDistribution) && raffle.prizeDistribution.length
      ? raffle.prizeDistribution
      : PRIZE_DISTRIBUTION;
    const winnersCount = Math.min(raffle.winnersCount, distribution.length, shuffled.length);
    const selected = shuffled.slice(0, winnersCount);

    const winners = selected.map((ticket, index) => {
      const dist = distribution[index] || { rank: index + 1, percentage: 3 };
      return {
        rank: dist.rank,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        userId: ticket.userId || null,
        prizeAmount: (raffle.prizePool * dist.percentage) / 100,
        prizePercentage: dist.percentage,
        claimed: false,
        claimDeadline: new Date(Date.now() + claimDeadlineDays * 24 * 60 * 60 * 1000),
      };
    });

    const participantHash = hashParticipants(soldTickets.map((t) => t.id));

    const updated = await rafflesRepo.update(raffleId, {
      winners,
      status: RAFFLE_STATUS.COMPLETED,
      drawDate: new Date(),
      drawSeed: seed,
      drawHash: participantHash,
    });

    await auditLogsRepo.record({
      userId,
      action: 'EXECUTE_DRAW',
      entity: 'raffle',
      entityId: raffleId,
      newValue: { winnersCount, participantHash, seed },
    });

    for (const winner of winners) {
      if (!winner.userId) continue;
      await notificationService.sendInApp(
        winner.userId,
        'wins',
        'Congratulations! You Won!',
        `You won rank #${winner.rank} with ticket #${winner.ticketNumber}. Prize: $${winner.prizeAmount.toFixed(2)}`,
        { raffleId, rank: winner.rank, prizeAmount: winner.prizeAmount, ticketNumber: winner.ticketNumber },
      );
      const user = await usersRepo.getById(winner.userId);
      if (user) {
        await notificationService.sendEmail(user, 'winner', {
          subject: 'You Won the Football Club Raffle!',
          body: `Congratulations! Ticket #${winner.ticketNumber} won $${winner.prizeAmount.toFixed(2)}`,
        });
        await notificationService.sendPush(winner.userId, {
          title: 'You Won! 🎉',
          body: `Ticket #${winner.ticketNumber} won $${winner.prizeAmount.toFixed(2)}`,
          data: { category: 'wins', raffleId },
        });
      }
    }

    if (io) {
      io.to(`raffle:${raffleId}`).emit('draw_completed', { raffleId, winners });
      io.emit('new_winner', { raffleId, winners });
    }

    await autoStartNewRound(userId);

    return { raffle: updated, winners, participantCount: soldTickets.length, participantHash };
  } catch (err) {
    // Ensure we never leave a raffle stuck in DRAWING on unexpected failure.
    if (err.status !== 400) {
      await rafflesRepo.update(raffleId, { status: RAFFLE_STATUS.ACTIVE }).catch(() => {});
    }
    throw err;
  }
}

async function autoStartNewRound(userId) {
  const [last, cfg, clubName] = await Promise.all([
    rafflesRepo.getLatest(),
    settingsService.getRaffleConfig(),
    settingsService.getClubName(),
  ]);
  const newRaffle = await raffleService.createRaffle(
    {
      title: `${clubName} — Round ${(last?.roundNumber || 0) + 1}`,
      description: 'Auto-started new round after previous draw',
      totalTickets: cfg.totalTickets,
      ticketPrice: cfg.ticketPrice,
      requiredSold: cfg.requiredSold,
      winnersCount: cfg.winnersCount,
      maxTicketsPerUser: cfg.maxTicketsPerUser,
      startDate: new Date(),
      endDate: new Date(Date.now() + cfg.roundDurationDays * 24 * 60 * 60 * 1000),
    },
    userId,
  );

  await raffleService.publishRaffle(newRaffle.id, userId);
  return newRaffle;
}

async function claimPrize(raffleId, userId) {
  const raffle = await rafflesRepo.getById(raffleId);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });

  const winners = raffle.winners || [];
  const winner = winners.find((w) => w.userId === userId && !w.claimed);
  if (!winner) throw Object.assign(new Error('No claimable prize found'), { status: 404 });
  if (winner.claimDeadline && new Date(winner.claimDeadline) < new Date()) {
    throw Object.assign(new Error('Claim deadline has passed'), { status: 400 });
  }

  const updatedWinners = winners.map((w) =>
    (w.userId === userId && !w.claimed ? { ...w, claimed: true, claimedAt: new Date() } : w));
  await rafflesRepo.update(raffleId, { winners: updatedWinners });

  return { message: 'Prize claim submitted for admin approval', winner };
}

module.exports = { executeDraw, autoStartNewRound, claimPrize, getDrawEligibility };
