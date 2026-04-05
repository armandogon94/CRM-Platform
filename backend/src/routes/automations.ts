import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response';
import Board from '../models/Board';
import Automation from '../models/Automation';
import AutomationLog from '../models/AutomationLog';

const router = Router();

// All automation routes require authentication
router.use(authenticate);

// GET /automations — list automations for a board (query: boardId)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const boardId = req.query.boardId ? Number(req.query.boardId) : undefined;

    if (!boardId || isNaN(boardId)) {
      return errorResponse(res, 'boardId query parameter is required', 400);
    }

    // Verify the board belongs to the user's workspace
    const board = await Board.findOne({
      where: { id: boardId, workspaceId: req.user!.workspaceId },
    });

    if (!board) {
      return errorResponse(res, 'Board not found', 404);
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;

    const { count, rows: automations } = await Automation.findAndCountAll({
      where: { boardId: board.id },
      include: [
        {
          model: AutomationLog,
          as: 'logs',
          limit: 5,
          order: [['executedAt', 'DESC']],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return paginatedResponse(res, automations, { page, limit, total: count });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch automations', 500);
  }
});

// POST /automations — create automation
router.post(
  '/',
  validateBody(['boardId', 'name', 'triggerType', 'actionType']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { boardId, name, triggerType, triggerConfig, actionType, actionConfig, isActive } = req.body;

      // Verify the board belongs to the user's workspace
      const board = await Board.findOne({
        where: { id: boardId, workspaceId: req.user!.workspaceId },
      });

      if (!board) {
        return errorResponse(res, 'Board not found', 404);
      }

      const automation = await Automation.create({
        boardId: board.id,
        name,
        triggerType,
        triggerConfig: triggerConfig || {},
        actionType,
        actionConfig: actionConfig || {},
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user!.id,
      });

      return successResponse(res, { automation }, 'Automation created', 201);
    } catch (error) {
      return errorResponse(res, 'Failed to create automation', 500);
    }
  }
);

// PUT /automations/:id — update automation
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);

    if (isNaN(id)) {
      return errorResponse(res, 'Invalid automation ID', 400);
    }

    const automation = await Automation.findByPk(id, {
      include: [{ model: Board, as: 'board' }],
    });

    if (!automation) {
      return errorResponse(res, 'Automation not found', 404);
    }

    // Verify workspace access through the board
    const board = await Board.findOne({
      where: { id: automation.boardId, workspaceId: req.user!.workspaceId },
    });

    if (!board) {
      return errorResponse(res, 'Access denied', 403);
    }

    const { name, triggerType, triggerConfig, actionType, actionConfig, isActive } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (triggerType !== undefined) updateData.triggerType = triggerType;
    if (triggerConfig !== undefined) updateData.triggerConfig = triggerConfig;
    if (actionType !== undefined) updateData.actionType = actionType;
    if (actionConfig !== undefined) updateData.actionConfig = actionConfig;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    await Automation.update(updateData, { where: { id } });

    const updatedAutomation = await Automation.findByPk(id, {
      include: [
        {
          model: AutomationLog,
          as: 'logs',
          limit: 5,
          order: [['executedAt', 'DESC']],
        },
      ],
    });

    return successResponse(res, { automation: updatedAutomation }, 'Automation updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update automation', 500);
  }
});

// DELETE /automations/:id — soft delete automation
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);

    if (isNaN(id)) {
      return errorResponse(res, 'Invalid automation ID', 400);
    }

    const automation = await Automation.findByPk(id);

    if (!automation) {
      return errorResponse(res, 'Automation not found', 404);
    }

    // Verify workspace access through the board
    const board = await Board.findOne({
      where: { id: automation.boardId, workspaceId: req.user!.workspaceId },
    });

    if (!board) {
      return errorResponse(res, 'Access denied', 403);
    }

    await automation.destroy(); // paranoid soft delete

    return successResponse(res, null, 'Automation deleted');
  } catch (error) {
    return errorResponse(res, 'Failed to delete automation', 500);
  }
});

// POST /automations/:id/trigger — manually trigger an automation
router.post('/:id/trigger', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);

    if (isNaN(id)) {
      return errorResponse(res, 'Invalid automation ID', 400);
    }

    const automation = await Automation.findByPk(id);

    if (!automation) {
      return errorResponse(res, 'Automation not found', 404);
    }

    // Verify workspace access through the board
    const board = await Board.findOne({
      where: { id: automation.boardId, workspaceId: req.user!.workspaceId },
    });

    if (!board) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (!automation.isActive) {
      return errorResponse(res, 'Automation is not active', 400);
    }

    const { triggerData } = req.body;

    // Create an automation log entry for the manual trigger
    let logStatus: 'success' | 'failure' = 'success';
    let actionResult: Record<string, unknown> = {};
    let errorMessage: string | null = null;

    try {
      // Execute the automation action based on type
      // For now, log the manual trigger execution
      actionResult = {
        triggeredBy: req.user!.id,
        triggeredManually: true,
        actionType: automation.actionType,
        actionConfig: automation.actionConfig,
        timestamp: new Date().toISOString(),
      };
    } catch (execError) {
      logStatus = 'failure';
      errorMessage = execError instanceof Error ? execError.message : 'Automation execution failed';
    }

    const automationLog = await AutomationLog.create({
      automationId: automation.id,
      status: logStatus,
      triggerData: triggerData || { manual: true, triggeredBy: req.user!.id },
      actionResult,
      errorMessage,
      executedAt: new Date(),
    });

    return successResponse(res, { automationLog }, 'Automation triggered');
  } catch (error) {
    return errorResponse(res, 'Failed to trigger automation', 500);
  }
});

export default router;
