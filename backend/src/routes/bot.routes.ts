import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, optionalAuth } from '../middleware/auth';
import { logActivity } from '../services/analytics.service';

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_BOTS = [
  {
    id: 'bot-travel',
    name: 'Travel Booking Agent',
    slug: 'travel-booking-agent',
    description: 'Search flights, buses, and trains. Compare prices across carriers and book instantly with AI-powered trip planning.',
    category: 'automation',
    icon: 'Plane',
    features: JSON.stringify(['Flight Search', 'Bus Routes', 'Train Booking', 'Price Comparison', 'Trip Planning', 'Instant Booking']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-hotel',
    name: 'Hotel Booking Agent',
    slug: 'hotel-booking-agent',
    description: 'Search hotels, compare room features, manage bookings, and find the best deals with AI recommendations.',
    category: 'automation',
    icon: 'Hotel',
    features: JSON.stringify(['Hotel Search', 'Room Configuration', 'Deals Comparison', 'Instant Reservation', 'Amenities Filter']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-1',
    name: 'WhatsApp AI Assistant',
    slug: 'whatsapp-ai-assistant',
    description: 'Intelligent WhatsApp chatbot with natural language understanding and automated responses.',
    category: 'communication',
    icon: 'MessageCircle',
    features: JSON.stringify(['Natural Language Processing', 'Auto-replies', 'Template Messages', 'Multi-language']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-2',
    name: 'Stock Intelligence Agent',
    slug: 'stock-intelligence-agent',
    description: 'Real-time stock analysis with RSI, MACD, Bollinger Bands, AI-powered buy/sell signals and portfolio tracking.',
    category: 'analytics',
    icon: 'TrendingUp',
    features: JSON.stringify(['Technical Analysis', 'AI Signals', 'Portfolio Tracker', 'Watchlists', 'Sentiment Analysis']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-3',
    name: 'Career Accelerator Agent',
    slug: 'career-accelerator-agent',
    description: 'ATS resume scoring, cover letter generation, interview prep, and skill gap analysis powered by AI.',
    category: 'productivity',
    icon: 'GraduationCap',
    features: JSON.stringify(['ATS Scoring', 'Cover Letters', 'Interview Prep', 'Skill Gap Analysis', 'Resume Optimization']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-productivity',
    name: 'Productivity Agent',
    slug: 'productivity-agent',
    description: 'AI-powered task management, daily planning, schedule generation, goal tracking, and smart reminders.',
    category: 'productivity',
    icon: 'CheckSquare',
    features: JSON.stringify(['Task Management', 'AI Scheduling', 'Goal Tracking', 'Smart Reminders', 'Daily Planning']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-document',
    name: 'Document Agent',
    slug: 'document-agent',
    description: 'AI text summarization, document analysis, PDF generation, and key points extraction from any content.',
    category: 'productivity',
    icon: 'FileText',
    features: JSON.stringify(['Text Summarization', 'Document Analysis', 'PDF Generation', 'Key Point Extraction']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-4',
    name: 'Smart File Monitor',
    slug: 'smart-file-monitor',
    description: 'AI-powered file tracking with change detection, audit logging, and alerts.',
    category: 'productivity',
    icon: 'FileSearch',
    features: JSON.stringify(['Change Detection', 'Audit Logging', 'Real-time Alerts', 'Version History']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-5',
    name: 'Startup Co-Founder Agent',
    slug: 'startup-co-founder-agent',
    description: 'AI-powered startup idea validation with SWOT analysis, market scoring, and revenue modeling.',
    category: 'analytics',
    icon: 'Rocket',
    features: JSON.stringify(['Idea Validation', 'SWOT Analysis', 'Market Scoring', 'Revenue Model', 'Competitor Research']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-compass',
    name: 'Compass Travel Advisor',
    slug: 'compass-travel-advisor',
    description: 'Bespoke travel planner with specialized agent roles, real-time map integration, and automated itinerary tracking.',
    category: 'automation',
    icon: 'Compass',
    features: JSON.stringify(['Specialized Advisor Roles', 'Real-Time Map Sync', 'Itinerary Generation', 'Automated Passport Tracking', 'Ollama & Gemini Support']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  },
  {
    id: 'bot-sales',
    name: 'AI Sales Agent',
    slug: 'ai-sales-agent',
    description: 'AI-powered lead discovery, personalized email outreach, and meeting scheduling for startups & SaaS.',
    category: 'automation',
    icon: 'Target',
    features: JSON.stringify(['Lead Discovery', 'AI Lead Scoring', 'Email Generation', 'Meeting Scheduling', 'Lead Enrichment', 'Pipeline Analytics']),
    screenshots: JSON.stringify([]),
    isActive: true,
    price: 0.0,
  }
];

export async function ensureBotsSeeded() {
  try {
    const count = await prisma.bot.count();
    if (count === 0) {
      for (const b of DEFAULT_BOTS) {
        await prisma.bot.upsert({
          where: { slug: b.slug },
          update: b,
          create: b,
        });
      }
    }
  } catch (err) {
    // best-effort
  }
}

/**
 * @route   GET /api/bots
 * @desc    Get all active bots from the marketplace
 * @access  Public
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureBotsSeeded();
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
 * @desc    Get bot details by slug or id
 * @access  Public
 */
router.get('/:slug', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureBotsSeeded();
    const slug = req.params.slug as string;
    let bot = await prisma.bot.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      },
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
    await ensureBotsSeeded();
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
    await ensureBotsSeeded();
    const userId = req.user!.userId;
    const botIdParam = req.params.botId as string;

    // Verify bot exists (by id or slug)
    let bot = await prisma.bot.findFirst({
      where: {
        OR: [{ id: botIdParam }, { slug: botIdParam }]
      }
    });

    // If not found in DB, check DEFAULT_BOTS and upsert it
    if (!bot) {
      const match = DEFAULT_BOTS.find(b => b.id === botIdParam || b.slug === botIdParam);
      if (match) {
        bot = await prisma.bot.upsert({
          where: { slug: match.slug },
          update: match,
          create: match,
        });
      }
    }

    if (!bot) {
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    const targetBotId = bot.id;

    // Check if already installed
    const existingInstance = await prisma.botInstance.findUnique({
      where: { userId_botId: { userId, botId: targetBotId } },
    });

    if (existingInstance) {
      res.status(200).json({
        ...existingInstance,
        config: JSON.parse(existingInstance.config || '{}'),
        message: 'Bot is already installed'
      });
      return;
    }

    // Create bot instance
    const instance = await prisma.botInstance.create({
      data: {
        userId,
        botId: targetBotId,
        status: 'active',
        config: '{}',
      },
    });

    // Increment bot usage count
    await prisma.bot.update({
      where: { id: targetBotId },
      data: { usageCount: { increment: 1 } },
    });

    await logActivity(userId, 'bot_installed', 'bot', targetBotId, { botName: bot.name });

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
