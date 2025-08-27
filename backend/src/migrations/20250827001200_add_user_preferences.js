exports.up = function(knex){
  return knex.schema.createTable('user_preferences', table => {
    table.string('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.string('theme', 20).defaultTo('system');
    table.string('default_currency', 10).defaultTo('USD');
    table.boolean('ai_opt_in').defaultTo(true);
    table.string('redaction_level', 20).defaultTo('standard');
    table.boolean('notifications_email').defaultTo(true);
    table.boolean('notifications_push').defaultTo(false);
    table.timestamps(true, true);
  });
};
exports.down = function(knex){
  return knex.schema.dropTableIfExists('user_preferences');
};
