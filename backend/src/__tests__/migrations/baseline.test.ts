/**
 * Tests for migration file structure and correctness.
 */

import path from 'path';

describe('Baseline migration', () => {
  const migrationPath = path.resolve(__dirname, '../../migrations/20260411000000-baseline.js');

  it('exports up and down functions', () => {
    const migration = require(migrationPath);
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('up function creates all 13 expected tables', async () => {
    const migration = require(migrationPath);

    const createdTables: string[] = [];
    const addedIndexes: string[] = [];

    const mockQueryInterface = {
      createTable: jest.fn((name: string) => {
        createdTables.push(name);
        return Promise.resolve();
      }),
      addIndex: jest.fn((tableName: string) => {
        addedIndexes.push(tableName);
        return Promise.resolve();
      }),
    };

    const mockSequelize = {
      INTEGER: 'INTEGER',
      STRING: 'STRING',
      TEXT: 'TEXT',
      BOOLEAN: 'BOOLEAN',
      DATE: 'DATE',
      JSONB: 'JSONB',
      ENUM: (...values: string[]) => `ENUM(${values.join(',')})`,
    };

    await migration.up(mockQueryInterface, mockSequelize);

    expect(createdTables).toEqual([
      'workspaces',
      'users',
      'boards',
      'board_groups',
      'board_views',
      'column_definitions',
      'items',
      'column_values',
      'file_attachments',
      'automations',
      'automation_logs',
      'activity_logs',
      'notifications',
    ]);

    // Unique index on column_values (item_id + column_id)
    expect(addedIndexes).toContain('column_values');
  });

  it('down function drops all 13 tables in reverse order', async () => {
    const migration = require(migrationPath);

    const droppedTables: string[] = [];
    const mockQueryInterface = {
      dropTable: jest.fn((name: string) => {
        droppedTables.push(name);
        return Promise.resolve();
      }),
    };

    await migration.down(mockQueryInterface);

    expect(droppedTables).toHaveLength(13);
    // Reverse of creation order (dependencies dropped first)
    expect(droppedTables[0]).toBe('notifications');
    expect(droppedTables[droppedTables.length - 1]).toBe('workspaces');
  });
});

describe('Follow-up migration', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../migrations/20260412000000-add-location-type-and-automation-last-triggered.js'
  );

  it('exports up and down functions', () => {
    const migration = require(migrationPath);
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('up function adds location type and last_triggered_at column', async () => {
    const migration = require(migrationPath);

    const queries: string[] = [];
    const addedColumns: string[] = [];

    const mockQueryInterface = {
      sequelize: {
        query: jest.fn((sql: string) => {
          queries.push(sql);
          return Promise.resolve();
        }),
      },
      addColumn: jest.fn((table: string, column: string) => {
        addedColumns.push(`${table}.${column}`);
        return Promise.resolve();
      }),
    };

    const mockSequelize = {
      DATE: 'DATE',
    };

    await migration.up(mockQueryInterface, mockSequelize);

    expect(queries.length).toBe(1);
    expect(queries[0]).toContain('location');
    expect(addedColumns).toContain('automations.last_triggered_at');
  });
});
