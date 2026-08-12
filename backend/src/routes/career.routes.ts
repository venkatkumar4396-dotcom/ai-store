import { Router, Request, Response, NextFunction } from 'express';
import { careerService } from '../services/career.service';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/agents/career/jobpilot/analyze
 * @desc    Full JobPilot AI analysis (6-step structured output)
 */
router.post('/jobpilot/analyze', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { resumeText, jobDescription, targetRole } = req.body;
    if (!resumeText) {
      res.status(400).json({ error: 'resumeText is required' });
      return;
    }
    const result = await careerService.analyzeWithJobPilot(userId, { resumeText, jobDescription, targetRole });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/career/jobpilot/application-package
 * @desc    Generate full application package (Resume version, Cover Letter, Recruiter Email, LinkedIn Summary)
 */
router.post('/jobpilot/application-package', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { resumeText, jobDescription, companyName, jobTitle } = req.body;
    if (!resumeText || !jobDescription || !companyName || !jobTitle) {
      res.status(400).json({ error: 'resumeText, jobDescription, companyName, and jobTitle are required' });
      return;
    }
    const result = await careerService.generateApplicationPackage(userId, { resumeText, jobDescription, companyName, jobTitle });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/career/jobpilot/interview/chat
 * @desc    Interactive JobPilot AI Mock Interview Q&A with 4-dimension scoring
 */
router.post('/jobpilot/interview/chat', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { history, userMessage, jobRole, experienceLevel } = req.body;
    const result = await careerService.interviewChat(userId, {
      history: history || [],
      userMessage,
      jobRole: jobRole || 'Software Engineer',
      experienceLevel: experienceLevel || 'Mid-Senior'
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/career/jobpilot/coaching
 * @desc    Get JobPilot AI Career Coaching & Project Recommendations
 */
router.post('/jobpilot/coaching', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { targetRole, currentSkills, experienceLevel } = req.body;
    if (!targetRole) {
      res.status(400).json({ error: 'targetRole is required' });
      return;
    }
    const result = await careerService.getCareerCoaching(userId, { targetRole, currentSkills, experienceLevel });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/career/scan
 * @desc    Scan and optimize resume for an ATS job description (legacy compatible)
 */
router.post('/scan', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { targetJob, resumeText } = req.body;
    if (!targetJob || !resumeText) {
      res.status(400).json({ error: 'targetJob and resumeText are required' });
      return;
    }
    const result = await careerService.scanResume(userId, { targetJob, resumeText });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/career/cover-letter
 * @desc    Generate a custom cover letter matching resume to job
 */
router.post('/cover-letter', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { jobTitle, company, jobDescription, resumeText } = req.body;
    if (!jobTitle || !company || !jobDescription || !resumeText) {
      res.status(400).json({ error: 'jobTitle, company, jobDescription, and resumeText are required' });
      return;
    }
    const result = await careerService.generateCoverLetter(userId, { jobTitle, company, jobDescription, resumeText });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/career/profiles
 * @desc    Get user's saved career analyses
 */
router.get('/profiles', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await careerService.getProfiles(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/career/matches
 * @desc    Get user's generated cover letters
 */
router.get('/matches', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await careerService.getMatches(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/career/matches/:id
 * @desc    Delete cover letter
 */
router.delete('/matches/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await careerService.deleteMatch(userId, id);
    res.status(200).json({ message: 'Cover letter match deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
