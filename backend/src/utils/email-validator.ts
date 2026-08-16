/**
 * Email Deliverability & DNS MX Validator
 * Verifies email syntax, filters known disposable email providers,
 * and performs live DNS MX-record lookups to ensure the domain accepts mail.
 */

import dns from 'dns';
import logger from './logger';

// List of popular disposable / temp email domains to reject automatically
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.net',
  'trashmail.com',
  'sharklasers.com',
  'getairmail.com',
  'throwawaymail.com',
  'temp-mail.org',
  'dispostable.com',
  'yopmail.com',
  'fakeinbox.com',
]);

export interface EmailValidationResult {
  isValid: boolean;
  email: string;
  domain: string;
  reason?: string;
  hasMxRecords: boolean;
  isDisposable: boolean;
}

/**
 * Standard RFC 5322 compliant email regex pattern
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validate an email address by checking syntax, disposable domain lists, and DNS MX records.
 * @param email - Target email to test
 * @param timeoutMs - Max timeout for DNS lookup (default: 3000ms)
 */
export async function validateEmailDeliverability(
  email: string,
  timeoutMs: number = 3500
): Promise<EmailValidationResult> {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return {
      isValid: false,
      email: cleanEmail,
      domain: '',
      reason: 'Invalid email syntax',
      hasMxRecords: false,
      isDisposable: false,
    };
  }

  const parts = cleanEmail.split('@');
  const domain = parts[1];

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      email: cleanEmail,
      domain,
      reason: 'Disposable or temporary email domain',
      hasMxRecords: false,
      isDisposable: true,
    };
  }

  // Perform live DNS MX resolution
  try {
    const mxLookupPromise = dns.promises.resolveMx(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs)
    );

    const mxRecords = await Promise.race([mxLookupPromise, timeoutPromise]);

    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        email: cleanEmail,
        domain,
        reason: 'Domain has no active Mail Exchange (MX) records',
        hasMxRecords: false,
        isDisposable: false,
      };
    }

    return {
      isValid: true,
      email: cleanEmail,
      domain,
      hasMxRecords: true,
      isDisposable: false,
    };
  } catch (error: any) {
    logger.warn(`MX verification failed for domain [${domain}]: ${error.message}`);
    return {
      isValid: false,
      email: cleanEmail,
      domain,
      reason: `DNS MX lookup failed: ${error.code || error.message}`,
      hasMxRecords: false,
      isDisposable: false,
    };
  }
}

/**
 * Quick batch validator with concurrency limit
 */
export async function batchValidateEmails(
  emails: string[],
  concurrency: number = 5
): Promise<Map<string, EmailValidationResult>> {
  const results = new Map<string, EmailValidationResult>();
  const queue = [...emails];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const email = queue.shift();
      if (!email) break;
      const res = await validateEmailDeliverability(email);
      results.set(email.toLowerCase(), res);
    }
  });

  await Promise.all(workers);
  return results;
}
