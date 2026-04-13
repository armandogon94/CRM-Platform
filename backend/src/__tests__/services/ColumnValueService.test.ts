/**
 * Core tests for ColumnValueService CRUD + EAV handler integration.
 */

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

const mockEmitToBoard = jest.fn();
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToBoard: mockEmitToBoard },
  wsService: { emitToBoard: mockEmitToBoard },
}));

jest.mock('../../services/AutomationEngine', () => ({
  AutomationEngine: { evaluate: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  ColumnValue: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
  },
  Column: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  Item: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  ActivityLog: { create: jest.fn() },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

jest.mock('../../eav', () => ({
  getHandler: jest.fn().mockReturnValue({
    validate: jest.fn().mockReturnValue({ valid: true }),
    serialize: jest.fn((v: any) => v),
    deserialize: jest.fn((v: any) => v),
    formatDisplay: jest.fn((v: any) => String(v ?? '')),
    getAggregates: jest.fn().mockReturnValue([{ type: 'count', value: 3 }]),
  }),
}));

import ColumnValueService from '../../services/ColumnValueService';
import { ColumnValue, Column, Item } from '../../models';

describe('ColumnValueService', () => {
  beforeEach(() => jest.clearAllMocks());

  const user = { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com', role: 'admin' as const, workspaceId: 1 };

  describe('listByItem', () => {
    it('returns all column values for an item', async () => {
      const values = [
        { id: 1, itemId: 1, columnId: 1, value: 'Done' },
        { id: 2, itemId: 1, columnId: 2, value: 42 },
      ];
      (ColumnValue.findAll as jest.Mock).mockResolvedValue(values);

      const result = await ColumnValueService.listByItem(1);

      expect(result).toEqual(values);
      expect(ColumnValue.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { itemId: 1 },
        })
      );
    });
  });

  describe('upsert', () => {
    it('creates a new column value when none exists', async () => {
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(null);
      const created = { id: 10, itemId: 1, columnId: 1, value: 'Working on it' };
      (ColumnValue.create as jest.Mock).mockResolvedValue(created);
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        ...created,
        column: { id: 1, name: 'Status', columnType: 'status', config: {} },
        value: 'Working on it',
      });
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });
      (Column.findByPk as jest.Mock).mockResolvedValue({ id: 1, columnType: 'text' });

      const result = await ColumnValueService.upsert(1, 1, 'Working on it', 1, user);

      expect(ColumnValue.create).toHaveBeenCalledWith(
        { itemId: 1, columnId: 1, value: 'Working on it' },
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(result.value).toBe('Working on it');
    });

    it('updates existing column value', async () => {
      const existing = {
        id: 10, itemId: 1, columnId: 1, value: 'Old',
        update: jest.fn(),
      };
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(existing);
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        id: 10, itemId: 1, columnId: 1, value: 'New',
        column: { id: 1, name: 'Status', columnType: 'status', config: {} },
      });
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });
      (Column.findByPk as jest.Mock).mockResolvedValue({ id: 1, columnType: 'text' });

      const result = await ColumnValueService.upsert(1, 1, 'New', 1, user);

      expect(existing.update).toHaveBeenCalledWith({ value: 'New' }, { transaction: mockTransaction });
      expect(mockCommit).toHaveBeenCalled();
      expect(result.value).toBe('New');
    });

    it('broadcasts WS event after upsert', async () => {
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(null);
      (ColumnValue.create as jest.Mock).mockResolvedValue({ id: 10, itemId: 1, columnId: 1, value: 'v' });
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        id: 10, itemId: 1, columnId: 1, value: 'v',
        column: { id: 1, name: 'Status', columnType: 'text', config: {} },
      });
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });
      (Column.findByPk as jest.Mock).mockResolvedValue({ id: 1, columnType: 'text' });

      await ColumnValueService.upsert(1, 1, 'v', 1, user);

      expect(mockEmitToBoard).toHaveBeenCalledWith(5, 'column_value:changed', expect.objectContaining({
        itemId: 1,
        columnId: 1,
      }));
    });

    it('triggers automation for status column changes', async () => {
      const { AutomationEngine } = require('../../services/AutomationEngine');
      (ColumnValue.findOne as jest.Mock).mockResolvedValue({
        id: 10, itemId: 1, columnId: 1, value: 'Old', update: jest.fn(),
      });
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        id: 10, itemId: 1, columnId: 1, value: 'Done',
        column: { id: 1, name: 'Status', columnType: 'status', config: {} },
      });
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });
      (Column.findByPk as jest.Mock).mockResolvedValue({ id: 1, columnType: 'status' });

      await ColumnValueService.upsert(1, 1, 'Done', 1, user);

      expect(AutomationEngine.evaluate).toHaveBeenCalledWith('on_status_changed', expect.objectContaining({
        boardId: 5,
        itemId: 1,
        columnId: 1,
      }));
    });

    it('rolls back transaction on error', async () => {
      (ColumnValue.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(ColumnValueService.upsert(1, 1, 'v', 1, user)).rejects.toThrow('DB error');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockEmitToBoard).not.toHaveBeenCalled();
    });
  });

  describe('batchUpdate', () => {
    it('creates/updates multiple column values in transaction', async () => {
      // First value exists, second doesn't
      (ColumnValue.findOne as jest.Mock)
        .mockResolvedValueOnce({ id: 10, value: 'Old', update: jest.fn() })
        .mockResolvedValueOnce(null);
      (ColumnValue.create as jest.Mock).mockResolvedValue({ id: 11 });
      (ColumnValue.findAll as jest.Mock).mockResolvedValue([
        { id: 10, itemId: 1, columnId: 1, value: 'New' },
        { id: 11, itemId: 1, columnId: 2, value: 42 },
      ]);
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });

      const result = await ColumnValueService.batchUpdate(
        1,
        [{ columnId: 1, value: 'New' }, { columnId: 2, value: 42 }],
        1,
        user
      );

      expect(result).toHaveLength(2);
      expect(mockCommit).toHaveBeenCalled();
    });

    it('broadcasts batch WS event after update', async () => {
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(null);
      (ColumnValue.create as jest.Mock).mockResolvedValue({ id: 10 });
      (ColumnValue.findAll as jest.Mock).mockResolvedValue([{ id: 10, itemId: 1, columnId: 1, value: 'v' }]);
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });

      await ColumnValueService.batchUpdate(1, [{ columnId: 1, value: 'v' }], 1, user);

      expect(mockEmitToBoard).toHaveBeenCalledWith(5, 'column_values:batch_changed', expect.objectContaining({
        itemId: 1,
        boardId: 5,
      }));
    });

    it('rolls back on error', async () => {
      (ColumnValue.findOne as jest.Mock).mockRejectedValue(new Error('batch fail'));

      await expect(
        ColumnValueService.batchUpdate(1, [{ columnId: 1, value: 'v' }], 1, user)
      ).rejects.toThrow('batch fail');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('validateAndSet', () => {
    it('validates value using EAV handler before upserting', async () => {
      const { getHandler } = require('../../eav');
      const mockHandler = {
        validate: jest.fn().mockReturnValue({ valid: true }),
        serialize: jest.fn().mockReturnValue('serialized'),
      };
      getHandler.mockReturnValue(mockHandler);

      // First findByPk call is from validateAndSet, second from upsert's automation check
      (Column.findByPk as jest.Mock)
        .mockResolvedValueOnce({ id: 1, name: 'Status', columnType: 'status', config: { labels: ['Done'] } })
        .mockResolvedValueOnce({ id: 1, columnType: 'text' });
      // Mock the upsert chain
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(null);
      (ColumnValue.create as jest.Mock).mockResolvedValue({ id: 10 });
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        id: 10, itemId: 1, columnId: 1, value: 'serialized',
        column: { id: 1, name: 'Status', columnType: 'status', config: {} },
      });
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: 1, boardId: 5 });

      await ColumnValueService.validateAndSet(1, 1, 'Done', 1, user);

      expect(mockHandler.validate).toHaveBeenCalledWith('Done', { labels: ['Done'] });
      expect(mockHandler.serialize).toHaveBeenCalledWith('Done');
    });

    it('throws when validation fails', async () => {
      const { getHandler } = require('../../eav');
      getHandler.mockReturnValue({
        validate: jest.fn().mockReturnValue({ valid: false, error: 'Invalid value' }),
      });

      (Column.findByPk as jest.Mock).mockResolvedValue({
        id: 1, name: 'Status', columnType: 'status', config: {},
      });

      await expect(
        ColumnValueService.validateAndSet(1, 1, 'bad', 1, user)
      ).rejects.toThrow('Validation failed for column "Status": Invalid value');
    });

    it('throws when column not found', async () => {
      (Column.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(
        ColumnValueService.validateAndSet(1, 999, 'v', 1, user)
      ).rejects.toThrow('Column with id 999 not found');
    });
  });

  describe('getFormattedValues', () => {
    it('returns formatted display values using EAV handlers', async () => {
      const { getHandler } = require('../../eav');
      const mockHandler = {
        deserialize: jest.fn((v: any) => v),
        formatDisplay: jest.fn(() => 'Formatted'),
      };
      getHandler.mockReturnValue(mockHandler);

      (ColumnValue.findAll as jest.Mock).mockResolvedValue([
        {
          value: 'Done',
          column: { id: 1, name: 'Status', columnType: 'status', config: {} },
        },
      ]);

      const result = await ColumnValueService.getFormattedValues(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        columnId: 1,
        columnName: 'Status',
        columnType: 'status',
        displayValue: 'Formatted',
      }));
    });
  });

  describe('getAggregates', () => {
    it('returns aggregates for a column across board items', async () => {
      const { getHandler } = require('../../eav');
      const mockHandler = {
        deserialize: jest.fn((v: any) => v),
        getAggregates: jest.fn().mockReturnValue([{ type: 'count', value: 3 }]),
      };
      getHandler.mockReturnValue(mockHandler);

      (Column.findOne as jest.Mock).mockResolvedValue({
        id: 1, columnType: 'status', config: {},
      });
      (Item.findAll as jest.Mock).mockResolvedValue([
        { id: 1 }, { id: 2 }, { id: 3 },
      ]);
      (ColumnValue.findAll as jest.Mock).mockResolvedValue([
        { value: 'Done' }, { value: 'Working on it' }, { value: 'Done' },
      ]);

      const result = await ColumnValueService.getAggregates(1, 1);

      expect(result).toEqual([{ type: 'count', value: 3 }]);
      expect(mockHandler.getAggregates).toHaveBeenCalled();
    });

    it('throws when column not found in board', async () => {
      (Column.findOne as jest.Mock).mockResolvedValue(null);

      await expect(ColumnValueService.getAggregates(1, 999)).rejects.toThrow('Column 999 not found in board 1');
    });

    it('returns empty aggregates when board has no items', async () => {
      const { getHandler } = require('../../eav');
      const mockHandler = {
        getAggregates: jest.fn().mockReturnValue([{ type: 'count', value: 0 }]),
      };
      getHandler.mockReturnValue(mockHandler);

      (Column.findOne as jest.Mock).mockResolvedValue({
        id: 1, columnType: 'number', config: {},
      });
      (Item.findAll as jest.Mock).mockResolvedValue([]);

      const result = await ColumnValueService.getAggregates(1, 1);

      expect(mockHandler.getAggregates).toHaveBeenCalledWith([]);
    });
  });
});
