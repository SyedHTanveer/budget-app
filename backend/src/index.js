const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const { loadEnv } = require('./config/env');
const { logger } = require('./logger');
const requestContext = require('./middleware/common/requestContext');
const errorHandler = require('./middleware/common/errorHandler');
const notFound = require('./middleware/common/notFound');

const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budget');
const aiRoutes = require('./routes/ai');
const plaidRoutes = require('./routes/plaid');
const subscriptionRoutes = require('./routes/subscription');
const privacyRoutes = require('./routes/privacy');
const vacationRoutes = require('./routes/vacation');

const env = loadEnv();
const app = express();
const PORT = process.env.PORT || 3001;

app.disable('x-powered-by');

// Global middleware
app.use(requestContext);
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
    if (!origin || allowed.includes(origin)) return cb(null, origin);
    return cb(new Error('CORS not allowed'));
  },
  credentials: true
}));
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Versioned API router
const api = express.Router();
api.use('/auth', authRoutes);
api.use('/accounts', accountRoutes);
api.use('/transactions', transactionRoutes);
api.use('/budget', budgetRoutes);
api.use('/ai', aiRoutes);
api.use('/plaid', plaidRoutes);
api.use('/subscription', subscriptionRoutes);
api.use('/privacy', privacyRoutes);
api.use('/vacation', vacationRoutes);

app.use('/api/v1', api);

// Legacy path compatibility (optional minimal)
app.use('/api/auth', authRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// 404
app.use(notFound);
// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ port: PORT, frontend: process.env.FRONTEND_URL }, 'server started');
});
