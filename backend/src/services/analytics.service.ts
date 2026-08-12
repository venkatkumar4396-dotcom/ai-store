import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface DashboardStats {
  totalUsers: number;
  totalBots: number;
  activeBotInstances: number;
  totalMessages: number;
  totalFileActivities: number;
  recentActivities: any[];
  botUsage: any[];
  messagesByDay: any[];
}

export interface UsageStats {
  period: string;
  aiRequests: number;
  messagesSent: number;
  messagesReceived: number;
  filesTracked: number;
  activeTrackers: number;
  activeSessions: number;
}

/**
 * Get dashboard analytics
 */
export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
  const userFilter = userId ? { userId } : {};

  // Run all queries in parallel
  const [
    totalUsers,
    totalBots,
    activeBotInstances,
    totalMessages,
    totalFileActivities,
    recentActivities,
    botUsage,
    messagesByDay,
  ] = await Promise.all([
    // Total users (admin only sees all, regular user sees 1)
    userId
      ? Promise.resolve(1)
      : prisma.user.count(),

    // Total available bots
    prisma.bot.count({ where: { isActive: true } }),

    // Active bot instances for user
    prisma.botInstance.count({
      where: { ...userFilter, status: 'active' },
    }),

    // Total messages
    prisma.whatsAppMessage.count({
      where: userId
        ? { session: { userId } }
        : {},
    }),

    // Total file activities
    prisma.fileActivity.count({
      where: userId
        ? { tracker: { userId } }
        : {},
    }),

    // Recent activities
    prisma.activityLog.findMany({
      where: userFilter,
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),

    // Bot usage stats
    prisma.bot.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        usageCount: true,
        _count: {
          select: { instances: true },
        },
      },
      orderBy: { usageCount: 'desc' },
    }),

    // Messages grouped by day (last 7 days)
    getMessagesByDay(userId),
  ]);

  return {
    totalUsers,
    totalBots,
    activeBotInstances,
    totalMessages,
    totalFileActivities,
    recentActivities,
    botUsage,
    messagesByDay,
  };
}

/**
 * Get messages grouped by day for the last 7 days
 */
async function getMessagesByDay(userId?: string): Promise<any[]> {
  const days = 7;
  const result: any[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const whereClause: any = {
      timestamp: {
        gte: date,
        lt: nextDate,
      },
    };

    if (userId) {
      whereClause.session = { userId };
    }

    const [inbound, outbound] = await Promise.all([
      prisma.whatsAppMessage.count({
        where: { ...whereClause, direction: 'inbound' },
      }),
      prisma.whatsAppMessage.count({
        where: { ...whereClause, direction: 'outbound' },
      }),
    ]);

    result.push({
      date: date.toISOString().split('T')[0],
      inbound,
      outbound,
      total: inbound + outbound,
    });
  }

  return result;
}

/**
 * Get usage statistics for a user
 */
export async function getUsageStats(userId: string, period: string = '7d'): Promise<UsageStats> {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const [
    aiRequests,
    messagesSent,
    messagesReceived,
    filesTracked,
    activeTrackers,
    activeSessions,
  ] = await Promise.all([
    // AI chat requests count
    prisma.activityLog.count({
      where: {
        userId,
        action: 'ai_chat',
        timestamp: { gte: startDate },
      },
    }),

    // Messages sent
    prisma.whatsAppMessage.count({
      where: {
        session: { userId },
        direction: 'outbound',
        timestamp: { gte: startDate },
      },
    }),

    // Messages received
    prisma.whatsAppMessage.count({
      where: {
        session: { userId },
        direction: 'inbound',
        timestamp: { gte: startDate },
      },
    }),

    // File activities
    prisma.fileActivity.count({
      where: {
        tracker: { userId },
        timestamp: { gte: startDate },
      },
    }),

    // Active trackers
    prisma.fileTracker.count({
      where: { userId, status: 'active' },
    }),

    // Active WhatsApp sessions
    prisma.whatsAppSession.count({
      where: { userId, status: 'connected' },
    }),
  ]);

  return {
    period,
    aiRequests,
    messagesSent,
    messagesReceived,
    filesTracked,
    activeTrackers,
    activeSessions,
  };
}

/**
 * Log a user activity
 */
export async function logActivity(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to log activity: ${error.message}`);
  }
}
