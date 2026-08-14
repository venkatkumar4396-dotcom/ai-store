import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signToken, JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';
import * as crypto from 'crypto';
import { sendOtpEmail } from '../utils/email';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

// ─── Constants ──────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_VERIFY_ATTEMPTS = 5;
const RESET_PERMISSION_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes to use reset permission

// ─── Password Complexity ────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const PASSWORD_RULES = 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.';

// ─── Email Validation ───────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ─── Interfaces ─────────────────────────────────────────────

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
    createdAt: Date;
  };
  token: string;
}

// ─── Helper: parse preferences JSON safely ──────────────────
function parsePreferences(prefs: string | null): Record<string, any> {
  if (!prefs) return {};
  try {
    return JSON.parse(prefs);
  } catch {
    return {};
  }
}

// ─── Helper: create error with status code ──────────────────
function createError(message: string, statusCode: number): Error & { statusCode: number } {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, name, password } = input;
  const cleanEmail = email.toLowerCase().trim();

  // Validate email format
  if (!EMAIL_REGEX.test(cleanEmail)) {
    throw createError('Please provide a valid email address.', 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Validate password strength
  if (!PASSWORD_REGEX.test(password)) {
    throw createError(PASSWORD_RULES, 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
    },
  });

  // Generate token
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const token = signToken(tokenPayload);

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'register',
      entityType: 'user',
      entityId: user.id,
      metadata: JSON.stringify({ email: user.email }),
    },
  });

  logger.info(`User registered: ${user.email}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Ensure root admin kumar exists in database
 */
export async function ensureAdminSeeded() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'kumar@nexora.ai' },
          { name: { equals: 'kumar', mode: 'insensitive' } },
        ],
      },
    });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('kumar@4396', salt);

    if (!adminExists) {
      await prisma.user.create({
        data: {
          email: 'kumar@nexora.ai',
          name: 'kumar',
          passwordHash,
          role: 'admin',
          provider: 'credentials',
          preferences: JSON.stringify({ theme: 'dark' }),
        },
      });
      logger.info('Auto-seeded root admin account: kumar (kumar@nexora.ai)');
    } else {
      // Ensure role is admin and password is up to date
      await prisma.user.update({
        where: { id: adminExists.id },
        data: {
          role: 'admin',
          passwordHash,
        },
      });
    }
  } catch (err: any) {
    logger.warn(`Failed to auto-seed admin: ${err.message}`);
  }
}

/**
 * Login an existing user — with failed attempt tracking and account lockout
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;
  const cleanEmail = email.toLowerCase().trim();

  // If logging in as admin kumar, guarantee admin exists
  if (cleanEmail === 'kumar' || cleanEmail === 'kumar@nexora.ai' || cleanEmail === 'admin') {
    await ensureAdminSeeded();
  }

  // Find user by email or name/username
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        { email: `${cleanEmail}@nexora.ai` },
        { email: `${cleanEmail}@gmail.com` },
        { name: { equals: cleanEmail, mode: 'insensitive' } },
        { name: { equals: email.trim(), mode: 'insensitive' } },
      ],
    },
  });

  if (!user) {
    throw createError('Invalid email/username or password', 401);
  }

  // Check account lockout
  const prefs = parsePreferences(user.preferences);
  if (prefs.loginLockedUntil && Date.now() < prefs.loginLockedUntil) {
    const minutesLeft = Math.ceil((prefs.loginLockedUntil - Date.now()) / 60000);
    throw createError(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`, 423);
  }

  // Prevent password login for OAuth-only accounts (no real password set)
  if (user.provider && user.provider !== 'credentials' && user.passwordHash.startsWith('$NO_PASSWORD$')) {
    throw createError(`This account uses ${user.provider} sign-in. Please use the ${user.provider} button.`, 400);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    // Track failed attempts
    const failedAttempts = (prefs.failedLoginAttempts || 0) + 1;
    const updatedPrefs: Record<string, any> = { ...prefs, failedLoginAttempts: failedAttempts };

    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      updatedPrefs.loginLockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
      updatedPrefs.failedLoginAttempts = 0;
      logger.warn(`Account locked for ${user.email} after ${MAX_LOGIN_ATTEMPTS} failed attempts`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(updatedPrefs) },
    });

    throw createError('Invalid email or password', 401);
  }

  // Clear failed attempts on successful login
  if (prefs.failedLoginAttempts || prefs.loginLockedUntil) {
    const cleanedPrefs = { ...prefs };
    delete cleanedPrefs.failedLoginAttempts;
    delete cleanedPrefs.loginLockedUntil;
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(cleanedPrefs) },
    });
  }

  // Generate token
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const token = signToken(tokenPayload);

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
    },
  });

  logger.info(`User logged in: ${user.email}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Get current user profile
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      preferences: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          botInstances: true,
          whatsappSessions: true,
          fileTrackers: true,
          apiKeys: true,
        },
      },
    },
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Return preferences without auth-internal fields
  const prefs = parsePreferences(user.preferences);
  delete prefs.otpHash;
  delete prefs.otpExpires;
  delete prefs.otpAttempts;
  delete prefs.otpEmail;
  delete prefs.resetPermissionToken;
  delete prefs.resetPermissionExpires;
  delete prefs.failedLoginAttempts;
  delete prefs.loginLockedUntil;
  delete prefs.passwordResetToken;
  delete prefs.passwordResetExpires;

  return {
    ...user,
    preferences: Object.keys(prefs).length > 0 ? prefs : null,
  };
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, data: { name?: string; avatar?: string; preferences?: Record<string, any> }) {
  const updateData: any = {};

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.avatar !== undefined) updateData.avatar = data.avatar;
  if (data.preferences !== undefined) {
    // Merge with existing preferences, preserving auth-internal fields
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const existingPrefs = parsePreferences(user?.preferences || null);
    const mergedPrefs = { ...existingPrefs, ...data.preferences };
    updateData.preferences = JSON.stringify(mergedPrefs);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      preferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Strip auth-internal fields from response
  const prefs = parsePreferences(user.preferences);
  delete prefs.otpHash;
  delete prefs.otpExpires;
  delete prefs.otpAttempts;
  delete prefs.otpEmail;
  delete prefs.resetPermissionToken;
  delete prefs.resetPermissionExpires;
  delete prefs.failedLoginAttempts;
  delete prefs.loginLockedUntil;

  return {
    ...user,
    preferences: Object.keys(prefs).length > 0 ? prefs : null,
  };
}

/**
 * Change user password (authenticated users)
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw createError('User not found', 404);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw createError('Current password is incorrect', 400);
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    throw createError(PASSWORD_RULES, 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  logger.info(`Password changed for user: ${user.email}`);
}

/**
 * Login/Register via Google/GitHub OAuth
 */
export async function loginWithOAuth(
  provider: string,
  providerId: string,
  email: string,
  name: string,
  avatar?: string
): Promise<AuthResponse> {
  const cleanEmail = email.toLowerCase().trim();
  
  // Find user by provider + providerId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { provider, providerId },
        { email: cleanEmail }
      ]
    }
  });

  if (user) {
    // Link provider info if logging in via oauth for first time but email matching exists
    if (!user.providerId || !user.provider) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { provider, providerId, avatar: avatar || user.avatar }
      });
    }
  } else {
    // Create new user — use a marker password hash that bcrypt.compare will never match
    const noPasswordHash = `$NO_PASSWORD$${crypto.randomBytes(32).toString('hex')}`;
    user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name.trim(),
        passwordHash: noPasswordHash,
        provider,
        providerId,
        avatar
      }
    });
  }

  // Generate token
  const tokenPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const token = signToken(tokenPayload);

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'oauth_login',
      entityType: 'user',
      entityId: user.id,
      metadata: JSON.stringify({ provider }),
    },
  });

  logger.info(`OAuth login via ${provider}: ${user.email}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    token,
  };
}

/**
 * Generate 6-digit OTP for password reset and send via email
 * IMPORTANT: Always returns the same message to prevent user enumeration
 */
export async function forgotPassword(email: string): Promise<{ message: string; devNote?: string; debugOtp?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const genericMessage = 'If an account with this email exists, a 6-digit OTP has been sent.';

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  
  // Always return same message — prevents user enumeration
  if (!user) {
    return { message: genericMessage };
  }

  // Don't allow OTP for OAuth-only users (they don't have a password)
  if (user.provider && user.provider !== 'credentials' && user.passwordHash.startsWith('$NO_PASSWORD$')) {
    return { message: genericMessage };
  }

  // Generate cryptographically secure 6-digit OTP
  const otpNumber = crypto.randomInt(100000, 999999);
  const otp = otpNumber.toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

  const prefsObj = parsePreferences(user.preferences);
  prefsObj.otpHash = otpHash;
  prefsObj.otpExpires = Date.now() + OTP_EXPIRY_MS;
  prefsObj.otpAttempts = 0;
  prefsObj.otpEmail = cleanEmail;

  // Clean up any old reset tokens
  delete prefsObj.passwordResetToken;
  delete prefsObj.passwordResetExpires;
  delete prefsObj.resetPermissionToken;
  delete prefsObj.resetPermissionExpires;

  await prisma.user.update({
    where: { id: user.id },
    data: { preferences: JSON.stringify(prefsObj) }
  });

  // Send OTP via email (or console in dev)
  await sendOtpEmail(cleanEmail, otp);

  logger.info(`OTP generated for password reset: ${cleanEmail}`);

  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (isDev && !smtpConfigured) {
    return {
      message: genericMessage,
      devNote: `[DEV MODE] OTP: ${otp}`,
      debugOtp: otp,
    };
  }

  return { message: genericMessage };
}

/**
 * Verify OTP and return a short-lived reset permission token
 */
export async function verifyOtp(email: string, otp: string): Promise<{ resetPermissionToken: string }> {
  const cleanEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user) {
    throw createError('Invalid OTP or email.', 400);
  }

  const prefs = parsePreferences(user.preferences);

  // Check if OTP exists
  if (!prefs.otpHash || !prefs.otpExpires) {
    throw createError('No OTP request found. Please request a new one.', 400);
  }

  // Check expiry
  if (Date.now() > prefs.otpExpires) {
    // Clean up expired OTP
    delete prefs.otpHash;
    delete prefs.otpExpires;
    delete prefs.otpAttempts;
    delete prefs.otpEmail;
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(prefs) },
    });
    throw createError('OTP has expired. Please request a new one.', 400);
  }

  // Check max attempts
  if ((prefs.otpAttempts || 0) >= MAX_OTP_VERIFY_ATTEMPTS) {
    // Invalidate OTP after too many attempts
    delete prefs.otpHash;
    delete prefs.otpExpires;
    delete prefs.otpAttempts;
    delete prefs.otpEmail;
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(prefs) },
    });
    throw createError('Too many failed OTP attempts. Please request a new code.', 429);
  }

  // Verify OTP
  const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(prefs.otpHash, 'hex'))) {
    // Increment attempt counter
    prefs.otpAttempts = (prefs.otpAttempts || 0) + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(prefs) },
    });
    const remaining = MAX_OTP_VERIFY_ATTEMPTS - prefs.otpAttempts;
    throw createError(`Invalid OTP. ${remaining} attempt(s) remaining.`, 400);
  }

  // OTP verified — generate a short-lived reset permission token
  const resetPermissionToken = crypto.randomBytes(32).toString('hex');
  const resetPermissionHash = crypto.createHash('sha256').update(resetPermissionToken).digest('hex');

  // Clear OTP and set reset permission
  delete prefs.otpHash;
  delete prefs.otpExpires;
  delete prefs.otpAttempts;
  delete prefs.otpEmail;
  prefs.resetPermissionToken = resetPermissionHash;
  prefs.resetPermissionExpires = Date.now() + RESET_PERMISSION_EXPIRY_MS;

  await prisma.user.update({
    where: { id: user.id },
    data: { preferences: JSON.stringify(prefs) },
  });

  logger.info(`OTP verified for: ${cleanEmail}`);
  return { resetPermissionToken };
}

/**
 * Reset password using a verified reset permission token
 */
export async function resetPassword(email: string, resetPermissionToken: string, newPassword: string): Promise<void> {
  if (!PASSWORD_REGEX.test(newPassword)) {
    throw createError(PASSWORD_RULES, 400);
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (!user) {
    throw createError('Password reset failed. Please try again.', 400);
  }

  const prefs = parsePreferences(user.preferences);

  // Verify reset permission token
  if (!prefs.resetPermissionToken || !prefs.resetPermissionExpires) {
    throw createError('No verified reset session found. Please verify OTP first.', 400);
  }

  if (Date.now() > prefs.resetPermissionExpires) {
    delete prefs.resetPermissionToken;
    delete prefs.resetPermissionExpires;
    await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(prefs) },
    });
    throw createError('Reset session has expired. Please start over.', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(resetPermissionToken).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(tokenHash, 'hex'), Buffer.from(prefs.resetPermissionToken, 'hex'))) {
    throw createError('Invalid reset token. Please verify OTP again.', 400);
  }

  // All verified — hash and save new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Clear all reset-related preferences
  delete prefs.resetPermissionToken;
  delete prefs.resetPermissionExpires;
  delete prefs.failedLoginAttempts;
  delete prefs.loginLockedUntil;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      preferences: JSON.stringify(prefs),
    }
  });

  logger.info(`Password successfully reset for user: ${user.email}`);
}

/**
 * Generate email verification token and save in preferences JSON
 */
export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

  const preferencesObj = parsePreferences(user.preferences);
  preferencesObj.emailVerificationToken = tokenHash;
  preferencesObj.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  preferencesObj.isEmailVerified = false;

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: JSON.stringify(preferencesObj) }
  });

  logger.info(`Email verification token generated for user: ${user.email}`);
  return verificationToken;
}

/**
 * Verify email using the token — searches by email instead of scanning all users
 */
export async function verifyEmail(token: string, email?: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // If email is provided, direct lookup; otherwise fallback to scan (backward compat)
  let user = null;
  if (email) {
    const candidate = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (candidate) {
      const prefs = parsePreferences(candidate.preferences);
      if (prefs.emailVerificationToken === tokenHash) {
        // Check expiry if present
        if (prefs.emailVerificationExpires && Date.now() > prefs.emailVerificationExpires) {
          throw createError('Email verification link has expired. Please request a new one.', 400);
        }
        user = candidate;
      }
    }
  }

  if (!user) {
    throw createError('Invalid or expired email verification token', 400);
  }

  const preferencesObj = parsePreferences(user.preferences);
  delete preferencesObj.emailVerificationToken;
  delete preferencesObj.emailVerificationExpires;
  preferencesObj.isEmailVerified = true;

  await prisma.user.update({
    where: { id: user.id },
    data: { preferences: JSON.stringify(preferencesObj) }
  });

  logger.info(`Email successfully verified for user: ${user.email}`);
}
