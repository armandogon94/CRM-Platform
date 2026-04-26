import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { requireRole } from '../middleware/rbac';
import { successResponse, errorResponse } from '../utils/response';
import WorkspaceService from '../services/WorkspaceService';

const router = Router();

// GET /workspaces/:workspaceId/members — Search workspace members (Slice 21B A1)
//
// Authorization: req.user.workspaceId must equal :workspaceId (manual scope check —
// foreign workspace requests get 403). All authenticated roles (admin/member/viewer)
// may search their own workspace's members so the person picker works for everyone
// who can be assigned to or read items.
//
// Empty `search` → 50 most-recent members. Non-empty → ILIKE on email/first/last.
// `isActive: true` filter is enforced inside WorkspaceService.searchMembers.
router.get('/:workspaceId/members', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    if (isNaN(workspaceId)) {
      return errorResponse(res, 'Invalid workspace ID', 400);
    }

    if (!req.user || req.user.workspaceId !== workspaceId) {
      return errorResponse(
        res,
        'Access denied. You do not belong to this workspace.',
        403
      );
    }

    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 50;

    const { members, total } = await WorkspaceService.searchMembers(
      workspaceId,
      search,
      limit
    );

    // SPEC §Slice 21B contract: `data: { members: [...] }` + sibling `pagination` block.
    // The shared `paginatedResponse` helper would write `data: T[]`, so we build the
    // envelope manually to match the spec shape exactly.
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return res.status(200).json({
      success: true,
      data: { members },
      message: 'Members retrieved',
      pagination: { page: 1, limit, total, totalPages },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to search workspace members';
    return errorResponse(res, message);
  }
});

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
