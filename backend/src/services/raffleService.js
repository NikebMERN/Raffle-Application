const rafflesRepo = require('../repositories/rafflesRepo');
const ticketsRepo = require('../repositories/ticketsRepo');
const auditLogsRepo = require('../repositories/auditLogsRepo');
const { RAFFLE_STATUS } = require('../utils/constants');
const { paginate, paginatedResponse } = require('../utils/helpers');

async function createRaffle(data, userId) {
  if (data.requiredSold > data.totalTickets) {
    throw Object.assign(new Error('Required sold cannot exceed total tickets'), { status: 400 });
  }
  if (data.winnersCount > data.requiredSold) {
    throw Object.assign(new Error('Winners count cannot exceed required sold'), { status: 400 });
  }

  const roundNumber = await rafflesRepo.getNextRoundNumber();
  const prizePool = data.prizePool ?? data.totalTickets * data.ticketPrice * 0.5;

  const raffle = await rafflesRepo.create({
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    endDate: data.endDate ? new Date(data.endDate) : null,
    roundNumber,
    prizePool,
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

module.exports = {
  createRaffle,
  publishRaffle,
  listRaffles,
  getRaffle,
  updateRaffle,
  cancelRaffle,
};
