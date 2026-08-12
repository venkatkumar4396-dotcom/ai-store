import { Router, Request, Response, NextFunction } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { authenticate } from '../middleware/auth';
import { broadcastLimiter } from '../middleware/rateLimit';
import { logActivity } from '../services/analytics.service';

const router = Router();

// Helper middleware to get the user's WhatsApp session
async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const session = await whatsappService.getOrCreateSession(userId);
    (req as any).whatsappSession = session;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/whatsapp/session
 * @desc    Get or create WhatsApp session details and status
 * @access  Private
 */
router.get('/session', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const statusInfo = await whatsappService.getStatus(session.id);
    res.status(200).json({
      session: {
        id: session.id,
        businessName: session.businessName,
        industry: session.industry,
        services: session.services ? JSON.parse(session.services) : [],
        products: session.products ? JSON.parse(session.products) : [],
        brandTone: session.brandTone,
        targetAudience: session.targetAudience,
        faqData: session.faqData ? JSON.parse(session.faqData) : [],
        supportDetails: session.supportDetails,
        pricingInfo: session.pricingInfo,
        websiteLinks: session.websiteLinks ? JSON.parse(session.websiteLinks) : [],
        contactInfo: session.contactInfo ? JSON.parse(session.contactInfo) : {},
        generatedPrompt: session.generatedPrompt,
        isAiEnabled: session.isAiEnabled,
      },
      status: statusInfo.status,
      qrCode: statusInfo.qrCode,
      isReady: statusInfo.isReady,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/session/initialize
 * @desc    Initialize the WhatsApp Web client (generates QR or connects)
 * @access  Private
 */
router.post('/session/initialize', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const session = (req as any).whatsappSession;
    const result = await whatsappService.initialize(userId, session.id);
    await logActivity(userId, 'whatsapp_initialized', 'whatsapp', session.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/session/disconnect
 * @desc    Disconnect and destroy the WhatsApp Web client
 * @access  Private
 */
router.post('/session/disconnect', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const session = (req as any).whatsappSession;
    await whatsappService.disconnect(session.id);
    await logActivity(userId, 'whatsapp_disconnected', 'whatsapp', session.id);
    res.status(200).json({ message: 'WhatsApp session disconnected' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/session/logout
 * @desc    Log out of WhatsApp (destroy client and delete authentication folder)
 * @access  Private
 */
router.post('/session/logout', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const session = (req as any).whatsappSession;
    await whatsappService.logout(session.id);
    await logActivity(userId, 'whatsapp_logged_out', 'whatsapp', session.id);
    res.status(200).json({ message: 'WhatsApp logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/session/setup-business
 * @desc    Setup/update business details and generate AI prompt
 * @access  Private
 */
router.post('/session/setup-business', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const session = (req as any).whatsappSession;
    const updatedSession = await whatsappService.setupBusiness(session.id, req.body);
    await logActivity(userId, 'whatsapp_business_configured', 'whatsapp', session.id, {
      businessName: req.body.businessName,
    });
    res.status(200).json({
      id: updatedSession.id,
      businessName: updatedSession.businessName,
      generatedPrompt: updatedSession.generatedPrompt,
      isAiEnabled: updatedSession.isAiEnabled,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/session/toggle-ai
 * @desc    Toggle AI auto-reply
 * @access  Private
 */
router.post('/session/toggle-ai', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const { isAiEnabled } = req.body;
    
    if (typeof isAiEnabled !== 'boolean') {
      res.status(400).json({ error: 'isAiEnabled boolean is required' });
      return;
    }

    const updated = await whatsappService.toggleAi(session.id, isAiEnabled);
    res.status(200).json({ isAiEnabled: updated.isAiEnabled });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/whatsapp/chats
 * @desc    Get all conversations
 * @access  Private
 */
router.get('/chats', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const chats = await whatsappService.getChats(session.id);
    res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/whatsapp/chats/:phone/messages
 * @desc    Get messages in a specific chat
 * @access  Private
 */
router.get('/chats/:phone/messages', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const phone = req.params.phone as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const messages = await whatsappService.getMessages(session.id, phone, limit, offset);
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/messages/send
 * @desc    Send a WhatsApp message
 * @access  Private
 */
router.post('/messages/send', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const session = (req as any).whatsappSession;
    const { to, body } = req.body;

    if (!to || !body) {
      res.status(400).json({ error: 'Recipients phone number (to) and body are required' });
      return;
    }

    const message = await whatsappService.sendMessage(session.id, to, body);
    await logActivity(userId, 'whatsapp_message_sent', 'message', message.id, { to });

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/whatsapp/templates
 * @desc    Get template messages
 * @access  Private
 */
router.get('/templates', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const templates = await whatsappService.getTemplates(session.id);
    res.status(200).json(templates);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/templates
 * @desc    Create a new message template
 * @access  Private
 */
router.post('/templates', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const { name, body, category, variables } = req.body;

    if (!name || !body) {
      res.status(400).json({ error: 'Template name and body are required' });
      return;
    }

    const template = await whatsappService.createTemplate(session.id, { name, body, category, variables });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/whatsapp/templates/:id
 * @desc    Delete a message template
 * @access  Private
 */
router.delete('/templates/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await whatsappService.deleteTemplate(id);
    res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/whatsapp/contacts
 * @desc    List all contacts for the session
 * @access  Private
 */
router.get('/contacts', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const contacts = await whatsappService.getContacts(session.id);
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/whatsapp/contacts/:id
 * @desc    Update contact tags and notes
 * @access  Private
 */
router.put('/contacts/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, tags, notes } = req.body;
    const updated = await whatsappService.updateContact(id, { name, tags, notes });
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/whatsapp/broadcasts
 * @desc    Get all broadcasts
 * @access  Private
 */
router.get('/broadcasts', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const broadcasts = await whatsappService.getBroadcasts(session.id);
    res.status(200).json(broadcasts);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/broadcasts
 * @desc    Create a new broadcast campaign
 * @access  Private
 */
router.post('/broadcasts', authenticate, getSession, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = (req as any).whatsappSession;
    const { name, templateId, recipients, message, scheduledAt } = req.body;

    if (!name || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: 'Broadcast name and an array of recipients are required' });
      return;
    }

    const broadcast = await whatsappService.createBroadcast(session.id, {
      name,
      templateId,
      recipients,
      message,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    res.status(201).json(broadcast);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/whatsapp/broadcasts/:id/execute
 * @desc    Run a broadcast campaign (sending messages)
 * @access  Private
 */
router.post('/broadcasts/:id/execute', authenticate, broadcastLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    // Run execution asynchronously to not block the request
    whatsappService.executeBroadcast(id).catch(err => {
      console.error(`Error executing broadcast ${id}:`, err);
    });

    await logActivity(userId, 'whatsapp_broadcast_started', 'broadcast', id);
    res.status(200).json({ message: 'Broadcast execution started' });
  } catch (error) {
    next(error);
  }
});

export default router;
