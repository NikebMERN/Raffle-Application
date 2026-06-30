const express = require('express');
const userController = require('../../controllers/userController');
const notificationService = require('../../services/notificationService');
const walletService = require('../../services/walletService');
const drawService = require('../../services/drawService');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

const router = express.Router();

router.get('/profile', authenticate, userController.profile);
router.post('/fcm-token', authenticate, userController.registerFcmToken);
router.delete('/fcm-token', authenticate, userController.removeFcmToken);

router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    res.json(await notificationService.getUserNotifications(req.user.id, req.query));
  } catch (err) {
    next(err);
  }
});
router.post('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    res.json(await notificationService.markRead(req.params.id, req.user.id));
  } catch (err) {
    next(err);
  }
});
router.post('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    res.json(await notificationService.markAllRead(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.get('/wallet', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.getBalance(req.user.id));
  } catch (err) {
    next(err);
  }
});
router.get('/wallet/transactions', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.listTransactions(req.user.id, req.query));
  } catch (err) {
    next(err);
  }
});
router.post('/wallet/topup', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.topUp(req.user.id, req.body.amount));
  } catch (err) {
    next(err);
  }
});
router.post('/wallet/withdraw', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.withdraw(req.user.id, req.body.amount));
  } catch (err) {
    next(err);
  }
});
router.post('/wallet/transfer', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.transfer(req.user.id, req.body.toEmail, req.body.amount));
  } catch (err) {
    next(err);
  }
});

router.post('/claim-prize/:raffleId', authenticate, async (req, res, next) => {
  try {
    res.json(await drawService.claimPrize(req.params.raffleId, req.user.id));
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, requireAdmin, userController.list);
router.get('/:id', authenticate, requireAdmin, userController.get);
router.patch('/:id', authenticate, requireAdmin, userController.update);
router.post('/:id/role', authenticate, requireAdmin, userController.setRole);
router.post('/:id/ban', authenticate, requireAdmin, userController.ban);

module.exports = router;
