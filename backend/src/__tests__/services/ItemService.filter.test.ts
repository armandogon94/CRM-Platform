/**
 * Tests for ItemService.list() column-value filtering and sorting.
 * Uses the same mock pattern as ItemService.ws.test.ts.
 *
 * Since ColumnValue.value is JSONB, filter operators work on the stored
 * JSON value. The service builds Sequelize literal WHERE clauses
 * against the column_values table.
 */

const mockEmitToBoard = jest.fn();
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToBoard: mockEmitToBoard },
}));

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

// We need findAndCountAll to behave differently per test
const mockFindAndCountAll = jest.fn();

jest.mock('../../models', () => {
  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    },
    Item: {
      findAndCountAll: mockFindAndCountAll,
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ColumnValue: {
      bulkCreate: jest.fn(),
      destroy: jest.fn(),
    },
    Column: {},
    BoardGroup: {
      findOne: jest.fn(),
    },
    ActivityLog: {
      create: jest.fn(),
    },
  };
});

jest.mock('../../config', () => ({
  default: {},
  __esModule: true,
}));

import ItemService from '../../services/ItemService';

describe('ItemService.list() filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
  });

  it('passes columnFilters into the query when provided', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'equals', value: 'Done' },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    // The where clause should include a Sequelize literal for the filter
    expect(callArgs.where).toBeDefined();
  });

  it('handles multiple columnFilters with AND logic', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'equals', value: 'Done' },
        { columnId: 6, operator: 'greater_than', value: 100 },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('handles is_empty operator without value', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'is_empty', value: null },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('handles is_not_empty operator without value', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'is_not_empty', value: null },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('handles contains operator for text search', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'contains', value: 'hello' },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('handles not_equals operator', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'not_equals', value: 'Working' },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('handles starts_with operator', async () => {
    await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'starts_with', value: 'Hel' },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('handles numeric comparison operators', async () => {
    for (const op of ['greater_than', 'less_than', 'greater_or_equal', 'less_or_equal']) {
      mockFindAndCountAll.mockClear();
      await ItemService.list(10, {
        columnFilters: [
          { columnId: 6, operator: op, value: 50 },
        ],
      });
      expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
    }
  });

  it('supports sortByColumn to sort by column value', async () => {
    await ItemService.list(10, {
      sortByColumn: 5,
      sortOrder: 'DESC',
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('returns empty result set without errors when no items match', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    const result = await ItemService.list(10, {
      columnFilters: [
        { columnId: 5, operator: 'equals', value: 'NonExistent' },
      ],
    });

    expect(result).toEqual({ items: [], total: 0 });
  });

  it('combines columnFilters with existing groupId filter', async () => {
    await ItemService.list(10, {
      groupId: 3,
      columnFilters: [
        { columnId: 5, operator: 'equals', value: 'Done' },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).toBeDefined();
  });

  it('combines columnFilters with search', async () => {
    await ItemService.list(10, {
      search: 'task',
      columnFilters: [
        { columnId: 5, operator: 'equals', value: 'Done' },
      ],
    });

    expect(mockFindAndCountAll).toHaveBeenCalledTimes(1);
  });

  it('combines columnFilters with pagination', async () => {
    mockFindAndCountAll.mockResolvedValue({ count: 100, rows: Array(10).fill({}) });

    const result = await ItemService.list(10, {
      page: 2,
      limit: 10,
      columnFilters: [
        { columnId: 5, operator: 'equals', value: 'Done' },
      ],
    });

    expect(result.total).toBe(100);
    expect(result.items).toHaveLength(10);
    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.offset).toBe(10); // page 2, limit 10
    expect(callArgs.limit).toBe(10);
  });
});
