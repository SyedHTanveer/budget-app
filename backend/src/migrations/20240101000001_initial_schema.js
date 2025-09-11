exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.string('id').primary(); // Changed from uuid to string for SQLite
      table.string('email', 255).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 100);
      table.string('last_name', 100);
      table.timestamps(true, true);
    })
    .createTable('plaid_items', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('item_id').notNullable();
      table.text('access_token').notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('accounts', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('plaid_account_id');
      table.string('name', 255).notNullable();
      table.string('type', 50).notNullable();
      table.decimal('balance', 12, 2).notNullable().defaultTo(0);
      table.string('currency', 3).defaultTo('USD');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('transactions', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('account_id').references('id').inTable('accounts').onDelete('CASCADE');
      table.string('plaid_transaction_id');
      table.decimal('amount', 12, 2).notNullable();
      table.text('description');
      table.string('category', 100);
      table.string('subcategory', 100);
      table.string('merchant_name');
      table.date('date').notNullable();
      table.string('status', 20).defaultTo('posted');
      table.timestamps(true, true);
    })
    .createTable('bills', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.decimal('amount', 12, 2).notNullable();
      table.date('due_date').notNullable();
      table.string('frequency', 20).defaultTo('monthly');
      table.boolean('is_paid').defaultTo(false);
      table.timestamps(true, true);
    })
    .createTable('goals', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.decimal('target_amount', 12, 2).notNullable();
      table.decimal('current_amount', 12, 2).defaultTo(0);
      table.decimal('monthly_target', 12, 2);
      table.date('target_date');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    .createTable('ai_conversations', function(table) {
      table.string('id').primary();
      table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('query').notNullable();
      table.text('response').notNullable();
      table.string('function_used', 100);
      table.text('function_data'); // Changed from jsonb to text for SQLite
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .then(() => {
      // Create indexes
      return knex.schema
        .table('transactions', function(table) {
          table.index(['user_id', 'date']);
          table.index('category');
        })
        .table('accounts', function(table) {
          table.index(['user_id', 'is_active']);
        })
        .table('bills', function(table) {
          table.index(['user_id', 'due_date']);
        })
        .table('goals', function(table) {
          table.index(['user_id', 'is_active']);
        });
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ai_conversations')
    .dropTableIfExists('goals')
    .dropTableIfExists('bills')
    .dropTableIfExists('transactions')
    .dropTableIfExists('accounts')
    .dropTableIfExists('plaid_items')
    .dropTableIfExists('users');
};
