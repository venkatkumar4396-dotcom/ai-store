import { PrismaClient } from '@prisma/client';
import { aiRouter } from './ai/provider';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class ProductivityService {

  // ─── Task Management ────────────────────────────────────────
  async getTasks(userId: string) {
    return prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(userId: string, data: {
    title: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }) {
    const task = await prisma.task.create({
      data: {
        userId,
        title: data.title,
        priority: data.priority || 'medium',
        status: data.status || 'todo',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'productivity',
        action: 'task_created',
        description: `Created task: "${task.title}" with priority ${task.priority}`,
      },
    });

    return task;
  }

  async updateTask(userId: string, taskId: string, data: {
    title?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
  }) {
    // Verify ownership
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      throw new Error('Task not found or access denied');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });

    // If task was completed, log it
    if (data.status === 'completed' && existing.status !== 'completed') {
      await prisma.agentActivityLog.create({
        data: {
          userId,
          agentId: 'productivity',
          action: 'task_completed',
          description: `Completed task: "${updated.title}"`,
        },
      });
    }

    return updated;
  }

  async deleteTask(userId: string, taskId: string) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      throw new Error('Task not found or access denied');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  }

  // ─── Goal Management ────────────────────────────────────────
  async getGoals(userId: string) {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(userId: string, data: {
    title: string;
    targetDate?: string;
    progress?: number;
  }) {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: data.title,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        progress: data.progress || 0,
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'productivity',
        action: 'goal_created',
        description: `Set new goal: "${goal.title}"`,
      },
    });

    return goal;
  }

  async updateGoal(userId: string, goalId: string, data: {
    title?: string;
    targetDate?: string;
    progress?: number;
  }) {
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      throw new Error('Goal not found or access denied');
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title: data.title,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        progress: data.progress !== undefined ? Number(data.progress) : undefined,
      },
    });

    if (data.progress === 100 && existing.progress !== 100) {
      await prisma.agentActivityLog.create({
        data: {
          userId,
          agentId: 'productivity',
          action: 'goal_achieved',
          description: `Achieved goal: "${updated.title}"! 🎉`,
        },
      });
    }

    return updated;
  }

  async deleteGoal(userId: string, goalId: string) {
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      throw new Error('Goal not found or access denied');
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { success: true };
  }

  // ─── AI Schedule Planning ──────────────────────────────────
  async getDailySchedule(userId: string, date: string) {
    return prisma.dailySchedule.findUnique({
      where: {
        userId_date: { userId, date },
      },
    });
  }

  async generateDailySchedule(userId: string, date: string) {
    // Fetch all active tasks
    const tasks = await prisma.task.findMany({
      where: { userId, status: { not: 'completed' } },
    });

    // Fetch goals to provide context
    const goals = await prisma.goal.findMany({
      where: { userId, progress: { lt: 100 } },
    });

    const tasksList = tasks.map(t => `- [${t.priority.toUpperCase()}] ${t.title} (Status: ${t.status})`).join('\n');
    const goalsList = goals.map(g => `- ${g.title} (${g.progress}% done)`).join('\n');

    const systemPrompt = `You are an elite productivity coach and AI organizer. Arrange the user's tasks into a high-performance daily hourly schedule.
Format your output strictly as a JSON object:
{
  "date": "${date}",
  "headline": "A motivational productivity focus slogan for the day",
  "timeSlots": [
    { "time": "08:00 AM", "activity": "Morning Routine & Goal Review", "duration": "30 mins", "priority": "low" },
    { "time": "09:00 AM", "activity": "Task title or description", "duration": "60 mins", "priority": "high" }
  ],
  "coachingTip": "One customized productivity tip based on their goals and tasks"
}`;

    const userPrompt = `Date: ${date}
Active Tasks:
${tasksList || 'No pending tasks. Suggest routine wellness/learning blocks.'}

Active Goals:
${goalsList || 'No current goals.'}`;

    let scheduleJson = '';
    try {
      const response = await aiRouter.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.3 });

      scheduleJson = response.content.trim().replace(/```json/g, '').replace(/```/g, '');
      // Validate JSON parse
      JSON.parse(scheduleJson);
    } catch (e: any) {
      logger.warn(`AI Schedule generation failed: ${e.message}`);
      // Fallback schedule
      const fallbackSlots = tasks.map((t, idx) => ({
        time: `${(9 + idx) % 12 || 12}:00 ${9 + idx >= 12 ? 'PM' : 'AM'}`,
        activity: t.title,
        duration: '65 mins',
        priority: t.priority,
      }));
      if (fallbackSlots.length === 0) {
        fallbackSlots.push({
          time: '09:00 AM',
          activity: 'Goal-setting and self-education',
          duration: '60 mins',
          priority: 'medium',
        });
      }
      scheduleJson = JSON.stringify({
        date,
        headline: 'Keep it moving! One step at a time.',
        timeSlots: fallbackSlots,
        coachingTip: 'Prioritize your tasks sequentially to avoid multitasking fatigue.',
      });
    }

    const schedule = await prisma.dailySchedule.upsert({
      where: {
        userId_date: { userId, date },
      },
      update: {
        tasks: scheduleJson,
      },
      create: {
        userId,
        date,
        tasks: scheduleJson,
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'productivity',
        action: 'schedule_generated',
        description: `AI generated productivity schedule for ${date}`,
        reasoning: `Structured ${tasks.length} active tasks around active goals.`,
      },
    });

    return schedule;
  }
}

export const productivityService = new ProductivityService();
