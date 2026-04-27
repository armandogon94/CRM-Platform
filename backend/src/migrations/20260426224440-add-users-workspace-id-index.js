'use strict';

/**
 * Slice 21 review C2 — adds a partial index on `users.workspace_id`
 * filtered to non-soft-deleted rows.
 *
 * Slice 21B introduced `WorkspaceService.searchMembers`, which
 * pre-filters by `workspace_id + is_active` before the ILIKE fan-out
 * over email/firstName/lastName. Without this index the workspace
 * pre-filter scans the entire `users` table — invisible at seeded
 * demo scale (tens of rows), seq-scan dominant in production at
 * thousands of users per workspace.
 *
 * The partial WHERE `deleted_at IS NULL` aligns with Sequelize's
 * paranoid scope (User.paranoid = true) and keeps the index small —
 * it only carries live rows, not the soft-delete tombstones that
 * member-search would never return anyway.
 *
 * Note on CONCURRENTLY: PostgreSQL `CREATE INDEX CONCURRENTLY` cannot
 * run inside a transaction, and umzug/Sequelize migrations default to
 * transactional execution. For the seeded demo dataset this matters
 * little (the index builds in milliseconds). If a production rollout
 * with large existing data ever requires zero-downtime indexing, the
 * operator can run `CREATE INDEX CONCURRENTLY` manually before
 * applying this migration; umzug then sees the index already exists
 * and skips silently — no harm done.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('users', ['workspace_id'], {
      name: 'idx_users_workspace_id',
      where: {
        deleted_at: null,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'idx_users_workspace_id');
  },
};
