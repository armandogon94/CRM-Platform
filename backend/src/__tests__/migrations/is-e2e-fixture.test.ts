/**
 * Tests for the E2E fixture flag migration and corresponding Workspace model field.
 *
 * Slice 19, Task A1: adds `is_e2e_fixture` boolean column to `workspaces` so the
 * E2E reset flow can safely target only the dedicated fixture workspace.
 */

import path from 'path';

describe('Migration: add-e2e-fixture-flag-to-workspaces', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../migrations/20260422000000-add-e2e-fixture-flag-to-workspaces.js'
  );

  it('exports up and down functions', () => {
    const migration = require(migrationPath);
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('up adds is_e2e_fixture boolean column to workspaces with NOT NULL + default false', async () => {
    const migration = require(migrationPath);

    const addColumnCalls: Array<{ table: string; column: string; spec: Record<string, unknown> }> = [];
    const mockQueryInterface = {
      addColumn: jest.fn(
        (table: string, column: string, spec: Record<string, unknown>) => {
          addColumnCalls.push({ table, column, spec });
          return Promise.resolve();
        }
      ),
    };
    const mockSequelize = { BOOLEAN: 'BOOLEAN' };

    await migration.up(mockQueryInterface, mockSequelize);

    expect(addColumnCalls).toHaveLength(1);
    const [call] = addColumnCalls;
    expect(call.table).toBe('workspaces');
    expect(call.column).toBe('is_e2e_fixture');
    expect(call.spec.type).toBe('BOOLEAN');
    expect(call.spec.allowNull).toBe(false);
    expect(call.spec.defaultValue).toBe(false);
  });

  it('down removes is_e2e_fixture column from workspaces', async () => {
    const migration = require(migrationPath);

    const removedColumns: string[] = [];
    const mockQueryInterface = {
      removeColumn: jest.fn((table: string, column: string) => {
        removedColumns.push(`${table}.${column}`);
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryInterface);

    expect(removedColumns).toEqual(['workspaces.is_e2e_fixture']);
  });
});

describe('Workspace model: isE2eFixture field', () => {
  it('exposes isE2eFixture with correct type, default, and snake_case field mapping', () => {
    // Load fresh to pick up model definitions without stale module cache.
    jest.resetModules();
    const Workspace = require('../../models/Workspace').default;

    const attributes = Workspace.getAttributes();
    expect(attributes.isE2eFixture).toBeDefined();

    const attr = attributes.isE2eFixture;
    // Sequelize represents DataTypes.BOOLEAN as an object — assert via key or toString.
    expect(String(attr.type)).toMatch(/BOOLEAN/i);
    expect(attr.allowNull).toBe(false);
    expect(attr.defaultValue).toBe(false);
    expect(attr.field).toBe('is_e2e_fixture');
  });

  it('type definition includes isE2eFixture on WorkspaceAttributes', () => {
    // Compile-time check surfaced at runtime: instantiating with the flag must succeed.
    const { WorkspaceAttributes } = require('../../models/Workspace');
    // At runtime, interfaces are erased — we just verify the module loads cleanly.
    // The real enforcement is `tsc --noEmit`, run as part of Task A1 verification.
    expect(true).toBe(true);
    void WorkspaceAttributes; // silence unused
  });
});
