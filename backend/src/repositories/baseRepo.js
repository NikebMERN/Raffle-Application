const { collection, mapDoc, mapSnap, FieldValue } = require('../lib/firestore');

function applyFilters(query, filters = []) {
  let q = query;
  for (const [field, op, value] of filters) {
    if (value === undefined || value === null || value === '') continue;
    q = q.where(field, op, value);
  }
  return q;
}

// Firestore needs a composite index whenever a query combines a where() filter
// with an orderBy() on a different field. This detects that specific error so we
// can transparently fall back to ordering in memory (no manual index required).
function isMissingIndexError(err) {
  return err && (err.code === 9 || /requires an index/i.test(err.message || ''));
}

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function sortInMemory(docs, orderBy) {
  if (!orderBy) return docs;
  const [field, dir = 'asc'] = orderBy;
  const sorted = [...docs].sort((x, y) => compareValues(x[field], y[field]));
  return dir === 'desc' ? sorted.reverse() : sorted;
}

function createRepo(collectionName) {
  const col = () => collection(collectionName);

  async function create(data) {
    const now = FieldValue.serverTimestamp();
    const ref = await col().add({ ...data, createdAt: now, updatedAt: now });
    const snap = await ref.get();
    return mapDoc(snap);
  }

  async function setById(id, data) {
    const now = FieldValue.serverTimestamp();
    await col().doc(id).set({ ...data, createdAt: now, updatedAt: now }, { merge: true });
    return getById(id);
  }

  async function getById(id) {
    if (!id) return null;
    return mapDoc(await col().doc(id).get());
  }

  async function update(id, data) {
    await col().doc(id).set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return getById(id);
  }

  async function remove(id) {
    await col().doc(id).delete();
    return { id };
  }

  async function findOne(filters = [], orderBy = null) {
    let q = applyFilters(col(), filters).limit(1);
    if (orderBy) q = q.orderBy(orderBy[0], orderBy[1] || 'asc');
    try {
      const snap = await q.get();
      return snap.empty ? null : mapDoc(snap.docs[0]);
    } catch (err) {
      if (!orderBy || !isMissingIndexError(err)) throw err;
      const docs = sortInMemory(mapSnap(await applyFilters(col(), filters).get()), orderBy);
      return docs[0] || null;
    }
  }

  async function find({ filters = [], orderBy = null, limit = null, offset = 0 } = {}) {
    let q = applyFilters(col(), filters);
    if (orderBy) q = q.orderBy(orderBy[0], orderBy[1] || 'asc');
    if (offset) q = q.offset(offset);
    if (limit) q = q.limit(limit);
    try {
      return mapSnap(await q.get());
    } catch (err) {
      if (!orderBy || !isMissingIndexError(err)) throw err;
      // Fall back to filtering server-side, then ordering + paginating in memory.
      const docs = sortInMemory(mapSnap(await applyFilters(col(), filters).get()), orderBy);
      const start = offset || 0;
      return limit ? docs.slice(start, start + limit) : docs.slice(start);
    }
  }

  async function count(filters = []) {
    const snap = await applyFilters(col(), filters).count().get();
    return snap.data().count;
  }

  return {
    collectionName,
    col,
    create,
    setById,
    getById,
    update,
    remove,
    findOne,
    find,
    count,
  };
}

module.exports = { createRepo, applyFilters };
