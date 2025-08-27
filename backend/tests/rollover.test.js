const { db } = require('../src/config/database');
const RolloverService = require('../src/services/rolloverService');
const { v4: uuid } = require('uuid');

describe('RolloverService', () => {
  test('closeMonth generates contributions for to_savings categories', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    const goalId = uuid();
    await db('goals').insert({ id: goalId, user_id: userId, name: 'Emergency', target_amount: 1000, current_amount: 0 });
    await db('budget_categories').insert({ id: uuid(), user_id: userId, name: 'Dining', monthly_limit: 200, rollover_mode: 'to_savings', savings_goal_id: goalId, is_active: true });
    // Spend only 50
    await db('transactions').insert({ id: uuid(), user_id: userId, account_id: null, amount: -50, category: 'Dining', date: new Date().toISOString().split('T')[0] });

    const res = await RolloverService.closeMonth(userId, new Date(Date.now()+31*24*60*60*1000));
    expect(res.contributions).toBe(1);
  });
});