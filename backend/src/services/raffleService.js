const rafflesRepo = require('../repositories/rafflesRepo');
const ticketsRepo = require('../repositories/ticketsRepo');
const auditLogsRepo = require('../repositories/auditLogsRepo');
const { RAFFLE_STATUS, PRIZE_DISTRIBUTION } = require('../utils/constants');
const { paginate, paginatedResponse } = require('../utils/helpers');

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Build a sensible default prize split for `winnersCount` winners, seeded from the
// global PRIZE_DISTRIBUTION and normalised so the percentages total 100.
function defaultDistribution(winnersCount) {
  const n = Math.max(1, Math.floor(Number(winnersCount) || 1));
  const base = Array.from({ length: n }, (_, i) => (PRIZE_DISTRIBUTION[i]?.percentage ?? 1));
  const total = base.reduce((s, p) => s + p, 0) || 1;
  const dist = base.map((p, i) => ({ rank: i + 1, percentage: round2((p / total) * 100) }));
  // Absorb any rounding drift into the top rank so the total is exactly 100.
  const drift = round2(100 - dist.reduce((s, d) => s + d.percentage, 0));
  if (dist.length) dist[0].percentage = round2(dist[0].percentage + drift);
  return dist;
}

// Validate an admin-supplied distribution against the round's winner count.
function normaliseDistribution(input, winnersCount) {
  if (!Array.isArray(input) || input.length === 0) {
    throw Object.assign(new Error('Prize distribution must be a non-empty list'), { status: 400 });
  }
  if (input.length !== winnersCount) {
    throw Object.assign(new Error(`Prize distribution must have exactly ${winnersCount} entries (one per winner)`), { status: 400 });
  }
  const dist = input.map((entry, i) => {
    const percentage = Number(entry?.percentage);
    if (!Number.isFinite(percentage) || percentage < 0) {
      throw Object.assign(new Error(`Rank ${i + 1} percentage must be zero or greater`), { status: 400 });
    }
    return { rank: i + 1, percentage: round2(percentage) };
  });
  const total = round2(dist.reduce((s, d) => s + d.percentage, 0));
  if (total > 100.01) {
    throw Object.assign(new Error(`Percentages total ${total}%, which exceeds 100%`), { status: 400 });
  }
  return dist;
}

async function createRaffle(data, userId) {
  if (data.requiredSold > data.totalTickets) {
    throw Object.assign(new Error('Required sold cannot exceed total tickets'), { status: 400 });
  }
  if (data.winnersCount > data.requiredSold) {
    throw Object.assign(new Error('Winners count cannot exceed required sold'), { status: 400 });
  }

  const roundNumber = await rafflesRepo.getNextRoundNumber();
  const prizePool = data.prizePool ?? data.totalTickets * data.ticketPrice * 0.5;

  // Use the admin-selected distribution if provided (e.g. from a saved reward
  // config), otherwise fall back to a normalised default for the winner count.
  const prizeDistribution = Array.isArray(data.prizeDistribution) && data.prizeDistribution.length
    ? normaliseDistribution(data.prizeDistribution, data.winnersCount)
    : defaultDistribution(data.winnersCount);

  const raffle = await rafflesRepo.create({
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : null,
    roundNumber,
    prizePool,
    prizeDistribution,
    soldCount: 0,
    revenue: 0,
    winners: [],
    status: RAFFLE_STATUS.DRAFT,
    createdBy: userId,
  });

  await ticketsRepo.createForRaffle(raffle.id, data.totalTickets);
  await auditLogsRepo.record({ userId, action: 'CREATE_RAFFLE', entity: 'raffle', entityId: raffle.id });
  return raffle;
}

async function publishRaffle(id, userId) {
  const raffle = await rafflesRepo.getById(id);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  const updated = await rafflesRepo.update(id, { status: RAFFLE_STATUS.ACTIVE });
  await auditLogsRepo.record({ userId, action: 'PUBLISH_RAFFLE', entity: 'raffle', entityId: id });
  return updated;
}

async function listRaffles(query, activeOnly = false) {
  const { page, limit, skip } = paginate(query);
  const filters = [];
  if (activeOnly) filters.push(['status', '==', RAFFLE_STATUS.ACTIVE]);
  else if (query.status) filters.push(['status', '==', query.status]);

  const [data, total] = await Promise.all([
    rafflesRepo.find({ filters, orderBy: ['roundNumber', 'desc'], limit, offset: skip }),
    rafflesRepo.count(filters),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getRaffle(id) {
  const raffle = await rafflesRepo.getById(id);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  return raffle;
}

async function updateRaffle(id, data, userId) {
  const raffle = await rafflesRepo.getById(id);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  if (raffle.status === RAFFLE_STATUS.COMPLETED) {
    throw Object.assign(new Error('Completed raffle cannot be modified'), { status: 400 });
  }
  if (raffle.status === RAFFLE_STATUS.ACTIVE) {
    const allowed = ['endDate', 'description'];
    Object.keys(data).forEach((k) => {
      if (!allowed.includes(k)) delete data[k];
    });
  }
  if (data.endDate) data.endDate = new Date(data.endDate);

  const updated = await rafflesRepo.update(id, data);
  await auditLogsRepo.record({ userId, action: 'UPDATE_RAFFLE', entity: 'raffle', entityId: id, newValue: data });
  return updated;
}

async function cancelRaffle(id, userId) {
  const raffle = await rafflesRepo.getById(id);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  const updated = await rafflesRepo.update(id, { status: RAFFLE_STATUS.CANCELLED });
  await auditLogsRepo.record({ userId, action: 'CANCEL_RAFFLE', entity: 'raffle', entityId: id });
  return updated;
}

// Set the per-round winner prize split. Editable while draft or active (i.e. before
// the draw locks the round to COMPLETED).
async function setPrizeDistribution(id, distribution, userId) {
  const raffle = await rafflesRepo.getById(id);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  if (raffle.status === RAFFLE_STATUS.COMPLETED || raffle.status === RAFFLE_STATUS.CANCELLED) {
    throw Object.assign(new Error('Prize distribution can only be changed before the draw'), { status: 400 });
  }

  const prizeDistribution = normaliseDistribution(distribution, raffle.winnersCount);
  const updated = await rafflesRepo.update(id, { prizeDistribution });
  await auditLogsRepo.record({
    userId,
    action: 'UPDATE_PRIZE_DISTRIBUTION',
    entity: 'raffle',
    entityId: id,
    newValue: { prizeDistribution },
  });
  return updated;
}

module.exports = {
  createRaffle,
  publishRaffle,
  listRaffles,
  getRaffle,
  updateRaffle,
  cancelRaffle,
  setPrizeDistribution,
  defaultDistribution,
};
