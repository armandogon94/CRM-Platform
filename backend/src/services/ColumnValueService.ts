import { Transaction } from 'sequelize';
import { sequelize, ColumnValue, Column, Item, ActivityLog } from '../models';
import { AuthUser } from '../types';
import { getHandler, AggregateResult } from '../eav';

export default class ColumnValueService {
  /**
   * Get all column values for an item.
   */
  static async listByItem(itemId: number): Promise<ColumnValue[]> {
    return ColumnValue.findAll({
      where: { itemId },
      include: [
        {
          model: Column,
          as: 'column',
          attributes: ['id', 'name', 'columnType', 'config'],
        },
      ],
    });
  }

  /**
   * Upsert a single column value (create if doesn't exist, update if exists).
   */
  static async upsert(
    itemId: number,
    columnId: number,
    value: any,
    workspaceId: number,
    user: AuthUser
  ): Promise<ColumnValue> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const existing = await ColumnValue.findOne({
        where: { itemId, columnId },
        transaction,
      });

      let columnValue: ColumnValue;
      let action: string;

      if (existing) {
        const previousValue = existing.value;
        await existing.update({ value }, { transaction });
        columnValue = existing;
        action = 'updated';

        await ActivityLog.create(
          {
            workspaceId,
            userId: user.id,
            entityType: 'column_value',
            entityId: existing.id,
            action: 'updated',
            changes: {
              columnId,
              itemId,
              value: { from: previousValue, to: value },
            },
          },
          { transaction }
        );
      } else {
        columnValue = await ColumnValue.create(
          { itemId, columnId, value },
          { transaction }
        );
        action = 'created';

        await ActivityLog.create(
          {
            workspaceId,
            userId: user.id,
            entityType: 'column_value',
            entityId: columnValue.id,
            action: 'created',
            changes: { columnId, itemId, value },
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Reload with column association
      return (await ColumnValue.findByPk(columnValue.id, {
        include: [
          {
            model: Column,
            as: 'column',
            attributes: ['id', 'name', 'columnType', 'config'],
          },
        ],
      }))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Batch update multiple column values for an item.
   */
  static async batchUpdate(
    itemId: number,
    values: Array<{ columnId: number; value: any }>,
    workspaceId: number,
    user: AuthUser
  ): Promise<ColumnValue[]> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      for (const { columnId, value } of values) {
        const existing = await ColumnValue.findOne({
          where: { itemId, columnId },
          transaction,
        });

        if (existing) {
          const previousValue = existing.value;
          await existing.update({ value }, { transaction });

          await ActivityLog.create(
            {
              workspaceId,
              userId: user.id,
              entityType: 'column_value',
              entityId: existing.id,
              action: 'updated',
              changes: {
                columnId,
                itemId,
                value: { from: previousValue, to: value },
              },
            },
            { transaction }
          );
        } else {
          const created = await ColumnValue.create(
            { itemId, columnId, value },
            { transaction }
          );

          await ActivityLog.create(
            {
              workspaceId,
              userId: user.id,
              entityType: 'column_value',
              entityId: created.id,
              action: 'created',
              changes: { columnId, itemId, value },
            },
            { transaction }
          );
        }
      }

      await transaction.commit();

      return ColumnValue.findAll({
        where: { itemId },
        include: [
          {
            model: Column,
            as: 'column',
            attributes: ['id', 'name', 'columnType', 'config'],
          },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── EAV Handler Integration ──────────────────────────────────────────────────

  /**
   * Validate a value using the column's type handler, then serialize and upsert it.
   */
  static async validateAndSet(
    itemId: number,
    columnId: number,
    value: any,
    workspaceId: number,
    user: AuthUser
  ): Promise<ColumnValue> {
    // Look up the column to determine its type and config
    const column = await Column.findByPk(columnId);
    if (!column) {
      throw new Error(`Column with id ${columnId} not found`);
    }

    const handler = getHandler(column.columnType);
    const config = column.config ?? {};

    // Validate
    const validation = handler.validate(value, config);
    if (!validation.valid) {
      throw new Error(`Validation failed for column "${column.name}": ${validation.error}`);
    }

    // Serialize
    const serialized = handler.serialize(value);

    // Upsert using the existing method
    return this.upsert(itemId, columnId, serialized, workspaceId, user);
  }

  /**
   * Get all column values for an item, deserialized and formatted using type handlers.
   */
  static async getFormattedValues(
    itemId: number
  ): Promise<
    Array<{
      columnId: number;
      columnName: string;
      columnType: string;
      rawValue: any;
      displayValue: string;
    }>
  > {
    const columnValues = await ColumnValue.findAll({
      where: { itemId },
      include: [
        {
          model: Column,
          as: 'column',
          attributes: ['id', 'name', 'columnType', 'config'],
        },
      ],
    });

    return columnValues.map((cv: any) => {
      const column = cv.column;
      const handler = getHandler(column.columnType);
      const config = column.config ?? {};
      const deserialized = handler.deserialize(cv.value);
      const displayValue = handler.formatDisplay(deserialized, config);

      return {
        columnId: column.id,
        columnName: column.name,
        columnType: column.columnType,
        rawValue: deserialized,
        displayValue,
      };
    });
  }

  /**
   * Compute aggregate values for a specific column across all items in a board.
   */
  static async getAggregates(
    boardId: number,
    columnId: number
  ): Promise<AggregateResult[]> {
    // Verify the column belongs to this board
    const column = await Column.findOne({
      where: { id: columnId, boardId },
    });
    if (!column) {
      throw new Error(`Column ${columnId} not found in board ${boardId}`);
    }

    const handler = getHandler(column.columnType);
    const config = column.config ?? {};

    // Get all items for this board
    const items = await Item.findAll({
      where: { boardId },
      attributes: ['id'],
    });

    const itemIds = items.map((item: any) => item.id);

    if (itemIds.length === 0) {
      return handler.getAggregates([]);
    }

    // Get all column values for this column across all items
    const columnValues = await ColumnValue.findAll({
      where: {
        columnId,
        itemId: itemIds,
      },
    });

    // Deserialize all values
    const values = columnValues.map((cv: any) => handler.deserialize(cv.value));

    return handler.getAggregates(values);
  }
}
