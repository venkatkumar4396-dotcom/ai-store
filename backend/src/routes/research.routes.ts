import { Router, Request, Response, NextFunction } from 'express';
import { researchService } from '../services/research.service';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/agents/research/project
 * @desc    Create and analyze a research topic
 */
router.post('/project', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { title, topic, description } = req.body;
    if (!title || !topic || !description) {
      res.status(400).json({ error: 'Title, topic, and description are required' });
      return;
    }
    const result = await researchService.createProject(userId, { title, topic, description });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/research/projects
 * @desc    Get user's research projects
 */
router.get('/projects', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const result = await researchService.getProjects(userId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/research/projects/:id
 * @desc    Delete a research project
 */
router.delete('/projects/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await researchService.deleteProject(userId, id);
    res.status(200).json({ message: 'Research project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
