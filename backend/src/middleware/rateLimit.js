const rateLimit = require('express-rate-limit');
const { DEFAULTS } = require('../utils/constants');

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: DEFAULTS.LOCKOUT_MINUTES * 60 * 1000,
  max: DEFAULTS.MAX_LOGIN_ATTEMPTS,
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.ip,
});

module.exports = { apiLimiter, loginLimiter };
