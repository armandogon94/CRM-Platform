/**
 * Tests for BoardViewService CRUD operations.
 */

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  BoardView: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  ActivityLog: { create: jest.fn() },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import BoardViewService from '../../services/BoardViewService';
import { BoardView, ActivityLog } from '../../models';
import { createAuthUser, createTestView } from '../factories';

describe('BoardViewService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('returns all views for a board', async () => {
      const views = [
        createTestView({ id: 1, name: 'Table View' }),
        createTestView({ id: 2, name: 'Kanban View', viewType: 'kanban' }),
      ];
      (BoardView.findAll as jest.Mock).mockResolvedValue(views);

      const result = await BoardViewService.list(1);

      expect(result).toEqual(views);
      expect(BoardView.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId: 1 },
          order: [['createdAt', 'ASC']],
        })
      );
    });
  });

  describe('getById', () => {
    it('returns view by id and boardId', async () => {
      const view = createTestView({ id: 5, boardId: 2 });
      (BoardView.findOne as jest.Mock).mockResolvedValue(view);

      const result = await BoardViewService.getById(5, 2);

      expect(result).toEqual(view);
      expect(BoardView.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, boardId: 2 },
        })
      );
    });

    it('returns null for non-existent view', async () => {
      (BoardView.findOne as jest.Mock).mockResolvedValue(null);

      const result = await BoardViewService.getById(999, 1);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates view with activity log in transaction', async () => {
      const view = createTestView({ id: 10, name: 'New View', viewType: 'kanban' });
      (BoardView.create as jest.Mock).mockResolvedValue(view);

      const user = createAuthUser();
      const data = { name: 'New View', viewType: 'kanban', settings: { groupBy: 'status' } };
      const result = await BoardViewService.create(data, 1, 1, user);

      expect(result).toEqual(view);
      expect(BoardView.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId: 1,
          name: 'New View',
          viewType: 'kanban',
          settings: { groupBy: 'status' },
          isDefault: false,
          createdBy: user.id,
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          userId: user.id,
          entityType: 'board_view',
          entityId: view.id,
          action: 'created',
          changes: { name: 'New View', viewType: 'kanban', boardId: 1 },
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('unsets other defaults when new view is default', async () => {
      const view = createTestView({ id: 11, isDefault: true });
      (BoardView.create as jest.Mock).mockResolvedValue(view);

      const user = createAuthUser();
      const data = { name: 'Default View', viewType: 'table', isDefault: true };
      await BoardViewService.create(data, 1, 1, user);

      // Should unset existing defaults first
      expect(BoardView.update).toHaveBeenCalledWith(
        { isDefault: false },
        { where: { boardId: 1, isDefault: true }, transaction: mockTransaction }
      );
      // Then create the new view with isDefault: true
      expect(BoardView.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
        expect.objectContaining({ transaction: mockTransaction })
      );
    });

    it('rolls back transaction on error', async () => {
      (BoardView.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const user = createAuthUser();
      await expect(
        BoardViewService.create({ name: 'Fail', viewType: 'table' }, 1, 1, user)
      ).rejects.toThrow('DB error');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates view name and settings', async () => {
      const view = {
        ...createTestView({ id: 1, boardId: 1, name: 'Old Name', isDefault: false }),
        update: jest.fn(),
      };
      (BoardView.findOne as jest.Mock).mockResolvedValue(view);

      const user = createAuthUser();
      const data = { name: 'Updated Name', settings: { sort: 'asc' } };
      await BoardViewService.update(1, 1, data, 1, user);

      expect(view.update).toHaveBeenCalledWith(data, { transaction: mockTransaction });
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          userId: user.id,
          entityType: 'board_view',
          entityId: 1,
          action: 'updated',
          changes: expect.objectContaining({
            name: { from: 'Old Name', to: 'Updated Name' },
          }),
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('throws for non-existent view', async () => {
      (BoardView.findOne as jest.Mock).mockResolvedValue(null);

      const user = createAuthUser();
      await expect(
        BoardViewService.update(999, 1, { name: 'X' }, 1, user)
      ).rejects.toThrow('View not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes view with activity log', async () => {
      const view = {
        ...createTestView({ id: 1, boardId: 1, name: 'To Delete', viewType: 'table' }),
        destroy: jest.fn(),
      };
      (BoardView.findOne as jest.Mock).mockResolvedValue(view);
      (BoardView.count as jest.Mock).mockResolvedValue(2);

      const user = createAuthUser();
      await BoardViewService.delete(1, 1, 1, user);

      expect(view.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          userId: user.id,
          entityType: 'board_view',
          entityId: 1,
          action: 'deleted',
          changes: { name: 'To Delete', viewType: 'table', boardId: 1 },
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('throws when deleting last view of a board', async () => {
      const view = { ...createTestView({ id: 1, boardId: 1 }), destroy: jest.fn() };
      (BoardView.findOne as jest.Mock).mockResolvedValue(view);
      (BoardView.count as jest.Mock).mockResolvedValue(1);

      const user = createAuthUser();
      await expect(
        BoardViewService.delete(1, 1, 1, user)
      ).rejects.toThrow('Cannot delete the last view of a board');

      expect(view.destroy).not.toHaveBeenCalled();
      expect(mockRollback).toHaveBeenCalled();
    });

    it('throws for non-existent view', async () => {
      (BoardView.findOne as jest.Mock).mockResolvedValue(null);

      const user = createAuthUser();
      await expect(
        BoardViewService.delete(999, 1, 1, user)
      ).rejects.toThrow('View not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });
});
