const { db } = require('../src/config/database');

describe('Alerts tables migration', () => {
  test('tables exist', async () => {
    const alerts = await db.schema.hasTable('alerts');
    const events = await db.schema.hasTable('alert_events');
    expect(alerts).toBe(true);
    expect(events).toBe(true);
  });
});