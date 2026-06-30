const Stripe = require('stripe');
const Transaction = require('../models/Transaction');
const Raffle = require('../models/Raffle');
const { TRANSACTION_STATUS } = require('../utils/constants');
const ticketService = require('./ticketService');
const walletService = require('./walletService');
const notificationService = require('./notificationService');
const { calculateTotalPrice } = require('../utils/helpers');

const stripe = process.env.STRIPE_SECRET_KEY?.includes('REPLACE')
  ? null
  : new Stripe(process.env.STRIPE_SECRET_KEY);

async function createCheckout(userId, raffleId, quantity) {
  const raffle = await Raffle.findById(raffleId);
  if (!raffle) throw Object.assign(new Error('Raffle not found'), { status: 404 });

  const pricing = calculateTotalPrice(quantity, raffle.ticketPrice);
  const tickets = await ticketService.reserveTickets(raffleId, userId, quantity);

  const transaction = await Transaction.create({
    userId,
    raffleId,
    ticketIds: tickets.map((t) => t._id),
    amount: pricing.total,
    discount: pricing.discountAmount,
    status: TRANSACTION_STATUS.PENDING,
    paymentMethod: 'stripe',
    metadata: { quantity, pricing },
  });

  if (!stripe) {
    await fulfillTransaction(transaction._id);
    return { message: 'Demo mode: payment auto-completed', transactionId: transaction._id };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: { name: `${raffle.title} - ${quantity} ticket(s)` },
        unit_amount: Math.round(pricing.total * 100),
      },
      quantity: 1,
    }],
    success_url: `${process.env.FRONTEND_URL}/my-tickets?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/raffles/${raffleId}?cancelled=true`,
    metadata: { transactionId: transaction._id.toString() },
  });

  transaction.stripeSessionId = session.id;
  await transaction.save();

  return { sessionId: session.id, url: session.url, transactionId: transaction._id };
}

async function payWithWallet(userId, raffleId, quantity) {
  const raffle = await Raffle.findById(raffleId);
  const pricing = calculateTotalPrice(quantity, raffle.ticketPrice);
  const tickets = await ticketService.reserveTickets(raffleId, userId, quantity);

  await walletService.debit(userId, pricing.total, `ticket-purchase-${raffleId}`);

  const transaction = await Transaction.create({
    userId,
    raffleId,
    ticketIds: tickets.map((t) => t._id),
    amount: pricing.total,
    discount: pricing.discountAmount,
    status: TRANSACTION_STATUS.COMPLETED,
    paymentMethod: 'wallet',
  });

  await fulfillTransaction(transaction._id);
  return transaction;
}

async function fulfillTransaction(transactionId) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction || transaction.status === TRANSACTION_STATUS.COMPLETED) return;

  const tickets = await ticketService.assignTicketsPermanently(
    transaction.ticketIds,
    transaction.userId,
    transaction.amount / transaction.ticketIds.length,
  );

  await Raffle.findByIdAndUpdate(transaction.raffleId, {
    $inc: { soldCount: tickets.length, revenue: transaction.amount },
  });

  transaction.status = TRANSACTION_STATUS.COMPLETED;
  await transaction.save();

  const user = await require('../models/User').findById(transaction.userId);
  await notificationService.sendInApp(user._id, 'purchases', 'Ticket Purchase Confirmed', `You purchased ${tickets.length} ticket(s).`);
  await notificationService.sendEmail(user, 'purchase', {
    subject: 'Ticket Purchase Confirmation',
    body: `Your ${tickets.length} ticket(s) have been confirmed.`,
  });

  return transaction;
}

async function handleStripeWebhook(payload, signature) {
  if (!stripe) return { received: true };
  const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const transaction = await Transaction.findOne({ stripeSessionId: session.id });
    if (transaction) await fulfillTransaction(transaction._id);
  }
  return { received: true };
}

async function listTransactions(query) {
  const filter = {};
  if (query.userId) filter.userId = query.userId;
  if (query.status) filter.status = query.status;
  return Transaction.find(filter).sort({ createdAt: -1 }).limit(100);
}

module.exports = {
  createCheckout,
  payWithWallet,
  fulfillTransaction,
  handleStripeWebhook,
  listTransactions,
};
