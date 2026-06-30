const mongoose = require('mongoose');
const { TRANSACTION_STATUS } = require('../utils/constants');

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    raffleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle', index: true },
    ticketIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
    amount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
      index: true,
    },
    paymentMethod: { type: String, enum: ['stripe', 'paypal', 'wallet'], default: 'stripe' },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    paypalOrderId: String,
    refundAmount: Number,
    metadata: mongoose.Schema.Types.Mixed,
    receiptUrl: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Transaction', transactionSchema);
