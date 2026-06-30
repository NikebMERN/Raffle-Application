const express = require('express');
const adminController = require('../../controllers/adminController');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');
const { validate } = require('../../middleware/validation');
const { rewardConfigSchema } = require('../../utils/validators');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/overview', adminController.overview);
router.get('/reports', adminController.reports);
router.get('/ticket-inventory', adminController.ticketInventory);
router.get('/audit-logs', adminController.auditLogs);
router.get('/settings', adminController.getSettings);
router.patch('/settings/:key', adminController.updateSetting);
router.post('/draws/:raffleId', adminController.executeDraw);

router.get('/rewards', adminController.listRewards);
router.post('/rewards', validate(rewardConfigSchema), adminController.createReward);
router.patch('/rewards/:id', adminController.updateReward);
router.delete('/rewards/:id', adminController.deleteReward);

module.exports = router;
