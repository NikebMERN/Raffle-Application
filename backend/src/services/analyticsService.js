const Raffle = require('../models/Raffle');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { TICKET_STATUS } = require('../utils/constants');

async function getOverview() {
  const [raffles, users, transactions, activeRaffle] = await Promise.all([
    Raffle.countDocuments(),
    User.countDocuments(),
    Transaction.countDocuments({ status: 'completed' }),
    Raffle.findOne({ status: 'active' }),
  ]);

  const revenue = await Transaction.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return {
    totalRaffles: raffles,
    totalUsers: users,
    totalTransactions: transactions,
    totalRevenue: revenue[0]?.total || 0,
    activeRaffle,
  };
}

async function getSalesReport() {
  const sales = await Transaction.find({ status: 'completed' })
    .populate('userId', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(100);

  const online = sales.filter((s) => s.paymentMethod === 'stripe');
  const wallet = sales.filter((s) => s.paymentMethod === 'wallet');

  return {
    totalSales: sales.length,
    totalRevenue: sales.reduce((s, t) => s + t.amount, 0),
    online: { count: online.length, revenue: online.reduce((s, t) => s + t.amount, 0) },
    wallet: { count: wallet.length, revenue: wallet.reduce((s, t) => s + t.amount, 0) },
    sales,
  };
}

async function getTicketInventory(raffleId) {
  const match = raffleId ? { raffleId } : {};
  return Ticket.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
}

module.exports = { getOverview, getSalesReport, getTicketInventory };
