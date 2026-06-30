const rafflesRepo = require('../repositories/rafflesRepo');
const usersRepo = require('../repositories/usersRepo');
const transactionsRepo = require('../repositories/transactionsRepo');
const ticketsRepo = require('../repositories/ticketsRepo');
const { TICKET_STATUS, RAFFLE_STATUS, TRANSACTION_STATUS } = require('../utils/constants');

async function getOverview() {
  const completedFilter = [['status', '==', TRANSACTION_STATUS.COMPLETED]];
  const [totalRaffles, totalUsers, totalTransactions, completed, active] = await Promise.all([
    rafflesRepo.count(),
    usersRepo.count(),
    transactionsRepo.count(completedFilter),
    transactionsRepo.find({ filters: completedFilter }),
    rafflesRepo.findOne([['status', '==', RAFFLE_STATUS.ACTIVE]], ['roundNumber', 'desc']),
  ]);

  const totalRevenue = completed.reduce((sum, t) => sum + (t.amount || 0), 0);

  return {
    totalRaffles,
    totalUsers,
    totalTransactions,
    totalRevenue,
    activeRaffle: active,
  };
}

async function getSalesReport() {
  const sales = await transactionsRepo.find({
    filters: [['status', '==', TRANSACTION_STATUS.COMPLETED]],
    orderBy: ['createdAt', 'desc'],
    limit: 100,
  });

  const online = sales.filter((s) => s.paymentMethod === 'stripe');
  const wallet = sales.filter((s) => s.paymentMethod === 'wallet');

  return {
    totalSales: sales.length,
    totalRevenue: sales.reduce((s, t) => s + (t.amount || 0), 0),
    online: { count: online.length, revenue: online.reduce((s, t) => s + (t.amount || 0), 0) },
    wallet: { count: wallet.length, revenue: wallet.reduce((s, t) => s + (t.amount || 0), 0) },
    sales,
  };
}

async function getTicketInventory(raffleId) {
  const statuses = Object.values(TICKET_STATUS);
  const results = await Promise.all(statuses.map(async (status) => {
    const filters = [['status', '==', status]];
    if (raffleId) filters.unshift(['raffleId', '==', raffleId]);
    const count = await ticketsRepo.count(filters);
    return { _id: status, count };
  }));
  return results.filter((r) => r.count > 0);
}

module.exports = { getOverview, getSalesReport, getTicketInventory };
