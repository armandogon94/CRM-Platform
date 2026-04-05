import { Transaction } from 'sequelize';
import { sequelize, Workspace, User, Board, ActivityLog } from '../models';
import { AuthUser } from '../types';

export default class WorkspaceService {
  /**
   * List all workspaces. Admins see all; members/viewers see only their own.
   */
  static async list(user: AuthUser): Promise<Workspace[]> {
    if (user.role === 'admin') {
      return Workspace.findAll({
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    }

    return Workspace.findAll({
      where: { id: user.workspaceId },
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
    });
  }

  /**
   * Get a single workspace by id.
   */
  static async getById(id: number): Promise<Workspace | null> {
    return Workspace.findByPk(id, {
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
        {
          model: Board,
          as: 'boards',
          attributes: ['id', 'name', 'boardType', 'createdAt'],
        },
      ],
    });
  }

  /**
   * Create a new workspace.
   */
  static async create(
    data: {
      name: string;
      slug: string;
      description?: string;
      settings?: Record<string, unknown>;
    },
    user: AuthUser
  ): Promise<Workspace> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const workspace = await Workspace.create(
        {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          settings: data.settings || {},
          createdBy: user.id,
        },
        { transaction }
      );

      await ActivityLog.create(
        {
          workspaceId: workspace.id,
          userId: user.id,
          entityType: 'workspace',
          entityId: workspace.id,
          action: 'created',
          changes: { name: data.name, slug: data.slug },
        },
        { transaction }
      );

      await transaction.commit();
      return workspace;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update a workspace.
   */
  static async update(
    id: number,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      settings?: Record<string, unknown>;
    },
    user: AuthUser
  ): Promise<Workspace> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const workspace = await Workspace.findByPk(id, { transaction });
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) {
        changes.name = { from: workspace.name, to: data.name };
      }
      if (data.slug !== undefined) {
        changes.slug = { from: workspace.slug, to: data.slug };
      }
      if (data.description !== undefined) {
        changes.description = { from: workspace.description, to: data.description };
      }

      await workspace.update(data, { transaction });

      await ActivityLog.create(
        {
          workspaceId: id,
          userId: user.id,
          entityType: 'workspace',
          entityId: id,
          action: 'updated',
          changes,
        },
        { transaction }
      );

      await transaction.commit();
      return workspace;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Soft delete a workspace.
   */
  static async delete(id: number, user: AuthUser): Promise<void> {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const workspace = await Workspace.findByPk(id, { transaction });
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      await workspace.destroy({ transaction });

      await ActivityLog.create(
        {
          workspaceId: id,
          userId: user.id,
          entityType: 'workspace',
          entityId: id,
          action: 'deleted',
          changes: { name: workspace.name },
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
