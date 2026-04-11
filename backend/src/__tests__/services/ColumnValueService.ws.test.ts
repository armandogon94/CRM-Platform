/**
 * Tests that ColumnValueService emits WebSocket events after upsert/batchUpdate.
 * Must resolve boardId from the item to emit to the correct board room.
 */

const mockEmitToBoard = jest.fn();
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToBoard: mockEmitToBoard },
  wsService: { emitToBoard: mockEmitToBoard },
}));

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => {
  const mockColumnValue: any = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
  };
  const mockColumn: any = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };
  const mockItem: any = {
    findByPk: jest.fn(),
    findAll: jest.fn(),
  };
  const mockActivityLog: any = {
    create: jest.fn(),
  };

  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    },
    ColumnValue: mockColumnValue,
    Column: mockColumn,
    Item: mockItem,
    ActivityLog: mockActivityLog,
  };
});

jest.mock('../../config', () => ({
  default: {},
  __esModule: true,
}));

jest.mock('../../eav', () => ({
  getHandler: jest.fn().mockReturnValue({
    validate: jest.fn().mockReturnValue({ valid: true }),
    serialize: jest.fn((v: any) => v),
    deserialize: jest.fn((v: any) => v),
    formatDisplay: jest.fn().mockReturnValue(''),
    getAggregates: jest.fn().mockReturnValue([]),
  }),
}));

import ColumnValueService from '../../services/ColumnValueService';
import { ColumnValue, Column, Item, ActivityLog } from '../../models';

const mockUser = { id: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' as const, firstName: 'Test', lastName: 'User' };

describe('ColumnValueService WebSocket broadcasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('emits column_value:changed to board room after commit', async () => {
      const itemId = 1;
      const columnId = 5;
      const boardId = 10;
      const value = { label: 'Done', color: '#00C875' };

      // Item lookup for boardId resolution
      (Item.findByPk as jest.Mock).mockResolvedValue({ id: itemId, boardId });

      // No existing value — create path
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(null);
      (ColumnValue.create as jest.Mock).mockResolvedValue({ id: 99, itemId, columnId, value });
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      // Reload after commit
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        id: 99,
        itemId,
        columnId,
        value,
        column: { id: columnId, name: 'Status', columnType: 'status', config: {} },
      });

      await ColumnValueService.upsert(itemId, columnId, value, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'column_value:changed',
        expect.objectContaining({ itemId, columnId })
      );
    });

    it('emits column_value:changed when updating existing value', async () => {
      const itemId = 1;
      const columnId = 5;
      const boardId = 10;
      const oldValue = { label: 'Working', color: '#FDAB3D' };
      const newValue = { label: 'Done', color: '#00C875' };

      (Item.findByPk as jest.Mock).mockResolvedValue({ id: itemId, boardId });

      const existingCV = { id: 99, itemId, columnId, value: oldValue, update: jest.fn() };
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(existingCV);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({
        id: 99,
        itemId,
        columnId,
        value: newValue,
        column: { id: columnId, name: 'Status', columnType: 'status', config: {} },
      });

      await ColumnValueService.upsert(itemId, columnId, newValue, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'column_value:changed',
        expect.objectContaining({ itemId, columnId })
      );
    });
  });

  describe('batchUpdate', () => {
    it('emits column_values:batch_changed to board room after commit', async () => {
      const itemId = 1;
      const boardId = 10;
      const values = [
        { columnId: 5, value: 'Done' },
        { columnId: 6, value: 42 },
      ];

      (Item.findByPk as jest.Mock).mockResolvedValue({ id: itemId, boardId });

      // Both are new values (create path)
      (ColumnValue.findOne as jest.Mock).mockResolvedValue(null);
      (ColumnValue.create as jest.Mock).mockResolvedValue({ id: 100, itemId });
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      // Reload all values after commit
      (ColumnValue.findAll as jest.Mock).mockResolvedValue([
        { id: 100, itemId, columnId: 5, value: 'Done' },
        { id: 101, itemId, columnId: 6, value: 42 },
      ]);

      await ColumnValueService.batchUpdate(itemId, values, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'column_values:batch_changed',
        expect.objectContaining({
          itemId,
          boardId,
        })
      );
    });
  });
});
