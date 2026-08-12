import nodemailer from 'nodemailer';
import env from '../config/env';
import logger from './logger';

/**
 * Create mail transporter — uses SMTP if configured, otherwise logs to console
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
 * Send OTP verification email for password reset
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const transporter = createTransporter();

  const subject = 'Nexora — Password Reset OTP';
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0f; border: 1px solid #27272a; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 8px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; font-weight: bold; font-size: 18px;">N</div>
      </div>
      <h2 style="color: #ffffff; text-align: center; margin: 0 0 8px;">Password Reset</h2>
      <p style="color: #a1a1aa; text-align: center; font-size: 14px; margin: 0 0 24px;">Use the code below to reset your Nexora password. It expires in <strong style="color: #e4e4e7;">10 minutes</strong>.</p>
      <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #a78bfa; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #71717a; text-align: center; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      logger.info(`OTP email sent to ${to.substring(0, 3)}***`);
    } catch (error: any) {
      logger.error(`Failed to send OTP email: ${error.message}`);
      // Fallback to console in case of SMTP failure
      logger.warn(`[FALLBACK] OTP for ${to}: ${otp}`);
    }
  } else {
    // Development fallback — log to console
    logger.warn('─────────────────────────────────────────');
    logger.warn(`📧 OTP for ${to}: ${otp}`);
    logger.warn('  (Configure SMTP_HOST/SMTP_USER/SMTP_PASS to send real emails)');
    logger.warn('─────────────────────────────────────────');
  }
}
