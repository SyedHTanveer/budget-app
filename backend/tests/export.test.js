const request = require('supertest');
const express = require('express');
const exportRoutes = require('../src/routes/export');
const authRoutes = require('../src/routes/auth');
const requestContext = require('../src/middleware/common/requestContext');
const errorHandler = require('../src/middleware/common/errorHandler');
const { db } = require('../src/config/database');
const { v4: uuid } = require('uuid');
const JSZip = require('jszip');

function makeApp() {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/export', exportRoutes);
  app.use(errorHandler);
  return app;
}

async function createUser() {
  const id = uuid();
  await db('users').insert({ id, email: `${id}@ex.com`, password_hash: 'x', first_name: 'T', last_name: 'U' });
  return id;
}

// Simple JWT generator bypassing password for tests
const jwt = require('jsonwebtoken');
function tokenFor(id) {
  return jwt.sign({ id, email: `${id}@ex.com` }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

describe('Export jobs', () => {
  test('enqueue and complete export job (simulate worker)', async () => {
    const userId = await createUser();
    const app = makeApp();
    const authHeader = `Bearer ${tokenFor(userId)}`;

    const post = await request(app).post('/api/export').set('Authorization', authHeader);
    expect(post.status).toBe(202);
    const { jobId } = post.body;
    expect(jobId).toBeDefined();

    // Simulate worker processing inline by invoking similar logic
    const jobRow = await db('export_jobs').where({ id: jobId }).first();
    expect(jobRow.status).toBe('pending');

    // Minimal datasets to ensure CSVs exist
    await db('accounts').insert({ id: uuid(), user_id: userId, name: 'Checking', type: 'depository', balance: 100 });
    await db('transactions').insert({ id: uuid(), user_id: userId, account_id: null, amount: 10, iso_currency_code: 'USD', date: new Date(), name: 'Coffee' });

    // Inline processor mimic
    const { toCSV } = require('../src/utils/csv');
    const JSZipLocal = require('jszip');
    await db('export_jobs').where({ id: jobId }).update({ status: 'processing' });
    const [accounts, transactions] = await Promise.all([
      db('accounts').where({ user_id: userId }),
      db('transactions').where({ user_id: userId })
    ]);
    const zip = new JSZipLocal();
    zip.file('accounts.csv', toCSV(accounts));
    zip.file('transactions.csv', toCSV(transactions));
    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    await db('export_jobs').where({ id: jobId }).update({ status: 'complete', zip_base64: content.toString('base64'), bytes: content.length, completed_at: new Date() });

    const status = await request(app).get(`/api/export/${jobId}/status`).set('Authorization', authHeader);
    expect(status.body.status).toBe('complete');

    const dl = await request(app).get(`/api/export/${jobId}/download`).set('Authorization', authHeader);
    expect(dl.status).toBe(200);
    expect(dl.headers['content-type']).toContain('application/zip');
    // Magic number PK\x03\x04
    expect(dl.body.slice(0,2).toString()).toBe('PK');
  });
});