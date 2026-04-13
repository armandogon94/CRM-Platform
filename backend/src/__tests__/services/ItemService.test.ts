/**
 * Tests for ItemService core CRUD operations.
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
  Item: {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ColumnValue: { bulkCreate: jest.fn(), destroy: jest.fn(), findAll: jest.fn() },
  Column: {},
  BoardGroup: { findOne: jest.fn() },
  ActivityLog: { create: jest.fn() },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import ItemService from '../../services/ItemService';
import { Item, ColumnValue, BoardGroup, ActivityLog } from '../../models';
import { AutomationEngine } from '../../services/AutomationEngine';

const mockUser = { id: 1, email: 'admin@crm-platform.com', workspaceId: 1 } as any;
const boardId = 1;
const workspaceId = 1;

describe('ItemService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getById', () => {
    it('returns item with column values and group', async () => {
      const item = {
        id: 1,
        name: 'Task A',
        boardId,
        groupId: 1,
        columnValues: [{ id: 1, columnId: 1, value: 'Active' }],
        group: { id: 1, name: 'In Progress', color: '#FF0000' },
      };
      (Item.findOne as jest.Mock).mockResolvedValue(item);

      const result = await ItemService.getById(1, boardId);

      expect(result).toEqual(item);
      expect(Item.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, boardId },
        })
      );
    });

    it('returns null for non-existent item', async () => {
      (Item.findOne as jest.Mock).mockResolvedValue(null);

      const result = await ItemService.getById(999, boardId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates item at end of group', async () => {
      const lastItem = { position: 4 };
      const createdItem = { id: 10, name: 'New Task', boardId, groupId: 1 };
      const fullItem = {
        id: 10,
        name: 'New Task',
        boardId,
        groupId: 1,
        columnValues: [],
        group: { id: 1, name: 'Group A', color: '#579BFC' },
      };

      // findOne calls: 1) lastItem position lookup, 2) getById reload after commit
      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(lastItem)
        .mockResolvedValueOnce(fullItem);
      (Item.create as jest.Mock).mockResolvedValue(createdItem);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await ItemService.create(
        { name: 'New Task', groupId: 1 },
        boardId,
        workspaceId,
        mockUser
      );

      expect(result).toEqual(fullItem);
      expect(Item.create).toHaveBeenCalledWith(
        expect.objectContaining({
          boardId,
          groupId: 1,
          name: 'New Task',
          position: 5,
          createdBy: mockUser.id,
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'item:created', fullItem);
      expect(AutomationEngine.evaluate).toHaveBeenCalledWith(
        'on_item_created',
        expect.objectContaining({ boardId, item: fullItem })
      );
    });

    it('uses first group when groupId not provided', async () => {
      const firstGroup = { id: 5 };
      const createdItem = { id: 11, name: 'Auto Group', boardId, groupId: 5 };
      const fullItem = { id: 11, name: 'Auto Group', boardId, groupId: 5, columnValues: [], group: { id: 5 } };

      (BoardGroup.findOne as jest.Mock).mockResolvedValue(firstGroup);
      // findOne calls: 1) lastItem (null = first in group), 2) getById reload
      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fullItem);
      (Item.create as jest.Mock).mockResolvedValue(createdItem);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await ItemService.create(
        { name: 'Auto Group' },
        boardId,
        workspaceId,
        mockUser
      );

      expect(result).toEqual(fullItem);
      expect(BoardGroup.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { boardId },
          order: [['position', 'ASC']],
        })
      );
      expect(Item.create).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: 5, position: 0 }),
        { transaction: mockTransaction }
      );
    });

    it('throws when board has no groups', async () => {
      (BoardGroup.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        ItemService.create({ name: 'No Group' }, boardId, workspaceId, mockUser)
      ).rejects.toThrow('Board has no groups. Create a group first.');

      expect(mockRollback).toHaveBeenCalled();
    });

    it('creates with column values', async () => {
      const createdItem = { id: 12, name: 'With Values', boardId, groupId: 1 };
      const fullItem = {
        id: 12,
        name: 'With Values',
        boardId,
        groupId: 1,
        columnValues: [{ columnId: 1, value: 'Active' }],
        group: { id: 1 },
      };

      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(null) // no lastItem
        .mockResolvedValueOnce(fullItem); // getById reload
      (Item.create as jest.Mock).mockResolvedValue(createdItem);
      (ColumnValue.bulkCreate as jest.Mock).mockResolvedValue([{ id: 1 }]);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await ItemService.create(
        {
          name: 'With Values',
          groupId: 1,
          columnValues: [{ columnId: 1, value: 'Active' }],
        },
        boardId,
        workspaceId,
        mockUser
      );

      expect(result).toEqual(fullItem);
      expect(ColumnValue.bulkCreate).toHaveBeenCalledWith(
        [{ itemId: 12, columnId: 1, value: 'Active' }],
        { transaction: mockTransaction }
      );
    });

    it('rolls back on error', async () => {
      (Item.findOne as jest.Mock).mockResolvedValueOnce(null);
      (Item.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        ItemService.create({ name: 'Fail', groupId: 1 }, boardId, workspaceId, mockUser)
      ).rejects.toThrow('DB error');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockEmitToBoard).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates item name', async () => {
      const item = {
        id: 1,
        name: 'Old Name',
        position: 0,
        groupId: 1,
        update: jest.fn(),
      };
      const fullItem = { id: 1, name: 'New Name', boardId, columnValues: [], group: { id: 1 } };

      // findOne calls: 1) find item for update, 2) getById reload
      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(fullItem);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await ItemService.update(
        1,
        boardId,
        { name: 'New Name' },
        workspaceId,
        mockUser
      );

      expect(result).toEqual(fullItem);
      expect(item.update).toHaveBeenCalledWith(
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
      expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'item:updated', fullItem);
      expect(AutomationEngine.evaluate).toHaveBeenCalledWith(
        'on_item_updated',
        expect.objectContaining({ boardId, item: fullItem })
      );
    });

    it('throws for non-existent item', async () => {
      (Item.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        ItemService.update(999, boardId, { name: 'X' }, workspaceId, mockUser)
      ).rejects.toThrow('Item not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('destroys column values and item', async () => {
      const item = { id: 1, name: 'To Delete', destroy: jest.fn() };

      (Item.findOne as jest.Mock).mockResolvedValue(item);
      (ColumnValue.destroy as jest.Mock).mockResolvedValue(3);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      await ItemService.delete(1, boardId, workspaceId, mockUser);

      expect(ColumnValue.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { itemId: 1 },
          transaction: mockTransaction,
        })
      );
      expect(item.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'deleted',
          changes: { name: 'To Delete', boardId },
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'item:deleted', { id: 1, boardId });
    });

    it('throws for non-existent item', async () => {
      (Item.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        ItemService.delete(999, boardId, workspaceId, mockUser)
      ).rejects.toThrow('Item not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('moves item to different group', async () => {
      const item = {
        id: 1,
        name: 'Move Me',
        groupId: 1,
        update: jest.fn(),
      };
      const targetGroup = { id: 2, boardId };
      const lastItem = { position: 3 };
      const fullItem = { id: 1, name: 'Move Me', boardId, groupId: 2, columnValues: [], group: { id: 2 } };

      // findOne calls: 1) find item, 2) find target group,
      // 3) find lastItem in target group, 4) getById reload
      (Item.findOne as jest.Mock)
        .mockResolvedValueOnce(item)
        .mockResolvedValueOnce(lastItem)
        .mockResolvedValueOnce(fullItem);
      (BoardGroup.findOne as jest.Mock).mockResolvedValue(targetGroup);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await ItemService.move(1, boardId, 2, workspaceId, mockUser);

      expect(result).toEqual(fullItem);
      expect(item.update).toHaveBeenCalledWith(
        { groupId: 2, position: 4 },
        { transaction: mockTransaction }
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'moved',
          changes: { groupId: { from: 1, to: 2 } },
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'item:updated', fullItem);
    });

    it('throws for non-existent target group', async () => {
      const item = { id: 1, name: 'Move Me', groupId: 1 };

      (Item.findOne as jest.Mock).mockResolvedValue(item);
      (BoardGroup.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        ItemService.move(1, boardId, 999, workspaceId, mockUser)
      ).rejects.toThrow('Target group not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    it('updates positions for all items', async () => {
      const itemIds = [3, 1, 2];
      (Item.update as jest.Mock).mockResolvedValue([1]);
      (ActivityLog.create as jest.Mock).mockResolvedValue({ id: 1 });

      await ItemService.reorder(boardId, itemIds, workspaceId, mockUser);

      expect(Item.update).toHaveBeenCalledTimes(3);
      expect(Item.update).toHaveBeenCalledWith(
        { position: 0 },
        { where: { id: 3, boardId }, transaction: mockTransaction }
      );
      expect(Item.update).toHaveBeenCalledWith(
        { position: 1 },
        { where: { id: 1, boardId }, transaction: mockTransaction }
      );
      expect(Item.update).toHaveBeenCalledWith(
        { position: 2 },
        { where: { id: 2, boardId }, transaction: mockTransaction }
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reordered',
          changes: { itemIds },
        }),
        { transaction: mockTransaction }
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'items:reordered', { boardId, itemIds });
    });
  });
});
