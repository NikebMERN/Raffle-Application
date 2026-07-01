require('dotenv').config({ path: ['.env.local', '.env'] });
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');

const logger = require('./src/config/logger');
const { app } = require('./src/app');
const { initializeFirebase } = require('./src/config/firebase');
const settingsService = require('./src/services/settingsService');
const { processCleanupJob } = require('./src/jobs/cleanupJob');
const { processAutoDraws } = require('./src/jobs/drawJob');

// One shared region for the HTTPS API and scheduled jobs. Keep in sync with the
// Hosting rewrite in firebase.json.
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

// Initialise the Admin SDK at cold start (uses the runtime service account on
// Cloud Functions, or the FIREBASE_* env vars if provided).
initializeFirebase();

// First-run setup (default settings, opening round, reward config). Runs once per
// warm instance, lazily on the first request so cold starts stay fast.
let bootstrapped = false;
async function ensureBootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  await settingsService.ensureBootstrap().catch((err) => {
    bootstrapped = false;
    logger.error('Bootstrap failed (continuing)', { error: err.message });
  });
}

// The entire Express API, served as a single HTTPS function. Firebase Hosting
// rewrites /api/** to this function (see firebase.json).
exports.api = onRequest(async (req, res) => {
  await ensureBootstrap();
  return app(req, res);
});

// Replaces the old in-process setInterval loop: reservation cleanup + auto-draws.
// (No Socket.IO on Functions — clients refetch; realtime can use Firestore later.)
exports.scheduledJobs = onSchedule('every 1 minutes', async () => {
  await processCleanupJob().catch((err) => logger.error('Cleanup job failed', { error: err.message }));
  await processAutoDraws(null).catch((err) => logger.error('Auto-draw job failed', { error: err.message }));
});
