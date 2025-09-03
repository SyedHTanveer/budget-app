exports.up = async function(knex){
  // If table already exists, ensure it has flattened columns; if still legacy (has preference_key) then do nothing (handled by later migration)
  const exists = await knex.schema.hasTable('user_preferences');
  if (exists) {
    const hasTheme = await knex.schema.hasColumn('user_preferences', 'theme');
    const hasPreferenceKey = await knex.schema.hasColumn('user_preferences', 'preference_key');
    if (!hasTheme && !hasPreferenceKey) {
      // Table exists but missing new columns (unlikely edge). Add them idempotently.
      await knex.schema.alterTable('user_preferences', table => {
        table.string('theme', 20).defaultTo('system');
        table.string('default_currency', 10).defaultTo('USD');
        table.boolean('ai_opt_in').defaultTo(true);
        table.string('redaction_level', 20).defaultTo('standard');
        table.boolean('notifications_email').defaultTo(true);
        table.boolean('notifications_push').defaultTo(false);
        table.timestamps(true, true);
      });
    }
    return;
  }
  // Fresh create
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
