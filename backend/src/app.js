require('dotenv').config({ path: ['.env.local', '.env'] });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const xss = require('xss-clean');
const { initializeFirebase, getDb } = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/v1/authRoutes');
const configRoutes = require('./routes/v1/configRoutes');
const raffleRoutes = require('./routes/v1/raffleRoutes');
const ticketRoutes = require('./routes/v1/ticketRoutes');
const paymentRoutes = require('./routes/v1/paymentRoutes');
const userRoutes = require('./routes/v1/userRoutes');
const adminRoutes = require('./routes/v1/adminRoutes');

const app = express();

const isProd = process.env.NODE_ENV === 'production';

// Behind a reverse proxy / load balancer (nginx, most PaaS) so req.ip and the
// rate limiter see the real client IP, and secure cookies work. Configurable via
// TRUST_PROXY (number of hops or a value like 'loopback'); defaults on in prod.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy !== undefined) {
  app.set('trust proxy', Number.isNaN(Number(trustProxy)) ? trustProxy : Number(trustProxy));
} else if (isProd) {
  app.set('trust proxy', 1);
}

const WEBHOOK_PATH = '/api/v1/payments/webhook';

// Allowed browser origins: the user frontend + admin app, plus any extra origins
// listed (comma-separated) in CORS_ORIGINS. Falls back to localhost dev ports.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.ADMIN_URL || 'http://localhost:3001',
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
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
app.use(morgan(isProd ? 'combined' : 'dev'));
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

// Tighter rate limit on the auth surface (login/session/refresh).
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/raffles', raffleRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// Unknown API route → JSON 404 (instead of Express' default HTML page).
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));

app.use(errorHandler);

async function createApp() {
  initializeFirebase();
  return app;
}

module.exports = { app, createApp };
