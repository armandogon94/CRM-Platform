import { Op, Transaction, WhereOptions } from 'sequelize';
import {
  sequelize,
  Item,
  ColumnValue,
  Column,
  BoardGroup,
  ActivityLog,
} from '../models';
import { AuthUser } from '../types';
import wsService from './WebSocketService';

interface ItemFilters {
  groupId?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export default class ItemService {
  /**
   * List items with pagination, filters, and column_values joined with
   * column_definitions.
   */
  static async list(
    boardId: number,
    filters: ItemFilters
  ): Promise<{ items: Item[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;
    const sortBy = filters.sortBy || 'position';
    const sortOrder = filters.sortOrder || 'ASC';

    const where: WhereOptions<any> = { boardId };
    if (filters.groupId) {
      (where as any).groupId = filters.groupId;
    }
    if (filters.search) {
      (where as any).name = { [Op.iLike]: `%${filters.search}%` };
    }

    const { count, rows } = await Item.findAndCountAll({
      where,
      include: [
        {
          model: ColumnValue,
          as: 'columnValues',
          include: [
            {
              model: Column,
              as: 'column',
              attributes: ['id', 'name', 'columnType', 'config'],
            },
          ],
        },
        {
          model: BoardGroup,
          as: 'group',
          attributes: ['id', 'name', 'color'],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    return { items: rows, total: count };
  }

  /**
   * Get single item with all column_values.
   */
  static async getById(id: number, boardId: number): Promise<Item | null> {
    return Item.findOne({
      where: { id, boardId },
      include: [
        {
          model: ColumnValue,
          as: 'columnValues',
          include: [
            {
              model: Column,
              as: 'column',
              attributes: ['id', 'name', 'columnType', 'config'],
            },
          ],
        },
        {
          model: BoardGroup,
          as: 'group',
          attributes: ['id', 'name', 'color'],
        },
      ],
    });
  }

  /**
   * Create item with optional column values.
   */
  static async create(
    data: {
      name: string;
      groupId?: number;
      columnValues?: Array<{ columnId: number; value: any }>;
    },
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<Item> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      // Determine groupId: use provided or find the first group of the board
      let groupId = data.groupId;
      if (!groupId) {
        const firstGroup = await BoardGroup.findOne({
          where: { boardId },
          order: [['position', 'ASC']],
          transaction,
        });
        if (!firstGroup) {
          throw new Error('Board has no groups. Create a group first.');
        }
        groupId = firstGroup.id;
      }

      // Determine position: place at the end
      const lastItem = await Item.findOne({
        where: { boardId, groupId },
        order: [['position', 'DESC']],
        transaction,
      });
      const position = lastItem ? lastItem.position + 1 : 0;

      const item = await Item.create(
        {
          boardId,
          groupId,
          name: data.name,
          position,
          createdBy: user.id,
        },
        { transaction }
      );

      // Create column values if provided
      if (data.columnValues && data.columnValues.length > 0) {
        const columnValueRecords = data.columnValues.map((cv) => ({
          itemId: item.id,
          columnId: cv.columnId,
          value: cv.value,
        }));
        await ColumnValue.bulkCreate(columnValueRecords, { transaction });
      }

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'item',
          entityId: item.id,
          action: 'created',
          changes: { name: data.name, boardId, groupId },
        },
        { transaction }
      );

      await transaction.commit();

      const fullItem = (await ItemService.getById(item.id, boardId))!;
      wsService.emitToBoard(boardId, 'item:created', fullItem);
      return fullItem;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update item name, position, groupId.
   */
  static async update(
    id: number,
    boardId: number,
    data: { name?: string; position?: number; groupId?: number },
    workspaceId: number,
    user: AuthUser
  ): Promise<Item> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const item = await Item.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!item) {
        throw new Error('Item not found');
      }

      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) {
        changes.name = { from: item.name, to: data.name };
      }
      if (data.position !== undefined) {
        changes.position = { from: item.position, to: data.position };
      }
      if (data.groupId !== undefined) {
        changes.groupId = { from: item.groupId, to: data.groupId };
      }

      await item.update(data, { transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'item',
          entityId: id,
          action: 'updated',
          changes,
        },
        { transaction }
      );

      await transaction.commit();

      const fullItem = (await ItemService.getById(id, boardId))!;
      wsService.emitToBoard(boardId, 'item:updated', fullItem);
      return fullItem;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Soft delete item and its column_values.
   */
  static async delete(
    id: number,
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const item = await Item.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!item) {
        throw new Error('Item not found');
      }

      await ColumnValue.destroy({ where: { itemId: id }, transaction });
      await item.destroy({ transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'item',
          entityId: id,
          action: 'deleted',
          changes: { name: item.name, boardId },
        },
        { transaction }
      );

      await transaction.commit();
      wsService.emitToBoard(boardId, 'item:deleted', { id, boardId });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Move item to a different group.
   */
  static async move(
    id: number,
    boardId: number,
    groupId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<Item> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const item = await Item.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!item) {
        throw new Error('Item not found');
      }

      const targetGroup = await BoardGroup.findOne({
        where: { id: groupId, boardId },
        transaction,
      });
      if (!targetGroup) {
        throw new Error('Target group not found');
      }

      const previousGroupId = item.groupId;

      // Place at the end of the target group
      const lastItem = await Item.findOne({
        where: { boardId, groupId },
        order: [['position', 'DESC']],
        transaction,
      });
      const position = lastItem ? lastItem.position + 1 : 0;

      await item.update({ groupId, position }, { transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'item',
          entityId: id,
          action: 'moved',
          changes: { groupId: { from: previousGroupId, to: groupId } },
        },
        { transaction }
      );

      await transaction.commit();

      const fullItem = (await ItemService.getById(id, boardId))!;
      wsService.emitToBoard(boardId, 'item:updated', fullItem);
      return fullItem;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reorder items by providing an ordered array of item IDs.
   */
  static async reorder(
    boardId: number,
    itemIds: number[],
    workspaceId: number,
    user: AuthUser
  ): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < itemIds.length; i++) {
        await Item.update(
          { position: i },
          { where: { id: itemIds[i], boardId }, transaction }
        );
      }

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'item',
          entityId: boardId,
          action: 'reordered',
          changes: { itemIds },
        },
        { transaction }
      );

      await transaction.commit();
      wsService.emitToBoard(boardId, 'items:reordered', { boardId, itemIds });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
