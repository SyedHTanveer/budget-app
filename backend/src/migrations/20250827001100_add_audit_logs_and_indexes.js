exports.up = async function(knex) {
  await knex.schema.createTable('audit_logs', function(table) {
    table.string('id').primary();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('action').notNullable();
    table.text('meta'); // JSON string
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id','created_at']);
  });
  // Add indexes if not existing
  const hasAI = await knex.schema.hasTable('ai_chat_usage');
  if (hasAI) {
    try { await knex.schema.table('ai_chat_usage', t => { t.index(['user_id','date']); }); } catch(_) {}
  }
  const hasTx = await knex.schema.hasTable('transactions');
  if (hasTx) {
    try { await knex.schema.table('transactions', t => { t.index(['user_id','date']); t.index(['user_id','category']); }); } catch(_) {}
  }
  const hasExport = await knex.schema.hasTable('export_jobs');
  if (hasExport) {
    try { await knex.schema.table('export_jobs', t => { t.index(['user_id','status']); }); } catch(_) {}
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
  // Index drops are automatic with table drop / ignore reversals for added indexes
};