const { Server } = require('socket.io');
const { getAuth } = require('../config/firebase');
const { registerHandlers } = require('./handlers');
const logger = require('../config/logger');

function initSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        process.env.ADMIN_URL || 'http://localhost:3001',
      ],
      credentials: true,
    },
  });

  // Optional auth: verify the Firebase ID token if provided. Anonymous viewers allowed.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = await getAuth().verifyIdToken(token);
      socket.userId = decoded.uid;
    } catch {
      // Ignore invalid tokens — connect as anonymous.
    }
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    registerHandlers(io, socket);
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });

  app.set('io', io);
  return io;
}

module.exports = { initSocket };
