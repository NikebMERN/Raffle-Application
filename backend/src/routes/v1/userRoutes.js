const express = require('express');
const userController = require('../../controllers/userController');
const notificationService = require('../../services/notificationService');
const walletService = require('../../services/walletService');
const drawService = require('../../services/drawService');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

const router = express.Router();

router.get('/profile', authenticate, userController.profile);
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    res.json(await notificationService.getUserNotifications(req.user._id, req.query));
  } catch (err) {
    next(err);
  }
});
router.post('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    res.json(await notificationService.markRead(req.params.id, req.user._id));
  } catch (err) {
    next(err);
  }
});
router.post('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    res.json(await notificationService.markAllRead(req.user._id));
  } catch (err) {
    next(err);
  }
});
router.get('/wallet', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.getBalance(req.user._id));
  } catch (err) {
    next(err);
  }
});
router.post('/wallet/topup', authenticate, async (req, res, next) => {
  try {
    res.json(await walletService.topUp(req.user._id, req.body.amount));
  } catch (err) {
    next(err);
  }
});
router.post('/claim-prize/:raffleId', authenticate, async (req, res, next) => {
  try {
    res.json(await drawService.claimPrize(req.params.raffleId, req.user._id));
  } catch (err) {
    next(err);
  }
});
router.get('/', authenticate, requireAdmin, userController.list);
router.get('/:id', authenticate, requireAdmin, userController.get);
router.patch('/:id', authenticate, requireAdmin, userController.update);
router.post('/:id/ban', authenticate, requireAdmin, userController.ban);

module.exports = router;
