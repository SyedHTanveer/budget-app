exports.up = function(knex) {
  return knex.schema.table('accounts', function(table) {
    table.string('institution_name', 255);
    table.string('official_name', 255);
    table.string('subtype', 100);
    table.string('mask', 10);
    table.boolean('is_manual').defaultTo(false);
    table.text('raw_plaid_meta'); // encrypted externally if needed
  });
};

exports.down = function(knex) {
  return knex.schema.table('accounts', function(table) {
    table.dropColumn('institution_name');
    table.dropColumn('official_name');
    table.dropColumn('subtype');
    table.dropColumn('mask');
    table.dropColumn('is_manual');
    table.dropColumn('raw_plaid_meta');
  });
};
