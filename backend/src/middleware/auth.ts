import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Helper to parse cookies from header
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach((item) => {
    const parts = item.split('=');
    const name = parts[0].trim();
    if (name) {
      cookies[name] = parts.slice(1).join('=').trim();
    }
  });
  return cookies;
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Authentication middleware - verifies JWT token from Authorization header or cookie
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token && req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.nexora_token) {
        token = cookies.nexora_token;
      }
    }

    if (!token) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const payload = verifyToken(token);

    // Validate that the user exists in database to prevent orphaned sessions (e.g., after a DB reset)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      res.status(401).json({ error: 'User account no longer exists. Please sign up or log in again.' });
      return;
    }

    req.user = payload;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token has expired' });
      return;
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication - sets user if token exists, but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token && req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.nexora_token) {
        token = cookies.nexora_token;
      }
    }

    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }
    next();
  } catch {
    // Token invalid, but that's okay for optional auth
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
