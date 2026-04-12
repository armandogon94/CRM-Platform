import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireWorkspaceAccess } from '../middleware/rbac';
import { AuthRequest } from '../types';
import { Sequelize } from 'sequelize';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';

import authRouter from './auth';
import workspaceRouter from './workspaces';
import boardRouter from './boards';
import boardGroupRouter from './boardGroups';
import columnRouter from './columns';
import itemRouter from './items';
import columnValueRouter from './columnValues';
import boardViewRouter from './boardViews';
import automationRouter from './automations';
import notificationRouter from './notifications';
import fileRouter from './files';
import activityLogRouter from './activityLogs';

import Board from '../models/Board';
import BoardGroup from '../models/BoardGroup';
import BoardView from '../models/BoardView';
import Column from '../models/Column';
import Item from '../models/Item';
import ColumnValue from '../models/ColumnValue';

const router = Router();

// ─── Auth routes (public + authenticated) ───────────────────────────
router.use('/auth', authRouter);

// ─── Automations (flat, already uses boardId query param) ───────────
router.use('/automations', automationRouter);

// ─── Notifications (user-scoped, authenticated) ────────────────────
router.use('/notifications', authenticate, notificationRouter);

// ─── Files (authenticated) ─────────────────────────────────────────
router.use('/files', authenticate, fileRouter);

// ─── Activity Logs (authenticated) ────────────────────────────────
router.use('/activity', authenticate, activityLogRouter);

// ─── Workspace-nested routes ────────────────────────────────────────
router.use('/workspaces', authenticate, workspaceRouter);

router.use(
  '/workspaces/:workspaceId/boards',
  authenticate,
  requireWorkspaceAccess,
  boardRouter
);

router.use(
  '/workspaces/:workspaceId/boards/:boardId/groups',
  authenticate,
  requireWorkspaceAccess,
  boardGroupRouter
);

router.use(
  '/workspaces/:workspaceId/boards/:boardId/columns',
  authenticate,
  requireWorkspaceAccess,
  columnRouter
);

router.use(
  '/workspaces/:workspaceId/boards/:boardId/items',
  authenticate,
  requireWorkspaceAccess,
  itemRouter
);

router.use(
  '/workspaces/:workspaceId/boards/:boardId/items/:itemId/values',
  authenticate,
  requireWorkspaceAccess,
  columnValueRouter
);

router.use(
  '/workspaces/:workspaceId/boards/:boardId/views',
  authenticate,
  requireWorkspaceAccess,
  boardViewRouter
);

// ─── Flat convenience routes (used by industry frontends) ───────────

// GET /boards?workspaceId=X — list boards for workspace
router.get('/boards', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId
      ? parseInt(req.query.workspaceId as string, 10)
      : req.user!.workspaceId;

    const boards = await Board.findAll({
      where: { workspaceId },
      include: [
        { model: Column, as: 'columns', order: [['position', 'ASC']] },
        { model: BoardGroup, as: 'groups', order: [['position', 'ASC']] },
        { model: BoardView, as: 'views' },
      ],
      order: [['createdAt', 'ASC']],
    });

    return successResponse(res, { boards });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch boards', 500);
  }
});

// GET /boards/:id — get board with groups, columns, views
router.get('/boards/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const board = await Board.findOne({
      where: { id, workspaceId: req.user!.workspaceId },
      include: [
        { model: Column, as: 'columns' },
        { model: BoardGroup, as: 'groups' },
        { model: BoardView, as: 'views' },
      ],
    });

    if (!board) return errorResponse(res, 'Board not found', 404);
    return successResponse(res, { board });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch board', 500);
  }
});

// GET /boards/:boardId/items — get all items with column values
router.get('/boards/:boardId/items', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);

    // Verify board belongs to user's workspace
    const board = await Board.findOne({
      where: { id: boardId, workspaceId: req.user!.workspaceId },
    });
    if (!board) return errorResponse(res, 'Board not found', 404);

    const items = await Item.findAll({
      where: { boardId },
      include: [
        { model: ColumnValue, as: 'columnValues' },
      ],
      order: [['groupId', 'ASC'], ['position', 'ASC']],
    });

    return successResponse(res, { items });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch items', 500);
  }
});

// GET /boards/:boardId/aggregates — aggregated data for dashboard widgets
router.get('/boards/:boardId/aggregates', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);

    const board = await Board.findOne({
      where: { id: boardId, workspaceId: req.user!.workspaceId },
    });
    if (!board) return errorResponse(res, 'Board not found', 404);

    // Total items
    const totalItems = await Item.count({ where: { boardId } });

    // Items by group
    const itemsByGroupRows = await Item.findAll({
      where: { boardId },
      attributes: ['groupId', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      group: ['groupId'],
      raw: true,
    }) as any[];

    const itemsByGroup: Record<number, number> = {};
    for (const row of itemsByGroupRows) {
      itemsByGroup[row.groupId] = parseInt(row.count, 10);
    }

    // Status counts — find status columns, then count values
    const statusColumns = await Column.findAll({
      where: { boardId, columnType: 'status' },
    });

    const statusCounts: Record<string, number> = {};
    if (statusColumns.length > 0) {
      const statusColumnIds = statusColumns.map((c: any) => c.id);
      const valueCounts = await ColumnValue.findAll({
        where: { columnId: statusColumnIds },
        attributes: ['value', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
        group: ['value'],
        raw: true,
      }) as any[];

      for (const row of valueCounts) {
        const label = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
        statusCounts[label] = parseInt(row.count, 10);
      }
    }

    return successResponse(res, { totalItems, statusCounts, itemsByGroup });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch aggregates', 500);
  }
});

// POST /items — create item (flat)
router.post('/items', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { boardId, groupId, name, values } = req.body;
    if (!boardId || !name) return errorResponse(res, 'boardId and name required', 400);

    const board = await Board.findOne({
      where: { id: boardId, workspaceId: req.user!.workspaceId },
    });
    if (!board) return errorResponse(res, 'Board not found', 404);

    const item = await Item.create({
      boardId,
      groupId: groupId || 0,
      name,
      position: 0,
      createdBy: req.user!.id,
    });

    // Create column values if provided
    if (values && typeof values === 'object') {
      for (const [columnId, value] of Object.entries(values)) {
        await ColumnValue.create({
          itemId: item.id,
          columnId: parseInt(columnId, 10),
          value: value as any,
        });
      }
    }

    const fullItem = await Item.findByPk(item.id, {
      include: [{ model: ColumnValue, as: 'columnValues' }],
    });

    return successResponse(res, { item: fullItem }, 'Item created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create item', 500);
  }
});

// PUT /items/:id — update item
router.put('/items/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const item = await Item.findByPk(id);
    if (!item) return errorResponse(res, 'Item not found', 404);

    const board = await Board.findOne({
      where: { id: item.boardId, workspaceId: req.user!.workspaceId },
    });
    if (!board) return errorResponse(res, 'Access denied', 403);

    const { name, groupId, position } = req.body;
    if (name !== undefined) item.name = name;
    if (groupId !== undefined) item.groupId = groupId;
    if (position !== undefined) item.position = position;
    await item.save();

    return successResponse(res, { item }, 'Item updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update item', 500);
  }
});

// PUT /items/:id/values — batch update column values
router.put('/items/:id/values', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const itemId = parseInt(req.params.id as string, 10);
    const item = await Item.findByPk(itemId);
    if (!item) return errorResponse(res, 'Item not found', 404);

    const board = await Board.findOne({
      where: { id: item.boardId, workspaceId: req.user!.workspaceId },
    });
    if (!board) return errorResponse(res, 'Access denied', 403);

    const { values } = req.body;
    if (!Array.isArray(values)) return errorResponse(res, 'values array required', 400);

    const results = [];
    for (const { columnId, value } of values) {
      const [cv] = await ColumnValue.upsert({
        itemId,
        columnId,
        value,
      } as any);
      results.push(cv);
    }

    return successResponse(res, { values: results }, 'Values updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update values', 500);
  }
});

export default router;
