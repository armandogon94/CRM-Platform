/**
 * Tests for the users.workspace_id partial-index migration.
 *
 * Slice 21 review fix C2: adds a partial index aligned with the
 * paranoid filter (deleted_at IS NULL) so WorkspaceService.searchMembers'
 * workspaceId pre-filter doesn't seq-scan the entire users table at
 * production scale.
 */

import path from 'path';

describe('Migration: add-users-workspace-id-index', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../migrations/20260426224440-add-users-workspace-id-index.js'
  );

  it('exports up and down functions', () => {
    const migration = require(migrationPath);
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('up calls addIndex on users(workspace_id) with partial WHERE deleted_at IS NULL', async () => {
    const migration = require(migrationPath);

    const addIndexCalls: Array<{
      table: string;
      columns: string[];
      options: Record<string, unknown>;
    }> = [];
    const mockQueryInterface = {
      addIndex: jest.fn(
        (
          table: string,
          columns: string[],
          options: Record<string, unknown>
        ) => {
          addIndexCalls.push({ table, columns, options });
          return Promise.resolve();
        }
      ),
    };

    await migration.up(mockQueryInterface);

    expect(addIndexCalls).toHaveLength(1);
    const [call] = addIndexCalls;
    expect(call.table).toBe('users');
    expect(call.columns).toEqual(['workspace_id']);
    expect(call.options.name).toBe('idx_users_workspace_id');
    // The partial-index predicate is the load-bearing detail — it
    // aligns the index with the paranoid scope so soft-deleted rows
    // don't bloat it.
    expect(call.options.where).toEqual({ deleted_at: null });
  });

  it('down removes the idx_users_workspace_id index from users', async () => {
    const migration = require(migrationPath);

    const removeIndexCalls: Array<{ table: string; indexName: string }> = [];
    const mockQueryInterface = {
      removeIndex: jest.fn((table: string, indexName: string) => {
        removeIndexCalls.push({ table, indexName });
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryInterface);

    expect(removeIndexCalls).toHaveLength(1);
    const [call] = removeIndexCalls;
    expect(call.table).toBe('users');
    expect(call.indexName).toBe('idx_users_workspace_id');
  });
});
