import { Router, Request, Response, NextFunction } from 'express';
import { salesService } from '../services/sales.service';
import { leadGenPipeline } from '../services/leadgen-pipeline.service';
import { suppressionService } from '../services/suppression.service';
import { validateEmailDeliverability } from '../utils/email-validator';
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

/**
 * @route   POST /api/agents/sales/leads/import
 * @desc    Import raw leads from CSV / JSON data
 */
router.post('/leads/import', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      res.status(400).json({ error: 'Leads array is required' });
      return;
    }
    const leadIds = await leadGenPipeline.discoverOrImportLeads(userId, {
      industry: 'Imported',
      targetRole: 'Prospect',
      companySize: 'Any',
      rawLeads: leads,
    });
    res.status(200).json({ message: `Successfully imported ${leadIds.length} leads`, leadIds });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/sales/leads/verify-email
 * @desc    Perform live DNS MX verification on a single email
 */
router.post('/leads/verify-email', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const result = await validateEmailDeliverability(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ─── Pipeline Routes ────────────────────────────────────────

/**
 * @route   POST /api/agents/sales/pipeline/run
 * @desc    Trigger full autonomous 5-stage lead generation pipeline
 */
router.post('/pipeline/run', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { industry, targetRole, companySize, rawLeads, dryRun, enableWhatsApp } = req.body;

    if ((!industry || !targetRole) && (!rawLeads || rawLeads.length === 0)) {
      res.status(400).json({ error: 'Industry & target role or a list of imported leads is required' });
      return;
    }

    const result = await leadGenPipeline.runFullPipeline(
      userId,
      {
        industry: industry || 'Target Market',
        targetRole: targetRole || 'Decision Maker',
        companySize: companySize || '10-500',
        rawLeads,
        enableWhatsApp: !!enableWhatsApp,
      },
      dryRun !== false // Default to dry run for safety
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/sales/pipeline/stage/:stage
 * @desc    Run a single pipeline stage (discover/enrich/score/write/send)
 */
router.post('/pipeline/stage/:stage', authenticate, aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const stage = req.params.stage as string;
    const result = await leadGenPipeline.runSingleStage(userId, stage, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/sales/pipeline/runs
 * @desc    Get pipeline run history
 */
router.get('/pipeline/runs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await leadGenPipeline.getRunHistory(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/sales/pipeline/runs/:id
 * @desc    Get a specific pipeline run details
 */
router.get('/pipeline/runs/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await leadGenPipeline.getRunById(userId, req.params.id as string);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ─── CAN-SPAM / GDPR Public 1-Click Unsubscribe ─────────────

/**
 * @route   GET /api/agents/sales/unsubscribe
 * @desc    Public 1-click unsubscribe landing page
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    res.status(400).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #fff;">
          <h2>Invalid Unsubscribe Link</h2>
          <p style="color: #94a3b8;">Missing authentication token.</p>
        </body>
      </html>
    `);
    return;
  }

  const email = suppressionService.verifyUnsubscribeToken(token);
  if (!email) {
    res.status(400).send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #fff;">
          <h2>Link Expired or Invalid</h2>
          <p style="color: #94a3b8;">The unsubscribe security token could not be verified.</p>
        </body>
      </html>
    `);
    return;
  }

  await suppressionService.unsubscribe(email, 'one_click_link');

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Unsubscribe Confirmed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 60px 20px; background: #09090b; color: #fafafa;">
        <div style="max-width: 480px; margin: 0 auto; background: #18181b; padding: 40px 30px; border-radius: 12px; border: 1px solid #27272a;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #10b98120; color: #10b981; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px;">✓</div>
          <h2 style="margin: 0 0 10px; font-size: 22px;">You Have Been Unsubscribed</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            <strong>${email}</strong> has been permanently removed from our sales outreach list in accordance with CAN-SPAM and GDPR guidelines.
          </p>
          <div style="font-size: 12px; color: #71717a; border-top: 1px solid #27272a; padding-top: 16px;">
            Nexora AI Suite • 100 Innovation Parkway, San Francisco, CA
          </div>
        </div>
      </body>
    </html>
  `);
});

/**
 * @route   POST /api/agents/sales/unsubscribe
 * @desc    Public API endpoint to unsubscribe an email
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
  const { email, reason } = req.body;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required' });
    return;
  }

  await suppressionService.unsubscribe(email, reason || 'api_opt_out');
  res.status(200).json({ success: true, message: `${email} has been unsubscribed` });
});

export default router;

