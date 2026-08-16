/**
 * Suppression & Unsubscribe Service — CAN-SPAM / GDPR Compliance
 * Manages opt-out suppression lists, cryptographic unsubscribe token verification,
 * and automatic contact blocking.
 */

import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class SuppressionService {
  /**
   * Generates a tamper-proof HMAC unsubscribe token for an email address
   */
  generateUnsubscribeToken(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    const hmac = crypto.createHmac('sha256', env.JWT_SECRET || 'suppression-secret-key');
    hmac.update(cleanEmail);
    const signature = hmac.digest('hex');
    const payload = Buffer.from(cleanEmail).toString('base64url');
    return `${payload}.${signature}`;
  }

  /**
   * Verifies the unsubscribe token and extracts the authenticated email address
   */
  verifyUnsubscribeToken(token: string): string | null {
    try {
      const [payload, signature] = token.split('.');
      if (!payload || !signature) return null;

      const email = Buffer.from(payload, 'base64url').toString('utf8').toLowerCase();
      const expectedToken = this.generateUnsubscribeToken(email);

      if (token === expectedToken) {
        return email;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Checks if an email is on the suppression list
   */
  async isSuppressed(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const record = await prisma.unsubscribedContact.findUnique({
      where: { email: cleanEmail },
    });
    return !!record;
  }

  /**
   * Adds an email to the suppression database and marks any existing leads as unsubscribed
   */
  async unsubscribe(email: string, reason: string = 'user_opt_out'): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Record in UnsubscribedContact table (upsert to prevent duplicate conflicts)
    await prisma.unsubscribedContact.upsert({
      where: { email: cleanEmail },
      update: { reason },
      create: { email: cleanEmail, reason },
    });

    // 2. Update status of any existing sales leads with this email
    await prisma.salesLead.updateMany({
      where: { email: cleanEmail },
      data: { status: 'unsubscribed' },
    });

    logger.info(`[CAN-SPAM/GDPR] Email added to suppression list: ${cleanEmail} (Reason: ${reason})`);
  }

  /**
   * Builds a full 1-click unsubscribe URL
   */
  getUnsubscribeUrl(email: string): string {
    const token = this.generateUnsubscribeToken(email);
    const origin = env.CORS_ORIGIN || 'http://localhost:3000';
    return `${origin}/api/agents/sales/unsubscribe?token=${token}`;
  }
}

export const suppressionService = new SuppressionService();
