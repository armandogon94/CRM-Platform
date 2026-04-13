/**
 * Tests for WorkspaceService CRUD operations.
 */

const mockCommit = jest.fn();
const mockRollback = jest.fn();
const mockTransaction = { commit: mockCommit, rollback: mockRollback };

jest.mock('../../models', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue(mockTransaction),
  },
  Workspace: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  User: {},
  Board: {},
  ActivityLog: { create: jest.fn() },
}));

jest.mock('../../config', () => ({ default: {}, __esModule: true }));

import WorkspaceService from '../../services/WorkspaceService';
import { Workspace, ActivityLog } from '../../models';
import { createAuthUser, createTestWorkspace } from '../factories';

describe('WorkspaceService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('list', () => {
    it('returns all workspaces for admin user', async () => {
      const workspaces = [
        createTestWorkspace({ id: 1, name: 'Workspace A' }),
        createTestWorkspace({ id: 2, name: 'Workspace B' }),
      ];
      (Workspace.findAll as jest.Mock).mockResolvedValue(workspaces);

      const user = createAuthUser({ role: 'admin' });
      const result = await WorkspaceService.list(user);

      expect(result).toEqual(workspaces);
      expect(Workspace.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['createdAt', 'DESC']],
        })
      );
      // Admin path should NOT filter by workspace id
      expect(Workspace.findAll).toHaveBeenCalledWith(
        expect.not.objectContaining({
          where: expect.anything(),
        })
      );
    });

    it('returns only user workspace for non-admin', async () => {
      const workspaces = [createTestWorkspace({ id: 3 })];
      (Workspace.findAll as jest.Mock).mockResolvedValue(workspaces);

      const user = createAuthUser({ role: 'member', workspaceId: 3 });
      const result = await WorkspaceService.list(user);

      expect(result).toEqual(workspaces);
      expect(Workspace.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 3 },
        })
      );
    });
  });

  describe('getById', () => {
    it('returns workspace by id', async () => {
      const workspace = createTestWorkspace({ id: 5 });
      (Workspace.findByPk as jest.Mock).mockResolvedValue(workspace);

      const result = await WorkspaceService.getById(5);

      expect(result).toEqual(workspace);
      expect(Workspace.findByPk).toHaveBeenCalledWith(5, expect.any(Object));
    });

    it('returns null for non-existent workspace', async () => {
      (Workspace.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await WorkspaceService.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates workspace with activity log in transaction', async () => {
      const workspace = createTestWorkspace({ id: 10, name: 'New Workspace', slug: 'new-workspace' });
      (Workspace.create as jest.Mock).mockResolvedValue(workspace);

      const user = createAuthUser();
      const data = { name: 'New Workspace', slug: 'new-workspace', description: 'A description' };
      const result = await WorkspaceService.create(data, user);

      expect(result).toEqual(workspace);
      expect(Workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Workspace',
          slug: 'new-workspace',
          description: 'A description',
          settings: {},
          createdBy: user.id,
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: workspace.id,
          userId: user.id,
          entityType: 'workspace',
          entityId: workspace.id,
          action: 'created',
          changes: { name: 'New Workspace', slug: 'new-workspace' },
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
      expect(mockRollback).not.toHaveBeenCalled();
    });

    it('rolls back transaction on error', async () => {
      (Workspace.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const user = createAuthUser();
      await expect(
        WorkspaceService.create({ name: 'Fail', slug: 'fail' }, user)
      ).rejects.toThrow('DB error');

      expect(mockRollback).toHaveBeenCalled();
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates workspace fields with activity log', async () => {
      const workspace = {
        ...createTestWorkspace({ id: 1, name: 'Old Name', slug: 'old-slug', description: 'Old desc' }),
        update: jest.fn(),
      };
      (Workspace.findByPk as jest.Mock).mockResolvedValue(workspace);

      const user = createAuthUser();
      const data = { name: 'New Name' };
      await WorkspaceService.update(1, data, user);

      expect(workspace.update).toHaveBeenCalledWith(data, { transaction: mockTransaction });
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          userId: user.id,
          entityType: 'workspace',
          entityId: 1,
          action: 'updated',
          changes: expect.objectContaining({
            name: { from: 'Old Name', to: 'New Name' },
          }),
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('throws for non-existent workspace', async () => {
      (Workspace.findByPk as jest.Mock).mockResolvedValue(null);

      const user = createAuthUser();
      await expect(
        WorkspaceService.update(999, { name: 'X' }, user)
      ).rejects.toThrow('Workspace not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('destroys workspace with activity log', async () => {
      const workspace = {
        ...createTestWorkspace({ id: 1, name: 'To Delete' }),
        destroy: jest.fn(),
      };
      (Workspace.findByPk as jest.Mock).mockResolvedValue(workspace);

      const user = createAuthUser();
      await WorkspaceService.delete(1, user);

      expect(workspace.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(ActivityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 1,
          userId: user.id,
          entityType: 'workspace',
          entityId: 1,
          action: 'deleted',
          changes: { name: 'To Delete' },
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      expect(mockCommit).toHaveBeenCalled();
    });

    it('throws for non-existent workspace', async () => {
      (Workspace.findByPk as jest.Mock).mockResolvedValue(null);

      const user = createAuthUser();
      await expect(
        WorkspaceService.delete(999, user)
      ).rejects.toThrow('Workspace not found');

      expect(mockRollback).toHaveBeenCalled();
    });
  });
});
