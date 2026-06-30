const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapSnap } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.walletTransactions);

// Recent ledger entries for a user, newest first (sorted in memory to avoid a
// composite index on userId + createdAt).
async function listForUser(userId, { limit = 50 } = {}) {
  const rows = mapSnap(await collection(COLLECTIONS.walletTransactions).where('userId', '==', userId).get());
  rows.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return rows.slice(0, limit);
}

module.exports = { ...repo, listForUser };
