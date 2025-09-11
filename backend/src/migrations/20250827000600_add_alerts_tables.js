exports.up = function(knex) {
  return knex.schema.createTable('alerts', function(table) {
    table.string('id').primary();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // category_spend | safe_to_spend | balance_low
    table.string('category_id'); // nullable
    table.decimal('threshold', 12, 2); // absolute or percentage depending on type
    table.string('comparison').defaultTo('gte'); // gte | lte
    table.string('status').defaultTo('active'); // active | inactive
    table.string('last_state'); // JSON snapshot text
    table.timestamp('last_triggered_at');
    table.timestamps(true, true);
    table.index(['user_id','type']);
  }).createTable('alert_events', function(table) {
    table.string('id').primary();
    table.string('alert_id').references('id').inTable('alerts').onDelete('CASCADE');
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('message');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id','created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('alert_events').dropTableIfExists('alerts');
};
