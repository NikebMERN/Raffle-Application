const express = require('express');
const configController = require('../../controllers/configController');

const router = express.Router();

router.get('/', configController.getPublicConfig);

module.exports = router;
