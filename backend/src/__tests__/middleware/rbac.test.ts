import { Response, NextFunction } from 'express';
import { requireRole, requirePermission, requireWorkspaceAccess } from '../../middleware/rbac';
import { AuthRequest } from '../../types';

function createMockReqResNext(userOverrides?: Partial<AuthRequest['user']>) {
  const req = {
    headers: {},
    params: {},
    user: userOverrides
      ? {
          id: 1,
          email: 'test@example.com',
          workspaceId: 10,
          role: 'member' as const,
          firstName: 'Test',
          lastName: 'User',
          ...userOverrides,
        }
      : undefined,
  } as unknown as AuthRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next: NextFunction = jest.fn();

  return { req, res, next };
}

describe('requireRole middleware', () => {
  it('should allow matching role', () => {
    const { req, res, next } = createMockReqResNext({ role: 'admin' });

    const middleware = requireRole('admin', 'member');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject non-matching role (403)', () => {
    const { req, res, next } = createMockReqResNext({ role: 'viewer' });

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Access denied'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject if no user on request (401)', () => {
    const { req, res, next } = createMockReqResNext();
    // user is undefined because no overrides were passed with a truthy value
    req.user = undefined;

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Authentication required.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow when user has one of multiple accepted roles', () => {
    const { req, res, next } = createMockReqResNext({ role: 'member' });

    const middleware = requireRole('admin', 'member');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('requirePermission middleware', () => {
  it('should allow when user role has the required permission', () => {
    const { req, res, next } = createMockReqResNext({ role: 'admin' });

    const middleware = requirePermission('workspace:manage');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject when user role lacks the required permission (403)', () => {
    const { req, res, next } = createMockReqResNext({ role: 'viewer' });

    const middleware = requirePermission('contacts:write');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Missing permission'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject if no user on request (401)', () => {
    const { req, res, next } = createMockReqResNext();
    req.user = undefined;

    const middleware = requirePermission('contacts:read');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireWorkspaceAccess middleware', () => {
  it('should allow matching workspaceId', () => {
    const { req, res, next } = createMockReqResNext({ workspaceId: 10 });
    req.params = { workspaceId: '10' };

    requireWorkspaceAccess(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject mismatched workspaceId (403)', () => {
    const { req, res, next } = createMockReqResNext({ workspaceId: 10 });
    req.params = { workspaceId: '99' };

    requireWorkspaceAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Access denied'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject if no user on request (401)', () => {
    const { req, res, next } = createMockReqResNext();
    req.user = undefined;
    req.params = { workspaceId: '10' };

    requireWorkspaceAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject invalid (non-numeric) workspaceId (400)', () => {
    const { req, res, next } = createMockReqResNext({ workspaceId: 10 });
    req.params = { workspaceId: 'abc' };

    requireWorkspaceAccess(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid workspace ID.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
