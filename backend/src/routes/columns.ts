import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import ColumnService from '../services/ColumnService';

const router = Router({ mergeParams: true });

// GET /workspaces/:workspaceId/boards/:boardId/columns — List columns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const columns = await ColumnService.list(boardId);
    return successResponse(res, columns, 'Columns retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list columns';
    return errorResponse(res, message);
  }
});

// POST /workspaces/:workspaceId/boards/:boardId/columns — Create column
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { name, columnType, config, width, isRequired, position } = req.body;

    if (!name || !columnType) {
      return errorResponse(res, 'Column name and columnType are required', 400);
    }

    const column = await ColumnService.create(
      { name, columnType, config, width, isRequired, position },
      boardId,
      workspaceId,
      req.user!
    );
    return successResponse(res, column, 'Column created', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create column';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/columns/reorder — Reorder columns
router.put('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { columnIds } = req.body;

    if (!Array.isArray(columnIds) || columnIds.length === 0) {
      return errorResponse(res, 'columnIds array is required', 400);
    }

    const columns = await ColumnService.reorder(
      boardId,
      columnIds,
      workspaceId,
      req.user!
    );
    return successResponse(res, columns, 'Columns reordered');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder columns';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/columns/:id — Update column
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid column ID', 400);
    }

    const { name, config, width, position } = req.body;
    const column = await ColumnService.update(
      id,
      boardId,
      { name, config, width, position },
      workspaceId,
      req.user!
    );
    return successResponse(res, column, 'Column updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update column';
    const status = message === 'Column not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

// DELETE /workspaces/:workspaceId/boards/:boardId/columns/:id — Delete column
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid column ID', 400);
    }

    await ColumnService.delete(id, boardId, workspaceId, req.user!);
    return successResponse(res, null, 'Column deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete column';
    const status = message === 'Column not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

export default router;
