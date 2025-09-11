exports.up = function(knex) {
  return knex.schema
    .table('users', function(table) {
      table.string('stripe_customer_id');
      table.string('subscription_tier').defaultTo('free');
    })
    .createTable('subscriptions', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('stripe_subscription_id').unique();
      table.string('stripe_customer_id');
      table.string('price_id');
      table.string('plan_type');
      table.string('status');
      table.timestamp('current_period_start');
      table.timestamp('current_period_end');
      table.timestamp('canceled_at');
      table.timestamps(true, true);
    })
    .createTable('usage_limits', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('feature');
      table.integer('limit_value');
      table.integer('used_value').defaultTo(0);
      table.date('reset_date');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('usage_limits')
    .dropTableIfExists('subscriptions')
    .table('users', function(table) {
      table.dropColumn('stripe_customer_id');
      table.dropColumn('subscription_tier');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('usage_limits')
    .dropTableIfExists('subscriptions')
    .table('users', function(table) {
      table.dropColumn('stripe_customer_id');
      table.dropColumn('subscription_tier');
    });
};
