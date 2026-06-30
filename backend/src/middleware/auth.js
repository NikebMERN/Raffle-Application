const { getAuth } = require('../config/firebase');
const usersRepo = require('../repositories/usersRepo');
const { ROLES } = require('../utils/constants');

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function extractToken(req) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  return req.cookies?.id_token || null;
}

// Verify a Firebase ID token (Google sign-in) and load/sync the Firestore profile.
async function resolveUser(decoded) {
  const email = decoded.email?.toLowerCase() || null;
  const isAdminEmail = email && getAdminEmails().includes(email);

  let user = await usersRepo.getById(decoded.uid);

  if (!user) {
    user = await usersRepo.upsertByUid(decoded.uid, {
      email,
      displayName: decoded.name || email,
      firstName: decoded.name?.split(' ')[0] || '',
      lastName: decoded.name?.split(' ').slice(1).join(' ') || '',
      photoURL: decoded.picture || null,
      role: isAdminEmail ? ROLES.SUPER_ADMIN : ROLES.USER,
      isActive: true,
      emailVerified: Boolean(decoded.email_verified),
      walletBalance: 0,
      provider: decoded.firebase?.sign_in_provider || 'google.com',
      lastLoginAt: new Date(),
    });
  } else {
    // Keep admin promotion in sync with ADMIN_EMAILS without demoting manual grants.
    const patch = { lastLoginAt: new Date() };
    if (isAdminEmail && user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.ADMIN) {
      patch.role = ROLES.SUPER_ADMIN;
    }
    user = await usersRepo.update(decoded.uid, patch);
  }

  return user;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    const decoded = await getAuth().verifyIdToken(token);
    const user = await resolveUser(decoded);

    if (!user || user.isActive === false) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    req.user = user;
    req.firebaseUid = decoded.uid;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', detail: err.code });
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = await getAuth().verifyIdToken(token);
      req.user = await resolveUser(decoded);
      req.firebaseUid = decoded.uid;
    }
  } catch {
    // Ignore — anonymous access allowed.
  }
  next();
}

module.exports = { authenticate, optionalAuth, getAdminEmails };
