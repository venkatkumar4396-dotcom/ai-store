import { Router, Request, Response, NextFunction } from 'express';
import { productivityService } from '../services/productivity.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// ─── Tasks Endpoints ────────────────────────────────────────

router.get('/tasks', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const tasks = await productivityService.getTasks(userId);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
});

router.post('/tasks', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { title, priority, status, dueDate } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const task = await productivityService.createTask(userId, { title, priority, status, dueDate });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.put('/tasks/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const taskId = req.params.id as string;
    const { title, priority, status, dueDate } = req.body;
    const task = await productivityService.updateTask(userId, taskId, { title, priority, status, dueDate });
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

router.delete('/tasks/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const taskId = req.params.id as string;
    const result = await productivityService.deleteTask(userId, taskId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ─── Goals Endpoints ────────────────────────────────────────

router.get('/goals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const goals = await productivityService.getGoals(userId);
    res.status(200).json(goals);
  } catch (error) {
    next(error);
  }
});

router.post('/goals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { title, targetDate, progress } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Goal title is required' });
      return;
    }
    const goal = await productivityService.createGoal(userId, { title, targetDate, progress });
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
});

router.put('/goals/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const goalId = req.params.id as string;
    const { title, targetDate, progress } = req.body;
    const goal = await productivityService.updateGoal(userId, goalId, { title, targetDate, progress });
    res.status(200).json(goal);
  } catch (error) {
    next(error);
  }
});

router.delete('/goals/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const goalId = req.params.id as string;
    const result = await productivityService.deleteGoal(userId, goalId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ─── Schedule Endpoints ─────────────────────────────────────

router.get('/schedule/:date', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const date = req.params.date as string;
    const schedule = await productivityService.getDailySchedule(userId, date);
    res.status(200).json(schedule);
  } catch (error) {
    next(error);
  }
});

router.post('/schedule', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }
    const schedule = await productivityService.generateDailySchedule(userId, date);
    res.status(200).json(schedule);
  } catch (error) {
    next(error);
  }
});

export default router;
