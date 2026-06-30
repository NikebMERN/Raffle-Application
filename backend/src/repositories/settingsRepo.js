const { COLLECTIONS, collection, mapDoc, mapSnap, FieldValue } = require('../lib/firestore');

// Settings are keyed by their unique `key`.
async function list() {
  return mapSnap(await collection(COLLECTIONS.settings).get());
}

async function get(key) {
  return mapDoc(await collection(COLLECTIONS.settings).doc(key).get());
}

async function upsert(key, value, description, category = 'general') {
  await collection(COLLECTIONS.settings).doc(key).set(
    { key, value, description, category, updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return get(key);
}

module.exports = { list, get, upsert };
