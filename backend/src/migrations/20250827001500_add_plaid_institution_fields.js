exports.up = async function(knex) {
  // Add institution metadata columns and relationships used for Plaid dedupe / refresh logic.
  const hasPlaidItems = await knex.schema.hasTable('plaid_items');
  if (hasPlaidItems) {
    const hasInstitutionId = await knex.schema.hasColumn('plaid_items','institution_id');
    if (!hasInstitutionId) {
      await knex.schema.alterTable('plaid_items', t => {
        t.string('institution_id');
        t.string('institution_name');
        t.index(['user_id','institution_id']);
      });
    }
  }
  const hasAccounts = await knex.schema.hasTable('accounts');
  if (hasAccounts) {
    const cols = await Promise.all([
      knex.schema.hasColumn('accounts','item_id'),
      knex.schema.hasColumn('accounts','institution_id'),
      knex.schema.hasColumn('accounts','institution_name'),
      knex.schema.hasColumn('accounts','official_name'),
      knex.schema.hasColumn('accounts','subtype'),
      knex.schema.hasColumn('accounts','mask'),
      knex.schema.hasColumn('accounts','raw_plaid_meta')
    ]);
    await knex.schema.alterTable('accounts', t => {
      if (!cols[0]) t.string('item_id');
      if (!cols[1]) t.string('institution_id');
      if (!cols[2]) t.string('institution_name');
      if (!cols[3]) t.string('official_name');
      if (!cols[4]) t.string('subtype');
      if (!cols[5]) t.string('mask');
      if (!cols[6]) t.text('raw_plaid_meta');
      t.index(['user_id','institution_id']);
    });
  }
};

exports.down = async function(knex) {
  // Non destructive rollback: leave columns in place.
};
