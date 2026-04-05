import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler, notFoundHandler } from '../../middleware/errorHandler';

// Mock the logger so it doesn't produce output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function createMockReqRes() {
  const req = {
    method: 'GET',
    originalUrl: '/api/v1/nonexistent',
  } as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next: NextFunction = jest.fn();

  return { req, res, next };
}

describe('AppError', () => {
  it('should create an error with the given message and status code', () => {
    const error = new AppError('Not Found', 404);
    expect(error.message).toBe('Not Found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should default to 500 status code and operational true', () => {
    const error = new AppError('Server error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });
});

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle AppError with correct status code', () => {
    const { req, res, next } = createMockReqRes();
    const appError = new AppError('Resource not found', 404);

    errorHandler(appError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found',
    });
  });

  it('should handle generic Error with 500', () => {
    const { req, res, next } = createMockReqRes();
    const genericError = new Error('Something broke');

    errorHandler(genericError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it('should handle Sequelize ValidationError', () => {
    const { req, res, next } = createMockReqRes();
    const validationError = new Error('Validation failed') as any;
    validationError.name = 'SequelizeValidationError';
    validationError.errors = [
      { path: 'email', message: 'must be unique' },
      { path: 'firstName', message: 'cannot be null' },
    ];

    errorHandler(validationError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed.',
      data: {
        errors: ['email: must be unique', 'firstName: cannot be null'],
      },
    });
  });

  it('should handle Sequelize UniqueConstraintError', () => {
    const { req, res, next } = createMockReqRes();
    const uniqueError = new Error('Unique constraint') as any;
    uniqueError.name = 'SequelizeUniqueConstraintError';
    uniqueError.fields = { email: 'test@test.com' };

    errorHandler(uniqueError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate value for: email',
    });
  });

  it('should handle JsonWebTokenError', () => {
    const { req, res, next } = createMockReqRes();
    const jwtError = new Error('jwt malformed') as any;
    jwtError.name = 'JsonWebTokenError';

    errorHandler(jwtError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token.',
    });
  });

  it('should handle TokenExpiredError', () => {
    const { req, res, next } = createMockReqRes();
    const expiredError = new Error('jwt expired') as any;
    expiredError.name = 'TokenExpiredError';

    errorHandler(expiredError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token has expired.',
    });
  });
});

describe('notFoundHandler middleware', () => {
  it('should return 404 with route info', () => {
    const { req, res, next } = createMockReqRes();

    notFoundHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Route not found: GET /api/v1/nonexistent',
    });
  });
});
