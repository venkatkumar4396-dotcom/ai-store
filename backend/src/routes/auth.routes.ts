import { Router, Request, Response, NextFunction } from 'express';
import { register, login, loginWithOAuth, forgotPassword, verifyOtp, resetPassword, verifyEmail } from '../services/auth.service';
import { authLimiter, otpLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * Helper to set secure auth cookie.
 * Works correctly for both local dev (http) and dev tunnels (https).
 * When the request arrives over HTTPS (tunnels forward X-Forwarded-Proto),
 * the cookie must be Secure + SameSite=None so browsers accept it.
 */
const setAuthCookie = (req: Request, res: Response, token: string) => {
  // Detect HTTPS: either the connection is secure, or a reverse-proxy/tunnel
  // forwarded it via HTTPS (VS Code Dev Tunnels, ngrok, Cloudflare, etc.)
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers['x-forwarded-proto'] as string)?.split(',')[0].trim() === 'https';

  res.cookie('nexora_token', token, {
    httpOnly: true,
    secure: isHttps,
    // SameSite=None requires Secure=true (cross-origin tunnel requests need this)
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};


/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }
    const result = await register({ email, name, password });
    setAuthCookie(req, res, result.token);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login a user
 * @access  Public
 */
router.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const result = await login({ email, password });
    setAuthCookie(req, res, result.token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Google OAuth login/register callback
 * @access  Public
 */
router.post('/google', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId, email, name, avatar } = req.body;
    if (!providerId || !email || !name) {
      res.status(400).json({ error: 'Google OAuth providerId, email, and name are required' });
      return;
    }
    const result = await loginWithOAuth('google', providerId, email, name, avatar);
    setAuthCookie(req, res, result.token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/github
 * @desc    GitHub OAuth login/register callback
 * @access  Public
 */
router.post('/github', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId, email, name, avatar } = req.body;
    if (!providerId || !email || !name) {
      res.status(400).json({ error: 'GitHub OAuth providerId, email, and name are required' });
      return;
    }
    const result = await loginWithOAuth('github', providerId, email, name, avatar);
    setAuthCookie(req, res, result.token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Clear secure auth cookie
 * @access  Public
 */
router.post('/logout', (req: Request, res: Response) => {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers['x-forwarded-proto'] as string)?.split(',')[0].trim() === 'https';

  res.clearCookie('nexora_token', {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Successfully logged out' });
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate and send 6-digit OTP for password reset
 * @access  Public
 */
router.post('/forgot-password', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const result = await forgotPassword(email);
    // Return the generic message. In dev mode (no SMTP), also include devNote + debugOtp
    // so the frontend OTP auto-fill works during local/tunnel development.
    const responsePayload: Record<string, any> = { message: result.message };
    if (result.devNote) responsePayload.devNote = result.devNote;
    if (result.debugOtp) responsePayload.debugOtp = result.debugOtp;
    res.status(200).json(responsePayload);

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and get a short-lived reset permission token
 * @access  Public
 */
router.post('/verify-otp', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ error: 'Email and OTP are required' });
      return;
    }
    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      res.status(400).json({ error: 'OTP must be a 6-digit number' });
      return;
    }
    const result = await verifyOtp(email, otp);
    res.status(200).json({
      message: 'OTP verified successfully. You may now reset your password.',
      resetPermissionToken: result.resetPermissionToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP-verified reset permission token
 * @access  Public
 */
router.post('/reset-password', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, resetPermissionToken, password } = req.body;
    if (!email || !resetPermissionToken || !password) {
      res.status(400).json({ error: 'Email, reset permission token, and new password are required' });
      return;
    }
    await resetPassword(email, resetPermissionToken, password);
    res.status(200).json({ message: 'Password successfully reset. You can now sign in.' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email using verification token
 * @access  Public
 */
router.post('/verify-email', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, email } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }
    await verifyEmail(token, email);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

