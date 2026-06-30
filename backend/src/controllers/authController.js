const usersRepo = require('../repositories/usersRepo');
const auditLogsRepo = require('../repositories/auditLogsRepo');

// The Firebase ID token is verified in middleware; `req.user` is the synced profile.
exports.me = async (req, res) => {
  res.json(req.user);
};

// Called right after Google sign-in; the auth middleware has already upserted the profile.
exports.session = async (req, res) => {
  await auditLogsRepo.record({
    userId: req.user.id,
    action: 'LOGIN_SUCCESS',
    entity: 'user',
    entityId: req.user.id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  res.json(req.user);
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['firstName', 'lastName', 'displayName', 'phone', 'notificationPreferences'];
    const data = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    });
    const user = await usersRepo.update(req.user.id, data);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.logout = (_req, res) => {
  res.clearCookie('id_token');
  res.json({ message: 'Logged out' });
};
