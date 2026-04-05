import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * Custom application error with HTTP status code and operational flag.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles 404 routes that don't match any defined endpoint.
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  const response: ApiResponse = {
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  };
  res.status(404).json(response);
}

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent ApiResponse format.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`Operational error: ${err.message}`);
  } else {
    logger.error(`Unexpected error: ${err.message}`, err.stack);
  }

  // Handle AppError
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Sequelize ValidationError
  if (err.name === 'SequelizeValidationError') {
    const validationErrors = (err as any).errors?.map(
      (e: any) => `${e.path}: ${e.message}`
    ) || [err.message];

    const response: ApiResponse = {
      success: false,
      error: 'Validation failed.',
      data: { errors: validationErrors },
    };
    res.status(400).json(response);
    return;
  }

  // Handle Sequelize UniqueConstraintError
  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = (err as any).fields || {};
    const response: ApiResponse = {
      success: false,
      error: `Duplicate value for: ${Object.keys(fields).join(', ')}`,
    };
    res.status(409).json(response);
    return;
  }

  // Handle Sequelize DatabaseError
  if (err.name === 'SequelizeDatabaseError') {
    const response: ApiResponse = {
      success: false,
      error: 'A database error occurred.',
    };
    res.status(500).json(response);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token.',
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      error: 'Token has expired.',
    };
    res.status(401).json(response);
    return;
  }

  // Handle SyntaxError (e.g., malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    const response: ApiResponse = {
      success: false,
      error: 'Malformed JSON in request body.',
    };
    res.status(400).json(response);
    return;
  }

  // Default: unhandled / unexpected error
  const response: ApiResponse = {
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message || 'An unexpected error occurred.',
  };
  res.status(500).json(response);
}
