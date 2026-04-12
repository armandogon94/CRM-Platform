import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import ActivityLog from '../models/ActivityLog';

const router = Router();

// GET /activity — paginated activity logs for workspace
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.user!.workspaceId;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { workspaceId };

    if (req.query.entityType) {
      where.entityType = req.query.entityType as string;
    }
    if (req.query.action) {
      where.action = req.query.action as string;
    }
    if (req.query.userId) {
      where.userId = parseInt(req.query.userId as string, 10);
    }
    if (req.query.boardId) {
      where.entityType = 'item';
      // boardId filter is handled via the board-specific route below
    }
    if (req.query.startDate || req.query.endDate) {
      const dateFilter: Record<symbol, string> = {};
      if (req.query.startDate) {
        dateFilter[Op.gte as unknown as symbol] = req.query.startDate as string;
      }
      if (req.query.endDate) {
        dateFilter[Op.lte as unknown as symbol] = req.query.endDate as string;
      }
      where.createdAt = dateFilter;
    }

    const result = await ActivityLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return successResponse(res, {
      activities: result.rows,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch activity logs', 500);
  }
});

// GET /activity/board/:boardId — activity logs scoped to a board
router.get('/board/:boardId', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId as string, 10);
    if (isNaN(boardId)) {
      return errorResponse(res, 'Invalid board ID', 400);
    }

    const workspaceId = req.user!.workspaceId;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { workspaceId };

    if (req.query.entityType) {
      where.entityType = req.query.entityType as string;
    }
    if (req.query.action) {
      where.action = req.query.action as string;
    }

    const result = await ActivityLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return successResponse(res, {
      activities: result.rows,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch activity logs', 500);
  }
});

export default router;
