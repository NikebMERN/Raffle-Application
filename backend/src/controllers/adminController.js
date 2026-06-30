const drawService = require('../services/drawService');
const analyticsService = require('../services/analyticsService');
const auditLogsRepo = require('../repositories/auditLogsRepo');
const settingsRepo = require('../repositories/settingsRepo');
const settingsService = require('../services/settingsService');
const rewardConfigsRepo = require('../repositories/rewardConfigsRepo');
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
    res.json(await drawService.executeDraw(req.params.raffleId, req.user.id, io));
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

exports.ticketInventory = async (req, res, next) => {
  try {
    res.json(await analyticsService.getTicketInventory(req.query.raffleId));
  } catch (err) {
    next(err);
  }
};

exports.auditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filters = [];
    if (req.query.action) filters.push(['action', '==', req.query.action]);
    if (req.query.userId) filters.push(['userId', '==', req.query.userId]);
    const [data, total] = await Promise.all([
      auditLogsRepo.find({ filters, orderBy: ['createdAt', 'desc'], limit, offset: skip }),
      auditLogsRepo.count(filters),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (_req, res, next) => {
  try {
    res.json(await settingsRepo.list());
  } catch (err) {
    next(err);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const setting = await settingsRepo.upsert(req.params.key, req.body.value, req.body.description, req.body.category);
    // Drop the cache so the new value is read on the very next request.
    settingsService.invalidate();
    res.json(setting);
  } catch (err) {
    next(err);
  }
};

exports.listRewards = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      rewardConfigsRepo.find({ orderBy: ['createdAt', 'desc'], limit, offset: skip }),
      rewardConfigsRepo.count(),
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
    const config = await rewardConfigsRepo.create({
      name,
      numberOfWinners,
      rewards,
      raffleId: raffleId || null,
      totalRewardPool,
      isActive: true,
      createdBy: req.user.id,
    });
    res.status(201).json(config);
  } catch (err) {
    next(err);
  }
};

exports.updateReward = async (req, res, next) => {
  try {
    res.json(await rewardConfigsRepo.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
};

exports.deleteReward = async (req, res, next) => {
  try {
    await rewardConfigsRepo.remove(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
