const admin = require('firebase-admin');
const logger = require('./logger');

let messaging = null;

function initializeFirebase() {
  if (messaging) return messaging;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase not configured — push notifications disabled');
    return null;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }
    messaging = admin.messaging();
    logger.info('Firebase Admin initialized for push notifications');
  } catch (err) {
    logger.error('Firebase Admin initialization failed', { error: err.message });
    messaging = null;
  }

  return messaging;
}

function getMessaging() {
  return messaging || initializeFirebase();
}

module.exports = { getMessaging, initializeFirebase };
