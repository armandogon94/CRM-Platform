import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthRequest, AuthUser } from '../types';
import { errorResponse } from '../utils/response';

/**
 * Extracts the Bearer token from the Authorization header.
 */
function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Maps a decoded JWT payload to an AuthUser object.
 */
function mapPayloadToUser(decoded: jwt.JwtPayload): AuthUser {
  return {
    id: decoded.sub as unknown as number,
    email: decoded.email,
    workspaceId: decoded.workspaceId,
    role: decoded.role,
    firstName: decoded.firstName,
    lastName: decoded.lastName,
  };
}

/**
 * Authentication middleware that requires a valid JWT token.
 * Attaches the decoded user payload to req.user.
 */
export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    errorResponse(res, 'Authentication required. No token provided.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    req.user = mapPayloadToUser(decoded);
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      errorResponse(res, 'Token has expired.', 401);
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      errorResponse(res, 'Invalid token.', 401);
      return;
    }

    errorResponse(res, 'Authentication failed.', 401);
  }
}

/**
 * Optional authentication middleware.
 * Attaches the user if a valid token is present, but does not fail if absent.
 */
export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
    req.user = mapPayloadToUser(decoded);
  } catch {
    // Do not fail -- just proceed without user
  }

  next();
}
