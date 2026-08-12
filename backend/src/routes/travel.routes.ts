import { Router, Request, Response, NextFunction } from 'express';
import { travelService } from '../services/travel.service';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/agents/travel/search
 * @desc    Search for flights, buses, or trains
 */
router.post('/search', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { mode, origin, destination, date, passengers, travelClass } = req.body;

    if (!mode || (mode !== 'hotel' && !origin) || !destination || !date || !passengers) {
      res.status(400).json({ error: 'Missing required search fields' });
      return;
    }

    let result;
    if (mode === 'flight') {
      result = await travelService.searchFlights(userId, { origin, destination, date, passengers: Number(passengers), travelClass });
    } else if (mode === 'bus') {
      result = await travelService.searchBuses(userId, { origin, destination, date, passengers: Number(passengers) });
    } else if (mode === 'train') {
      result = await travelService.searchTrains(userId, { origin, destination, date, passengers: Number(passengers), travelClass });
    } else if (mode === 'hotel') {
      result = await travelService.searchHotels(userId, { destination, date, passengers: Number(passengers) });
    } else {
      res.status(400).json({ error: 'Invalid travel mode. Must be: flight, bus, train, hotel' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/travel/book
 * @desc    Book a travel ticket
 */
router.post('/book', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { mode, resultId, origin, destination, date, passengers, carrier, price, departureTime, arrivalTime } = req.body;

    if (!mode || !resultId || !origin || !destination || !date || !passengers || !carrier || price === undefined || !departureTime || !arrivalTime) {
      res.status(400).json({ error: 'Missing required booking fields' });
      return;
    }

    const result = await travelService.bookTicket(userId, {
      mode,
      resultId,
      origin,
      destination,
      date,
      passengers: Number(passengers),
      carrier,
      price: Number(price),
      departureTime,
      arrivalTime,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/agents/travel/bookings
 * @desc    Get travel booking history
 */
router.get('/bookings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const history = await travelService.getBookingHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/travel/plan
 * @desc    Plan a trip with AI trip planning
 */
router.post('/plan', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { description } = req.body;

    if (!description) {
      res.status(400).json({ error: 'Trip description is required for planning' });
      return;
    }

    const result = await travelService.planTrip(userId, { description });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/agents/travel/cancel
 * @desc    Cancel a travel booking
 */
router.post('/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required for cancellation' });
      return;
    }

    const result = await travelService.cancelBooking(userId, bookingId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
