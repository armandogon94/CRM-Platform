import { Transaction } from 'sequelize';
import { sequelize, Column, ColumnValue, ActivityLog } from '../models';
import { AuthUser } from '../types';
import wsService from './WebSocketService';

const VALID_COLUMN_TYPES = [
  'status',
  'text',
  'long_text',
  'number',
  'date',
  'person',
  'email',
  'phone',
  'dropdown',
  'checkbox',
  'url',
  'files',
  'formula',
  'timeline',
  'rating',
] as const;

export default class ColumnService {
  /**
   * List columns in a board, ordered by position.
   */
  static async list(boardId: number): Promise<Column[]> {
    return Column.findAll({
      where: { boardId },
      order: [['position', 'ASC']],
    });
  }

  /**
   * Create a column. Validates that columnType is a valid enum value.
   */
  static async create(
    data: {
      name: string;
      columnType: string;
      config?: Record<string, unknown>;
      width?: number;
      isRequired?: boolean;
      position?: number;
    },
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<Column> {
    if (!VALID_COLUMN_TYPES.includes(data.columnType as any)) {
      throw new Error(
        `Invalid column type: ${data.columnType}. Valid types: ${VALID_COLUMN_TYPES.join(', ')}`
      );
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      let position = data.position;
      if (position === undefined) {
        const lastColumn = await Column.findOne({
          where: { boardId },
          order: [['position', 'DESC']],
          transaction,
        });
        position = lastColumn ? lastColumn.position + 1 : 0;
      }

      const column = await Column.create(
        {
          boardId,
          name: data.name,
          columnType: data.columnType as any,
          config: data.config || {},
          width: data.width || 150,
          isRequired: data.isRequired || false,
          position,
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'column',
          entityId: column.id,
          action: 'created',
          changes: { name: data.name, columnType: data.columnType, boardId },
        },
        { transaction }
      );

      await transaction.commit();
      wsService.emitToBoard(boardId, 'column:created', column);
      return column;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update column name, config, width, position.
   */
  static async update(
    id: number,
    boardId: number,
    data: {
      name?: string;
      config?: Record<string, unknown>;
      width?: number;
      position?: number;
    },
    workspaceId: number,
    user: AuthUser
  ): Promise<Column> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const column = await Column.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!column) {
        throw new Error('Column not found');
      }

      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) {
        changes.name = { from: column.name, to: data.name };
      }
      if (data.width !== undefined) {
        changes.width = { from: column.width, to: data.width };
      }
      if (data.position !== undefined) {
        changes.position = { from: column.position, to: data.position };
      }

      await column.update(data, { transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'column',
          entityId: id,
          action: 'updated',
          changes,
        },
        { transaction }
      );

      await transaction.commit();
      wsService.emitToBoard(boardId, 'column:updated', column);
      return column;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete column and all associated column_values.
   */
  static async delete(
    id: number,
    boardId: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const column = await Column.findOne({
        where: { id, boardId },
        transaction,
      });
      if (!column) {
        throw new Error('Column not found');
      }

      await ColumnValue.destroy({ where: { columnId: id }, transaction });
      await column.destroy({ transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'column',
          entityId: id,
          action: 'deleted',
          changes: {
            name: column.name,
            columnType: column.columnType,
            boardId,
          },
        },
        { transaction }
      );

      await transaction.commit();
      wsService.emitToBoard(boardId, 'column:deleted', { id, boardId });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Reorder columns by providing an ordered array of column IDs.
   */
  static async reorder(
    boardId: number,
    columnIds: number[],
    workspaceId: number,
    user: AuthUser
  ): Promise<Column[]> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < columnIds.length; i++) {
        await Column.update(
          { position: i },
          { where: { id: columnIds[i], boardId }, transaction }
        );
      }

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'column',
          entityId: boardId,
          action: 'reordered',
          changes: { columnIds },
        },
        { transaction }
      );

      await transaction.commit();

      const columns = await Column.findAll({
        where: { boardId },
        order: [['position', 'ASC']],
      });
      wsService.emitToBoard(boardId, 'columns:reordered', { boardId, columns });
      return columns;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
