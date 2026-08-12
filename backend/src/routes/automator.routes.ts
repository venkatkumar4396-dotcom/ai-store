import { Router, Request, Response, NextFunction } from 'express';
import { automatorService } from '../services/automator.service';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   GET /api/agents/automator/leads
 * @desc    Get all CRM sales leads
 */
router.get('/leads', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const result = await automatorService.getLeads(userId, limit, offset);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/leads
 * @desc    Create a new CRM lead
 */
router.post('/leads', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, email, notes } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    const result = await automatorService.createLead(userId, { name, email, notes });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/leads/:id/status
 * @desc    Update lead pipeline status
 */
router.post('/leads/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    const result = await automatorService.updateLeadStatus(userId, id, status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/leads/:id/email
 * @desc    Generate a custom sales follow-up email draft
 */
router.post('/leads/:id/email', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { pitchGoal } = req.body;
    if (!pitchGoal) {
      res.status(400).json({ error: 'pitchGoal is required' });
      return;
    }
    const result = await automatorService.generateFollowUpEmail(userId, id, { pitchGoal });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/automator/invoices
 * @desc    Get client invoices
 */
router.get('/invoices', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await automatorService.getInvoices(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/invoices
 * @desc    Create a client invoice
 */
router.post('/invoices', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { clientName, clientEmail, items } = req.body;
    if (!clientName || !clientEmail || !items || !Array.isArray(items)) {
      res.status(400).json({ error: 'clientName, clientEmail, and items array are required' });
      return;
    }
    const result = await automatorService.createInvoice(userId, { clientName, clientEmail, items });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/invoices/:id/status
 * @desc    Update invoice billing status
 */
router.post('/invoices/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    const result = await automatorService.updateInvoiceStatus(userId, id, status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/automator/workflows
 * @desc    Get automated trigger workflows
 */
router.get('/workflows', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await automatorService.getWorkflows(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/workflows
 * @desc    Create a new automation workflow
 */
router.post('/workflows', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { name, triggerType, actionType } = req.body;
    if (!name || !triggerType || !actionType) {
      res.status(400).json({ error: 'Name, triggerType, and actionType are required' });
      return;
    }
    const result = await automatorService.createWorkflow(userId, { name, triggerType, actionType });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/automator/workflows/:id/toggle
 * @desc    Toggle workflow active rule
 */
router.post('/workflows/:id/toggle', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const result = await automatorService.toggleWorkflow(userId, id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/agents/automator/workflows/:id
 * @desc    Delete workflow rule
 */
router.delete('/workflows/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    await automatorService.deleteWorkflow(userId, id);
    res.status(200).json({ message: 'Workflow rule deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
