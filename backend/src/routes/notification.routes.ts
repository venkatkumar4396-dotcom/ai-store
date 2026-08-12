import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/notifications/:id/read
 * @desc    Mark a notification as read
 */
router.post('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const notification = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/notifications/read-all
 * @desc    Mark all notifications as read
 */
router.post('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 */
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await prisma.notification.deleteMany({
      where: { id, userId },
    });
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
