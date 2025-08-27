const { db } = require('../src/config/database');
const request = require('supertest');
const express = require('express');
const txRoutes = require('../src/routes/transactions');
const alertsRoutes = require('../src/routes/alerts');
const authRoutes = require('../src/routes/auth');
const requestContext = require('../src/middleware/common/requestContext');
const errorHandler = require('../src/middleware/common/errorHandler');
const { signAccessToken } = require('../src/utils/tokens');
const { v4: uuid } = require('uuid');

function makeApp(token) {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use('/api/transactions', (req,res,next)=> { req.headers.authorization = `Bearer ${token}`; next(); }, txRoutes);
  app.use('/api/alerts', (req,res,next)=> { req.headers.authorization = `Bearer ${token}`; next(); }, alertsRoutes);
  app.use('/api/auth', authRoutes); // for completeness
  app.use(errorHandler);
  return app;
}

describe('Alerts trigger integration', () => {
  test('category spend alert triggers after transaction update', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    const catId = uuid();
    await db('budget_categories').insert({ id: catId, user_id: userId, name: 'Dining', monthly_limit: 100, is_active: true });
    const alertId = uuid();
    await db('alerts').insert({ id: alertId, user_id: userId, type: 'category_spend', category_id: catId, threshold: 10, comparison: 'gte', status: 'active' });
    const accountId = uuid();
    await db('accounts').insert({ id: accountId, user_id: userId, name: 'Checking', type: 'checking', balance: 500 });
    const txnId = uuid();
    await db('transactions').insert({ id: txnId, user_id: userId, account_id: accountId, amount: -5, category: 'Other', date: new Date().toISOString().split('T')[0] });

    const token = signAccessToken({ id: userId, email: `${userId}@ex.com` });
    const app = makeApp(token);

    // Update category to Dining (will not yet exceed threshold)
    await request(app).put(`/api/transactions/${txnId}/category`).send({ category: 'Dining' });

    // Increase amount to exceed threshold
    await db('transactions').where({ id: txnId }).update({ amount: -15 });
    await request(app).put(`/api/transactions/${txnId}/category`).send({ category: 'Dining' });

    // Directly evaluate alerts engine (simulate worker) since worker not running in test
    const AlertsEngine = require('../src/services/alertsEngine');
    const events = await AlertsEngine.evaluateUser(userId);
    expect(events.some(e => e.message.includes('Dining'))).toBe(true);
  });
});