import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import BoardService from '../services/BoardService';

const router = Router({ mergeParams: true });

// GET /workspaces/:workspaceId/boards — List all boards in workspace
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const boards = await BoardService.list(workspaceId);
    return successResponse(res, boards, 'Boards retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list boards';
    return errorResponse(res, message);
  }
});

// GET /workspaces/:workspaceId/boards/:id — Get board with details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid board ID', 400);
    }

    const board = await BoardService.getById(id, workspaceId);
    if (!board) {
      return errorResponse(res, 'Board not found', 404);
    }

    return successResponse(res, board, 'Board retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get board';
    return errorResponse(res, message);
  }
});

// POST /workspaces/:workspaceId/boards — Create board
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { name, description, boardType, settings } = req.body;

    if (!name) {
      return errorResponse(res, 'Board name is required', 400);
    }

    const board = await BoardService.create(
      { name, description, boardType, settings },
      workspaceId,
      req.user!
    );
    return successResponse(res, board, 'Board created', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create board';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:id — Update board
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid board ID', 400);
    }

    const { name, description, settings } = req.body;
    const board = await BoardService.update(
      id,
      workspaceId,
      { name, description, settings },
      req.user!
    );
    return successResponse(res, board, 'Board updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update board';
    const status = message === 'Board not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

// DELETE /workspaces/:workspaceId/boards/:id — Soft delete board
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid board ID', 400);
    }

    await BoardService.delete(id, workspaceId, req.user!);
    return successResponse(res, null, 'Board deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete board';
    const status = message === 'Board not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

// POST /workspaces/:workspaceId/boards/:id/duplicate — Duplicate board
router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid board ID', 400);
    }

    const board = await BoardService.duplicate(id, workspaceId, req.user!);
    return successResponse(res, board, 'Board duplicated', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to duplicate board';
    const status = message === 'Board not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

export default router;
