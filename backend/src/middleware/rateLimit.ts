import rateLimit from 'express-rate-limit';
import env from '../config/env';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    statusCode: 429,
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fall back to IP
    return (req as any).user?.userId || req.ip || 'unknown';
  },
});

/**
 * Strict rate limiter for auth endpoints (login/register)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 10000 : 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts. Please try again after 15 minutes.',
    statusCode: 429,
  },
});

/**
 * Rate limiter for AI endpoints (more restrictive)
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'development' ? 10000 : 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI rate limit exceeded',
    message: 'Too many AI requests. Please slow down.',
    statusCode: 429,
  },
  keyGenerator: (req) => {
    return (req as any).user?.userId || req.ip || 'unknown';
  },
});

/**
 * Strict rate limiter for OTP/forgot-password endpoints
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 10000 : 3, // 3 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many OTP requests',
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
    statusCode: 429,
  },
});

/**
 * Rate limiter for WhatsApp broadcast (very restrictive)
 */
export const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'development' ? 10000 : 5, // 5 broadcasts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Broadcast rate limit exceeded',
    message: 'Too many broadcasts. Please try again later.',
    statusCode: 429,
  },
  keyGenerator: (req) => {
    return (req as any).user?.userId || req.ip || 'unknown';
  },
});
