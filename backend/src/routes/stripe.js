import { Router } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const { user } = req;

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe?canceled=true`,
      metadata: { userId: user.id },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: 'Could not create checkout session' });
  }
});

// POST /api/stripe/webhook  (raw body — mounted before express.json())
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const userId = session.metadata?.userId;
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscribed: true,
                subscriptionStatus: 'active',
                stripeSubscriptionId: session.subscription,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer },
        });
        if (user) {
          const isActive = subscription.status === 'active';
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscribed: isActive,
              subscriptionStatus: subscription.status,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscribed: false,
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: invoice.customer },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'past_due' },
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// POST /api/stripe/cancel-subscription
router.post('/cancel-subscription', authenticate, async (req, res) => {
  try {
    const { user } = req;
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel at period end (graceful)
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ message: 'Subscription will be canceled at the end of the billing period' });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ error: 'Could not cancel subscription' });
  }
});

export default router;
