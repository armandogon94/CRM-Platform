import { Transaction } from 'sequelize';
import {
  sequelize,
  Board,
  BoardGroup,
  Column,
  BoardView,
  Item,
  ColumnValue,
  ActivityLog,
} from '../models';
import { AuthUser } from '../types';
import type { RedisService } from './RedisService';

export default class BoardService {
  /**
   * List all boards in a workspace with groups and column count.
   */
  static async list(workspaceId: number): Promise<Board[]> {
    return Board.findAll({
      where: { workspaceId },
      include: [
        {
          model: BoardGroup,
          as: 'groups',
          attributes: ['id', 'name', 'color', 'position'],
        },
        {
          model: Column,
          as: 'columns',
          attributes: ['id'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get a board with groups, columns (ordered by position), and view count.
   */
  static async getById(id: number, workspaceId: number): Promise<Board | null> {
    return Board.findOne({
      where: { id, workspaceId },
      include: [
        {
          model: BoardGroup,
          as: 'groups',
        },
        {
          model: Column,
          as: 'columns',
        },
        {
          model: BoardView,
          as: 'views',
          attributes: ['id', 'name', 'viewType', 'isDefault'],
        },
      ],
      order: [
        [{ model: BoardGroup, as: 'groups' }, 'position', 'ASC'],
        [{ model: Column, as: 'columns' }, 'position', 'ASC'],
      ],
    });
  }

  private static CACHE_TTL = 300; // 5 minutes

  /**
   * Cache-aside wrapper for getById.
   * Checks Redis first, falls back to DB on miss, caches the result.
   */
  static async getByIdCached(
    id: number,
    workspaceId: number,
    cache: RedisService
  ): Promise<Board | Record<string, unknown> | null> {
    const cacheKey = `board:${id}:ws:${workspaceId}`;

    // Try cache first
    const cached = await cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    // Cache miss — query DB
    const board = await BoardService.getById(id, workspaceId);
    if (!board) return null;

    // Cache the serialized result
    const serialized = board.toJSON ? (board.toJSON() as unknown as Record<string, unknown>) : (board as unknown as Record<string, unknown>);
    await cache.set(cacheKey, serialized, BoardService.CACHE_TTL);
    return serialized;
  }

  /**
   * Invalidate board cache after mutations.
   */
  static async invalidateBoardCache(
    boardId: number,
    workspaceId: number,
    cache: RedisService
  ): Promise<void> {
    await cache.del(`board:${boardId}:ws:${workspaceId}`);
  }

  /**
   * Create a board with a default group and default table view.
   */
  static async create(
    data: {
      name: string;
      description?: string;
      boardType?: string;
      settings?: Record<string, unknown>;
    },
    workspaceId: number,
    user: AuthUser
  ): Promise<Board> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const board = await Board.create(
        {
          name: data.name,
          description: data.description || null,
          workspaceId,
          createdBy: user.id,
          boardType:
            (data.boardType as 'main' | 'shareable' | 'private') || 'main',
          settings: data.settings || {},
        },
        { transaction }
      );

      // Auto-create default group
      await BoardGroup.create(
        {
          boardId: board.id,
          name: 'New Group',
          color: '#579BFC',
          position: 0,
        },
        { transaction }
      );

      // Auto-create default table view
      await BoardView.create(
        {
          boardId: board.id,
          name: 'Main Table',
          viewType: 'table',
          isDefault: true,
          createdBy: user.id,
          settings: {},
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board',
          entityId: board.id,
          action: 'created',
          changes: { name: data.name },
        },
        { transaction }
      );

      await transaction.commit();

      // Reload with associations
      return (await BoardService.getById(board.id, workspaceId))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update board name, description, settings.
   */
  static async update(
    id: number,
    workspaceId: number,
    data: {
      name?: string;
      description?: string;
      settings?: Record<string, unknown>;
    },
    user: AuthUser
  ): Promise<Board> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const board = await Board.findOne({
        where: { id, workspaceId },
        transaction,
      });
      if (!board) {
        throw new Error('Board not found');
      }

      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) {
        changes.name = { from: board.name, to: data.name };
      }
      if (data.description !== undefined) {
        changes.description = { from: board.description, to: data.description };
      }

      await board.update(data, { transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board',
          entityId: id,
          action: 'updated',
          changes,
        },
        { transaction }
      );

      await transaction.commit();
      return board;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Soft delete board (cascades to items, columns, groups).
   */
  static async delete(
    id: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const board = await Board.findOne({
        where: { id, workspaceId },
        transaction,
      });
      if (!board) {
        throw new Error('Board not found');
      }

      // Cascade soft-deletes
      const items = await Item.findAll({
        where: { boardId: id },
        attributes: ['id'],
        transaction,
      });
      const itemIds = items.map((i) => i.id);

      if (itemIds.length > 0) {
        await ColumnValue.destroy({ where: { itemId: itemIds }, transaction });
        await Item.destroy({ where: { boardId: id }, transaction });
      }

      await Column.destroy({ where: { boardId: id }, transaction });
      await BoardGroup.destroy({ where: { boardId: id }, transaction });
      await BoardView.destroy({ where: { boardId: id }, transaction });
      await board.destroy({ transaction });

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board',
          entityId: id,
          action: 'deleted',
          changes: { name: board.name },
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
   * Duplicate board with all groups and columns (not items).
   */
  static async duplicate(
    id: number,
    workspaceId: number,
    user: AuthUser
  ): Promise<Board> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const original = await Board.findOne({
        where: { id, workspaceId },
        include: [
          { model: BoardGroup, as: 'groups' },
          { model: Column, as: 'columns' },
        ],
        transaction,
      });

      if (!original) {
        throw new Error('Board not found');
      }

      // Create duplicate board
      const duplicate = await Board.create(
        {
          name: `${original.name} (copy)`,
          description: original.description,
          workspaceId,
          createdBy: user.id,
          boardType: original.boardType,
          settings: original.settings,
        },
        { transaction }
      );

      // Duplicate groups
      const groups = (original as any).groups || [];
      for (const group of groups) {
        await BoardGroup.create(
          {
            boardId: duplicate.id,
            name: group.name,
            color: group.color,
            position: group.position,
          },
          { transaction }
        );
      }

      // Duplicate columns
      const columns = (original as any).columns || [];
      for (const column of columns) {
        await Column.create(
          {
            boardId: duplicate.id,
            name: column.name,
            columnType: column.columnType,
            config: column.config,
            position: column.position,
            width: column.width,
            isRequired: column.isRequired,
          },
          { transaction }
        );
      }

      // Create default table view for duplicate
      await BoardView.create(
        {
          boardId: duplicate.id,
          name: 'Main Table',
          viewType: 'table',
          isDefault: true,
          createdBy: user.id,
          settings: {},
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          workspaceId,
          userId: user.id,
          entityType: 'board',
          entityId: duplicate.id,
          action: 'duplicated',
          changes: { originalBoardId: id, name: duplicate.name },
        },
        { transaction }
      );

      await transaction.commit();

      return (await BoardService.getById(duplicate.id, workspaceId))!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
