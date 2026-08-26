import winston from 'winston';
import path from 'path';
import { Request } from 'express';
import env from '../config/env';

/**
 * Dedicated security event logger for authentication, authorization,
 * and abuse-detection events. Writes to a separate security.log file
 * in production and always logs to console.
 */

// Security event types
export type SecurityEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_LOCKOUT'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'OTP_VERIFIED'
  | 'OTP_FAILED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'RATE_LIMIT_HIT'
  | 'UNAUTHORIZED_ACCESS'
  | 'IDOR_ATTEMPT'
  | 'SUSPICIOUS_INPUT'
  | 'FILE_UPLOAD_BLOCKED'
  | 'SSRF_BLOCKED';

interface SecurityLogEntry {
  event: SecurityEvent;
  ip?: string;
  userId?: string;
  email?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  details?: string;
}

const securityFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [SECURITY] ${level.toUpperCase()}: ${message} ${JSON.stringify(meta)}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: 🔐 ${message}`;
      })
    ),
  }),
];

// Always write security events to file (even in development)
transports.push(
  new winston.transports.File({
    filename: path.resolve('logs', 'security.log'),
    format: securityFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
  })
);

const securityLogger = winston.createLogger({
  level: 'info',
  transports,
  exitOnError: false,
});

/**
 * Extract client metadata from an Express request
 */
function extractRequestMeta(req?: Request): Partial<SecurityLogEntry> {
  if (!req) return {};
  return {
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent']?.substring(0, 200),
    path: req.originalUrl,
    method: req.method,
  };
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  event: SecurityEvent,
  details: string,
  extra?: { req?: Request; userId?: string; email?: string }
): void {
  const meta = {
    event,
    ...extractRequestMeta(extra?.req),
    userId: extra?.userId,
    email: extra?.email,
  };

  const isWarning = [
    'LOGIN_FAILED', 'LOGIN_LOCKOUT', 'OTP_FAILED', 'TOKEN_EXPIRED',
    'TOKEN_INVALID', 'RATE_LIMIT_HIT', 'UNAUTHORIZED_ACCESS',
    'IDOR_ATTEMPT', 'SUSPICIOUS_INPUT', 'FILE_UPLOAD_BLOCKED', 'SSRF_BLOCKED',
  ].includes(event);

  if (isWarning) {
    securityLogger.warn(`${event}: ${details}`, meta);
  } else {
    securityLogger.info(`${event}: ${details}`, meta);
  }
}

export default securityLogger;
