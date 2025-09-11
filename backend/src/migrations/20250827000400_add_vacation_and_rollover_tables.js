exports.up = function(knex) {
  return knex.schema
    .createTable('vacation_periods', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.boolean('include_in_travel').defaultTo(false);
      table.text('paused_categories'); // JSON string of category ids
      table.timestamps(true, true);
      table.index(['user_id','start_date']);
    })
    .createTable('goal_contributions', function(table) {
      table.string('id').primary();
      table.string('goal_id').references('id').inTable('goals').onDelete('CASCADE');
      table.decimal('amount',12,2).notNullable();
      table.string('source', 30).defaultTo('manual'); // manual | rollover_auto
      table.timestamps(true, true);
    })
    .createTable('user_budget_prefs', function(table) {
      table.string('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
      table.text('default_alert_thresholds'); // JSON
      table.text('pay_schedule'); // JSON (frequency, last_pay_date, etc.)
      table.string('default_savings_goal_id');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_budget_prefs')
    .dropTableIfExists('goal_contributions')
    .dropTableIfExists('vacation_periods');
};
