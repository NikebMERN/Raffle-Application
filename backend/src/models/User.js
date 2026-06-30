const mongoose = require('mongoose');
const { ROLES, DEFAULTS } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: String,
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    twoFactorBackupCodes: [String],
    trustedDevices: [{ deviceId: String, expiresAt: Date }],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    walletBalance: { type: Number, default: 0 },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      quietHoursStart: String,
      quietHoursEnd: String,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true },
);

userSchema.methods.isLocked = function isLocked() {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
