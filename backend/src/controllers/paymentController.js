const paymentService = require('../services/paymentService');

exports.checkout = async (req, res, next) => {
  try {
    const { raffleId, quantity } = req.body;
    res.json(await paymentService.createCheckout(req.user._id, raffleId, quantity));
  } catch (err) {
    next(err);
  }
};

exports.walletDeposit = async (req, res, next) => {
  try {
    res.json(await paymentService.createWalletDeposit(req.user._id, req.body.amount));
  } catch (err) {
    next(err);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    // On Cloud Functions the raw payload is on req.rawBody; locally express.raw
    // puts the Buffer on req.body. Prefer rawBody so signature checks pass in both.
    const payload = req.rawBody || req.body;
    const result = await paymentService.handleStripeWebhook(payload, req.headers['stripe-signature']);
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
