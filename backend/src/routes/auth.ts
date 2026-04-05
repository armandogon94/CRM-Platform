import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { authenticate } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import AuthService from '../services/AuthService';
import User from '../models/User';

const router = Router();

// POST /auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const result = await AuthService.login(email, password);

    return successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Login successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return errorResponse(res, message, 401);
  }
});

// POST /auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, workspaceId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return errorResponse(res, 'Email, password, firstName, and lastName are required', 400);
    }

    if (password.length < 8) {
      return errorResponse(res, 'Password must be at least 8 characters', 400);
    }

    const user = await AuthService.register(email, password, firstName, lastName, workspaceId);

    return successResponse(res, { user }, 'Registration successful', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    const status = message === 'Email already registered' ? 409 : 400;
    return errorResponse(res, message, status);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 400);
    }

    const result = await AuthService.refreshToken(refreshToken);

    return successResponse(res, { accessToken: result.accessToken }, 'Token refreshed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return errorResponse(res, message, 401);
  }
});

// POST /auth/logout (authenticated)
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    return successResponse(res, null, 'Logout successful');
  } catch (error) {
    return errorResponse(res, 'Logout failed', 500);
  }
});

// GET /auth/me (authenticated)
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await AuthService.getUserById(req.user!.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', 500);
  }
});

// PUT /auth/me (authenticated)
router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, avatar } = req.body;
    const userId = req.user!.id;

    const updateData: Record<string, string> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No fields to update', 400);
    }

    await User.update(updateData, { where: { id: userId } });

    const updatedUser = await AuthService.getUserById(userId);

    return successResponse(res, { user: updatedUser }, 'Profile updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update profile', 500);
  }
});

// PUT /auth/change-password (authenticated)
router.put('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, 'Old password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters', 400);
    }

    await AuthService.changePassword(req.user!.id, oldPassword, newPassword);

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password change failed';
    const status = message === 'Current password is incorrect' ? 401 : 400;
    return errorResponse(res, message, status);
  }
});

export default router;
