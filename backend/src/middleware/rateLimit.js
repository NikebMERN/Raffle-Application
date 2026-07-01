const rateLimit = require('express-rate-limit');

// General API limiter. Behind a proxy this needs `trust proxy` set (see app.js)
// so the client IP — not the proxy's — is used as the key.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for sensitive endpoints (auth + payments) to blunt
// credential stuffing and payment abuse.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 30,
  message: { message: 'Too many attempts, please slow down and try again shortly' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter };
