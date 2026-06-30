const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed,
    description: String,
    category: {
      type: String,
      enum: ['general', 'raffle', 'payment', 'notification', 'security'],
      default: 'general',
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Settings', settingsSchema);
