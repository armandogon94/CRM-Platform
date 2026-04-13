'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'location' to column_type ENUM on column_definitions
    // Postgres requires: create new type → alter column → drop old type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_column_definitions_column_type"
      ADD VALUE IF NOT EXISTS 'location';
    `);

    // Add last_triggered_at to automations
    await queryInterface.addColumn('automations', 'last_triggered_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('automations', 'last_triggered_at');
    // Note: Postgres cannot easily remove an ENUM value.
    // The 'location' value will remain in the type but is harmless.
  },
};
