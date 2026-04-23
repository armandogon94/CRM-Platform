/**
 * Unit tests for E2EResetService (Slice 19, Task A3).
 *
 * Verifies:
 *  - Scopes all deletes to the workspace flagged is_e2e_fixture=true
 *  - Deletes in leaves-first order so FK constraints hold
 *  - Returns null (no-op) when no fixture workspace exists
 *  - Wraps the whole flow in a transaction; rolls back on error
 *  - Invokes the caller-provided reseed() after destroys complete
 */

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => ({
  sequelize: {
    // Default implementation runs the callback with a mock transaction,
    // commits on success, rolls back on thrown error — matches Sequelize v6.
    transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      try {
        const result = await cb(mockTransaction);
        await mockCommit();
        return result;
      } catch (err) {
        await mockRollback();
        throw err;
      }
    }),
  },
  Workspace: { findOne: jest.fn() },
  Board: { findAll: jest.fn(), destroy: jest.fn() },
  BoardGroup: { destroy: jest.fn() },
  Column: { destroy: jest.fn() },
  Item: { findAll: jest.fn(), destroy: jest.fn() },
  ColumnValue: { destroy: jest.fn() },
  BoardView: { destroy: jest.fn() },
  Automation: { findAll: jest.fn(), destroy: jest.fn() },
  AutomationLog: { destroy: jest.fn() },
  ActivityLog: { destroy: jest.fn() },
  Notification: { destroy: jest.fn() },
  FileAttachment: { destroy: jest.fn() },
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import {
  Workspace, Board, BoardGroup, Column, Item, ColumnValue,
  BoardView, Automation, AutomationLog, ActivityLog, Notification, FileAttachment,
} from '../../models';
import { E2EResetService } from '../../services/E2EResetService';

describe('E2EResetService.reset', () => {
  let service: E2EResetService;

  beforeEach(() => {
    service = new E2EResetService();
    jest.clearAllMocks();
  });

  it('queries for the fixture workspace with isE2eFixture=true', async () => {
    (Workspace.findOne as jest.Mock).mockResolvedValue(null);

    await service.reset();

    expect(Workspace.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isE2eFixture: true },
        transaction: mockTransaction,
      })
    );
  });

  it('returns null and skips destroys when no fixture workspace exists', async () => {
    (Workspace.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.reset();

    expect(result).toBeNull();
    expect(Board.destroy).not.toHaveBeenCalled();
    expect(Item.destroy).not.toHaveBeenCalled();
    expect(ColumnValue.destroy).not.toHaveBeenCalled();
    // Commit still runs — a read-only transaction is still a transaction.
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockRollback).not.toHaveBeenCalled();
  });

  it('cascades destroys scoped to the fixture workspace ids', async () => {
    (Workspace.findOne as jest.Mock).mockResolvedValue({ id: 42 });
    (Board.findAll as jest.Mock).mockResolvedValue([{ id: 100 }, { id: 101 }]);
    (Item.findAll as jest.Mock).mockResolvedValue([{ id: 500 }, { id: 501 }]);
    (Automation.findAll as jest.Mock).mockResolvedValue([{ id: 9 }]);
    const reseed = jest.fn().mockResolvedValue(undefined);

    const result = await service.reset({ reseed });

    expect(result).toEqual({ workspaceId: 42 });

    // Scoped lookups
    expect(Board.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 42 } })
    );
    expect(Item.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] } })
    );
    expect(Automation.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] } })
    );

    // Leaves first
    expect(ColumnValue.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { itemId: [500, 501] }, force: true })
    );
    expect(AutomationLog.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { automationId: [9] }, force: true })
    );

    // Mid-level (board-scoped)
    expect(Item.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] }, force: true })
    );
    expect(BoardView.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] }, force: true })
    );
    expect(BoardGroup.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] }, force: true })
    );
    expect(Column.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] }, force: true })
    );
    expect(Automation.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { boardId: [100, 101] }, force: true })
    );

    // Workspace-scoped
    expect(Board.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 42 }, force: true })
    );
    expect(Notification.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 42 }, force: true })
    );
    expect(ActivityLog.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 42 }, force: true })
    );
    expect(FileAttachment.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: 42 }, force: true })
    );

    // Slice 19.6 fix: reseed now runs AFTER the transaction commits
    // (so the callback's findOrCreate reads wiped committed state).
    // The second arg is kept for backwards-compat with the original
    // signature but is passed as `undefined` since the tx is gone.
    expect(reseed).toHaveBeenCalledTimes(1);
    expect((reseed as jest.Mock).mock.calls[0][0]).toBe(42);
    expect(mockCommit).toHaveBeenCalledTimes(1);
    expect(mockRollback).not.toHaveBeenCalled();
  });

  it('enforces leaves-first delete order so FK constraints hold', async () => {
    (Workspace.findOne as jest.Mock).mockResolvedValue({ id: 1 });
    (Board.findAll as jest.Mock).mockResolvedValue([{ id: 10 }]);
    (Item.findAll as jest.Mock).mockResolvedValue([{ id: 100 }]);
    (Automation.findAll as jest.Mock).mockResolvedValue([{ id: 7 }]);

    const order: string[] = [];
    const tag = (name: string) => () => {
      order.push(name);
      return Promise.resolve();
    };
    (ColumnValue.destroy as jest.Mock).mockImplementation(tag('ColumnValue'));
    (AutomationLog.destroy as jest.Mock).mockImplementation(tag('AutomationLog'));
    (Item.destroy as jest.Mock).mockImplementation(tag('Item'));
    (BoardView.destroy as jest.Mock).mockImplementation(tag('BoardView'));
    (BoardGroup.destroy as jest.Mock).mockImplementation(tag('BoardGroup'));
    (Column.destroy as jest.Mock).mockImplementation(tag('Column'));
    (Automation.destroy as jest.Mock).mockImplementation(tag('Automation'));
    (Board.destroy as jest.Mock).mockImplementation(tag('Board'));

    await service.reset({ reseed: jest.fn().mockResolvedValue(undefined) });

    // ColumnValue and AutomationLog must come before Item and Automation
    expect(order.indexOf('ColumnValue')).toBeLessThan(order.indexOf('Item'));
    expect(order.indexOf('AutomationLog')).toBeLessThan(order.indexOf('Automation'));

    // Everything board-scoped must come before Board
    for (const name of ['Item', 'BoardView', 'BoardGroup', 'Column', 'Automation']) {
      expect(order.indexOf(name)).toBeLessThan(order.indexOf('Board'));
    }
  });

  it('rolls back and rethrows when any destroy fails', async () => {
    (Workspace.findOne as jest.Mock).mockResolvedValue({ id: 42 });
    (Board.findAll as jest.Mock).mockResolvedValue([{ id: 100 }]);
    (Item.findAll as jest.Mock).mockResolvedValue([{ id: 500 }]);
    (Automation.findAll as jest.Mock).mockResolvedValue([]);

    const boom = new Error('DB unreachable');
    (ColumnValue.destroy as jest.Mock).mockRejectedValue(boom);
    const reseed = jest.fn();

    await expect(service.reset({ reseed })).rejects.toThrow('DB unreachable');
    expect(mockRollback).toHaveBeenCalledTimes(1);
    expect(mockCommit).not.toHaveBeenCalled();
    expect(reseed).not.toHaveBeenCalled();
  });

  it('invokes reseed after destroys and before commit', async () => {
    (Workspace.findOne as jest.Mock).mockResolvedValue({ id: 42 });
    (Board.findAll as jest.Mock).mockResolvedValue([]);
    (Item.findAll as jest.Mock).mockResolvedValue([]);
    (Automation.findAll as jest.Mock).mockResolvedValue([]);

    const order: string[] = [];
    (Board.destroy as jest.Mock).mockImplementation(async () => { order.push('Board.destroy'); });
    const reseed = jest.fn().mockImplementation(async () => { order.push('reseed'); });
    mockCommit.mockImplementation(() => { order.push('commit'); });

    await service.reset({ reseed });

    // Slice 19.6 fix: Board.destroy fires inside the tx, then commit
    // runs, THEN reseed (so findOrCreate sees the wiped DB state).
    expect(order).toEqual(['Board.destroy', 'commit', 'reseed']);
  });
});
