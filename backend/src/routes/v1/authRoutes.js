const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../utils/validators');
const { loginLimiter } = require('../middleware/rateLimit');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.me);
router.post('/2fa/setup', authenticate, authController.setup2FA);
router.post('/2fa/enable', authenticate, authController.enable2FA);

module.exports = router;
