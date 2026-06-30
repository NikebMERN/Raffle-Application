const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { registerHandlers } = require('./handlers');
const logger = require('../config/logger');

function initSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/access_token=([^;]+)/)?.[1];
    if (!token) return next();
    try {
      const payload = jwt.verify(token, authConfig.accessSecret);
      socket.userId = payload.sub;
      next();
    } catch {
      next();
    }
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
