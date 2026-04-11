/**
 * Tests that ColumnService emits WebSocket events after CRUD operations.
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
  Column: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  ColumnValue: {
    destroy: jest.fn(),
  },
  ActivityLog: {
    create: jest.fn(),
  },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import ColumnService from '../../services/ColumnService';
import { Column, ColumnValue, ActivityLog } from '../../models';

const mockUser = { id: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' as const, firstName: 'Test', lastName: 'User' };

describe('ColumnService WebSocket broadcasts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('emits column:created after create', async () => {
    const boardId = 10;
    const column = { id: 1, boardId, name: 'Status', columnType: 'status', config: {}, position: 0, width: 150, isRequired: false };

    (Column.findOne as jest.Mock).mockResolvedValue(null); // no existing columns
    (Column.create as jest.Mock).mockResolvedValue(column);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});

    await ColumnService.create({ name: 'Status', columnType: 'status' }, boardId, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'column:created', column);
  });

  it('emits column:updated after update', async () => {
    const boardId = 10;
    const existingColumn = {
      id: 1, boardId, name: 'Old', columnType: 'text', width: 150, position: 0,
      update: jest.fn(),
    };

    (Column.findOne as jest.Mock).mockResolvedValue(existingColumn);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});

    await ColumnService.update(1, boardId, { name: 'Renamed' }, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'column:updated', existingColumn);
  });

  it('emits column:deleted after delete', async () => {
    const boardId = 10;
    const column = {
      id: 1, boardId, name: 'To Delete', columnType: 'text',
      destroy: jest.fn(),
    };

    (Column.findOne as jest.Mock).mockResolvedValue(column);
    (ColumnValue.destroy as jest.Mock).mockResolvedValue(5);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});

    await ColumnService.delete(1, boardId, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'column:deleted', { id: 1, boardId });
  });

  it('emits columns:reordered after reorder', async () => {
    const boardId = 10;
    const columnIds = [3, 1, 2];
    const reorderedColumns = [
      { id: 3, position: 0 },
      { id: 1, position: 1 },
      { id: 2, position: 2 },
    ];

    (Column.update as jest.Mock).mockResolvedValue([1]);
    (ActivityLog.create as jest.Mock).mockResolvedValue({});
    (Column.findAll as jest.Mock).mockResolvedValue(reorderedColumns);

    await ColumnService.reorder(boardId, columnIds, 1, mockUser);

    expect(mockCommit).toHaveBeenCalled();
    expect(mockEmitToBoard).toHaveBeenCalledWith(boardId, 'columns:reordered', {
      boardId,
      columns: reorderedColumns,
    });
  });
});
