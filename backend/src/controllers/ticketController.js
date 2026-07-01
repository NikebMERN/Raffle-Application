const ticketService = require('../services/ticketService');
const paymentService = require('../services/paymentService');

exports.list = async (req, res, next) => {
  try {
    res.json(await ticketService.listTickets(req.query));
  } catch (err) {
    next(err);
  }
};

exports.grid = async (req, res, next) => {
  try {
    res.json(await ticketService.getTicketGrid(req.params.raffleId));
  } catch (err) {
    next(err);
  }
};

exports.purchase = async (req, res, next) => {
  try {
    const { raffleId, quantity, paymentMethod } = req.body;
    const result =
      paymentMethod === 'wallet'
        ? await paymentService.payWithWallet(req.user.id, raffleId, quantity)
        : await paymentService.createCheckout(req.user.id, raffleId, quantity);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.myTickets = async (req, res, next) => {
  try {
    res.json(await ticketService.listTickets({ ...req.query, userId: req.user.id }));
  } catch (err) {
    next(err);
  }
};
