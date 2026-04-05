import { Transaction } from 'sequelize';
import { sequelize, BoardGroup, Item, ActivityLog } from '../models';
import { AuthUser } from '../types';

export default class BoardGroupService {
  /**
   * List groups in a board, ordered by position.
   */
  static async list(boardId: number): Promise<BoardGroup[]> {
    return BoardGroup.findAll({
      where: { boardId },
      order: [['position', 'ASC']],
    });
  }

  /**
   * Create a group in a board.
   */
  static async create(
    data: { name: string; color?: string; position?: number },
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<BoardGroup> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      let position = data.position;
      if (position === undefined) {
        const lastGroup = await BoardGroup.findOne({
          where: { boardId },
          order: [['position', 'DESC']],
          transaction,
        });
        position = lastGroup ? lastGroup.position + 1 : 0;
      }

      const group = await BoardGroup.create(
        {
          boardId,
          name: data.name,
          color: data.color || '#579BFC',
          position,
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_group',
          entityId: group.id,
          action: 'created',
          changes: { name: data.name, boardId },
        },
        { transaction }
      );

      await transaction.commit();
      return group;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update group name, color, position.
   */
  static async update(
    id: number,
    boardId: number,
    data: { name?: string; color?: string; position?: number },
    workspaceId: number,
    user: AuthUser
  ): Promise<BoardGroup> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const group = await BoardGroup.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!group) {
        throw new Error('Group not found');
      }

      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) {
        changes.name = { from: group.name, to: data.name };
      }
      if (data.color !== undefined) {
        changes.color = { from: group.color, to: data.color };
      }
      if (data.position !== undefined) {
        changes.position = { from: group.position, to: data.position };
      }

      await group.update(data, { transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_group',
          entityId: id,
          action: 'updated',
          changes,
        },
        { transaction }
      );

      await transaction.commit();
      return group;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete group. Move items to first remaining group, or delete if none remain.
   */
  static async delete(
    id: number,
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const group = await BoardGroup.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!group) {
        throw new Error('Group not found');
      }

      // Find the first remaining group to move items to
      const remainingGroup = await BoardGroup.findOne({
        where: { boardId },
        order: [['position', 'ASC']],
        transaction,
      });

      if (remainingGroup && remainingGroup.id !== id) {
        await Item.update(
          { groupId: remainingGroup.id },
          { where: { groupId: id }, transaction }
        );
      } else {
        await Item.destroy({ where: { groupId: id }, transaction });
      }

      await group.destroy({ transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_group',
          entityId: id,
          action: 'deleted',
          changes: { name: group.name, boardId },
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reorder groups by providing an ordered array of group IDs.
   */
  static async reorder(
    boardId: number,
    groupIds: number[],
    workspaceId: number,
    user: AuthUser
  ): Promise<BoardGroup[]> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < groupIds.length; i++) {
        await BoardGroup.update(
          { position: i },
          { where: { id: groupIds[i], boardId }, transaction }
        );
      }

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board_group',
          entityId: boardId,
          action: 'reordered',
          changes: { groupIds },
        },
        { transaction }
      );

      await transaction.commit();

      return BoardGroup.findAll({
        where: { boardId },
        order: [['position', 'ASC']],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
