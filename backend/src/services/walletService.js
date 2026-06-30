const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

async function getBalance(userId) {
  const user = await User.findById(userId).select('walletBalance');
  return { balance: user?.walletBalance || 0, currency: 'GBP' };
}

async function credit(userId, amount, reference) {
  if (amount <= 0) throw Object.assign(new Error('Amount must be positive'), { status: 400 });
  const user = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } }, { new: true });
  await AuditLog.create({ userId, action: 'WALLET_CREDIT', newValue: { amount, reference, balance: user.walletBalance } });
  return { balance: user.walletBalance };
}

async function debit(userId, amount, reference) {
  if (amount <= 0) throw Object.assign(new Error('Amount must be positive'), { status: 400 });
  const user = await User.findById(userId);
  if (user.walletBalance < amount) throw Object.assign(new Error('Insufficient balance'), { status: 400 });
  user.walletBalance -= amount;
  await user.save();
  await AuditLog.create({ userId, action: 'WALLET_DEBIT', newValue: { amount, reference, balance: user.walletBalance } });
  return { balance: user.walletBalance };
}

async function topUp(userId, amount) {
  return credit(userId, amount, 'top-up');
}

module.exports = { getBalance, credit, debit, topUp };
