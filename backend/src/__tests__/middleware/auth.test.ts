import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { AuthRequest } from '../../types';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

// Mock config
jest.mock('../../config', () => ({
  default: {
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
  },
  __esModule: true,
}));

// Mock response utility so it doesn't pull in unmocked dependencies
jest.mock('../../utils/response', () => ({
  errorResponse: (res: any, message: string, statusCode: number) => {
    res.status(statusCode).json({ success: false, error: message });
  },
}));

const mockedVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function createMockReqResNext() {
  const req = {
    headers: {},
    user: undefined,
  } as unknown as AuthRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next: NextFunction = jest.fn();

  return { req, res, next };
}

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject request without token (401)', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = {};

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('No token provided'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token (401)', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Bearer invalid-token' };

    const jwtError = new Error('jwt malformed');
    jwtError.name = 'JsonWebTokenError';
    mockedVerify.mockImplementation(() => {
      throw jwtError;
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid token.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with expired token (401)', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Bearer expired-token' };

    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    mockedVerify.mockImplementation(() => {
      throw expiredError;
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Token has expired.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should attach user to request with valid token', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Bearer valid-token' };

    const payload = {
      sub: 1,
      email: 'test@example.com',
      workspaceId: 10,
      role: 'admin',
      firstName: 'John',
      lastName: 'Doe',
    };
    mockedVerify.mockReturnValue(payload as any);

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 1,
      email: 'test@example.com',
      workspaceId: 10,
      role: 'admin',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('should reject request with non-Bearer authorization header', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Basic some-credentials' };

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle unknown jwt errors with generic auth failed message', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Bearer some-token' };

    const unknownError = new Error('Something went wrong');
    unknownError.name = 'SomeOtherError';
    mockedVerify.mockImplementation(() => {
      throw unknownError;
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Authentication failed.',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe('optionalAuth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should pass through without token and not set user', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = {};

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it('should attach user with valid token', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Bearer valid-token' };

    const payload = {
      sub: 5,
      email: 'user@test.com',
      workspaceId: 20,
      role: 'member',
      firstName: 'Jane',
      lastName: 'Smith',
    };
    mockedVerify.mockReturnValue(payload as any);

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 5,
      email: 'user@test.com',
      workspaceId: 20,
      role: 'member',
      firstName: 'Jane',
      lastName: 'Smith',
    });
  });

  it('should proceed without user when token is invalid', () => {
    const { req, res, next } = createMockReqResNext();
    req.headers = { authorization: 'Bearer bad-token' };

    mockedVerify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });
});
