import { PrismaClient, Prisma } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class AdminService {

  async getStats() {
    const userCount = await prisma.user.count();
    const botInstanceCount = await prisma.botInstance.count();
    const whatsappSessionCount = await prisma.whatsAppSession.count();
    const fileTrackerCount = await prisma.fileTracker.count();
    
    // Total system logs count
    const systemLogsCount = await prisma.activityLog.count();
    
    // Total travel booking count
    const travelBookingCount = await prisma.agentActivityLog.count({
      where: { agentId: 'travel', action: 'booking_confirmed' }
    });

    // Total AI tasks sequenced
    const tasksCount = await prisma.task.count();

    return {
      users: userCount,
      botInstances: botInstanceCount,
      whatsappSessions: whatsappSessionCount,
      fileTrackers: fileTrackerCount,
      totalActivityLogs: systemLogsCount,
      travelBookings: travelBookingCount,
      activeTasks: tasksCount
    };
  }

  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateUserRole(targetUserId: string, newRole: string) {
    if (newRole !== 'admin' && newRole !== 'user') {
      throw new Error('Invalid role specified. Must be user or admin.');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return updated;
  }

  async getHealthLogs() {
    const logs = await prisma.agentActivityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    return logs;
  }

  /**
   * Get unified real-time activity feed combining system logs, AI agent actions, and booking events
   */
  async getLiveActivityFeed() {
    const [agentLogs, activityLogs, bookingSearches] = await Promise.all([
      prisma.agentActivityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 40,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.activityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 40,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.bookingSearch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      })
    ]);

    // Format into unified stream items
    const streamItems: any[] = [];

    agentLogs.forEach(log => {
      streamItems.push({
        id: `agent-${log.id}`,
        type: 'agent_activity',
        agentId: log.agentId,
        title: log.action,
        description: log.description,
        reasoning: log.reasoning,
        status: log.status,
        timestamp: log.timestamp,
        user: log.user
      });
    });

    activityLogs.forEach(log => {
      streamItems.push({
        id: `activity-${log.id}`,
        type: 'user_action',
        agentId: log.entityType || 'system',
        title: log.action,
        description: log.metadata || `User performed ${log.action}`,
        status: 'info',
        timestamp: log.timestamp,
        user: log.user
      });
    });

    bookingSearches.forEach(search => {
      streamItems.push({
        id: `booking-${search.id}`,
        type: 'travel_search',
        agentId: 'travel',
        title: `Search ${search.mode.toUpperCase()}: ${search.origin} → ${search.destination}`,
        description: `${search.passengers} passenger(s), Status: ${search.status}`,
        status: search.status === 'completed' ? 'success' : search.status,
        timestamp: search.createdAt,
        user: search.user
      });
    });

    // Sort descending by timestamp
    streamItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return streamItems.slice(0, 60);
  }

  /**
   * Get complete deep dossier for a specific user
   */
  async getUserDossier(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        botInstances: {
          include: {
            bot: true
          }
        },
        activityLogs: {
          orderBy: { timestamp: 'desc' },
          take: 30
        },
        agentLogs: {
          orderBy: { timestamp: 'desc' },
          take: 30
        },
        bookingSearches: {
          orderBy: { createdAt: 'desc' },
          take: 15
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 15
        },
        documentOperations: {
          orderBy: { createdAt: 'desc' },
          take: 15
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        salesLeads: {
          orderBy: { createdAt: 'desc' },
          take: 15
        }
      }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return user;
  }

  // ─── Database Explorer Services ──────────────────────────

  async getDbModels() {
    const modelsMetadata = Prisma.dmmf.datamodel.models;
    const result = [];

    for (const m of modelsMetadata) {
      const prop = m.name.charAt(0).toLowerCase() + m.name.slice(1);
      const modelClient = (prisma as any)[prop];
      let count = 0;
      if (modelClient && typeof modelClient.count === 'function') {
        try {
          count = await modelClient.count();
        } catch (e: any) {
          logger.warn(`Failed to count model ${m.name}: ${e.message}`);
        }
      }
      result.push({
        name: m.name,
        fields: m.fields.map(f => ({
          name: f.name,
          type: f.type,
          isId: f.isId,
          isRequired: f.isRequired,
          isList: f.isList,
          kind: f.kind, // 'scalar' | 'object' | 'enum'
        })),
        count
      });
    }

    return result;
  }

  async getDbModelRecords(
    modelName: string, 
    options: { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ) {
    const prop = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const modelClient = (prisma as any)[prop];
    if (!modelClient) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const page = Math.max(1, options.page);
    const limit = Math.max(1, options.limit);
    const skip = (page - 1) * limit;

    const modelMeta = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    if (!modelMeta) {
      throw new Error(`Metadata not found for model: ${modelName}`);
    }

    const where: any = {};
    if (options.search && options.search.trim()) {
      const searchVal = options.search.trim();
      const searchConditions = modelMeta.fields
        .filter(f => f.kind === 'scalar' && f.type === 'String' && !f.isList)
        .map(f => ({
          [f.name]: { contains: searchVal }
        }));
      
      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    let orderBy: any = undefined;
    if (options.sortBy) {
      orderBy = { [options.sortBy]: options.sortOrder || 'asc' };
    } else {
      const idField = modelMeta.fields.find(f => f.isId);
      const createdAtField = modelMeta.fields.find(f => f.name === 'createdAt');
      if (createdAtField) {
        orderBy = { createdAt: 'desc' };
      } else if (idField) {
        orderBy = { [idField.name]: 'desc' };
      }
    }

    const [records, total] = await Promise.all([
      modelClient.findMany({
        where,
        orderBy,
        skip,
        take: limit
      }),
      modelClient.count({ where })
    ]);

    return {
      records,
      total,
      page,
      limit
    };
  }

  async createDbModelRecord(modelName: string, data: any) {
    const prop = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const modelClient = (prisma as any)[prop];
    if (!modelClient) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const modelMeta = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    const cleanedData: any = {};

    if (modelMeta) {
      for (const field of modelMeta.fields) {
        if (field.kind === 'scalar' && data[field.name] !== undefined) {
          let val = data[field.name];
          if (field.type === 'DateTime' && val) {
            val = new Date(val);
          }
          cleanedData[field.name] = val;
        }
      }
    }

    return modelClient.create({
      data: cleanedData
    });
  }

  async updateDbModelRecord(modelName: string, id: string, data: any) {
    const prop = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const modelClient = (prisma as any)[prop];
    if (!modelClient) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const modelMeta = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    if (!modelMeta) throw new Error(`Model metadata not found`);

    const idField = modelMeta.fields.find(f => f.isId);
    if (!idField) throw new Error(`Primary key (id) not found for model ${modelName}`);

    let parsedId: any = id;
    if (idField.type === 'Int') {
      parsedId = parseInt(id, 10);
    }

    const cleanedData: any = {};
    for (const field of modelMeta.fields) {
      if (field.kind === 'scalar' && !field.isId && data[field.name] !== undefined) {
        let val = data[field.name];
        if (field.type === 'DateTime' && val) {
          val = new Date(val);
        }
        cleanedData[field.name] = val;
      }
    }

    return modelClient.update({
      where: { [idField.name]: parsedId },
      data: cleanedData
    });
  }

  async deleteDbModelRecord(modelName: string, id: string) {
    const prop = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const modelClient = (prisma as any)[prop];
    if (!modelClient) {
      throw new Error(`Invalid model name: ${modelName}`);
    }

    const modelMeta = Prisma.dmmf.datamodel.models.find(m => m.name === modelName);
    if (!modelMeta) throw new Error(`Model metadata not found`);

    const idField = modelMeta.fields.find(f => f.isId);
    if (!idField) throw new Error(`Primary key (id) not found for model ${modelName}`);

    let parsedId: any = id;
    if (idField.type === 'Int') {
      parsedId = parseInt(id, 10);
    }

    return modelClient.delete({
      where: { [idField.name]: parsedId }
    });
  }

  // Allowlist of safe read-only operations for the DB query explorer
  private static readonly SAFE_OPERATIONS = new Set([
    'findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy',
  ]);

  // Models whose sensitive fields should be excluded from query results
  private static readonly SENSITIVE_FIELDS: Record<string, string[]> = {
    User: ['passwordHash', 'preferences'],
  };

  async executeDbQuery(queryObj: { model: string; operation: string; args: any }) {
    const prop = queryObj.model.charAt(0).toLowerCase() + queryObj.model.slice(1);
    const modelClient = (prisma as any)[prop];
    if (!modelClient) {
      throw new Error(`Invalid model: ${queryObj.model}`);
    }

    const operation = queryObj.operation;

    // Only allow read-only operations
    if (!AdminService.SAFE_OPERATIONS.has(operation)) {
      throw new Error(`Operation "${operation}" is not permitted. Only read operations are allowed: ${[...AdminService.SAFE_OPERATIONS].join(', ')}`);
    }

    if (typeof modelClient[operation] !== 'function') {
      throw new Error(`Invalid operation ${operation} on model ${queryObj.model}`);
    }

    const result = await modelClient[operation](queryObj.args);

    // Strip sensitive fields from results
    const sensitiveFields = AdminService.SENSITIVE_FIELDS[queryObj.model];
    if (sensitiveFields && result) {
      const stripFields = (record: any) => {
        if (!record || typeof record !== 'object') return record;
        for (const field of sensitiveFields) {
          if (field in record) {
            record[field] = '[REDACTED]';
          }
        }
        return record;
      };

      if (Array.isArray(result)) {
        result.forEach(stripFields);
      } else if (typeof result === 'object') {
        stripFields(result);
      }
    }

    logger.info(`Admin DB query: ${queryObj.model}.${operation}`);
    return result;
  }
}

export const adminService = new AdminService();
