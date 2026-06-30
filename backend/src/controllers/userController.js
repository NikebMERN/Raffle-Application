const usersRepo = require('../repositories/usersRepo');
const auditLogsRepo = require('../repositories/auditLogsRepo');
const notificationService = require('../services/notificationService');
const { paginate, paginatedResponse, omit } = require('../utils/helpers');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { data, total } = await usersRepo.search(req.query.search, { limit, offset: skip });
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const user = await usersRepo.getById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = omit(req.body, ['role', 'walletBalance', 'email', 'fcmTokens']);
    const user = await usersRepo.update(req.params.id, data);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.setRole = async (req, res, next) => {
  try {
    const user = await usersRepo.update(req.params.id, { role: req.body.role });
    await auditLogsRepo.record({ userId: req.user.id, action: 'SET_ROLE', entity: 'user', entityId: req.params.id, newValue: { role: req.body.role } });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.ban = async (req, res, next) => {
  try {
    const user = await usersRepo.update(req.params.id, { isActive: false });
    await auditLogsRepo.record({ userId: req.user.id, action: 'BAN_USER', entity: 'user', entityId: req.params.id });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.profile = async (req, res) => {
  res.json(req.user);
};

exports.registerFcmToken = async (req, res, next) => {
  try {
    res.json(await notificationService.registerFcmToken(req.user.id, req.body.token));
  } catch (err) {
    next(err);
  }
};

exports.removeFcmToken = async (req, res, next) => {
  try {
    res.json(await notificationService.removeFcmToken(req.user.id, req.body.token));
  } catch (err) {
    next(err);
  }
};
