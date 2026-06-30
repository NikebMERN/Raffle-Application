const admin = require('firebase-admin');
const logger = require('./logger');

let app = null;
let db = null;
let authClient = null;
let messaging = null;

function buildCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { credential: admin.credential.cert({ projectId, clientEmail, privateKey }), projectId };
  }

  // Fall back to GOOGLE_APPLICATION_CREDENTIALS (service-account JSON file path).
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { credential: admin.credential.applicationDefault(), projectId };
  }

  return null;
}

function initializeFirebase() {
  if (app) return app;

  const config = buildCredential();
  if (!config) {
    throw new Error(
      'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY '
        + '(or GOOGLE_APPLICATION_CREDENTIALS) in backend/.env.',
    );
  }

  app = admin.apps.length
    ? admin.app()
    : admin.initializeApp({ credential: config.credential, projectId: config.projectId });

  db = admin.firestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  authClient = admin.auth(app);

  try {
    messaging = admin.messaging(app);
  } catch (err) {
    logger.warn('Firebase messaging unavailable', { error: err.message });
    messaging = null;
  }

  logger.info('Firebase Admin initialized (Firestore + Auth)');
  return app;
}

function getDb() {
  if (!db) initializeFirebase();
  return db;
}

function getAuth() {
  if (!authClient) initializeFirebase();
  return authClient;
}

function getMessaging() {
  if (!messaging) {
    try {
      initializeFirebase();
    } catch {
      return null;
    }
  }
  return messaging;
}

module.exports = {
  admin,
  initializeFirebase,
  getDb,
  getAuth,
  getMessaging,
  FieldValue: admin.firestore.FieldValue,
  Timestamp: admin.firestore.Timestamp,
};
