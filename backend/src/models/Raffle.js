const mongoose = require('mongoose');
const { RAFFLE_STATUS, DEFAULTS } = require('../utils/constants');

const winnerSchema = new mongoose.Schema({
  rank: Number,
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  ticketNumber: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  prizeAmount: Number,
  prizePercentage: Number,
  claimed: { type: Boolean, default: false },
  claimedAt: Date,
  kycVerified: { type: Boolean, default: false },
  claimDeadline: Date,
});

const raffleSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: Object.values(RAFFLE_STATUS),
      default: RAFFLE_STATUS.DRAFT,
      index: true,
    },
    totalTickets: { type: Number, default: DEFAULTS.TOTAL_TICKETS },
    ticketPrice: { type: Number, default: DEFAULTS.TICKET_PRICE },
    requiredSold: { type: Number, default: DEFAULTS.REQUIRED_SOLD },
    winnersCount: { type: Number, default: DEFAULTS.WINNERS_COUNT },
    prizePool: { type: Number, default: 0 },
    maxTicketsPerUser: { type: Number, default: DEFAULTS.MAX_TICKETS_PER_USER },
    soldCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    drawDate: Date,
    drawHash: String,
    drawSeed: String,
    winners: [winnerSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

raffleSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('Raffle', raffleSchema);
