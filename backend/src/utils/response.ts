import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Sends a success response with optional data, message, and status code.
 */
export function successResponse<T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
}

/**
 * Sends an error response with an error message and status code.
 */
export function errorResponse(
  res: Response,
  error: string,
  statusCode: number = 500
): void {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

/**
 * Sends a paginated success response with data and pagination metadata.
 */
export function paginatedResponse<T = any>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string,
  statusCode: number = 200
): void {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
    },
  };
  res.status(statusCode).json(response);
}
