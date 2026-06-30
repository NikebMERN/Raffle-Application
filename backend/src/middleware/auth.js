const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, authConfig.accessSecret);
    const user = await User.findById(payload.sub).select('-passwordHash -twoFactorSecret');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    if (user.isLocked()) {
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return next();
  jwt.verify(token, authConfig.accessSecret, async (err, payload) => {
    if (!err) {
      const user = await User.findById(payload.sub).select('-passwordHash');
      if (user) req.user = user;
    }
    next();
  });
}

module.exports = { authenticate, optionalAuth };
