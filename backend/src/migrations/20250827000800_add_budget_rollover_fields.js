exports.up = function(knex) {
  return knex.schema.table('budget_categories', function(table) {
    table.string('rollover_mode').defaultTo('none'); // none | full | percent | to_savings
    table.decimal('carry_over_percent',5,2).defaultTo(0); // used when rollover_mode=percent
    table.string('savings_goal_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('budget_categories', function(table) {
    table.dropColumn('rollover_mode');
    table.dropColumn('carry_over_percent');
    table.dropColumn('savings_goal_id');
  });
};