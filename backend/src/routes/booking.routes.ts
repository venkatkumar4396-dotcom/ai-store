/**
 * Booking Routes — REST API for the 5-bot booking agent system
 * Mounts at: /api/booking
 * 
 * SECURITY: All endpoints require authentication. User data is scoped
 * to the authenticated user's ID — no query-param userId override.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { orchestratorAgent, TransportMode } from '../services/agents/orchestrator.agent';
import { trainAgent } from '../services/agents/train.agent';
import { notifierAgent } from '../services/agents/notifier.agent';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { logSecurityEvent } from '../utils/securityLogger';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// ─── POST /api/booking/search ───────────────────────────────
// Trigger multi-agent search via orchestrator
router.post('/search', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const {
      origin,
      destination,
      date,
      passengers = 1,
      mode = 'multi',
      class: travelClass,
      sessionId,
    } = req.body;

    if (!origin || !destination || !date) {
      res.status(400).json({ error: 'origin, destination, and date are required' });
      return;
    }

    const result = await orchestratorAgent.search({
      origin,
      destination,
      date,
      passengers: parseInt(passengers as string, 10),
      mode: mode as TransportMode,
      class: travelClass,
      userId,
      sessionId,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error(`Booking search error: ${error.message}`);
    next(error);
  }
});

// ─── POST /api/booking/book ─────────────────────────────────
// Confirm a booking through the orchestrator
router.post('/book', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { mode, itemId, passengerInfo } = req.body;

    if (!mode || !itemId || !passengerInfo) {
      res.status(400).json({ error: 'mode, itemId, and passengerInfo are required' });
      return;
    }

    const result = await orchestratorAgent.book({
      mode: mode as 'flight' | 'bus' | 'train' | 'hotel',
      itemId,
      userId,
      passengerInfo,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error(`Booking confirmation error: ${error.message}`);
    next(error);
  }
});

// ─── GET /api/booking/history ───────────────────────────────
// Get authenticated user's booking history only
router.get('/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Cap at 100
    });

    res.json({ success: true, data: bookings });
  } catch (error: any) {
    logger.error(`Booking history error: ${error.message}`);
    next(error);
  }
});

// ─── GET /api/booking/searches ──────────────────────────────
// Get authenticated user's recent searches
router.get('/searches', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const searches = await prisma.bookingSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ success: true, data: searches });
  } catch (error: any) {
    next(error);
  }
});

// ─── GET /api/booking/health ────────────────────────────────
// Get health status of all 5 agents (public — no user data exposed)
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await orchestratorAgent.getAllAgentHealth();
    res.json({ success: true, data: agents });
  } catch (error: any) {
    logger.error(`Agent health check error: ${error.message}`);
    next(error);
  }
});

// ─── GET /api/booking/pnr/:pnr ──────────────────────────────
// PNR status check — requires auth and ownership verification
router.get('/pnr/:pnr', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const pnrParam = req.params.pnr;
    const pnr = typeof pnrParam === 'string' ? pnrParam : Array.isArray(pnrParam) ? pnrParam[0] : undefined;
    if (!pnr) {
      res.status(400).json({ error: 'PNR param is required and must be a string' });
      return;
    }

    // Check in database — verify ownership
    const booking = await prisma.booking.findUnique({ where: { pnr } });
    if (!booking) {
      // Try train PNR check (generic lookup, no user data)
      const status = await trainAgent.checkPNR(pnr);
      res.json({ success: true, data: status });
      return;
    }

    // Verify the booking belongs to the authenticated user
    if (booking.userId !== userId) {
      logSecurityEvent('IDOR_ATTEMPT', `User ${userId} tried to access PNR ${pnr} owned by ${booking.userId}`, { userId });
      res.status(403).json({ error: 'You do not have permission to view this booking' });
      return;
    }

    res.json({
      success: true,
      data: {
        pnr,
        status: booking.status,
        mode: booking.mode,
        carrier: booking.carrier,
        origin: booking.origin,
        destination: booking.destination,
        departure: booking.departureTime,
        arrival: booking.arrivalTime,
        passengers: booking.passengers,
        totalPrice: booking.totalPrice,
        currency: booking.currency,
        eTicketUrl: booking.eTicketUrl,
        seatInfo: booking.seatInfo ? JSON.parse(booking.seatInfo) : null,
      },
    });
  } catch (error: any) {
    logger.error(`PNR check error: ${error.message}`);
    next(error);
  }
});

// ─── GET /api/booking/notifications ────────────────────────
// Get authenticated user's booking notifications
router.get('/notifications', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const notifications = await notifierAgent.getUserNotifications(userId);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    next(error);
  }
});

export default router;
