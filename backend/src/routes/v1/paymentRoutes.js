const express = require('express');
const paymentController = require('../../controllers/paymentController');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

const router = express.Router();

router.post('/checkout', authenticate, paymentController.checkout);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);
router.get('/', authenticate, requireAdmin, paymentController.list);

module.exports = router;
