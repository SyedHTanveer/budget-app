const { db } = require('../src/config/database');

describe('Accounts extended fields migration', () => {
  test('has new columns', async () => {
    const has = await db.schema.hasTable('accounts');
    if (!has) {
      console.warn('accounts table missing, skipping');
      return;
    }
    const columns = await db('accounts').columnInfo();
    ['institution_name','official_name','subtype','mask','is_manual','raw_plaid_meta'].forEach(c => {
      expect(columns).toHaveProperty(c);
    });
  });
});
