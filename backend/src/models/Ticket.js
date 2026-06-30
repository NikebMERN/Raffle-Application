const mongoose = require('mongoose');
const { TICKET_STATUS } = require('../utils/constants');

const ticketSchema = new mongoose.Schema(
  {
    raffleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle', required: true, index: true },
    ticketNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.AVAILABLE,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reservedUntil: Date,
    soldAt: Date,
    price: Number,
    saleChannel: { type: String, enum: ['online', 'offline'], default: 'online' },
  },
  { timestamps: true },
);

ticketSchema.index({ raffleId: 1, ticketNumber: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', ticketSchema);
