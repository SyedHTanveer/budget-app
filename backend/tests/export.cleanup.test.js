const { db } = require('../src/config/database');
const { v4: uuid } = require('uuid');

describe('Export cleanup job logic', () => {
  test('removes old downloaded exports', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    const oldId = uuid();
    const oldDate = new Date(Date.now() - 10*24*60*60*1000); // 10 days ago
    await db('export_jobs').insert({ id: oldId, user_id: userId, status: 'complete', filename: 'old.zip', mime_type: 'application/zip', bytes: 100, zip_base64: 'UEs=', completed_at: oldDate, downloaded_at: oldDate, created_at: oldDate, updated_at: oldDate });
    const freshId = uuid();
    await db('export_jobs').insert({ id: freshId, user_id: userId, status: 'complete', filename: 'fresh.zip', mime_type: 'application/zip', bytes: 50, zip_base64: 'UEs=', completed_at: new Date() });

    // Inline simulate cleanup
    const days = 7;
    const cutoff = new Date(Date.now() - days*24*60*60*1000);
    const removed = await db('export_jobs')
      .where(function() {
        this.whereNotNull('downloaded_at').andWhere('downloaded_at','<', cutoff)
          .orWhere(function() { this.where('status','complete').andWhere('completed_at','<', cutoff); });
      })
      .del();

    expect(removed).toBeGreaterThanOrEqual(1);
    const remainingOld = await db('export_jobs').where({ id: oldId }).first();
    expect(remainingOld).toBeUndefined();
    const remainingFresh = await db('export_jobs').where({ id: freshId }).first();
    expect(remainingFresh).toBeDefined();
  });
});