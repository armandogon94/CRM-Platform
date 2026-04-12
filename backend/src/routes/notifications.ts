import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { successResponse, errorResponse } from '../utils/response';
import NotificationService from '../services/NotificationService';

const router = Router();

// GET /notifications — list paginated notifications for authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.user!.workspaceId;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await NotificationService.list(userId, workspaceId, {
      page,
      limit,
      unreadOnly: unreadOnly || undefined,
    });

    return successResponse(res, {
      notifications: result.rows,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
});

// GET /notifications/unread-count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const count = await NotificationService.getUnreadCount(
      req.user!.id,
      req.user!.workspaceId
    );
    return successResponse(res, { count });
  } catch (error) {
    return errorResponse(res, 'Failed to get unread count', 500);
  }
});

// PUT /notifications/read-all — mark all as read (must be before /:id/read)
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markAllRead(req.user!.id, req.user!.workspaceId);
    return successResponse(res, null, 'All notifications marked as read');
  } catch (error) {
    return errorResponse(res, 'Failed to mark all as read', 500);
  }
});

// PUT /notifications/:id/read — mark single notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return errorResponse(res, 'Invalid notification ID', 400);
    }

    const notification = await NotificationService.markRead(id, req.user!.id);
    return successResponse(res, notification, 'Notification marked as read');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark as read';
    const status = message === 'Notification not found' ? 404 : 500;
    return errorResponse(res, message, status);
  }
});

export default router;
