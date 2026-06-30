require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/v1/authRoutes');
const raffleRoutes = require('./routes/v1/raffleRoutes');
const ticketRoutes = require('./routes/v1/ticketRoutes');
const paymentRoutes = require('./routes/v1/paymentRoutes');
const userRoutes = require('./routes/v1/userRoutes');
const adminRoutes = require('./routes/v1/adminRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(xss());
app.use(apiLimiter);

app.get('/api/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  res.json({
    status: dbState === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: { database: dbState, mongodb: true },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/raffles', raffleRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(errorHandler);

async function createApp() {
  await connectDatabase();
  return app;
}

module.exports = { app, createApp };
