const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapDoc, mapSnap, FieldValue } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.users);

// Users are keyed by their Firebase Auth UID.
async function upsertByUid(uid, data) {
  const ref = collection(COLLECTIONS.users).doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  } else {
    await ref.set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return mapDoc(await ref.get());
}

async function incrementWallet(uid, amount) {
  await collection(COLLECTIONS.users).doc(uid).set(
    { walletBalance: FieldValue.increment(amount), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return repo.getById(uid);
}

// Firestore has no native "contains" search; filter in memory for the admin list.
async function search(term, { limit = 20, offset = 0 } = {}) {
  const all = mapSnap(await collection(COLLECTIONS.users).orderBy('createdAt', 'desc').get());
  const filtered = term
    ? all.filter((u) => {
      const t = term.toLowerCase();
      return [u.email, u.displayName, u.firstName, u.lastName]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(t));
    })
    : all;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length };
}

module.exports = { ...repo, upsertByUid, incrementWallet, search };
