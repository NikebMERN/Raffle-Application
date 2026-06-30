require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const { initializeFirebase, getDb } = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/v1/authRoutes');
const configRoutes = require('./routes/v1/configRoutes');
const raffleRoutes = require('./routes/v1/raffleRoutes');
const ticketRoutes = require('./routes/v1/ticketRoutes');
const paymentRoutes = require('./routes/v1/paymentRoutes');
const userRoutes = require('./routes/v1/userRoutes');
const adminRoutes = require('./routes/v1/adminRoutes');

const app = express();

const WEBHOOK_PATH = '/api/v1/payments/webhook';

// Allow the user frontend (:3000) and the separate admin app (:3001).
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3001',
];

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/non-browser requests (no Origin header) and known origins.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(cookieParser());

// Stripe needs the raw body to verify webhook signatures, so JSON parsing is
// skipped for the webhook route (its router applies express.raw instead).
app.use((req, res, next) => {
  if (req.originalUrl === WEBHOOK_PATH) return next();
  return express.json({ limit: '1mb' })(req, res, next);
});
app.use(xss());
app.use(apiLimiter);

app.get('/api/health', async (_req, res) => {
  let database = 'unknown';
  try {
    await getDb().collection('settings').limit(1).get();
    database = 'healthy';
  } catch {
    database = 'unhealthy';
  }
  res.json({
    status: database === 'healthy' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: { database, firestore: database === 'healthy' },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/raffles', raffleRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(errorHandler);

async function createApp() {
  initializeFirebase();
  return app;
}

module.exports = { app, createApp };
