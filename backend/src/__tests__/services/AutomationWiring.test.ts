/**
 * Tests that CRUD services trigger automation evaluation.
 */

const mockEmitToBoard = jest.fn();
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToBoard: mockEmitToBoard },
  wsService: { emitToBoard: mockEmitToBoard },
}));

const mockEvaluate = jest.fn();
jest.mock('../../services/AutomationEngine', () => ({
  AutomationEngine: { evaluate: (...a: any[]) => mockEvaluate(...a) },
}));

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => ({
  sequelize: { transaction: jest.fn().mockResolvedValue(mockTransaction) },
  Item: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ColumnValue: {
    bulkCreate: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  Column: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  BoardGroup: {
    findOne: jest.fn(),
  },
  ActivityLog: {
    create: jest.fn(),
  },
}));

jest.mock('../../eav', () => ({
  getHandler: jest.fn().mockReturnValue({
    validate: () => ({ valid: true }),
    serialize: (v: any) => v,
  }),
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import ItemService from '../../services/ItemService';
import ColumnValueService from '../../services/ColumnValueService';
import { Item, ColumnValue, Column, BoardGroup, ActivityLog } from '../../models';

const mockUser = { id: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' as const, firstName: 'Test', lastName: 'User' };

describe('Automation wiring', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('ItemService.create triggers on_item_created', () => {
    it('calls AutomationEngine.evaluate after commit', async () => {
      const item = { id: 1, boardId: 10, groupId: 2, name: 'Test', position: 0 };
      (BoardGroup.findOne as jest.Mock).mockResolvedValue({ id: 2 });
      (Item.findOne as jest.Mock).mockResolvedValue(null); // no existing items
      (Item.create as jest.Mock).mockResolvedValue(item);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});
      // Mock getById (internal)
      jest.spyOn(ItemService, 'getById').mockResolvedValue(item as any);
      mockEvaluate.mockResolvedValue(undefined);

      await ItemService.create({ name: 'Test' }, 10, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEvaluate).toHaveBeenCalledWith(
        'on_item_created',
        expect.objectContaining({ boardId: 10, item: expect.objectContaining({ id: 1 }) })
      );
    });
  });

  describe('ItemService.update triggers on_item_updated', () => {
    it('calls AutomationEngine.evaluate after commit', async () => {
      const existingItem = {
        id: 1, boardId: 10, groupId: 2, name: 'Old', position: 0,
        update: jest.fn(),
      };
      (Item.findOne as jest.Mock).mockResolvedValue(existingItem);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});
      jest.spyOn(ItemService, 'getById').mockResolvedValue({ ...existingItem, name: 'New' } as any);
      mockEvaluate.mockResolvedValue(undefined);

      await ItemService.update(1, 10, { name: 'New' }, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEvaluate).toHaveBeenCalledWith(
        'on_item_updated',
        expect.objectContaining({ boardId: 10, changes: expect.objectContaining({ name: expect.any(Object) }) })
      );
    });
  });

  describe('ColumnValueService.upsert triggers on_status_changed for status columns', () => {
    it('calls AutomationEngine.evaluate when status column changes', async () => {
      const existing = { id: 1, itemId: 5, columnId: 3, value: { label: 'Working' }, update: jest.fn() };
      const column = { id: 3, name: 'Status', columnType: 'status', config: {} };
      const item = { id: 5, boardId: 10 };

      (ColumnValue.findOne as jest.Mock).mockResolvedValue(existing);
      (ActivityLog.create as jest.Mock).mockResolvedValue({});
      (ColumnValue.findByPk as jest.Mock).mockResolvedValue({ ...existing, value: { label: 'Done' }, column });
      (Column.findByPk as jest.Mock).mockResolvedValue(column);
      (Item.findByPk as jest.Mock).mockResolvedValue(item);
      mockEvaluate.mockResolvedValue(undefined);

      await ColumnValueService.upsert(5, 3, { label: 'Done' }, 1, mockUser);

      expect(mockCommit).toHaveBeenCalled();
      expect(mockEvaluate).toHaveBeenCalledWith(
        'on_status_changed',
        expect.objectContaining({
          boardId: 10,
          itemId: 5,
          columnId: 3,
          oldValue: { label: 'Working' },
          newValue: { label: 'Done' },
        })
      );
    });
  });
});
