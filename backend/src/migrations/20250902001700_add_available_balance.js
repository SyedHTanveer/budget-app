// Guarded migration: add available_balance column if missing for Plaid available vs current display.

exports.up = async function(knex) {
  const hasAccounts = await knex.schema.hasTable('accounts');
  if (!hasAccounts) return;
  const hasCol = await knex.schema.hasColumn('accounts','available_balance');
  if (!hasCol) {
    await knex.schema.alterTable('accounts', t => {
      t.decimal('available_balance',12,2).nullable();
    });
  }
};

exports.down = async function() { /* non-destructive */ };
