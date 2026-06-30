const User = require('../models/User');
const { paginate, paginatedResponse, omit } = require('../utils/helpers');
const notificationService = require('../services/notificationService');

exports.list = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { email: new RegExp(req.query.search, 'i') },
        { username: new RegExp(req.query.search, 'i') },
        { firstName: new RegExp(req.query.search, 'i') },
      ];
    }
    const [data, total] = await Promise.all([
      User.find(filter).select('-passwordHash -twoFactorSecret').skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -twoFactorSecret');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = omit(req.body, ['passwordHash', 'role']);
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-passwordHash');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.ban = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
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
    const result = await notificationService.registerFcmToken(
      req.user._id,
      req.body.token,
      req.body.deviceId,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.removeFcmToken = async (req, res, next) => {
  try {
    const result = await notificationService.removeFcmToken(req.user._id, req.body.token);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
