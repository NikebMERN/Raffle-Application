const { createRepo } = require('./baseRepo');
const { COLLECTIONS, collection, mapSnap, FieldValue } = require('../lib/firestore');

const repo = createRepo(COLLECTIONS.notifications);

async function listForUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  // Filter server-side, then sort by createdAt in memory so we don't require a
  // composite (userId + createdAt) Firestore index.
  let q = collection(COLLECTIONS.notifications).where('userId', '==', userId);
  if (unreadOnly) q = q.where('read', '==', false);
  const rows = mapSnap(await q.get());
  rows.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  return rows.slice(0, limit);
}

async function markAllRead(userId) {
  const snap = await collection(COLLECTIONS.notifications)
    .where('userId', '==', userId)
    .where('read', '==', false)
    .get();
  const db = collection(COLLECTIONS.notifications).firestore;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true, updatedAt: FieldValue.serverTimestamp() }));
  await batch.commit();
  return { updated: snap.size };
}

module.exports = { ...repo, listForUser, markAllRead };
