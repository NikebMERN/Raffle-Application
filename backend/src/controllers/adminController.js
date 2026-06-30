const drawService = require('../services/drawService');
const analyticsService = require('../services/analyticsService');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');
const RewardConfig = require('../models/RewardConfig');
const { paginate, paginatedResponse } = require('../utils/helpers');

exports.overview = async (req, res, next) => {
  try {
    res.json(await analyticsService.getOverview());
  } catch (err) {
    next(err);
  }
};

exports.executeDraw = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    res.json(await drawService.executeDraw(req.params.raffleId, req.user._id, io));
  } catch (err) {
    next(err);
  }
};

exports.reports = async (req, res, next) => {
  try {
    res.json(await analyticsService.getSalesReport());
  } catch (err) {
    next(err);
  }
};

exports.auditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.userId) filter.userId = req.query.userId;
    const [data, total] = await Promise.all([
      AuditLog.find(filter).populate('userId', 'email firstName lastName').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    res.json(await Settings.find());
  } catch (err) {
    next(err);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { value: req.body.value, description: req.body.description },
      { upsert: true, new: true },
    );
    res.json(setting);
  } catch (err) {
    next(err);
  }
};

exports.listRewards = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      RewardConfig.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      RewardConfig.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.createReward = async (req, res, next) => {
  try {
    const { name, numberOfWinners, rewards, raffleId } = req.body;
    const totalSlots = rewards.reduce((s, r) => s + r.winnersCount, 0);
    if (totalSlots !== numberOfWinners) {
      return res.status(400).json({ message: 'Winners count must match tier slots' });
    }
    const totalRewardPool = rewards.reduce((s, r) => s + r.amount * r.winnersCount, 0);
    const config = await RewardConfig.create({
      name,
      numberOfWinners,
      rewards,
      raffleId,
      totalRewardPool,
      createdBy: req.user._id,
    });
    res.status(201).json(config);
  } catch (err) {
    next(err);
  }
};

exports.updateReward = async (req, res, next) => {
  try {
    const config = await RewardConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(config);
  } catch (err) {
    next(err);
  }
};

exports.deleteReward = async (req, res, next) => {
  try {
    await RewardConfig.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
