// Migration: migrate legacy key/value user_preferences table to flattened schema
// Idempotent: only runs if legacy structure detected (has preference_key column, lacks theme column)

exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('user_preferences');
  if (!hasTable) {
    // Fresh DB already skipped legacy; just create flattened table
    await knex.schema.createTable('user_preferences', table => {
      table.string('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
      table.string('theme', 20).defaultTo('system');
      table.string('default_currency', 10).defaultTo('USD');
      table.boolean('ai_opt_in').defaultTo(true);
      table.string('redaction_level', 20).defaultTo('standard');
      table.boolean('notifications_email').defaultTo(true);
      table.boolean('notifications_push').defaultTo(false);
      table.timestamps(true, true);
    });
    return;
  }

  const hasPreferenceKey = await knex.schema.hasColumn('user_preferences', 'preference_key');
  const hasTheme = await knex.schema.hasColumn('user_preferences', 'theme');
  if (!hasPreferenceKey || hasTheme) {
    // Already migrated or already correct
    return;
  }

  // Legacy detected: rename + recreate
  const LEGACY = 'user_preferences_legacy';
  try {
    await knex.schema.renameTable('user_preferences', LEGACY);
  } catch (e) {
    // If rename fails, abort to avoid data loss
    console.error('Rename user_preferences -> legacy failed', e);
    throw e;
  }

  await knex.schema.createTable('user_preferences', table => {
    table.string('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.string('theme', 20).defaultTo('system');
    table.string('default_currency', 10).defaultTo('USD');
    table.boolean('ai_opt_in').defaultTo(true);
    table.string('redaction_level', 20).defaultTo('standard');
    table.boolean('notifications_email').defaultTo(true);
    table.boolean('notifications_push').defaultTo(false);
    table.timestamps(true, true);
  });

  const legacyRows = await knex(LEGACY).select('*');
  const byUser = {};
  legacyRows.forEach(r => {
    if (!r.user_id) return;
    if (!byUser[r.user_id]) byUser[r.user_id] = {};
    byUser[r.user_id][r.preference_key] = r.preference_value;
  });

  const defaults = {
    theme: 'system',
    default_currency: 'USD',
    ai_opt_in: true,
    redaction_level: 'standard',
    notifications_email: true,
    notifications_push: false
  };

  const parseBool = (val, def) => {
    if (val === undefined || val === null) return def;
    if (typeof val === 'boolean') return val;
    const s = String(val).toLowerCase();
    if (['true','1','yes','on'].includes(s)) return true;
    if (['false','0','no','off'].includes(s)) return false;
    return def;
  };

  for (const [user_id, map] of Object.entries(byUser)) {
    await knex('user_preferences').insert({
      user_id,
      theme: map.theme || defaults.theme,
      default_currency: map.default_currency || defaults.default_currency,
      ai_opt_in: parseBool(map.ai_opt_in, defaults.ai_opt_in),
      redaction_level: map.redaction_level || defaults.redaction_level,
      notifications_email: parseBool(map.notifications_email, defaults.notifications_email),
      notifications_push: parseBool(map.notifications_push, defaults.notifications_push)
    });
  }

  await knex.schema.dropTableIfExists(LEGACY);
};

exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('user_preferences');
  if (!hasTable) return;
  const hasPreferenceKey = await knex.schema.hasColumn('user_preferences', 'preference_key');
  if (hasPreferenceKey) return; // Already legacy or nothing to do
  await knex.schema.dropTable('user_preferences');
  // (Optional) Could recreate legacy structure here, but not required.
};
