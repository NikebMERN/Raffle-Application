const raffleService = require('../services/raffleService');

exports.list = async (req, res, next) => {
  try {
    const activeOnly = req.path.includes('/public');
    res.json(await raffleService.listRaffles(req.query, activeOnly));
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    res.json(await raffleService.getRaffle(req.params.id));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    res.status(201).json(await raffleService.createRaffle(req.body, req.user._id));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    res.json(await raffleService.updateRaffle(req.params.id, req.body, req.user._id));
  } catch (err) {
    next(err);
  }
};

exports.publish = async (req, res, next) => {
  try {
    res.json(await raffleService.publishRaffle(req.params.id, req.user._id));
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    res.json(await raffleService.cancelRaffle(req.params.id, req.user._id));
  } catch (err) {
    next(err);
  }
};
