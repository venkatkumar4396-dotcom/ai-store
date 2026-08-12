import crypto from 'crypto';
import env from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getKey(): Buffer {
  // Ensure the key is exactly 32 bytes for AES-256
  const key = env.ENCRYPTION_KEY;
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-CBC
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an AES-256-CBC encrypted string
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length < 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts.slice(1).join(':');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a random token of specified byte length
 */
export function generateToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Create a SHA-256 hash of a string
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
