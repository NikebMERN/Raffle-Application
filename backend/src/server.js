require('dotenv').config({ path: ['.env.local', '.env'] });
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

  const jobs = setInterval(() => {
    processCleanupJob().catch((err) => logger.error('Cleanup job failed', err));
    processAutoDraws(io).catch((err) => logger.error('Auto-draw job failed', err));
  }, 60 * 1000);

  server.listen(PORT, () => {
    logger.info(`SF Football Club Raffle API running on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown so in-flight requests finish and the port is released
  // cleanly on container stop / redeploy (SIGTERM) or Ctrl-C (SIGINT).
  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down gracefully`);
    clearInterval(jobs);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force-exit if connections don't drain in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  ['SIGTERM', 'SIGINT'].forEach((sig) => process.on(sig, () => shutdown(sig)));
}

// Log (don't silently swallow) unexpected async failures.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason?.message || String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
});

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
