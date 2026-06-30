const mongoose = require('mongoose');

const rewardConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    raffleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Raffle' },
    numberOfWinners: { type: Number, required: true, min: 1 },
    totalRewardPool: { type: Number, default: 0 },
    rewards: [
      {
        position: Number,
        name: String,
        amount: Number,
        winnersCount: { type: Number, default: 1 },
        description: String,
      },
    ],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RewardConfig', rewardConfigSchema);
