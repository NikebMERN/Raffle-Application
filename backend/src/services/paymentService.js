const Stripe = require('stripe');
const { getDb } = require('../config/firebase');
const { COLLECTIONS, FieldValue } = require('../lib/firestore');
const transactionsRepo = require('../repositories/transactionsRepo');
const rafflesRepo = require('../repositories/rafflesRepo');
const usersRepo = require('../repositories/usersRepo');
const ticketService = require('./ticketService');
const walletService = require('./walletService');
const notificationService = require('./notificationService');
const settingsService = require('./settingsService');
const { TRANSACTION_STATUS } = require('../utils/constants');
const { calculateTotalPrice } = require('../utils/helpers');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey && !stripeKey.includes('your_key') && !stripeKey.includes('REPLACE')
  ? new Stripe(stripeKey)
  : null;

async function createCheckout(userId, raffleId, quantity) {
  const raffle = await rafflesRepo.getById(raffleId);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });

  const discounts = await settingsService.getBulkDiscounts();
  const pricing = calculateTotalPrice(quantity, raffle.ticketPrice, discounts);
  const tickets = await ticketService.reserveTickets(raffleId, userId, quantity);

  const transaction = await transactionsRepo.create({
    userId,
    raffleId,
    ticketIds: tickets.map((t) => t.id),
    amount: pricing.total,
    discount: pricing.discountAmount,
    status: TRANSACTION_STATUS.PENDING,
    paymentMethod: 'stripe',
    metadata: { quantity, pricing },
  });

  if (!stripe) {
    await fulfillTransaction(transaction.id);
    return { message: 'Demo mode: payment auto-completed', transactionId: transaction.id };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `${raffle.title} - ${quantity} ticket(s)` },
        unit_amount: Math.round(pricing.total * 100),
      },
      quantity: 1,
    }],
    success_url: `${process.env.FRONTEND_URL}/my-tickets?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/raffles/${raffleId}?cancelled=true`,
    metadata: { transactionId: transaction.id },
  });

  await transactionsRepo.update(transaction.id, { stripeSessionId: session.id });
  return { sessionId: session.id, url: session.url, transactionId: transaction.id };
}

async function payWithWallet(userId, raffleId, quantity) {
  const raffle = await rafflesRepo.getById(raffleId);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });

  const discounts = await settingsService.getBulkDiscounts();
  const pricing = calculateTotalPrice(quantity, raffle.ticketPrice, discounts);
  const tickets = await ticketService.reserveTickets(raffleId, userId, quantity);

  try {
    await walletService.debit(userId, pricing.total, `ticket-purchase-${raffleId}`);
  } catch (err) {
    await ticketService.releaseReservation(tickets.map((t) => t.id));
    throw err;
  }

  const transaction = await transactionsRepo.create({
    userId,
    raffleId,
    ticketIds: tickets.map((t) => t.id),
    amount: pricing.total,
    discount: pricing.discountAmount,
    status: TRANSACTION_STATUS.PENDING,
    paymentMethod: 'wallet',
  });

  await fulfillTransaction(transaction.id);
  return transactionsRepo.getById(transaction.id);
}

async function fulfillTransaction(transactionId) {
  const transaction = await transactionsRepo.getById(transactionId);
  if (!transaction || transaction.status === TRANSACTION_STATUS.COMPLETED) return transaction;

  const tickets = await ticketService.assignTicketsPermanently(
    transaction.ticketIds,
    transaction.userId,
    transaction.amount / transaction.ticketIds.length,
  );

  await getDb().collection(COLLECTIONS.raffles).doc(transaction.raffleId).set({
    soldCount: FieldValue.increment(tickets.length),
    revenue: FieldValue.increment(transaction.amount),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await transactionsRepo.update(transactionId, { status: TRANSACTION_STATUS.COMPLETED });

  const user = await usersRepo.getById(transaction.userId);
  if (user) {
    await notificationService.sendInApp(user.id, 'purchases', 'Ticket Purchase Confirmed', `You purchased ${tickets.length} ticket(s).`);
    await notificationService.sendEmail(user, 'purchase', {
      subject: 'Ticket Purchase Confirmation',
      body: `Your ${tickets.length} ticket(s) have been confirmed.`,
    });
  }

  return transactionsRepo.getById(transactionId);
}

function getStripe() {
  return stripe;
}

async function handleStripeWebhook(payload, signature) {
  if (!stripe) return { received: true };
  const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const transaction = await transactionsRepo.findByStripeSession(session.id);
    if (transaction) await fulfillTransaction(transaction.id);
  }
  return { received: true };
}

async function listTransactions(query) {
  const filters = [];
  if (query.userId) filters.push(['userId', '==', query.userId]);
  if (query.status) filters.push(['status', '==', query.status]);
  return transactionsRepo.find({ filters, orderBy: ['createdAt', 'desc'], limit: 100 });
}

module.exports = {
  createCheckout,
  payWithWallet,
  fulfillTransaction,
  handleStripeWebhook,
  listTransactions,
  getStripe,
};
