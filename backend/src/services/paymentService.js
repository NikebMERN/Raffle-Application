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

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

// Fund the in-app wallet via Stripe. In demo mode (no Stripe key) the deposit is
// credited instantly; otherwise we return a Checkout URL and credit on webhook.
async function createWalletDeposit(userId, amount) {
  const value = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(value) || value <= 0) throw badRequest('Enter a valid amount');
  if (value < 1) throw badRequest('Minimum deposit is $1');
  if (value > 10000) throw badRequest('Maximum deposit is $10,000');

  const transaction = await transactionsRepo.create({
    userId,
    kind: 'wallet_deposit',
    amount: value,
    status: TRANSACTION_STATUS.PENDING,
    paymentMethod: 'stripe',
  });

  if (!stripe) {
    await fulfillWalletDeposit(transaction.id);
    return { message: 'Demo mode: deposit credited instantly', transactionId: transaction.id, demo: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: 'Wallet deposit' },
        unit_amount: Math.round(value * 100),
      },
      quantity: 1,
    }],
    success_url: `${process.env.FRONTEND_URL}/wallet?deposit=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/wallet?deposit=cancelled`,
    metadata: { transactionId: transaction.id, kind: 'wallet_deposit' },
  });

  await transactionsRepo.update(transaction.id, { stripeSessionId: session.id });
  return { sessionId: session.id, url: session.url, transactionId: transaction.id };
}

// Credit a wallet deposit when the user returns from Stripe Checkout. Verifies the
// session was actually paid, so this is safe even without a configured webhook.
// Idempotent: fulfilling an already-completed transaction is a no-op.
async function confirmWalletDeposit(userId, sessionId) {
  if (!stripe) throw badRequest('Stripe is not configured');
  if (!sessionId) throw badRequest('Missing session id');

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session || session.payment_status !== 'paid') {
    throw badRequest('Payment not completed yet');
  }

  const txId = session.metadata?.transactionId;
  const transaction = txId
    ? await transactionsRepo.getById(txId)
    : await transactionsRepo.findByStripeSession(sessionId);

  if (!transaction || transaction.userId !== userId) {
    throw Object.assign(new Error('Deposit not found'), { status: 404 });
  }

  await fulfillWalletDeposit(transaction.id);
  const { balance } = await walletService.getBalance(userId);
  return { status: 'completed', balance };
}

async function fulfillWalletDeposit(transactionId) {
  const transaction = await transactionsRepo.getById(transactionId);
  if (!transaction || transaction.status === TRANSACTION_STATUS.COMPLETED) return transaction;

  await walletService.credit(transaction.userId, transaction.amount, { type: 'deposit', reference: 'Card deposit' });
  await transactionsRepo.update(transactionId, { status: TRANSACTION_STATUS.COMPLETED });

  const user = await usersRepo.getById(transaction.userId);
  if (user) {
    await notificationService.sendInApp(
      user.id,
      'purchases',
      'Deposit received',
      `$${transaction.amount.toFixed(2)} was added to your wallet.`,
    );
  }
  return transactionsRepo.getById(transactionId);
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
    if (transaction) {
      if (transaction.kind === 'wallet_deposit') await fulfillWalletDeposit(transaction.id);
      else await fulfillTransaction(transaction.id);
    }
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
  createWalletDeposit,
  confirmWalletDeposit,
  fulfillWalletDeposit,
  fulfillTransaction,
  handleStripeWebhook,
  listTransactions,
  getStripe,
};
