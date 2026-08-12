import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/payments/subscription
 * @desc    Get user's current subscription plan
 */
router.get('/subscription', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const sub = await paymentService.getSubscription(userId);
    res.status(200).json(sub);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/payments/create-checkout
 * @desc    Create a simulated Stripe checkout session
 */
router.post('/create-checkout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { plan } = req.body;
    if (!plan) {
      res.status(400).json({ error: 'Plan is required (pro or premium)' });
      return;
    }
    const result = await paymentService.createCheckoutSession(userId, plan);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/payments/confirm-checkout
 * @desc    Confirm and activate subscription after checkout completes
 */
router.post('/confirm-checkout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { sessionId, plan } = req.body;
    if (!sessionId || !plan) {
      res.status(400).json({ error: 'sessionId and plan are required' });
      return;
    }
    const sub = await paymentService.confirmCheckoutSession(userId, sessionId, plan);
    res.status(200).json(sub);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/payments/cancel
 * @desc    Cancel active plan subscription
 */
router.post('/cancel', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const result = await paymentService.cancelSubscription(userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
