import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Create a standardized application error
 */
export function createError(message: string, statusCode: number = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * 404 Not Found handler - catches unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
  });
}

/**
 * Fields that must NEVER appear in logs (passwords, tokens, OTPs, secrets)
 */
const SENSITIVE_FIELDS = new Set([
  'password', 'currentPassword', 'newPassword', 'passwordHash',
  'token', 'resetToken', 'otp', 'secret', 'key', 'encryptedKey',
  'authorization', 'cookie',
]);

/**
 * Deep-clone an object and replace sensitive field values with '[REDACTED]'
 */
function redactSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveFields);

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveFields(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error with sensitive fields redacted
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`, {
      stack: err.stack,
      body: redactSensitiveFields(req.body),
      params: req.params,
      query: req.query,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`);
  }

  // Build response
  const response: Record<string, any> = {
    error: statusCode >= 500 ? 'Internal Server Error' : message,
    statusCode,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  // Include original message in development for 500 errors
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}
