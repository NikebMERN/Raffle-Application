const { getDb } = require('../config/firebase');
const { COLLECTIONS, FieldValue } = require('../lib/firestore');
const { TICKET_STATUS } = require('../utils/constants');
const logger = require('../config/logger');

// Release reservations that have passed their hold window back to AVAILABLE.
async function processCleanupJob() {
  const db = getDb();
  const now = new Date();
  const snap = await db
    .collection(COLLECTIONS.tickets)
    .where('status', '==', TICKET_STATUS.RESERVED)
    .get();

  const expired = snap.docs.filter((d) => {
    const reservedUntil = d.data().reservedUntil;
    const ts = reservedUntil?.toDate ? reservedUntil.toDate() : reservedUntil;
    return ts && new Date(ts) < now;
  });

  if (!expired.length) return;

  // Commit in chunks of 500 (Firestore batch limit).
  for (let i = 0; i < expired.length; i += 500) {
    const batch = db.batch();
    expired.slice(i, i + 500).forEach((d) => {
      batch.update(d.ref, {
        status: TICKET_STATUS.AVAILABLE,
        userId: null,
        reservedUntil: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  logger.info(`Cleanup job: released ${expired.length} expired reservations`);
}

module.exports = { processCleanupJob };
