import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { logSecurityEvent } from '../utils/securityLogger';

/**
 * Blocked file extensions — executables, scripts, and dangerous files
 */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.sh', '.bash', '.csh', '.ksh', '.zsh',
  '.ps1', '.psm1', '.psd1', '.ps1xml',
  '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh',
  '.dll', '.sys', '.drv', '.ocx',
  '.cpl', '.inf', '.reg', '.hta', '.lnk',
  '.jar', '.class', '.war',
  '.php', '.phtml', '.php3', '.php4', '.php5',
  '.asp', '.aspx', '.cshtml',
  '.py', '.pyc', '.pyo',
  '.rb', '.pl', '.cgi',
  '.svg',  // SVG can contain embedded JavaScript
]);

/**
 * Allowed MIME types for document upload
 */
const DOCUMENT_MIME_WHITELIST = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

/**
 * General allowed MIME types for file tracker uploads
 */
const GENERAL_MIME_WHITELIST = new Set([
  ...DOCUMENT_MIME_WHITELIST,
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'video/mp4', 'video/webm',
  'application/zip', 'application/gzip',
  'application/json',
  'text/html', 'text/css', 'text/xml',
]);

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Strips directory separators, null bytes, and unsafe characters.
 */
export function sanitizeFilename(filename: string): string {
  // Remove null bytes
  let safe = filename.replace(/\0/g, '');
  // Extract only the basename (remove any directory components)
  safe = path.basename(safe);
  // Remove any remaining path separators
  safe = safe.replace(/[/\\]/g, '');
  // Remove leading dots (hidden files / directory traversal)
  safe = safe.replace(/^\.+/, '');
  // Replace dangerous characters
  safe = safe.replace(/[<>:"|?*]/g, '_');
  // Ensure non-empty
  if (!safe || safe.length === 0) {
    safe = `upload_${Date.now()}`;
  }
  // Limit filename length
  if (safe.length > 255) {
    const ext = path.extname(safe);
    safe = safe.substring(0, 255 - ext.length) + ext;
  }
  return safe;
}

/**
 * Middleware factory: validate uploaded file against extension and MIME type restrictions.
 * 
 * @param mode - 'document' for strict doc-only uploads, 'general' for broader file types
 */
export function validateUploadedFile(mode: 'document' | 'general' = 'general') {
  const allowedMimes = mode === 'document' ? DOCUMENT_MIME_WHITELIST : GENERAL_MIME_WHITELIST;

  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;
    if (!file) {
      // No file uploaded — let the route handler deal with it
      next();
      return;
    }

    // Sanitize the filename
    file.originalname = sanitizeFilename(file.originalname);

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      logSecurityEvent('FILE_UPLOAD_BLOCKED', `Blocked upload of ${ext} file: ${file.originalname}`, {
        req,
        userId: (req as any).user?.userId,
      });
      res.status(400).json({
        error: `File type "${ext}" is not allowed for security reasons.`,
      });
      return;
    }

    // Check MIME type
    if (!allowedMimes.has(file.mimetype)) {
      logSecurityEvent('FILE_UPLOAD_BLOCKED', `Blocked upload with MIME ${file.mimetype}: ${file.originalname}`, {
        req,
        userId: (req as any).user?.userId,
      });
      res.status(400).json({
        error: `File type "${file.mimetype}" is not allowed. Accepted types: ${Array.from(allowedMimes).join(', ')}`,
      });
      return;
    }

    next();
  };
}
