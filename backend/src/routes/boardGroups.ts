import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import BoardGroupService from '../services/BoardGroupService';

const router = Router({ mergeParams: true });

// GET /workspaces/:workspaceId/boards/:boardId/groups — List groups
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const groups = await BoardGroupService.list(boardId);
    return successResponse(res, groups, 'Groups retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list groups';
    return errorResponse(res, message);
  }
});

// POST /workspaces/:workspaceId/boards/:boardId/groups — Create group
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { name, color, position } = req.body;

    if (!name) {
      return errorResponse(res, 'Group name is required', 400);
    }

    const group = await BoardGroupService.create(
      { name, color, position },
      boardId,
      workspaceId,
      req.user!
    );
    return successResponse(res, group, 'Group created', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create group';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/groups/reorder — Reorder groups
router.put('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { groupIds } = req.body;

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return errorResponse(res, 'groupIds array is required', 400);
    }

    const groups = await BoardGroupService.reorder(
      boardId,
      groupIds,
      workspaceId,
      req.user!
    );
    return successResponse(res, groups, 'Groups reordered');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder groups';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/groups/:id — Update group
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid group ID', 400);
    }

    const { name, color, position } = req.body;
    const group = await BoardGroupService.update(
      id,
      boardId,
      { name, color, position },
      workspaceId,
      req.user!
    );
    return successResponse(res, group, 'Group updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update group';
    const status = message === 'Group not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

// DELETE /workspaces/:workspaceId/boards/:boardId/groups/:id — Delete group
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid group ID', 400);
    }

    await BoardGroupService.delete(id, boardId, workspaceId, req.user!);
    return successResponse(res, null, 'Group deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete group';
    const status = message === 'Group not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

export default router;
