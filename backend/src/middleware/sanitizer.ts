import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitize all string values in an object to prevent XSS.
 * Strips dangerous HTML tags and script injections from user input.
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* event handlers
      .replace(/\bon\w+\s*=\s*(['"]?).*?\1/gi, '')
      // Remove javascript: protocol
      .replace(/javascript\s*:/gi, '')
      // Remove data: protocol for security
      .replace(/data\s*:\s*text\/html/gi, '')
      // Strip dangerous HTML tags (keep safe ones)
      .replace(/<\/?(?:script|iframe|object|embed|form|input|button|textarea|select|style|link|meta|base)\b[^>]*>/gi, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent XSS and script injection attacks.
 */
export function inputSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    // Only sanitize string values in query
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeValue(req.params[key]);
      }
    }
  }
  next();
}
