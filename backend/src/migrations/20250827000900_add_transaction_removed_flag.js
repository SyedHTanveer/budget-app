exports.up = function(knex) {
  return knex.schema.table('transactions', function(table) {
    table.timestamp('deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.table('transactions', function(table) {
    table.dropColumn('deleted_at');
  });
};