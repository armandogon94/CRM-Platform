import { Transaction } from 'sequelize';
import { sequelize, Notification } from '../models';
import wsService from './WebSocketService';

interface CreateNotificationData {
  userId: number;
  workspaceId: number;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  linkUrl?: string;
}

interface ListOptions {
  page: number;
  limit: number;
  unreadOnly?: boolean;
}

export default class NotificationService {
  static async create(data: CreateNotificationData): Promise<Notification> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const notification = await Notification.create(
        {
          userId: data.userId,
          workspaceId: data.workspaceId,
          title: data.title,
          message: data.message ?? null,
          type: data.type ?? 'info',
          isRead: false,
          linkUrl: data.linkUrl ?? null,
        },
        { transaction }
      );

      await transaction.commit();
      wsService.emitToUser(data.userId, 'notification:created', notification);
      return notification;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async list(
    userId: number,
    workspaceId: number,
    options: ListOptions
  ): Promise<{ rows: Notification[]; count: number }> {
    const where: Record<string, unknown> = { userId, workspaceId };
    if (options.unreadOnly) {
      where.isRead = false;
    }

    return Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: options.limit,
      offset: (options.page - 1) * options.limit,
    });
  }

  static async markRead(id: number, userId: number): Promise<Notification> {
    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) {
      throw new Error('Notification not found');
    }
    await notification.update({ isRead: true });
    return notification;
  }

  static async markAllRead(userId: number, workspaceId: number): Promise<void> {
    await Notification.update(
      { isRead: true },
      { where: { userId, workspaceId, isRead: false } }
    );
  }

  static async getUnreadCount(userId: number, workspaceId: number): Promise<number> {
    return Notification.count({
      where: { userId, workspaceId, isRead: false },
    });
  }
}
