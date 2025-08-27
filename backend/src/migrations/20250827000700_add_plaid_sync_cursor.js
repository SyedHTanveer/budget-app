exports.up = function(knex) {
  return knex.schema.createTable('plaid_sync_state', function(table) {
    table.string('id').primary();
    table.string('item_id').references('item_id').inTable('plaid_items').onDelete('CASCADE');
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('cursor');
    table.timestamp('last_synced_at');
    table.timestamps(true, true);
    table.unique(['item_id']);
    table.index(['user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('plaid_sync_state');
};