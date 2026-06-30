const { getDb } = require('../config/firebase');
const { COLLECTIONS, FieldValue, mapDoc } = require('../lib/firestore');
const ticketsRepo = require('../repositories/ticketsRepo');
const rafflesRepo = require('../repositories/rafflesRepo');
const settingsService = require('./settingsService');
const { TICKET_STATUS, RAFFLE_STATUS } = require('../utils/constants');
const { paginate, paginatedResponse } = require('../utils/helpers');

// Atomically grab `quantity` available tickets and mark them reserved.
async function reserveTickets(raffleId, userId, quantity) {
  const raffle = await rafflesRepo.getById(raffleId);
  if (!raffle || raffle.status !== RAFFLE_STATUS.ACTIVE) {
    throw Object.assign(new Error('Raffle is not active'), { status: 400 });
  }

  const cfg = await settingsService.getRaffleConfig();
  const held = await ticketsRepo.countUserTickets(raffleId, userId, [TICKET_STATUS.SOLD, TICKET_STATUS.RESERVED]);
  if (held + quantity > (raffle.maxTicketsPerUser || cfg.maxTicketsPerUser)) {
    throw Object.assign(new Error('Max tickets per user exceeded'), { status: 400 });
  }

  const db = getDb();
  const ticketsCol = db.collection(COLLECTIONS.tickets);
  const reservedUntil = new Date(Date.now() + cfg.reserveTimeoutMs);

  return db.runTransaction(async (tx) => {
    const query = ticketsCol
      .where('raffleId', '==', raffleId)
      .where('status', '==', TICKET_STATUS.AVAILABLE)
      .limit(quantity);
    const snap = await tx.get(query);

    if (snap.size < quantity) {
      throw Object.assign(new Error('Not enough tickets available'), { status: 400 });
    }

    snap.docs.forEach((doc) => {
      tx.update(doc.ref, {
        status: TICKET_STATUS.RESERVED,
        userId,
        reservedUntil,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return snap.docs.map((doc) => ({ id: doc.id, _id: doc.id, ...doc.data(), status: TICKET_STATUS.RESERVED, userId }));
  });
}

async function assignTicketsPermanently(ticketIds, userId, price) {
  const db = getDb();
  const batch = db.batch();
  const now = new Date();
  ticketIds.forEach((id) => {
    batch.update(db.collection(COLLECTIONS.tickets).doc(id), {
      status: TICKET_STATUS.SOLD,
      userId,
      soldAt: now,
      price,
      reservedUntil: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  const docs = await Promise.all(ticketIds.map((id) => ticketsRepo.getById(id)));
  return docs.filter(Boolean);
}

async function releaseReservation(ticketIds) {
  const db = getDb();
  const batch = db.batch();
  ticketIds.forEach((id) => {
    batch.update(db.collection(COLLECTIONS.tickets).doc(id), {
      status: TICKET_STATUS.AVAILABLE,
      userId: null,
      reservedUntil: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

async function getTicketGrid(raffleId) {
  const tickets = await ticketsRepo.find({
    filters: [['raffleId', '==', raffleId]],
    orderBy: ['ticketNumber', 'asc'],
  });
  return tickets.map((t) => ({ id: t.id, ticketNumber: t.ticketNumber, status: t.status }));
}

async function listTickets(query) {
  const { page, limit, skip } = paginate(query);
  const filters = [];
  if (query.raffleId) filters.push(['raffleId', '==', query.raffleId]);
  if (query.userId) filters.push(['userId', '==', query.userId]);
  if (query.status) filters.push(['status', '==', query.status]);

  const [data, total] = await Promise.all([
    ticketsRepo.find({ filters, limit, offset: skip }),
    ticketsRepo.count(filters),
  ]);

  return paginatedResponse(data, total, page, limit);
}

module.exports = {
  reserveTickets,
  assignTicketsPermanently,
  releaseReservation,
  getTicketGrid,
  listTickets,
};
