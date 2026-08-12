import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { getCurrentUser, updateProfile, changePassword } from '../services/auth.service';
import { encrypt } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/user/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const user = await getCurrentUser(userId);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile details
 * @access  Private
 */
router.put('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, avatar, preferences } = req.body;
    const updated = await updateProfile(userId, { name, avatar, preferences });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/user/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }
    await changePassword(userId, currentPassword, newPassword);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/user/api-keys
 * @desc    List all API keys (masked)
 * @access  Private
 */
router.get('/api-keys', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Return keys with masked values
    const maskedKeys = keys.map(k => ({
      id: k.id,
      provider: k.provider,
      label: k.label,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));

    res.status(200).json(maskedKeys);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/user/api-keys
 * @desc    Add a new API key
 * @access  Private
 */
router.post('/api-keys', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { provider, key, label } = req.body;

    if (!provider || !key || !label) {
      res.status(400).json({ error: 'Provider, key, and label are required' });
      return;
    }

    const encryptedKey = encrypt(key);

    const newKey = await prisma.apiKey.create({
      data: {
        userId,
        provider,
        encryptedKey,
        label,
        isActive: true,
      },
    });

    res.status(201).json({
      id: newKey.id,
      provider: newKey.provider,
      label: newKey.label,
      isActive: newKey.isActive,
      createdAt: newKey.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/user/api-keys/:id
 * @desc    Delete an API key
 * @access  Private
 */
router.delete('/api-keys/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const key = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!key) {
      res.status(404).json({ error: 'API Key not found or unauthorized' });
      return;
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    res.status(200).json({ message: 'API key deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/user/api-keys/:id/toggle
 * @desc    Toggle API key active status
 * @access  Private
 */
router.put('/api-keys/:id/toggle', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const key = await prisma.apiKey.findFirst({
      where: { id, userId },
    });

    if (!key) {
      res.status(404).json({ error: 'API Key not found or unauthorized' });
      return;
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { isActive: !key.isActive },
    });

    res.status(200).json({ id: updated.id, isActive: updated.isActive });
  } catch (error) {
    next(error);
  }
});

export default router;
