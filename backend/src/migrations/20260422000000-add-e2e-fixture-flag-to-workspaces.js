'use strict';

/**
 * Slice 19, Task A1 — adds an `is_e2e_fixture` flag to the `workspaces`
 * table so the E2E reset flow can safely target only the dedicated
 * fixture workspace without risk of touching dev or production data.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('workspaces', 'is_e2e_fixture', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('workspaces', 'is_e2e_fixture');
  },
};
