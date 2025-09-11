exports.up = function(knex) {
  return knex.schema
    .createTable('user_preferences', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('preference_key').notNullable();
      table.text('preference_value');
      table.timestamps(true, true);
      table.unique(['user_id', 'preference_key']);
    })
    .createTable('data_exports', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('filename');
      table.integer('file_size');
      table.timestamp('expires_at');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('data_exports')
    .dropTableIfExists('user_preferences');
};
