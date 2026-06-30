const crypto = require('crypto');

// Secret used to sign wallet ledger entries. Prefer an explicit WALLET_SECRET;
// otherwise derive a stable key from the Firebase private key so signatures are
// consistent across restarts without extra setup.
function getSecret() {
  return (
    process.env.WALLET_SECRET
    || process.env.FIREBASE_PRIVATE_KEY
    || 'dev-only-wallet-secret-change-me'
  );
}

// Canonical, order-stable representation of the fields that must not be tampered with.
function canonical(entry) {
  return [
    entry.userId,
    entry.type,
    entry.direction,
    Number(entry.amount).toFixed(2),
    Number(entry.balanceAfter).toFixed(2),
    entry.reference || '',
    entry.counterparty || '',
    entry.createdAtISO || '',
  ].join('|');
}

function signEntry(entry) {
  return crypto.createHmac('sha256', getSecret()).update(canonical(entry)).digest('hex');
}

// Timing-safe verification that a ledger entry has not been altered.
function verifyEntry(entry) {
  if (!entry || !entry.signature) return false;
  const expected = signEntry(entry);
  const a = Buffer.from(expected);
  const b = Buffer.from(entry.signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { signEntry, verifyEntry, canonical };
