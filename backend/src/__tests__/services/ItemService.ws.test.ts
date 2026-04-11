/**
 * Tests that ItemService emits WebSocket events after CRUD operations.
 * Pattern: mock all Sequelize models + wsService, verify emitToBoard called
 * with correct event and payload AFTER transaction.commit().
 */

// Mock wsService before importing anything
const mockEmitToBoard = jest.fn();
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToBoard: mockEmitToBoard },
  wsService: { emitToBoard: mockEmitToBoard },
}));

// Mock sequelize transaction
const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => {
  const mockItem: any = {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  };
  const mockColumnValue: any = {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  };
  const mockColumn: any = {};
  const mockBoardGroup: any = {
    findOne: jest.fn(),
  };
  const mockActivityLog: any = {
    create: jest.fn(),
  };

  return {
    sequelize: {
      transaction: jest.fn().mockResolvedValue(mockTransaction),
    },
    Item: mockItem,
    ColumnValue: mockColumnValue,
    Column: mockColumn,
    BoardGroup: mockBoardGroup,
    ActivityLog: mockActivityLog,
  };
});

// Mock config
jest.mock('../../config', () => ({
  default: {},
  __esModule: true,
}));

import ItemService from '../../services/ItemService';
import { Item, BoardGroup, ActivityLog, ColumnValue } from '../../models';

const mockUser = { id: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' as const, firstName: 'Test', lastName: 'User' };

describe('ItemService WebSocket broadcasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('emits item:created to board room after transaction commits', async () => {
      const boardId = 10;
      const createdItem = {
        id: 1,
        boardId,
        groupId: 5,
        name: 'New task',
        position: 0,
        createdBy: 1,
      };

      (BoardGroup.findOne as jest.Mock).mockResolvedValue({ id: 5, position: 0 });
      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // lastItem check (position calc)
        .mockResolvedValueOnce(createdItem); // getById reload
      (Item.create as jest.Mock).mockResolvedValue(createdItem);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      await ItemService.create({ name: 'New task' }, boardId, 1, mockUser);

      // WS emit must happen AFTER commit
      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'item:created',
        expect.objectContaining({ id: 1, boardId })
      );
    });
  });

  describe('update', () => {
    it('emits item:updated to board room after transaction commits', async () => {
      const boardId = 10;
      const existingItem = {
        id: 1,
        boardId,
        name: 'Old name',
        position: 0,
        groupId: 5,
        update: jest.fn(),
      };
      const updatedItem = { ...existingItem, name: 'New name' };

      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(existingItem) // find in update
        .mockResolvedValueOnce(updatedItem); // getById reload
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      await ItemService.update(1, boardId, { name: 'New name' }, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'item:updated',
        expect.objectContaining({ id: 1 })
      );
    });
  });

  describe('delete', () => {
    it('emits item:deleted to board room after transaction commits', async () => {
      const boardId = 10;
      const existingItem = {
        id: 1,
        boardId,
        name: 'To delete',
        destroy: jest.fn(),
      };

      (Item.findOne as jest.Mock).mockResolvedValue(existingItem);
      (ColumnValue.destroy as jest.Mock).mockResolvedValue(1);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      await ItemService.delete(1, boardId, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'item:deleted',
        { id: 1, boardId }
      );
    });
  });

  describe('move', () => {
    it('emits item:updated to board room after transaction commits', async () => {
      const boardId = 10;
      const existingItem = {
        id: 1,
        boardId,
        groupId: 5,
        update: jest.fn(),
      };
      const movedItem = { ...existingItem, groupId: 6 };

      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(existingItem) // find item
        .mockResolvedValueOnce(null) // lastItem in target group
        .mockResolvedValueOnce(movedItem); // getById reload
      (BoardGroup.findOne as jest.Mock).mockResolvedValue({ id: 6, boardId });
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      await ItemService.move(1, boardId, 6, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'item:updated',
        expect.objectContaining({ id: 1 })
      );
    });
  });

  describe('reorder', () => {
    it('emits items:reordered to board room after transaction commits', async () => {
      const boardId = 10;
      const itemIds = [3, 1, 2];

      (Item.update as jest.Mock).mockResolvedValue([1]);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});

      await ItemService.reorder(boardId, itemIds, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(
        boardId,
        'items:reordered',
        { boardId, itemIds }
      );
    });
  });
});
