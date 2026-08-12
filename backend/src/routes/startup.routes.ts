import { Router, Request, Response, NextFunction } from 'express';
import { startupService } from '../services/startup.service';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/agents/startup/analyze
 * @desc    Submit startup idea for analysis
 */
router.post('/analyze', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, industry, description } = req.body;
    if (!name || !industry || !description) {
      res.status(400).json({ error: 'Name, industry, and description are required' });
      return;
    }
    const result = await startupService.analyzeIdea(userId, { name, industry, description });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/startup/ideas
 * @desc    Get all analyzed startup ideas
 */
router.get('/ideas', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await startupService.getIdeas(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/startup/ideas/:id
 * @desc    Delete a startup idea
 */
router.delete('/ideas/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await startupService.deleteIdea(userId, id);
    res.status(200).json({ message: 'Idea deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
