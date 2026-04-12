/**
 * Tests for NotificationService CRUD + WebSocket delivery.
 */

const mockEmitToUser = jest.fn();
jest.mock('../../services/WebSocketService', () => ({
  __esModule: true,
  default: { emitToUser: mockEmitToUser },
  wsService: { emitToUser: mockEmitToUser },
}));

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  Notification: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import NotificationService from '../../services/NotificationService';
import { Notification } from '../../models';

describe('NotificationService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('creates notification and emits WS event to user', async () => {
      const notif = {
        id: 1, userId: 5, workspaceId: 1,
        title: 'Item assigned', message: 'You were assigned to Task #42',
        type: 'info', isRead: false, linkUrl: '/boards/1/items/42',
      };
      (Notification.create as jest.Mock).mockResolvedValue(notif);

      const result = await NotificationService.create({
        userId: 5,
        workspaceId: 1,
        title: 'Item assigned',
        message: 'You were assigned to Task #42',
        linkUrl: '/boards/1/items/42',
      });

      expect(result).toEqual(notif);
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 5,
          workspaceId: 1,
          title: 'Item assigned',
          message: 'You were assigned to Task #42',
          linkUrl: '/boards/1/items/42',
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(mockEmitToUser).toHaveBeenCalledWith(5, 'notification:created', notif);
    });

    it('defaults type to info and isRead to false', async () => {
      const notif = { id: 2, userId: 3, workspaceId: 1, title: 'Test', type: 'info', isRead: false };
      (Notification.create as jest.Mock).mockResolvedValue(notif);

      await NotificationService.create({
        userId: 3,
        workspaceId: 1,
        title: 'Test',
      });

      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'info', isRead: false }),
        expect.any(Object)
      );
    });

    it('rolls back transaction on error', async () => {
      (Notification.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        NotificationService.create({ userId: 1, workspaceId: 1, title: 'Fail' })
      ).rejects.toThrow('DB error');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockEmitToUser).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('returns paginated notifications for user', async () => {
      const rows = [
        { id: 1, title: 'Notif A', isRead: false },
        { id: 2, title: 'Notif B', isRead: true },
      ];
      (Notification.findAndCountAll as jest.Mock).mockResolvedValue({ rows, count: 10 });

      const result = await NotificationService.list(5, 1, { page: 1, limit: 20 });

      expect(result.rows).toEqual(rows);
      expect(result.count).toBe(10);
      expect(Notification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 5, workspaceId: 1 },
          order: [['createdAt', 'DESC']],
          limit: 20,
          offset: 0,
        })
      );
    });

    it('filters to unread only when unreadOnly is true', async () => {
      (Notification.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      await NotificationService.list(5, 1, { page: 1, limit: 20, unreadOnly: true });

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 5, workspaceId: 1, isRead: false },
        })
      );
    });

    it('handles page 2 offset correctly', async () => {
      (Notification.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 30 });

      await NotificationService.list(5, 1, { page: 2, limit: 10 });

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 10,
          limit: 10,
        })
      );
    });
  });

  describe('markRead', () => {
    it('sets isRead to true on the notification', async () => {
      const notif = { id: 1, userId: 5, isRead: false, update: jest.fn() };
      (Notification.findOne as jest.Mock).mockResolvedValue(notif);

      await NotificationService.markRead(1, 5);

      expect(notif.update).toHaveBeenCalledWith({ isRead: true });
      expect(Notification.findOne).toHaveBeenCalledWith({
        where: { id: 1, userId: 5 },
      });
    });

    it('throws if notification not found', async () => {
      (Notification.findOne as jest.Mock).mockResolvedValue(null);

      await expect(NotificationService.markRead(999, 5)).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllRead', () => {
    it('updates all unread notifications for user in workspace', async () => {
      (Notification.update as jest.Mock).mockResolvedValue([5]);

      await NotificationService.markAllRead(5, 1);

      expect(Notification.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { userId: 5, workspaceId: 1, isRead: false } }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      (Notification.count as jest.Mock).mockResolvedValue(7);

      const count = await NotificationService.getUnreadCount(5, 1);

      expect(count).toBe(7);
      expect(Notification.count).toHaveBeenCalledWith({
        where: { userId: 5, workspaceId: 1, isRead: false },
      });
    });
  });
});
