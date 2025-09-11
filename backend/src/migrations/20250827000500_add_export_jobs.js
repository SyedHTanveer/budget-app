exports.up = function(knex) {
  return knex.schema.createTable('export_jobs', function(table) {
    table.string('id').primary();
    table.string('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('status').notNullable(); // pending | processing | complete | failed
    table.string('filename');
    table.string('mime_type');
    table.integer('bytes');
    table.text('error');
    table.text('zip_base64'); // large base64 zip payload (Phase A - future move to object storage)
    table.timestamp('completed_at');
    table.timestamp('downloaded_at');
    table.timestamps(true, true);
    table.index(['user_id','created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('export_jobs');
};
