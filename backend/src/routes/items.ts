import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import ItemService from '../services/ItemService';

const router = Router({ mergeParams: true });

// GET /workspaces/:workspaceId/boards/:boardId/items — List items with pagination
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const groupId = req.query.groupId
      ? parseInt(req.query.groupId as string, 10)
      : undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || undefined;

    const { items, total } = await ItemService.list(boardId, {
      page,
      limit,
      groupId,
      search,
      sortBy,
      sortOrder,
    });

    return paginatedResponse(res, items, { page, limit, total }, 'Items retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list items';
    return errorResponse(res, message);
  }
});

// GET /workspaces/:workspaceId/boards/:boardId/items/:id — Get single item
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid item ID', 400);
    }

    const item = await ItemService.getById(id, boardId);
    if (!item) {
      return errorResponse(res, 'Item not found', 404);
    }

    return successResponse(res, item, 'Item retrieved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get item';
    return errorResponse(res, message);
  }
});

// POST /workspaces/:workspaceId/boards/:boardId/items — Create item
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { name, groupId, columnValues } = req.body;

    if (!name) {
      return errorResponse(res, 'Item name is required', 400);
    }

    const item = await ItemService.create(
      { name, groupId, columnValues },
      boardId,
      workspaceId,
      req.user!
    );
    return successResponse(res, item, 'Item created', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create item';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/items/reorder — Reorder items
router.put('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return errorResponse(res, 'itemIds array is required', 400);
    }

    await ItemService.reorder(boardId, itemIds, workspaceId, req.user!);
    return successResponse(res, null, 'Items reordered');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder items';
    return errorResponse(res, message, 400);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/items/:id — Update item
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid item ID', 400);
    }

    const { name, position, groupId } = req.body;
    const item = await ItemService.update(
      id,
      boardId,
      { name, position, groupId },
      workspaceId,
      req.user!
    );
    return successResponse(res, item, 'Item updated');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update item';
    const status = message === 'Item not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

// PUT /workspaces/:workspaceId/boards/:boardId/items/:id/move — Move item
router.put('/:id/move', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid item ID', 400);
    }

    const { groupId } = req.body;
    if (!groupId) {
      return errorResponse(res, 'groupId is required', 400);
    }

    const item = await ItemService.move(
      id,
      boardId,
      groupId,
      workspaceId,
      req.user!
    );
    return successResponse(res, item, 'Item moved');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move item';
    const status =
      message === 'Item not found' || message === 'Target group not found'
        ? 404
        : 400;
    return errorResponse(res, message, status);
  }
});

// DELETE /workspaces/:workspaceId/boards/:boardId/items/:id — Soft delete item
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    const workspaceId = parseInt(req.params.workspaceId as string, 10);
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid item ID', 400);
    }

    await ItemService.delete(id, boardId, workspaceId, req.user!);
    return successResponse(res, null, 'Item deleted');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete item';
    const status = message === 'Item not found' ? 404 : 400;
    return errorResponse(res, message, status);
  }
});

export default router;
