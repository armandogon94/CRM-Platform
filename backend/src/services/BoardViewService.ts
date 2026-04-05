import { Transaction } from 'sequelize';
import { sequelize, BoardView, ActivityLog } from '../models';
import { AuthUser } from '../types';

export default class BoardViewService {
  /**
   * List views for a board.
   */
  static async list(boardId: number): Promise<BoardView[]> {
    return BoardView.findAll({
      where: { boardId },
      order: [['createdAt', 'ASC']],
    });
  }

  /**
   * Get a view with settings.
   */
  static async getById(
    id: number,
    boardId: number
  ): Promise<BoardView | null> {
    return BoardView.findOne({
      where: { id, boardId },
    });
  }

  /**
   * Create a view.
   */
  static async create(
    data: {
      name: string;
      viewType: string;
      settings?: Record<string, unknown>;
      layoutJson?: Record<string, unknown>;
      isDefault?: boolean;
    },
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<BoardView> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // If this view is marked as default, unset other defaults
      if (data.isDefault) {
        await BoardView.update(
          { isDefault: false },
          { where: { boardId, isDefault: true }, transaction }
        );
      }

      const view = await BoardView.create(
        {
          boardId,
          name: data.name,
          viewType: data.viewType as any,
          settings: data.settings || {},
          layoutJson: data.layoutJson || null,
          isDefault: data.isDefault || false,
          createdBy: user.id,
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_view',
          entityId: view.id,
          action: 'created',
          changes: {
            name: data.name,
            viewType: data.viewType,
            boardId,
          },
        },
        { transaction }
      );

      await transaction.commit();
      return view;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update view settings, layout.
   */
  static async update(
    id: number,
    boardId: number,
    data: {
      name?: string;
      settings?: Record<string, unknown>;
      layoutJson?: Record<string, unknown>;
      isDefault?: boolean;
    },
    workspaceId: number,
    user: AuthUser
  ): Promise<BoardView> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const view = await BoardView.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!view) {
        throw new Error('View not found');
      }

      // If setting this view as default, unset other defaults
      if (data.isDefault) {
        await BoardView.update(
          { isDefault: false },
          { where: { boardId, isDefault: true }, transaction }
        );
      }

      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) {
        changes.name = { from: view.name, to: data.name };
      }
      if (data.isDefault !== undefined) {
        changes.isDefault = { from: view.isDefault, to: data.isDefault };
      }

      await view.update(data, { transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_view',
          entityId: id,
          action: 'updated',
          changes,
        },
        { transaction }
      );

      await transaction.commit();
      return view;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete view (can't delete the last view).
   */
  static async delete(
    id: number,
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const view = await BoardView.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!view) {
        throw new Error('View not found');
      }

      // Check if this is the last view
      const viewCount = await BoardView.count({
        where: { boardId },
        transaction,
      });
      if (viewCount <= 1) {
        throw new Error('Cannot delete the last view of a board');
      }

      await view.destroy({ transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_view',
          entityId: id,
          action: 'deleted',
          changes: { name: view.name, viewType: view.viewType, boardId },
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
