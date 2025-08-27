exports.up = function(knex) {
  return knex.schema
    .createTable('budget_categories', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name', 100).notNullable();
      table.string('icon_name', 50).defaultTo('DollarSign');
      table.string('color', 50).defaultTo('bg-gray-100 text-gray-700');
      table.text('description');
      table.decimal('monthly_limit', 12, 2).notNullable().defaultTo(0);
      table.decimal('current_spent', 12, 2).defaultTo(0);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
      table.unique(['user_id', 'name']);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('budget_categories');
};
