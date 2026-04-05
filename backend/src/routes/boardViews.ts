import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import BoardViewService from '../services/BoardViewService';

const router = Router({ mergeParams: true });

// GET /workspaces/:workspaceId/boards/:boardId/views — List views
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const views = await BoardViewService.list(boardId);
    return successResponse(res, views, 'Views retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list views';
    return errorResponse(res, message);
  }
});

// GET /workspaces/:workspaceId/boards/:boardId/views/:id — Get view with settings
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid view ID', 400);
    }

    const view = await BoardViewService.getById(id, boardId);
    if (!view) {
      return errorResponse(res, 'View not found', 404);
    }

    return successResponse(res, view, 'View retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get view';
    return errorResponse(res, message);
  }
});

// POST /workspaces/:workspaceId/boards/:boardId/views — Create view
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { name, viewType, settings, layoutJson, isDefault } = req.body;

    if (!name || !viewType) {
      return errorResponse(res, 'View name and viewType are required', 400);
    }

    const view = await BoardViewService.create(
      { name, viewType, settings, layoutJson, isDefault },
      boardId,
      workspaceId,
      req.user!
    );
    return successResponse(res, view, 'View created', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create view';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/views/:id — Update view
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid view ID', 400);
    }

    const { name, settings, layoutJson, isDefault } = req.body;
    const view = await BoardViewService.update(
      id,
      boardId,
      { name, settings, layoutJson, isDefault },
      workspaceId,
      req.user!
    );
    return successResponse(res, view, 'View updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update view';
    const status = message === 'View not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

// DELETE /workspaces/:workspaceId/boards/:boardId/views/:id — Delete view
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid view ID', 400);
    }

    await BoardViewService.delete(id, boardId, workspaceId, req.user!);
    return successResponse(res, null, 'View deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete view';
    const status =
      message === 'View not found'
        ? 404
        : message === 'Cannot delete the last view of a board'
          ? 400
          : 400;
    return errorResponse(res, message, status);
  }
});

export default router;
