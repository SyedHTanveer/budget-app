exports.up = function(knex) {
  return knex.schema.table('refresh_tokens', function(table) {
    table.timestamp('last_used_at');
  });
};

exports.down = function(knex) {
  return knex.schema.table('refresh_tokens', function(table) {
    table.dropColumn('last_used_at');
  });
};