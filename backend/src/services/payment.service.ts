import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class PaymentService {

  async getSubscription(userId: string) {
    let sub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) {
      // Create a default free subscription
      sub = await prisma.subscription.create({
        data: {
          userId,
          plan: 'free',
          status: 'active',
        },
      });
    }

    return sub;
  }

  async createCheckoutSession(userId: string, plan: string) {
    const validPlans = ['pro', 'premium'];
    if (!validPlans.includes(plan)) {
      throw new Error('Invalid plan selection');
    }

    // Since this platform has a disruptive 100% free model, we simulate checkout session
    // returning a mock URL that directs to the success redirect parameter.
    const mockSessionId = `cs_test_${Math.random().toString(36).substr(2, 9)}`;
    const mockCheckoutUrl = `/billing?checkout_status=success&session_id=${mockSessionId}&plan=${plan}`;

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'checkout_session_created',
        entityType: 'subscription',
        entityId: userId,
        metadata: JSON.stringify({ plan, mockSessionId }),
      },
    });

    return {
      sessionId: mockSessionId,
      url: mockCheckoutUrl,
    };
  }

  async confirmCheckoutSession(userId: string, sessionId: string, plan: string) {
    // Process and activate subscription inside DB
    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'active',
        stripeSubscriptionId: `sub_test_${Math.random().toString(36).substr(2, 9)}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      create: {
        userId,
        plan,
        status: 'active',
        stripeSubscriptionId: `sub_test_${Math.random().toString(36).substr(2, 9)}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Save billing payment details
    const price = plan === 'pro' ? 49.00 : 99.00;
    await prisma.payment.create({
      data: {
        userId,
        amount: price,
        currency: 'USD',
        status: 'completed',
        stripeSessionId: sessionId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'subscription_activated',
        entityType: 'subscription',
        entityId: sub.id,
        metadata: JSON.stringify({ plan, sessionId }),
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'payment',
        action: 'billing_confirmed',
        description: `Upgraded subscription to ${plan.toUpperCase()} plan (Session: ${sessionId})`,
        reasoning: `Billed: $${price} USD (simulated free tier)`,
      },
    });

    return sub;
  }

  async cancelSubscription(userId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub) {
      throw new Error('Subscription not found');
    }

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        plan: 'free',
        status: 'cancelled',
        currentPeriodEnd: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'subscription_cancelled',
        entityType: 'subscription',
        entityId: sub.id,
      },
    });

    await prisma.agentActivityLog.create({
      data: {
        userId,
        agentId: 'payment',
        action: 'billing_cancelled',
        description: `Cancelled plan. User downgraded back to FREE tier.`,
      },
    });

    return updated;
  }
}

export const paymentService = new PaymentService();
