exports.up = function(knex){
  return knex.schema.alterTable('goals', table => {
    table.string('priority', 20).defaultTo('medium');
  });
};
exports.down = function(knex){
  return knex.schema.alterTable('goals', table => {
    table.dropColumn('priority');
  });
};
