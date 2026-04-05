import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import ColumnValueService from '../services/ColumnValueService';

const router = Router({ mergeParams: true });

// GET /workspaces/:workspaceId/boards/:boardId/items/:itemId/values — Get all column values
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId as string, 10);
    if (isNaN(itemId)) {
      return errorResponse(res, 'Invalid item ID', 400);
    }

    const values = await ColumnValueService.listByItem(itemId);
    return successResponse(res, values, 'Column values retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get column values';
    return errorResponse(res, message);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/items/:itemId/values/:columnId — Update single value
router.put('/:columnId', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const itemId = parseInt(req.params.itemId as string, 10);
    const columnId = parseInt(req.params.columnId as string, 10);

    if (isNaN(itemId) || isNaN(columnId)) {
      return errorResponse(res, 'Invalid item ID or column ID', 400);
    }

    const { value } = req.body;
    if (value === undefined) {
      return errorResponse(res, 'value is required', 400);
    }

    const columnValue = await ColumnValueService.upsert(
      itemId,
      columnId,
      value,
      workspaceId,
      req.user!
    );
    return successResponse(res, columnValue, 'Column value updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update column value';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/items/:itemId/values — Batch update values
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const itemId = parseInt(req.params.itemId as string, 10);

    if (isNaN(itemId)) {
      return errorResponse(res, 'Invalid item ID', 400);
    }

    const { values } = req.body;
    if (!Array.isArray(values) || values.length === 0) {
      return errorResponse(
        res,
        'values array is required with { columnId, value } entries',
        400
      );
    }

    const updatedValues = await ColumnValueService.batchUpdate(
      itemId,
      values,
      workspaceId,
      req.user!
    );
    return successResponse(res, updatedValues, 'Column values updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to batch update column values';
    return errorResponse(res, message, 400);
  }
});

export default router;
