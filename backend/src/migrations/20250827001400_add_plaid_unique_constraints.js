exports.up = async function(knex) {
  // Add unique constraints & supporting indexes for idempotent Plaid ingestion
  // Guard each change so migration is re-runnable in dev if partially applied.
  const hasPlaidItems = await knex.schema.hasTable('plaid_items');
  if (hasPlaidItems) {
    // If item_id is not yet unique add constraint
    try { await knex.schema.alterTable('plaid_items', t => { t.unique(['item_id']); }); } catch(_) {}
    try { await knex.schema.alterTable('plaid_items', t => { t.index(['user_id']); }); } catch(_) {}
  }
  const hasAccounts = await knex.schema.hasTable('accounts');
  if (hasAccounts) {
    try { await knex.schema.alterTable('accounts', t => { t.unique(['user_id','plaid_account_id']); }); } catch(_) {}
    try { await knex.schema.alterTable('accounts', t => { t.index(['plaid_account_id']); }); } catch(_) {}
  }
  const hasTx = await knex.schema.hasTable('transactions');
  if (hasTx) {
    try { await knex.schema.alterTable('transactions', t => { t.unique(['plaid_transaction_id']); }); } catch(_) {}
    try { await knex.schema.alterTable('transactions', t => { t.index(['plaid_transaction_id']); }); } catch(_) {}
  }
};

exports.down = async function(knex) {
  // SQLite cannot easily drop individual unique constraints by name if unnamed; skip reversible drops.
  // For portability we leave constraints in place on rollback.
};
