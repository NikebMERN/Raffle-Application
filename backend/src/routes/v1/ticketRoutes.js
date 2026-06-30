const express = require('express');
const ticketController = require('../../controllers/ticketController');
const { validate } = require('../../middleware/validation');
const { purchaseSchema } = require('../../utils/validators');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

router.get('/grid/:raffleId', ticketController.grid);
router.get('/my', authenticate, ticketController.myTickets);
router.get('/', authenticate, ticketController.list);
router.post('/purchase', authenticate, validate(purchaseSchema), ticketController.purchase);

module.exports = router;
