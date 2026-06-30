require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { initSocket } = require('./websocket/socket');
const logger = require('./config/logger');
const { processCleanupJob } = require('./jobs/cleanupJob');

const PORT = process.env.PORT || 5000;

async function start() {
  const app = await createApp();
  const server = http.createServer(app);
  initSocket(server, app);

  setInterval(() => {
    processCleanupJob().catch((err) => logger.error('Cleanup job failed', err));
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
