const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapSnap, FieldValue } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.tickets);

// Create all tickets for a raffle using batched writes (Firestore limit: 500 ops/batch).
async function createForRaffle(raffleId, totalTickets) {
  const col = collection(COLLECTIONS.tickets);
  const now = FieldValue.serverTimestamp();
  const db = col.firestore;
  const BATCH = 500;

  for (let start = 1; start <= totalTickets; start += BATCH) {
    const batch = db.batch();
    const end = Math.min(start + BATCH - 1, totalTickets);
    for (let n = start; n <= end; n++) {
      const ref = col.doc();
      batch.set(ref, {
        raffleId,
        ticketNumber: n,
        status: 'available',
        userId: null,
        reservedUntil: null,
        soldAt: null,
        price: null,
        saleChannel: 'online',
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
  }
}

async function findByRaffleAndStatus(raffleId, status, limit = null) {
  let q = collection(COLLECTIONS.tickets).where('raffleId', '==', raffleId).where('status', '==', status);
  if (limit) q = q.limit(limit);
  return mapSnap(await q.get());
}

async function countByRaffleStatus(raffleId, statuses) {
  const list = Array.isArray(statuses) ? statuses : [statuses];
  let total = 0;
  for (const status of list) {
    const snap = await collection(COLLECTIONS.tickets)
      .where('raffleId', '==', raffleId)
      .where('status', '==', status)
      .count()
      .get();
    total += snap.data().count;
  }
  return total;
}

async function countUserTickets(raffleId, userId, statuses) {
  const list = Array.isArray(statuses) ? statuses : [statuses];
  let total = 0;
  for (const status of list) {
    const snap = await collection(COLLECTIONS.tickets)
      .where('raffleId', '==', raffleId)
      .where('userId', '==', userId)
      .where('status', '==', status)
      .count()
      .get();
    total += snap.data().count;
  }
  return total;
}

module.exports = {
  ...repo,
  createForRaffle,
  findByRaffleAndStatus,
  countByRaffleStatus,
  countUserTickets,
};
