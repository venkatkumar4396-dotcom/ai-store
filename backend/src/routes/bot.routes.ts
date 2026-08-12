import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth } from '../middleware/auth';
import { logActivity } from '../services/analytics.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/bots
 * @desc    Get all active bots from the marketplace
 * @access  Public
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bots = await prisma.bot.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const formattedBots = bots.map(b => ({
      ...b,
      features: b.features ? JSON.parse(b.features) : [],
      screenshots: b.screenshots ? JSON.parse(b.screenshots) : [],
    }));

    res.status(200).json(formattedBots);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bots/:slug
 * @desc    Get bot details by slug
 * @access  Public
 */
router.get('/:slug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const bot = await prisma.bot.findUnique({
      where: { slug },
    });

    if (!bot) {
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    res.status(200).json({
      ...bot,
      features: bot.features ? JSON.parse(bot.features) : [],
      screenshots: bot.screenshots ? JSON.parse(bot.screenshots) : [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/bots/instances/user
 * @desc    Get current user's installed bot instances
 * @access  Private
 */
router.get('/instances/user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const instances = await prisma.botInstance.findMany({
      where: { userId },
      include: {
        bot: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedInstances = instances.map(inst => ({
      ...inst,
      config: inst.config ? JSON.parse(inst.config) : null,
      bot: {
        ...inst.bot,
        features: inst.bot.features ? JSON.parse(inst.bot.features) : [],
        screenshots: inst.bot.screenshots ? JSON.parse(inst.bot.screenshots) : [],
      },
    }));

    res.status(200).json(formattedInstances);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/bots/instances/:botId/install
 * @desc    Install/subscribe to a bot
 * @access  Private
 */
router.post('/instances/:botId/install', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const botId = req.params.botId as string;

    // Verify bot exists
    const bot = await prisma.bot.findUnique({ where: { id: botId } });
    if (!bot) {
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    // Check if already installed
    const existingInstance = await prisma.botInstance.findUnique({
      where: { userId_botId: { userId, botId } },
    });

    if (existingInstance) {
      res.status(400).json({ error: 'Bot is already installed' });
      return;
    }

    // Create bot instance
    const instance = await prisma.botInstance.create({
      data: {
        userId,
        botId,
        status: 'configuring',
        config: '{}',
      },
    });

    // Increment bot usage count
    await prisma.bot.update({
      where: { id: botId },
      data: { usageCount: { increment: 1 } },
    });

    await logActivity(userId, 'bot_installed', 'bot', botId, { botName: bot.name });

    res.status(201).json({
      ...instance,
      config: JSON.parse(instance.config || '{}'),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/bots/instances/:botId/config
 * @desc    Configure a bot instance
 * @access  Private
 */
router.post('/instances/:botId/config', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const botId = req.params.botId as string;
    const { config } = req.body;

    if (!config) {
      res.status(400).json({ error: 'Configuration object is required' });
      return;
    }

    const instance = await prisma.botInstance.findUnique({
      where: { userId_botId: { userId, botId } },
    });

    if (!instance) {
      res.status(404).json({ error: 'Bot instance not found' });
      return;
    }

    const updated = await prisma.botInstance.update({
      where: { id: instance.id },
      data: {
        config: JSON.stringify(config),
        status: instance.status === 'configuring' ? 'inactive' : instance.status, // Move to inactive if it was configuring
      },
    });

    await logActivity(userId, 'bot_configured', 'bot', botId, { configKeys: Object.keys(config) });

    res.status(200).json({
      ...updated,
      config: JSON.parse(updated.config || '{}'),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/bots/instances/:botId/toggle
 * @desc    Toggle bot status (active/inactive)
 * @access  Private
 */
router.post('/instances/:botId/toggle', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const botId = req.params.botId as string;

    const instance = await prisma.botInstance.findUnique({
      where: { userId_botId: { userId, botId } },
      include: { bot: true },
    });

    if (!instance) {
      res.status(404).json({ error: 'Bot instance not found' });
      return;
    }

    const newStatus = instance.status === 'active' ? 'inactive' : 'active';
    const lastActiveAt = newStatus === 'active' ? new Date() : instance.lastActiveAt;

    const updated = await prisma.botInstance.update({
      where: { id: instance.id },
      data: {
        status: newStatus,
        lastActiveAt,
      },
    });

    await logActivity(
      userId,
      newStatus === 'active' ? 'bot_activated' : 'bot_deactivated',
      'bot',
      botId,
      { botName: (instance as any).bot.name }
    );

    res.status(200).json({
      ...updated,
      config: updated.config ? JSON.parse(updated.config) : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/bots/instances/:botId/uninstall
 * @desc    Uninstall a bot instance
 * @access  Private
 */
router.delete('/instances/:botId/uninstall', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const botId = req.params.botId as string;

    const instance = await prisma.botInstance.findUnique({
      where: { userId_botId: { userId, botId } },
      include: { bot: true },
    });

    if (!instance) {
      res.status(404).json({ error: 'Bot instance not found' });
      return;
    }

    await prisma.botInstance.delete({
      where: { id: instance.id },
    });

    await logActivity(userId, 'bot_uninstalled', 'bot', botId, { botName: (instance as any).bot.name });

    res.status(200).json({ message: 'Bot uninstalled successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
