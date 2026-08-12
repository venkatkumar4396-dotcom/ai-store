import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Sign a JWT token with the given payload
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Decode a JWT token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token);
  return decoded as JwtPayload | null;
}
