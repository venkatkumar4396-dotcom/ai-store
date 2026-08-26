import { Request, Response, NextFunction } from 'express';

/**
 * Maximum allowed string length for general input fields.
 * Content fields (like document text) have their own higher limits in their routes.
 */
const MAX_STRING_LENGTH = 10000;
const MAX_SHORT_STRING_LENGTH = 500;

/**
 * Fields that are allowed to contain longer text (document content, AI prompts, etc.)
 */
const LONG_CONTENT_FIELDS = new Set([
  'content', 'text', 'prompt', 'systemPrompt', 'message', 'body',
  'generatedPrompt', 'faqData', 'supportDetails', 'pricingInfo',
  'features', 'screenshots', 'services', 'products',
  'reasoning', 'sentimentSummary', 'metadata',
]);

/**
 * Fields that should be short (names, labels, etc.)
 */
const SHORT_FIELDS = new Set([
  'name', 'email', 'label', 'provider', 'symbol', 'ticker',
  'origin', 'destination', 'pnr', 'slug', 'category',
]);

/**
 * Keys that indicate prototype pollution attempts
 */
const DANGEROUS_KEYS = new Set([
  '__proto__', 'constructor', 'prototype',
]);

/**
 * Recursively sanitize all string values in an object to prevent XSS.
 * Strips dangerous HTML tags, script injections, and prototype pollution.
 */
function sanitizeValue(value: any, fieldName?: string): any {
  if (typeof value === 'string') {
    // Apply length limits based on field type
    const maxLen = SHORT_FIELDS.has(fieldName || '')
      ? MAX_SHORT_STRING_LENGTH
      : LONG_CONTENT_FIELDS.has(fieldName || '')
        ? 100000  // 100K for content fields
        : MAX_STRING_LENGTH;

    let sanitized = value.length > maxLen ? value.substring(0, maxLen) : value;

    sanitized = sanitized
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* event handlers
      .replace(/\bon\w+\s*=\s*(['"]?).*?\1/gi, '')
      // Remove javascript: protocol
      .replace(/javascript\s*:/gi, '')
      // Remove data: protocol for security
      .replace(/data\s*:\s*text\/html/gi, '')
      // Remove vbscript: protocol
      .replace(/vbscript\s*:/gi, '')
      // Strip dangerous HTML tags (keep safe ones)
      .replace(/<\/?(?:script|iframe|object|embed|form|input|button|textarea|select|style|link|meta|base|applet|marquee|bgsound|layer|ilayer)\b[^>]*>/gi, '')
      .trim();

    return sanitized;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, fieldName));
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      // Block prototype pollution
      if (DANGEROUS_KEYS.has(key)) {
        continue; // Silently drop dangerous keys
      }
      sanitized[key] = sanitizeValue(value[key], key);
    }
    return sanitized;
  }
  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent XSS, script injection, and prototype pollution attacks.
 */
export function inputSanitizer(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    // Only sanitize string values in query
    for (const key of Object.keys(req.query)) {
      if (DANGEROUS_KEYS.has(key)) {
        delete req.query[key];
        continue;
      }
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeValue(req.query[key], key);
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeValue(req.params[key], key);
      }
    }
  }
  next();
}
