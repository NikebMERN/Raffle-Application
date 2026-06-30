const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapSnap } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.transactions);

async function findByStripeSession(sessionId) {
  const snap = await collection(COLLECTIONS.transactions)
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get();
  return snap.empty ? null : mapSnap(snap)[0];
}

module.exports = { ...repo, findByStripeSession };
