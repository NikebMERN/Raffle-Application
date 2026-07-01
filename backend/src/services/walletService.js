const { getDb } = require('../config/firebase');
const { COLLECTIONS, FieldValue } = require('../lib/firestore');
const usersRepo = require('../repositories/usersRepo');
const walletTxRepo = require('../repositories/walletTransactionsRepo');
const auditLogsRepo = require('../repositories/auditLogsRepo');
const { signEntry, verifyEntry } = require('../utils/walletCrypto');
const { isStripeConfigured } = require('../config/payments');
const { WALLET_TX, WALLET_LIMITS, TRANSACTION_STATUS } = require('../utils/constants');

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function assertAmount(amount) {
  const value = round2(amount);
  if (!Number.isFinite(value) || value <= 0) throw badRequest('Amount must be a positive number');
  if (value < WALLET_LIMITS.MIN_AMOUNT) throw badRequest(`Minimum amount is ${WALLET_LIMITS.MIN_AMOUNT}`);
  if (value > WALLET_LIMITS.MAX_AMOUNT) throw badRequest(`Maximum amount is ${WALLET_LIMITS.MAX_AMOUNT}`);
  return value;
}

// Append a tamper-evident (HMAC-signed) ledger entry.
async function recordEntry({ userId, type, direction, amount, balanceAfter, reference, counterparty, status = TRANSACTION_STATUS.COMPLETED }) {
  const createdAtISO = new Date().toISOString();
  const base = {
    userId,
    type,
    direction,
    amount: round2(amount),
    balanceAfter: round2(balanceAfter),
    reference: reference || '',
    counterparty: counterparty || '',
    status,
    createdAtISO,
  };
  const signature = signEntry(base);
  return walletTxRepo.create({ ...base, signature, createdAt: new Date() });
}

async function getBalance(userId) {
  const user = await usersRepo.getById(userId);
  return { balance: round2(user?.walletBalance || 0), currency: 'USD' };
}

// --- Core balance mutations (atomic) ---------------------------------------

async function credit(userId, amount, { type = WALLET_TX.DEPOSIT, reference, counterparty } = {}) {
  const value = assertAmount(amount);
  const db = getDb();
  const ref = db.collection(COLLECTIONS.users).doc(userId);

  const balanceAfter = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
    const updated = round2((snap.data().walletBalance || 0) + value);
    tx.update(ref, { walletBalance: updated, updatedAt: FieldValue.serverTimestamp() });
    return updated;
  });

  await recordEntry({ userId, type, direction: 'credit', amount: value, balanceAfter, reference, counterparty });
  await auditLogsRepo.record({ userId, action: 'WALLET_CREDIT', newValue: { amount: value, type, reference, balance: balanceAfter } });
  return { balance: balanceAfter };
}

async function debit(userId, amount, reference, { type = WALLET_TX.PURCHASE, counterparty, status } = {}) {
  const value = assertAmount(amount);
  const db = getDb();
  const ref = db.collection(COLLECTIONS.users).doc(userId);

  const balanceAfter = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw Object.assign(new Error('User not found'), { status: 404 });
    const balance = snap.data().walletBalance || 0;
    if (balance < value) throw badRequest('Insufficient balance');
    const updated = round2(balance - value);
    tx.update(ref, { walletBalance: updated, updatedAt: FieldValue.serverTimestamp() });
    return updated;
  });

  await recordEntry({ userId, type, direction: 'debit', amount: value, balanceAfter, reference, counterparty, status });
  await auditLogsRepo.record({ userId, action: 'WALLET_DEBIT', newValue: { amount: value, type, reference, balance: balanceAfter } });
  return { balance: balanceAfter };
}

// --- Public operations ------------------------------------------------------

// Direct wallet credit with NO payment — a demo convenience only. Once Stripe is
// configured (a real deployment), funding must go through the card deposit flow
// (POST /api/v1/payments/wallet-deposit), otherwise anyone could mint balance.
async function topUp(userId, amount) {
  if (isStripeConfigured()) {
    throw Object.assign(
      new Error('Direct top-up is disabled. Add funds by card via wallet deposit.'),
      { status: 403 },
    );
  }
  return credit(userId, amount, { type: WALLET_TX.DEPOSIT, reference: 'Wallet top-up (demo)' });
}

// Withdraw funds: debit immediately (held) and log a pending payout request.
async function withdraw(userId, amount) {
  const value = assertAmount(amount);
  const result = await debit(userId, value, 'Wallet withdrawal', {
    type: WALLET_TX.WITHDRAWAL,
    status: TRANSACTION_STATUS.PENDING,
  });
  return { balance: result.balance, status: 'pending', message: 'Withdrawal requested. Funds are held pending payout.' };
}

// Atomic peer-to-peer transfer: debit sender + credit recipient in ONE transaction.
async function transfer(fromUserId, toEmail, amount) {
  const value = assertAmount(amount);
  const recipient = await usersRepo.findOne([['email', '==', String(toEmail || '').trim().toLowerCase()]]);
  if (!recipient) throw badRequest('Recipient not found');
  if (recipient.id === fromUserId) throw badRequest('You cannot transfer to yourself');
  if (recipient.isActive === false) throw badRequest('Recipient account is inactive');

  const db = getDb();
  const fromRef = db.collection(COLLECTIONS.users).doc(fromUserId);
  const toRef = db.collection(COLLECTIONS.users).doc(recipient.id);

  const balances = await db.runTransaction(async (tx) => {
    const [fromSnap, toSnap] = await Promise.all([tx.get(fromRef), tx.get(toRef)]);
    if (!fromSnap.exists || !toSnap.exists) throw Object.assign(new Error('Account not found'), { status: 404 });
    const fromBalance = fromSnap.data().walletBalance || 0;
    if (fromBalance < value) throw badRequest('Insufficient balance');
    const newFrom = round2(fromBalance - value);
    const newTo = round2((toSnap.data().walletBalance || 0) + value);
    tx.update(fromRef, { walletBalance: newFrom, updatedAt: FieldValue.serverTimestamp() });
    tx.update(toRef, { walletBalance: newTo, updatedAt: FieldValue.serverTimestamp() });
    return { newFrom, newTo };
  });

  const sender = await usersRepo.getById(fromUserId);
  await recordEntry({
    userId: fromUserId,
    type: WALLET_TX.TRANSFER_OUT,
    direction: 'debit',
    amount: value,
    balanceAfter: balances.newFrom,
    reference: `Transfer to ${recipient.email}`,
    counterparty: recipient.email,
  });
  await recordEntry({
    userId: recipient.id,
    type: WALLET_TX.TRANSFER_IN,
    direction: 'credit',
    amount: value,
    balanceAfter: balances.newTo,
    reference: `Transfer from ${sender?.email || 'a member'}`,
    counterparty: sender?.email || fromUserId,
  });

  await auditLogsRepo.record({
    userId: fromUserId,
    action: 'WALLET_TRANSFER',
    entity: 'user',
    entityId: recipient.id,
    newValue: { amount: value, to: recipient.email },
  });

  return { balance: balances.newFrom, message: `Sent ${value.toFixed(2)} to ${recipient.email}` };
}

// Return the ledger, flagging any entry whose signature fails verification.
async function listTransactions(userId, query = {}) {
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
  const rows = await walletTxRepo.listForUser(userId, { limit });
  return rows.map((r) => ({ ...r, verified: verifyEntry(r) }));
}

module.exports = { getBalance, credit, debit, topUp, withdraw, transfer, listTransactions };
