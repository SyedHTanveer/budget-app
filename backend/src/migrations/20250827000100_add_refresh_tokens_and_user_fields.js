exports.up = function(knex) {
  return knex.schema
    .createTable('refresh_tokens', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('token_hash').notNullable();
      table.datetime('expires_at').notNullable();
      table.datetime('revoked_at');
      table.string('replaced_by');
      table.string('user_agent');
      table.string('ip');
      table.timestamps(true, true);
      table.index(['user_id','expires_at']);
    })
    .table('users', function(table) {
      table.string('timezone').defaultTo('UTC');
      table.text('preferences');
    });
};

exports.down = function(knex) {
  return knex.schema
    .table('users', function(table) {
      table.dropColumn('timezone');
      table.dropColumn('preferences');
    })
    .dropTableIfExists('refresh_tokens');
};
