const Raffle = require('../models/Raffle');
const Ticket = require('../models/Ticket');
const { RAFFLE_STATUS, DEFAULTS } = require('../utils/constants');
const { paginate, paginatedResponse } = require('../utils/helpers');
const AuditLog = require('../models/AuditLog');

async function getNextRoundNumber() {
  const last = await Raffle.findOne().sort({ roundNumber: -1 });
  return (last?.roundNumber || 0) + 1;
}

async function createRaffle(data, userId) {
  if (data.requiredSold > data.totalTickets) {
    throw Object.assign(new Error('Required sold cannot exceed total tickets'), { status: 400 });
  }
  if (data.winnersCount > data.requiredSold) {
    throw Object.assign(new Error('Winners count cannot exceed required sold'), { status: 400 });
  }

  const roundNumber = await getNextRoundNumber();
  const prizePool = data.prizePool ?? data.totalTickets * data.ticketPrice * 0.5;

  const raffle = await Raffle.create({
    ...data,
    roundNumber,
    prizePool,
    status: RAFFLE_STATUS.DRAFT,
    createdBy: userId,
  });

  const tickets = [];
  for (let i = 1; i <= data.totalTickets; i++) {
    tickets.push({ raffleId: raffle._id, ticketNumber: i });
  }
  await Ticket.insertMany(tickets);

  await AuditLog.create({ userId, action: 'CREATE_RAFFLE', entity: 'raffle', entityId: raffle._id, newValue: raffle });
  return raffle;
}

async function publishRaffle(id, userId) {
  const raffle = await Raffle.findByIdAndUpdate(
    id,
    { status: RAFFLE_STATUS.ACTIVE },
    { new: true },
  );
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  await AuditLog.create({ userId, action: 'PUBLISH_RAFFLE', entity: 'raffle', entityId: id });
  return raffle;
}

async function listRaffles(query, activeOnly = false) {
  const { page, limit, skip } = paginate(query);
  const filter = activeOnly ? { status: RAFFLE_STATUS.ACTIVE } : {};
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Raffle.find(filter).sort({ roundNumber: -1 }).skip(skip).limit(limit),
    Raffle.countDocuments(filter),
  ]);

  return paginatedResponse(data, total, page, limit);
}

async function getRaffle(id) {
  const raffle = await Raffle.findById(id).populate('winners.userId', 'firstName lastName email');
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  return raffle;
}

async function updateRaffle(id, data, userId) {
  const raffle = await Raffle.findById(id);
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

  const updated = await Raffle.findByIdAndUpdate(id, data, { new: true });
  await AuditLog.create({ userId, action: 'UPDATE_RAFFLE', entity: 'raffle', entityId: id, newValue: data });
  return updated;
}

async function cancelRaffle(id, userId) {
  const raffle = await Raffle.findByIdAndUpdate(id, { status: RAFFLE_STATUS.CANCELLED }, { new: true });
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });
  await AuditLog.create({ userId, action: 'CANCEL_RAFFLE', entity: 'raffle', entityId: id });
  return raffle;
}

module.exports = {
  createRaffle,
  publishRaffle,
  listRaffles,
  getRaffle,
  updateRaffle,
  cancelRaffle,
};
