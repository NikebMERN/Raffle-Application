const express = require('express');
const authController = require('../../controllers/authController');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// Auth is handled by Firebase on the client; these endpoints verify the ID token
// (via the `authenticate` middleware) and sync/return the Firestore profile.
router.get('/me', authenticate, authController.me);
router.post('/session', authenticate, authController.session);
router.patch('/profile', authenticate, authController.updateProfile);
router.post('/logout', authController.logout);

module.exports = router;
