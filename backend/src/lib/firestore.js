const { getDb, FieldValue, Timestamp } = require('../config/firebase');

const COLLECTIONS = {
  users: 'users',
  raffles: 'raffles',
  tickets: 'tickets',
  transactions: 'transactions',
  notifications: 'notifications',
  auditLogs: 'auditLogs',
  settings: 'settings',
  rewardConfigs: 'rewardConfigs',
  walletTransactions: 'walletTransactions',
  counters: 'counters',
};

function collection(name) {
  return getDb().collection(name);
}

function toPlain(value) {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(toPlain);
  if (value && typeof value === 'object' && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

// Map a Firestore document snapshot to a plain object.
// Exposes both `id` and `_id` so existing clients keep working.
function mapDoc(snap) {
  if (!snap || !snap.exists) return null;
  const data = toPlain(snap.data());
  return { id: snap.id, _id: snap.id, ...data };
}

function mapSnap(querySnap) {
  return querySnap.docs.map(mapDoc);
}

module.exports = {
  COLLECTIONS,
  collection,
  mapDoc,
  mapSnap,
  toPlain,
  FieldValue,
  Timestamp,
  getDb,
};
