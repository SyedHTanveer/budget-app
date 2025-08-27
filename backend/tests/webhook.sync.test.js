const PlaidService = require('../src/services/plaidService');
const { db } = require('../src/config/database');
const { v4: uuid } = require('uuid');

describe('Plaid webhook incremental sync', () => {
  test('handle webhook with transactions update triggers incremental sync (mocked)', async () => {
    const userId = uuid();
    await db('users').insert({ id: userId, email: `${userId}@ex.com`, password_hash: 'x' });
    await db('plaid_items').insert({ id: uuid(), user_id: userId, item_id: 'item123', access_token: 'token' });
    // Mock syncIncremental
    const spy = jest.spyOn(PlaidService, 'syncIncremental').mockResolvedValue({ added:1, modified:0, removed:0 });
    const res = await PlaidService.handleWebhook({ webhook_type: 'TRANSACTIONS', webhook_code: 'DEFAULT_UPDATE', item_id: 'item123' }, {});
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});