/**
 * Tests for BoardService CRUD operations.
 */

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

// Mock WebSocket to prevent connection errors
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToBoard: jest.fn() },
  wsService: { emitToBoard: jest.fn() },
}));

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  Board: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  BoardGroup: { create: jest.fn(), destroy: jest.fn() },
  Column: { create: jest.fn(), destroy: jest.fn() },
  BoardView: { create: jest.fn(), destroy: jest.fn() },
  Item: { findAll: jest.fn(), destroy: jest.fn() },
  ColumnValue: { destroy: jest.fn() },
  ActivityLog: { create: jest.fn() },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import BoardService from '../../services/BoardService';
import { Board, BoardGroup, Column, BoardView, Item, ColumnValue, ActivityLog } from '../../models';

const mockUser = { id: 1, email: 'admin@crm-platform.com', workspaceId: 1 } as any;
const workspaceId = 1;

describe('BoardService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('returns boards with groups and columns', async () => {
      const boards = [
        { id: 1, name: 'Sales Pipeline', groups: [{ id: 1 }], columns: [{ id: 1 }] },
        { id: 2, name: 'Task Tracker', groups: [], columns: [] },
      ];
      (Board.findAll as jest.Mock).mockResolvedValue(boards);

      const result = await BoardService.list(workspaceId);

      expect(result).toEqual(boards);
      expect(Board.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId },
          order: [['createdAt', 'DESC']],
        })
      );
    });
  });

  describe('getById', () => {
    it('returns board with associations', async () => {
      const board = {
        id: 1,
        name: 'Sales Pipeline',
        groups: [{ id: 1, name: 'Active' }],
        columns: [{ id: 1, name: 'Status' }],
        views: [{ id: 1, name: 'Main Table' }],
      };
      (Board.findOne as jest.Mock).mockResolvedValue(board);

      const result = await BoardService.getById(1, workspaceId);

      expect(result).toEqual(board);
      expect(Board.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, workspaceId },
        })
      );
    });

    it('returns null for non-existent board', async () => {
      (Board.findOne as jest.Mock).mockResolvedValue(null);

      const result = await BoardService.getById(999, workspaceId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates board with default group, default view, and activity log', async () => {
      const createdBoard = { id: 10, name: 'New Board' };
      const fullBoard = {
        id: 10,
        name: 'New Board',
        groups: [{ id: 1, name: 'New Group' }],
        columns: [],
        views: [{ id: 1, name: 'Main Table' }],
      };

      (Board.create as jest.Mock).mockResolvedValue(createdBoard);
      (BoardGroup.create as jest.Mock).mockResolvedValue({ id: 1 });
      (BoardView.create as jest.Mock).mockResolvedValue({ id: 1 });
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });
      // After commit, BoardService.getById is called which uses Board.findOne
      (Board.findOne as jest.Mock).mockResolvedValue(fullBoard);

      const result = await BoardService.create(
        { name: 'New Board' },
        workspaceId,
        mockUser
      );

      expect(result).toEqual(fullBoard);
      expect(Board.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Board',
          workspaceId,
          createdBy: mockUser.id,
        }),
        { transaction: mockTransaction }
      );
      expect(BoardGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 10,
          name: 'New Group',
          color: '#579BFC',
          position: 0,
        }),
        { transaction: mockTransaction }
      );
      expect(BoardView.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 10,
          name: 'Main Table',
          viewType: 'table',
          isDefault: true,
        }),
        { transaction: mockTransaction }
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'board',
          entityId: 10,
          action: 'created',
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('rolls back on error', async () => {
      (Board.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        BoardService.create({ name: 'Fail' }, workspaceId, mockUser)
      ).rejects.toThrow('DB error');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates board name', async () => {
      const board = {
        id: 1,
        name: 'Old Name',
        description: 'desc',
        update: jest.fn(),
      };
      (Board.findOne as jest.Mock).mockResolvedValue(board);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await BoardService.update(
        1,
        workspaceId,
        { name: 'New Name' },
        mockUser
      );

      expect(result).toEqual(board);
      expect(board.update).toHaveBeenCalledWith(
        { name: 'New Name' },
        { transaction: mockTransaction }
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'updated',
          changes: { name: { from: 'Old Name', to: 'New Name' } },
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('throws for non-existent board', async () => {
      (Board.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        BoardService.update(999, workspaceId, { name: 'X' }, mockUser)
      ).rejects.toThrow('Board not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('cascade deletes items, column values, columns, groups, views', async () => {
      const board = { id: 1, name: 'To Delete', destroy: jest.fn() };
      const items = [{ id: 10 }, { id: 11 }];

      (Board.findOne as jest.Mock).mockResolvedValue(board);
      (Item.findAll as jest.Mock).mockResolvedValue(items);
      (ColumnValue.destroy as jest.Mock).mockResolvedValue(2);
      (Item.destroy as jest.Mock).mockResolvedValue(2);
      (Column.destroy as jest.Mock).mockResolvedValue(3);
      (BoardGroup.destroy as jest.Mock).mockResolvedValue(1);
      (BoardView.destroy as jest.Mock).mockResolvedValue(1);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      await BoardService.delete(1, workspaceId, mockUser);

      expect(ColumnValue.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { itemId: [10, 11] },
          transaction: mockTransaction,
        })
      );
      expect(Item.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 1 },
          transaction: mockTransaction,
        })
      );
      expect(Column.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 1 },
          transaction: mockTransaction,
        })
      );
      expect(BoardGroup.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 1 },
          transaction: mockTransaction,
        })
      );
      expect(BoardView.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 1 },
          transaction: mockTransaction,
        })
      );
      expect(board.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'deleted',
          changes: { name: 'To Delete' },
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('throws for non-existent board', async () => {
      (Board.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        BoardService.delete(999, workspaceId, mockUser)
      ).rejects.toThrow('Board not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('duplicate', () => {
    it('creates copy of board with groups and columns', async () => {
      const original = {
        id: 1,
        name: 'Original Board',
        description: 'A board',
        boardType: 'main',
        settings: { color: 'blue' },
        groups: [
          { name: 'Group A', color: '#FF0000', position: 0 },
          { name: 'Group B', color: '#00FF00', position: 1 },
        ],
        columns: [
          { name: 'Status', columnType: 'status', config: {}, position: 0, width: 150, isRequired: false },
        ],
      };
      const duplicateBoard = { id: 20, name: 'Original Board (copy)' };
      const fullDuplicate = {
        id: 20,
        name: 'Original Board (copy)',
        groups: [{ id: 5, name: 'Group A' }, { id: 6, name: 'Group B' }],
        columns: [{ id: 10, name: 'Status' }],
        views: [{ id: 3, name: 'Main Table' }],
      };

      // First call: findOne for the original board (with transaction)
      // Second call: findOne for getById reload after commit
      (Board.findOne as jest.Mock)
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(fullDuplicate);
      (Board.create as jest.Mock).mockResolvedValue(duplicateBoard);
      (BoardGroup.create as jest.Mock).mockResolvedValue({ id: 5 });
      (Column.create as jest.Mock).mockResolvedValue({ id: 10 });
      (BoardView.create as jest.Mock).mockResolvedValue({ id: 3 });
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await BoardService.duplicate(1, workspaceId, mockUser);

      expect(result).toEqual(fullDuplicate);
      expect(Board.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Original Board (copy)',
          description: 'A board',
          workspaceId,
          createdBy: mockUser.id,
          boardType: 'main',
          settings: { color: 'blue' },
        }),
        { transaction: mockTransaction }
      );
      // Two groups duplicated
      expect(BoardGroup.create).toHaveBeenCalledTimes(2);
      expect(BoardGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 20,
          name: 'Group A',
          color: '#FF0000',
          position: 0,
        }),
        { transaction: mockTransaction }
      );
      // One column duplicated
      expect(Column.create).toHaveBeenCalledTimes(1);
      expect(Column.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 20,
          name: 'Status',
          columnType: 'status',
        }),
        { transaction: mockTransaction }
      );
      // Default view for duplicate
      expect(BoardView.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 20,
          name: 'Main Table',
          viewType: 'table',
          isDefault: true,
        }),
        { transaction: mockTransaction }
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'duplicated',
          changes: { originalBoardId: 1, name: 'Original Board (copy)' },
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
    });
  });
});
