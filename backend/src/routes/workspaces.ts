import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { requireRole } from '../middleware/rbac';
import { successResponse, errorResponse } from '../utils/response';
import WorkspaceService from '../services/WorkspaceService';

const router = Router();

// GET /workspaces — List all workspaces
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaces = await WorkspaceService.list(req.user!);
    return successResponse(res, workspaces, 'Workspaces retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list workspaces';
    return errorResponse(res, message);
  }
});

// GET /workspaces/:id — Get workspace by id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid workspace ID', 400);
    }

    const workspace = await WorkspaceService.getById(id);
    if (!workspace) {
      return errorResponse(res, 'Workspace not found', 404);
    }

    return successResponse(res, workspace, 'Workspace retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get workspace';
    return errorResponse(res, message);
  }
});

// POST /workspaces — Create workspace (admin only)
router.post(
  '/',
  requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, slug, description, settings } = req.body;

      if (!name || !slug) {
        return errorResponse(res, 'Name and slug are required', 400);
      }

      const workspace = await WorkspaceService.create(
        { name, slug, description, settings },
        req.user!
      );
      return successResponse(res, workspace, 'Workspace created', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create workspace';
      const status = message.includes('unique') ? 409 : 400;
      return errorResponse(res, message, status);
    }
  }
);

// PUT /workspaces/:id — Update workspace (admin only)
router.put(
  '/:id',
  requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return errorResponse(res, 'Invalid workspace ID', 400);
      }

      const { name, slug, description, settings } = req.body;
      const workspace = await WorkspaceService.update(
        id,
        { name, slug, description, settings },
        req.user!
      );
      return successResponse(res, workspace, 'Workspace updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update workspace';
      const status = message === 'Workspace not found' ? 404 : 400;
      return errorResponse(res, message, status);
    }
  }
);

// DELETE /workspaces/:id — Soft delete workspace (admin only)
router.delete(
  '/:id',
  requireRole('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return errorResponse(res, 'Invalid workspace ID', 400);
      }

      await WorkspaceService.delete(id, req.user!);
      return successResponse(res, null, 'Workspace deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete workspace';
      const status = message === 'Workspace not found' ? 404 : 400;
      return errorResponse(res, message, status);
    }
  }
);

export default router;
