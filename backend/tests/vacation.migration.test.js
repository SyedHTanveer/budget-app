const { db } = require('../src/config/database');

describe('Vacation & rollover tables migration', () => {
  test('tables exist', async () => {
    const vacation = await db.schema.hasTable('vacation_periods');
    const contrib = await db.schema.hasTable('goal_contributions');
    const prefs = await db.schema.hasTable('user_budget_prefs');
    expect(vacation).toBe(true);
    expect(contrib).toBe(true);
    expect(prefs).toBe(true);
  });
});
