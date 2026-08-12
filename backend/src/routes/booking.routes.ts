/**
 * Booking Routes — REST API for the 5-bot booking agent system
 * Mounts at: /api/booking
 */

import { Router, Request, Response, NextFunction } from 'express';
import { orchestratorAgent, TransportMode } from '../services/agents/orchestrator.agent';
import { trainAgent } from '../services/agents/train.agent';
import { notifierAgent } from '../services/agents/notifier.agent';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// ─── POST /api/booking/search ───────────────────────────────
// Trigger multi-agent search via orchestrator
router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    // Get userId from auth header (JWT) if available
    const userId = (req as any).user?.userId || 'anonymous';

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
router.post('/book', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mode, itemId, passengerInfo } = req.body;

    if (!mode || !itemId || !passengerInfo) {
      res.status(400).json({ error: 'mode, itemId, and passengerInfo are required' });
      return;
    }

    const userId = (req as any).user?.userId || 'anonymous';

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
// Get user's booking history
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId || req.query.userId as string || 'anonymous';
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ success: true, data: bookings });
  } catch (error: any) {
    logger.error(`Booking history error: ${error.message}`);
    next(error);
  }
});

// ─── GET /api/booking/searches ──────────────────────────────
// Get user's recent searches
router.get('/searches', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId || req.query.userId as string || 'anonymous';

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
// Get health status of all 5 agents
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
// PNR status check
router.get('/pnr/:pnr', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pnrParam = req.params.pnr;
    const pnr = typeof pnrParam === 'string' ? pnrParam : Array.isArray(pnrParam) ? pnrParam[0] : undefined;
    if (!pnr) {
      res.status(400).json({ error: 'PNR param is required and must be a string' });
      return;
    }

    // Check in database
    const booking = await prisma.booking.findUnique({ where: { pnr } });
    if (!booking) {
      // Try train PNR check
      const status = await trainAgent.checkPNR(pnr);
      res.json({ success: true, data: status });
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
// Get user's booking notifications
router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId || req.query.userId as string || 'anonymous';
    const notifications = await notifierAgent.getUserNotifications(userId);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    next(error);
  }
});

export default router;
