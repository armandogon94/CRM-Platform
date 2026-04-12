/**
 * Unit tests for ActionExecutor — strategy pattern for automation actions.
 */

const mockNotificationCreate = jest.fn();
const mockColumnValueUpdate = jest.fn();
const mockItemCreate = jest.fn();
const mockItemFindByPk = jest.fn();
const mockActivityLogCreate = jest.fn();
const mockColumnValueFindOne = jest.fn();

jest.mock('../../models', () => ({
  Notification: { create: (...a: any[]) => mockNotificationCreate(...a) },
  ColumnValue: { findOne: (...a: any[]) => mockColumnValueFindOne(...a), upsert: (...a: any[]) => mockColumnValueUpdate(...a) },
  Item: { create: (...a: any[]) => mockItemCreate(...a), findByPk: (...a: any[]) => mockItemFindByPk(...a) },
  ActivityLog: { create: (...a: any[]) => mockActivityLogCreate(...a) },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import { execute, ActionResult } from '../../services/ActionExecutor';

describe('ActionExecutor', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send_notification', () => {
    it('creates a notification record', async () => {
      mockNotificationCreate.mockResolvedValue({ id: 1, title: 'Item completed' });

      const result = await execute('send_notification', {
        userId: 5,
        workspaceId: 1,
        title: 'Item completed',
        message: 'Your item was marked as done',
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockNotificationCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 5, title: 'Item completed' })
      );
    });
  });

  describe('set_column_value', () => {
    it('upserts column value for the item', async () => {
      mockColumnValueUpdate.mockResolvedValue([{ id: 1, value: 'Done' }]);

      const result = await execute('set_column_value', {
        columnId: 5,
        value: 'Done',
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockColumnValueUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: 1, columnId: 5, value: 'Done' })
      );
    });
  });

  describe('update_status', () => {
    it('upserts status column value', async () => {
      mockColumnValueUpdate.mockResolvedValue([{ id: 1, value: { label: 'Done', color: '#00C875' } }]);

      const result = await execute('update_status', {
        columnId: 3,
        status: { label: 'Done', color: '#00C875' },
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockColumnValueUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: 1, columnId: 3, value: { label: 'Done', color: '#00C875' } })
      );
    });
  });

  describe('create_activity', () => {
    it('creates an activity log entry', async () => {
      mockActivityLogCreate.mockResolvedValue({ id: 1 });

      const result = await execute('create_activity', {
        workspaceId: 1,
        userId: 5,
        message: 'Automation triggered',
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockActivityLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          entityType: 'automation',
        })
      );
    });
  });

  describe('increment_number', () => {
    it('increments existing number column value by specified amount', async () => {
      mockColumnValueFindOne.mockResolvedValue({ value: 5 });
      mockColumnValueUpdate.mockResolvedValue([{ id: 1, value: 6 }]);

      const result = await execute('increment_number', {
        columnId: 7,
        amount: 1,
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockColumnValueUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ itemId: 1, columnId: 7, value: 6 })
      );
    });

    it('starts from 0 when no existing value', async () => {
      mockColumnValueFindOne.mockResolvedValue(null);
      mockColumnValueUpdate.mockResolvedValue([{ id: 1, value: 5 }]);

      const result = await execute('increment_number', {
        columnId: 7,
        amount: 5,
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockColumnValueUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ value: 5 })
      );
    });
  });

  describe('create_subitem', () => {
    it('creates a new item linked to same board and group', async () => {
      mockItemFindByPk.mockResolvedValue({ id: 1, boardId: 10, groupId: 2 });
      mockItemCreate.mockResolvedValue({ id: 50, name: 'Follow-up', boardId: 10, groupId: 2 });

      const result = await execute('create_subitem', {
        name: 'Follow-up',
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(mockItemCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Follow-up', boardId: 10, groupId: 2 })
      );
    });
  });

  describe('send_email', () => {
    it('returns success as a placeholder (logs in dev)', async () => {
      const result = await execute('send_email', {
        to: 'user@example.com',
        subject: 'Update',
        body: 'Your item was updated',
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('placeholder', true);
    });
  });

  describe('send_slack_message', () => {
    it('returns success as a placeholder (logs in dev)', async () => {
      const result = await execute('send_slack_message', {
        channel: '#general',
        message: 'Item completed',
      }, { boardId: 10, itemId: 1 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('placeholder', true);
    });
  });

  describe('unknown action', () => {
    it('returns failure for unknown action type', async () => {
      const result = await execute('unknown_action' as any, {}, { boardId: 10 });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action type');
    });
  });
});
