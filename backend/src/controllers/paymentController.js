const paymentService = require('../services/paymentService');

exports.checkout = async (req, res, next) => {
  try {
    const { raffleId, quantity } = req.body;
    res.json(await paymentService.createCheckout(req.user._id, raffleId, quantity));
  } catch (err) {
    next(err);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    const result = await paymentService.handleStripeWebhook(req.body, req.headers['stripe-signature']);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    res.json(await paymentService.listTransactions(req.query));
  } catch (err) {
    next(err);
  }
};
