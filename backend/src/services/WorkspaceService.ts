import { Op, Transaction, literal } from 'sequelize';
import { sequelize, Workspace, User, Board, ActivityLog } from '../models';
import { AuthUser } from '../types';

/**
 * Public-safe attribute allowlist for member search responses.
 * NEVER include passwordHash, refreshToken, resetToken, or any sensitive User fields.
 * (Slice 21B-A1 — security boundary.)
 */
const MEMBER_SEARCH_ATTRIBUTES = [
  'id',
  'email',
  'firstName',
  'lastName',
  'avatar',
  'role',
] as const;

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
   * Search active members of a workspace (Slice 21B A1).
   *
   * Empty `search` → 50 most-recently-active members ordered by `lastLoginAt DESC NULLS LAST`,
   * fallback `createdAt DESC`. Non-empty → ILIKE on email + firstName + lastName, OR-joined.
   *
   * Boundaries:
   * - ALWAYS scoped to `workspaceId` (caller must enforce that the request's :workspaceId
   *   matches the auth user's workspaceId; the service trusts what it's handed).
   * - ALWAYS filters `isActive: true` (deactivated users are not searchable).
   * - NEVER returns passwordHash / refreshToken / resetToken — strict attributes allowlist.
   */
  static async searchMembers(
    workspaceId: number,
    search: string,
    limit: number = 50
  ): Promise<{ members: User[]; total: number }> {
    const trimmed = (search || '').trim();
    const where: Record<string, unknown> = {
      workspaceId,
      isActive: true,
    };

    if (trimmed.length > 0) {
      const pattern = `%${trimmed}%`;
      where[Op.or as unknown as string] = [
        { email: { [Op.iLike]: pattern } },
        { firstName: { [Op.iLike]: pattern } },
        { lastName: { [Op.iLike]: pattern } },
      ];
    }

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: [...MEMBER_SEARCH_ATTRIBUTES],
      order: [
        [literal('"last_login_at" DESC NULLS LAST') as unknown as string],
        ['createdAt', 'DESC'],
      ] as never,
      limit,
    });

    return { members: rows, total: count };
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
