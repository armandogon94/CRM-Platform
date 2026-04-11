/**
 * Tests that BoardGroupService emits WebSocket events after CRUD operations.
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

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  BoardGroup: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Item: {
    update: jest.fn(),
    destroy: jest.fn(),
  },
  ActivityLog: {
    create: jest.fn(),
  },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import BoardGroupService from '../../services/BoardGroupService';
import { BoardGroup, Item, ActivityLog } from '../../models';

const mockUser = { id: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' as const, firstName: 'Test', lastName: 'User' };

describe('BoardGroupService WebSocket broadcasts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('emits group:created after create', async () => {
    const boardId = 10;
    const group = { id: 1, boardId, name: 'New Group', color: '#579BFC', position: 0 };

    (BoardGroup.findOne as jest.Mock).mockResolvedValue(null); // no existing groups
    (BoardGroup.create as jest.Mock).mockResolvedValue(group);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});

    await BoardGroupService.create({ name: 'New Group' }, boardId, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'group:created', group);
  });

  it('emits group:updated after update', async () => {
    const boardId = 10;
    const existingGroup = {
      id: 1, boardId, name: 'Old', color: '#579BFC', position: 0,
      update: jest.fn(),
    };

    (BoardGroup.findOne as jest.Mock).mockResolvedValue(existingGroup);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});

    await BoardGroupService.update(1, boardId, { name: 'Renamed' }, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'group:updated', existingGroup);
  });

  it('emits group:deleted after delete', async () => {
    const boardId = 10;
    const group = {
      id: 1, boardId, name: 'To Delete', color: '#579BFC',
      destroy: jest.fn(),
    };
    const otherGroup = { id: 2, boardId };

    (BoardGroup.findOne as jest.Mock)
      .mockResolvedValueOnce(group) // find group to delete
      .mockResolvedValueOnce(otherGroup); // find remaining group for item migration
    (Item.update as jest.Mock).mockResolvedValue([3]);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});

    await BoardGroupService.delete(1, boardId, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'group:deleted', { id: 1, boardId });
  });

  it('emits groups:reordered after reorder', async () => {
    const boardId = 10;
    const groupIds = [3, 1, 2];
    const reorderedGroups = [
      { id: 3, position: 0 },
      { id: 1, position: 1 },
      { id: 2, position: 2 },
    ];

    (BoardGroup.update as jest.Mock).mockResolvedValue([1]);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});
    (BoardGroup.findAll as jest.Mock).mockResolvedValue(reorderedGroups);

    await BoardGroupService.reorder(boardId, groupIds, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'groups:reordered', {
      boardId,
      groups: reorderedGroups,
    });
  });
});
