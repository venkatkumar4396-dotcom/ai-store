import { Router, Request, Response, NextFunction } from 'express';
import { salesService } from '../services/sales.service';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/agents/sales/leads/find
 * @desc    AI-powered lead discovery
 */
router.post('/leads/find', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { industry, targetRole, companySize } = req.body;
    if (!industry || !targetRole) {
      res.status(400).json({ error: 'Industry and target role are required' });
      return;
    }
    const result = await salesService.findLeads(userId, { industry, targetRole, companySize: companySize || '10-500' });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/sales/leads/:id/enrich
 * @desc    AI-powered lead enrichment
 */
router.post('/leads/:id/enrich', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const leadId = req.params.id as string;
    const result = await salesService.enrichLead(userId, leadId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/sales/leads
 * @desc    Get all leads
 */
router.get('/leads', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await salesService.getLeads(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/sales/leads/:id
 * @desc    Delete a lead
 */
router.delete('/leads/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    await salesService.deleteLead(userId, req.params.id as string);
    res.status(200).json({ message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/sales/emails/generate
 * @desc    AI-powered email generation
 */
router.post('/emails/generate', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { leadId, emailType, tone, context } = req.body;
    const result = await salesService.generateEmail(userId, {
      leadId,
      emailType: emailType || 'cold_outreach',
      tone: tone || 'professional',
      context,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/sales/emails/:id/send
 * @desc    Send an email (simulated)
 */
router.post('/emails/:id/send', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await salesService.sendEmail(userId, req.params.id as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/sales/emails
 * @desc    Get all emails
 */
router.get('/emails', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await salesService.getEmails(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/sales/emails/:id
 * @desc    Delete an email
 */
router.delete('/emails/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    await salesService.deleteEmail(userId, req.params.id as string);
    res.status(200).json({ message: 'Email deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/sales/meetings
 * @desc    Schedule a meeting
 */
router.post('/meetings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { leadId, title, dateTime, duration, agenda } = req.body;
    if (!title || !dateTime) {
      res.status(400).json({ error: 'Title and dateTime are required' });
      return;
    }
    const result = await salesService.scheduleMeeting(userId, {
      leadId,
      title,
      dateTime,
      duration: duration || 30,
      agenda,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/sales/meetings
 * @desc    Get all meetings
 */
router.get('/meetings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await salesService.getMeetings(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/sales/dashboard
 * @desc    Sales dashboard stats
 */
router.get('/dashboard', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await salesService.getDashboard(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
