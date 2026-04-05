import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/**
 * Middleware factory that validates required fields exist in the request body.
 * Returns 400 with a list of missing field names if validation fails.
 */
export function validateBody(requiredFields: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        data: { missingFields },
      });
      return;
    }

    next();
  };
}
