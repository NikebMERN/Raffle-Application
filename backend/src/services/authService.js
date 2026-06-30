const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const authConfig = require('../config/auth');
const { ROLES, DEFAULTS } = require('../utils/constants');
const notificationService = require('./notificationService');

function signTokens(user) {
  const payload = { sub: user._id.toString(), email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, authConfig.accessSecret, { expiresIn: authConfig.accessExpiry });
  const refreshToken = jwt.sign(payload, authConfig.refreshSecret, { expiresIn: authConfig.refreshExpiry });
  return { accessToken, refreshToken };
}

async function register(data, ipAddress) {
  const existing = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
  if (existing) throw Object.assign(new Error('Email or username already registered'), { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, DEFAULTS.BCRYPT_ROUNDS);
  const verificationToken = uuidv4();

  const user = await User.create({
    email: data.email,
    username: data.username,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    role: ROLES.USER,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    referralCode: uuidv4().slice(0, 8).toUpperCase(),
  });

  await AuditLog.create({ userId: user._id, action: 'REGISTER', entity: 'user', entityId: user._id, ipAddress });
  await notificationService.sendEmail(user, 'welcome', {
    subject: 'Welcome to SF Football Club Raffle',
    body: `Hello ${user.firstName}, welcome! Please verify your email.`,
  });

  return signTokens(user);
}

async function login(email, password, twoFactorCode, ipAddress, userAgent) {
  const user = await User.findOne({ email });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  if (user.isLocked()) {
    throw Object.assign(new Error('Account locked. Try again later.'), { status: 423 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= DEFAULTS.MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + DEFAULTS.LOCKOUT_MINUTES * 60 * 1000);
    }
    await user.save();
    await AuditLog.create({ userId: user._id, action: 'LOGIN_FAILED', ipAddress, userAgent, suspicious: true });
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  if (user.twoFactorEnabled) {
    if (!twoFactorCode) throw Object.assign(new Error('2FA code required'), { status: 403, code: '2FA_REQUIRED' });
    const valid2fa = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1,
    });
    const backupValid = user.twoFactorBackupCodes?.includes(twoFactorCode);
    if (!valid2fa && !backupValid) {
      throw Object.assign(new Error('Invalid 2FA code'), { status: 401 });
    }
    if (backupValid) {
      user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter((c) => c !== twoFactorCode);
      await user.save();
    }
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  await AuditLog.create({ userId: user._id, action: 'LOGIN_SUCCESS', ipAddress, userAgent });
  return signTokens(user);
}

async function setup2FA(userId) {
  const secret = speakeasy.generateSecret({ name: 'SF Football Club Raffle' });
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  await User.findByIdAndUpdate(userId, { twoFactorSecret: secret.base32 });
  return { secret: secret.base32, qrCode };
}

async function enable2FA(userId, token) {
  const user = await User.findById(userId);
  const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 });
  if (!valid) throw Object.assign(new Error('Invalid 2FA code'), { status: 400 });

  const backupCodes = Array.from({ length: 10 }, () => uuidv4().slice(0, 8).toUpperCase());
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodes = backupCodes;
  await user.save();
  return { backupCodes };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) return { message: 'If the email exists, a reset link has been sent' };

  const token = uuidv4();
  user.passwordResetToken = token;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await notificationService.sendEmail(user, 'password_reset', {
    subject: 'Password Reset',
    body: `Reset your password using token: ${token}`,
  });

  return { message: 'If the email exists, a reset link has been sent' };
}

async function resetPassword(token, newPassword) {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });

  user.passwordHash = await bcrypt.hash(newPassword, DEFAULTS.BCRYPT_ROUNDS);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  return { message: 'Password reset successful' };
}

module.exports = {
  signTokens,
  register,
  login,
  setup2FA,
  enable2FA,
  forgotPassword,
  resetPassword,
};
