import { Router } from 'express';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

router.get('/', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      createdAt: true,
    },
  });

  let subscription: any = null;
  let invoices: any[] = [];

  if (user?.stripeCustomerId && user?.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      subscription = {
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };

      const invList = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 10,
      });
      invoices = invList.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        status: inv.status,
        created: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf,
      }));
    } catch {
      // Stripe data may be stale; ignore errors
    }
  }

  res.json({
    plan: user?.plan || 'FREE',
    stripeCustomerId: user?.stripeCustomerId,
    stripeSubscriptionId: user?.stripeSubscriptionId,
    subscription,
    invoices,
  });
});

router.post('/checkout', async (req: AuthRequest, res) => {
  try {
    const { plan, interval = 'month' } = req.body as { plan: 'pro' | 'team'; interval?: 'month' | 'year' };

    const isYearly = interval === 'year';
    const priceId =
      plan === 'team'
        ? (isYearly ? process.env.STRIPE_PRICE_TEAM_YEARLY : process.env.STRIPE_PRICE_TEAM)
        : (isYearly ? process.env.STRIPE_PRICE_PRO_YEARLY : process.env.STRIPE_PRICE_PRO);

    if (!priceId) {
      console.error(`[Stripe Checkout] Missing price ID for plan=${plan} interval=${interval}`);
      return res.status(500).json({ error: `Stripe ${interval}ly price not configured for ${plan}` });
    }

    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Checkout] STRIPE_SECRET_KEY is not set');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      console.log(`[Stripe Checkout] Creating new customer for user=${user.id}`);
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: req.user!.name || undefined,
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { stripeCustomerId: customerId },
      });
    }

    console.log(`[Stripe Checkout] Creating session: customer=${customerId} price=${priceId}`);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/billing?canceled=true`,
    });

    console.log(`[Stripe Checkout] Session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout] Error:', err.message);
    res.status(500).json({ error: 'Checkout failed. Please try again later.' });
  }
});

router.post('/portal', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/billing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Portal] Error:', err.message);
    res.status(500).json({ error: 'Billing portal failed. Please try again later.' });
  }
});

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  // Idempotency — skip already processed events
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    return res.json({ received: true, idempotency: 'skipped' });
  }
  await prisma.stripeEvent.create({
    data: { id: event.id, type: event.type, processed: true },
  });

  const getPlanFromPrice = (priceId: string | undefined) => {
    if (priceId === process.env.STRIPE_PRICE_TEAM || priceId === process.env.STRIPE_PRICE_TEAM_YEARLY) return 'TEAM';
    if (priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return 'PRO';
    return 'FREE';
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPrice(priceId);

          await prisma.user.updateMany({
            where: { stripeCustomerId: session.customer },
            data: {
              plan,
              stripeSubscriptionId: session.subscription,
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPrice(priceId);

          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan, stripeSubscriptionId: subscriptionId },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: 'FREE' },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price.id;

        // If subscription is past_due or unpaid, downgrade
        if (status === 'past_due' || status === 'unpaid') {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: 'FREE' },
          });
        } else if (status === 'active' || status === 'trialing') {
          const plan = getPlanFromPrice(priceId);
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan, stripeSubscriptionId: subscription.id },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: 'FREE', stripeSubscriptionId: null },
        });
        break;
      }
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err.message);
    // Still return 200 so Stripe doesn't retry indefinitely
  }

  res.json({ received: true });
});

export default router;
