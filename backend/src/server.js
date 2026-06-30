require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { initSocket } = require('./websocket/socket');
const logger = require('./config/logger');
const { initializeFirebase } = require('./config/firebase');
const settingsService = require('./services/settingsService');
const { processCleanupJob } = require('./jobs/cleanupJob');
const { processAutoDraws } = require('./jobs/drawJob');

const PORT = process.env.PORT || 5000;

async function start() {
  initializeFirebase();

  // First-run setup (default settings, opening round, reward config). Idempotent
  // and non-fatal — the server still boots if Firestore is briefly unavailable.
  await settingsService.ensureBootstrap().catch((err) => {
    logger.error('Bootstrap failed (continuing)', { error: err.message });
  });

  const app = await createApp();
  const server = http.createServer(app);
  const io = initSocket(server, app);

  setInterval(() => {
    processCleanupJob().catch((err) => logger.error('Cleanup job failed', err));
    processAutoDraws(io).catch((err) => logger.error('Auto-draw job failed', err));
  }, 60 * 1000);

  server.listen(PORT, () => {
    logger.info(`SF Football Club Raffle API running on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
