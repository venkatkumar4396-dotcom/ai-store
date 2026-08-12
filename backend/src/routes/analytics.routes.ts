import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import { getDashboardStats, getUsageStats } from '../services/analytics.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard metrics (user-specific or global for admin)
 * @access  Private
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const targetUser = req.query.userId as string | undefined;

    let stats;
    if (role === 'admin') {
      // Admin can view global dashboard or filter by target user
      stats = await getDashboardStats(targetUser);
    } else {
      // Normal user can only view their own dashboard
      stats = await getDashboardStats(userId);
    }

    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/usage
 * @desc    Get usage statistics over a specific period
 * @access  Private
 */
router.get('/usage', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || '7d';

    if (!['24h', '7d', '30d', '90d'].includes(period)) {
      res.status(400).json({ error: 'Invalid period parameter. Use: 24h, 7d, 30d, 90d' });
      return;
    }

    const stats = await getUsageStats(userId, period);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/analytics/logs
 * @desc    Get recent activity logs for current user
 * @access  Private
 */
router.get('/logs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.activityLog.count({ where: { userId } });

    res.status(200).json({
      logs: logs.map(l => ({
        ...l,
        metadata: l.metadata ? JSON.parse(l.metadata) : null,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
