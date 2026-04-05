import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/**
 * Permission map: defines which permissions each role has.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'contacts:read',
    'contacts:write',
    'contacts:delete',
    'deals:read',
    'deals:write',
    'deals:delete',
    'tasks:read',
    'tasks:write',
    'tasks:delete',
    'workspace:manage',
    'workspace:settings',
    'users:manage',
    'users:invite',
    'reports:read',
    'reports:export',
    'files:upload',
    'files:delete',
    'pipeline:manage',
    'email:send',
    'email:read',
  ],
  member: [
    'contacts:read',
    'contacts:write',
    'deals:read',
    'deals:write',
    'tasks:read',
    'tasks:write',
    'reports:read',
    'files:upload',
    'pipeline:manage',
    'email:send',
    'email:read',
  ],
  viewer: [
    'contacts:read',
    'deals:read',
    'tasks:read',
    'reports:read',
    'email:read',
  ],
};

/**
 * Middleware factory that checks whether the authenticated user's role
 * is among the allowed roles.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware factory that checks whether the authenticated user has
 * a specific permission based on their role.
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Missing permission: ${permission}.`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware that ensures the authenticated user belongs to the workspace
 * specified in the route parameters (req.params.workspaceId).
 */
export function requireWorkspaceAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
    return;
  }

  const rawId = req.params.workspaceId as string;
  const workspaceId = parseInt(rawId, 10);

  if (isNaN(workspaceId)) {
    res.status(400).json({
      success: false,
      error: 'Invalid workspace ID.',
    });
    return;
  }

  if (req.user.workspaceId !== workspaceId) {
    res.status(403).json({
      success: false,
      error: 'Access denied. You do not belong to this workspace.',
    });
    return;
  }

  next();
}
