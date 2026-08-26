import rateLimit from 'express-rate-limit';
import env from '../config/env';

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 200 : env.RATE_LIMIT_MAX_REQUESTS,
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
  max: env.NODE_ENV === 'development' ? 30 : 10, // 10 attempts per window in prod
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
  max: env.NODE_ENV === 'development' ? 50 : 20, // 20 requests per minute in prod
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
  max: env.NODE_ENV === 'development' ? 10 : 3, // 3 attempts per window in prod
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
  max: env.NODE_ENV === 'development' ? 20 : 5, // 5 broadcasts per hour in prod
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

/**
 * Rate limiter for account creation (prevent mass registration)
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'development' ? 20 : 5, // 5 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many accounts created',
    message: 'Too many account registrations from this address. Please try again later.',
    statusCode: 429,
  },
});

/**
 * Rate limiter for file upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 50 : 20, // 20 uploads per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload rate limit exceeded',
    message: 'Too many file uploads. Please try again later.',
    statusCode: 429,
  },
  keyGenerator: (req) => {
    return (req as any).user?.userId || req.ip || 'unknown';
  },
});
