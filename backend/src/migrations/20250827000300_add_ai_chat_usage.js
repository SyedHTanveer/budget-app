exports.up = function(knex) {
  return knex.schema.createTable('ai_chat_usage', function(table) {
    table.string('id').primary();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.date('date').notNullable();
    table.integer('chats_used').defaultTo(0);
    table.timestamps(true, true);
    table.unique(['user_id','date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ai_chat_usage');
};
