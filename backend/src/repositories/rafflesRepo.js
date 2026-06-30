const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapDoc } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.raffles);

async function getNextRoundNumber() {
  const snap = await collection(COLLECTIONS.raffles).orderBy('roundNumber', 'desc').limit(1).get();
  if (snap.empty) return 1;
  return (mapDoc(snap.docs[0]).roundNumber || 0) + 1;
}

async function getLatest() {
  const snap = await collection(COLLECTIONS.raffles).orderBy('roundNumber', 'desc').limit(1).get();
  return snap.empty ? null : mapDoc(snap.docs[0]);
}

module.exports = { ...repo, getNextRoundNumber, getLatest };
