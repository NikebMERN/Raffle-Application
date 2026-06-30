const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapDoc } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.rewardConfigs);

async function findByName(name) {
  const snap = await collection(COLLECTIONS.rewardConfigs).where('name', '==', name).limit(1).get();
  return snap.empty ? null : mapDoc(snap.docs[0]);
}

module.exports = { ...repo, findByName };
