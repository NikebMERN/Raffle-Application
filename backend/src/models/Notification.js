const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: { type: String, enum: ['email', 'sms', 'push', 'in_app'], required: true },
    category: {
      type: String,
      enum: ['purchases', 'wins', 'draws', 'promotions', 'system', 'reminders'],
      default: 'system',
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    sentAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

module.exports = mongoose.model('Notification', notificationSchema);
