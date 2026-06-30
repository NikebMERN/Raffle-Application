const express = require('express');
const raffleController = require('../../controllers/raffleController');
const { validate } = require('../../middleware/validation');
const { createRaffleSchema } = require('../../utils/validators');
const { authenticate } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/role');

const router = express.Router();

router.get('/public', raffleController.list);
router.get('/public/:id', raffleController.get);
router.get('/', authenticate, requireAdmin, raffleController.list);
router.get('/:id', authenticate, raffleController.get);
router.post('/', authenticate, requireAdmin, validate(createRaffleSchema), raffleController.create);
router.patch('/:id', authenticate, requireAdmin, raffleController.update);
router.post('/:id/publish', authenticate, requireAdmin, raffleController.publish);
router.post('/:id/cancel', authenticate, requireAdmin, raffleController.cancel);

module.exports = router;
