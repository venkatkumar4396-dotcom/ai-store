import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from './logger';
import { suppressionService } from '../services/suppression.service';
import { validateEmailDeliverability } from './email-validator';

/**
 * Create reusable mail transporter — uses SMTP if configured, otherwise null
 */
function createTransporter() {
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return null;
}

/**
 * Premium outreach email HTML template with CAN-SPAM / GDPR compliant footer
 */
function buildOutreachHtml(body: string, recipientName: string, recipientEmail: string): string {
  const htmlBody = body.replace(/\n/g, '<br>');
  const unsubscribeUrl = suppressionService.getUnsubscribeUrl(recipientEmail);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #ffffff;">
      <div style="padding: 28px 24px; font-size: 15px; line-height: 1.65; color: #222222;">
        ${htmlBody}
      </div>
      <div style="padding: 20px 24px; border-top: 1px solid #eaeaea; font-size: 11px; line-height: 1.5; color: #888888; background-color: #fafafa;">
        <p style="margin: 0 0 6px 0;">
          Sent to <strong>${recipientEmail}</strong> on behalf of Nexora AI Automation Suite.
        </p>
        <p style="margin: 0 0 6px 0;">
          100 Innovation Parkway, Suite 400 • San Francisco, CA 94107 • USA
        </p>
        <p style="margin: 0;">
          If you no longer wish to receive sales correspondence from us, you can 
          <a href="${unsubscribeUrl}" style="color: #4f46e5; text-decoration: underline; font-weight: 500;">
            unsubscribe instantly with 1-click
          </a>.
        </p>
      </div>
    </div>
  `;
}

/**
 * Build plain-text version of the email with unsubscribe notice
 */
function buildPlainText(body: string, recipientEmail: string): string {
  const unsubscribeUrl = suppressionService.getUnsubscribeUrl(recipientEmail);
  return `${body.replace(/\\n/g, '\n')}

---
To unsubscribe, visit: ${unsubscribeUrl}
Nexora AI, 100 Innovation Parkway, Suite 400, San Francisco, CA 94107`;
}

export interface OutreachEmailOptions {
  to: string;
  toName: string;
  subject: string;
  body: string;
  replyTo?: string;
  skipMxValidation?: boolean;
}

export interface SendOutreachResult {
  success: boolean;
  status: 'sent' | 'suppressed' | 'invalid_email' | 'failed' | 'dev_preview';
  reason?: string;
}

/**
 * Send a CAN-SPAM compliant outreach email via SMTP with deliverability checks.
 */
export async function sendOutreachEmail(options: OutreachEmailOptions): Promise<SendOutreachResult> {
  const cleanEmail = options.to.trim().toLowerCase();

  // 1. Suppression & Opt-Out Check
  const isBlocked = await suppressionService.isSuppressed(cleanEmail);
  if (isBlocked) {
    logger.warn(`[CAN-SPAM GUARD] Skipped outreach to suppressed email: ${cleanEmail}`);
    return {
      success: false,
      status: 'suppressed',
      reason: 'Email is on the suppression opt-out list',
    };
  }

  // 2. DNS MX & Syntax Verification
  if (!options.skipMxValidation) {
    const deliverability = await validateEmailDeliverability(cleanEmail);
    if (!deliverability.isValid) {
      logger.warn(`[DELIVERABILITY GUARD] Rejected unverified email [${cleanEmail}]: ${deliverability.reason}`);
      return {
        success: false,
        status: 'invalid_email',
        reason: deliverability.reason,
      };
    }
  }

  const transporter = createTransporter();
  const html = buildOutreachHtml(options.body, options.toName, cleanEmail);
  const text = buildPlainText(options.body, cleanEmail);
  const unsubscribeUrl = suppressionService.getUnsubscribeUrl(cleanEmail);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: cleanEmail,
        replyTo: options.replyTo || env.SMTP_FROM,
        subject: options.subject,
        html,
        text,
        headers: {
          // RFC 2369 & RFC 8058 1-Click Unsubscribe headers
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Entity-Ref-ID': Buffer.from(cleanEmail).toString('base64url'),
        },
      });
      logger.info(`📧 Outreach email dispatched to ${options.toName} <${cleanEmail.substring(0, 3)}***>`);
      return { success: true, status: 'sent' };
    } catch (error: any) {
      logger.error(`Failed to dispatch email to ${cleanEmail}: ${error.message}`);
      return { success: false, status: 'failed', reason: error.message };
    }
  } else {
    // Development fallback — log to console
    logger.warn('─────────────────────────────────────────');
    logger.warn(`📧 OUTREACH EMAIL (dev mode preview)`);
    logger.warn(`  To: ${options.toName} <${cleanEmail}>`);
    logger.warn(`  Subject: ${options.subject}`);
    logger.warn(`  Unsubscribe: ${unsubscribeUrl}`);
    logger.warn(`  Body: ${options.body.substring(0, 150)}...`);
    logger.warn('─────────────────────────────────────────');
    return { success: true, status: 'dev_preview' };
  }
}
