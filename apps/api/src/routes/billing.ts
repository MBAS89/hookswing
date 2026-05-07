import { Router } from 'express';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Price ID helpers
const getPriceId = (plan: 'pro' | 'team', interval: 'month' | 'year') => {
  if (plan === 'team') {
    return interval === 'year'
      ? process.env.STRIPE_PRICE_TEAM_YEARLY
      : process.env.STRIPE_PRICE_TEAM;
  }
  return interval === 'year'
    ? process.env.STRIPE_PRICE_PRO_YEARLY
    : process.env.STRIPE_PRICE_PRO;
};

const getPlanFromPrice = (priceId: string | undefined) => {
  if (!priceId) return 'FREE';
  if (priceId === process.env.STRIPE_PRICE_TEAM || priceId === process.env.STRIPE_PRICE_TEAM_YEARLY) return 'TEAM';
  if (priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return 'PRO';
  return 'FREE';
};

const getIntervalFromPrice = (priceId: string | undefined): 'month' | 'year' => {
  if (!priceId) return 'month';
  if (priceId === process.env.STRIPE_PRICE_PRO_YEARLY || priceId === process.env.STRIPE_PRICE_TEAM_YEARLY) return 'year';
  return 'month';
};

// ========== WEBHOOK — NO AUTH (must be before auth middleware) ==========
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} id=${event.id}`);

  // Idempotency — skip already processed events
  const existing = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    console.log(`[Stripe Webhook] Event ${event.id} already processed — skipping`);
    return res.json({ received: true, idempotency: 'skipped' });
  }
  await prisma.stripeEvent.create({
    data: { id: event.id, type: event.type, processed: true },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log(`[Stripe Webhook] checkout.session.completed customer=${session.customer}`);
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPrice(priceId);
          console.log(`[Stripe Webhook] New subscription: user plan=${plan} sub=${session.subscription}`);

          await prisma.user.updateMany({
            where: { stripeCustomerId: session.customer },
            data: { plan, stripeSubscriptionId: session.subscription },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;
        console.log(`[Stripe Webhook] invoice.payment_succeeded customer=${customerId}`);

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id;
          const plan = getPlanFromPrice(priceId);
          console.log(`[Stripe Webhook] Invoice paid: plan=${plan}`);

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
        const subscriptionId = invoice.subscription as string;
        console.log(`[Stripe Webhook] invoice.payment_failed customer=${customerId}`);

        // Only downgrade if this is a final payment failure (subscription becomes past_due)
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            console.log(`[Stripe Webhook] Subscription ${subscriptionId} past_due — downgrading to FREE`);
            await prisma.user.updateMany({
              where: { stripeCustomerId: customerId },
              data: { plan: 'FREE' },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price.id;
        console.log(`[Stripe Webhook] customer.subscription.updated customer=${customerId} status=${status} price=${priceId}`);

        if (status === 'past_due' || status === 'unpaid' || status === 'canceled') {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: 'FREE', stripeSubscriptionId: null },
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
        console.log(`[Stripe Webhook] customer.subscription.deleted customer=${customerId} — downgrading to FREE`);

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: 'FREE', stripeSubscriptionId: null },
        });
        break;
      }
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err.message);
  }

  res.json({ received: true });
});

// ========== AUTH-PROTECTED ROUTES ==========
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

  let subscriptions: any[] = [];
  let invoices: any[] = [];
  let currentPriceId: string | null = null;
  let currentInterval: 'month' | 'year' = 'month';

  if (user?.stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'all',
        limit: 10,
      });

      subscriptions = subs.data.map((sub) => {
        const price = sub.items.data[0]?.price;
        const subPlan = getPlanFromPrice(price?.id);
        const subInterval = getIntervalFromPrice(price?.id);
        return {
          id: sub.id,
          status: sub.status,
          currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          plan: subPlan,
          interval: subInterval,
          amount: price?.unit_amount,
          currency: price?.currency,
          priceId: price?.id,
        };
      });

      // Find the primary active subscription
      const activeSub = subscriptions.find((s) => s.status === 'active' || s.status === 'trialing');
      if (activeSub) {
        currentPriceId = activeSub.priceId;
        currentInterval = activeSub.interval;
      }

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
    } catch (err: any) {
      console.error('[Billing] Error fetching Stripe data:', err.message);
    }
  }

  res.json({
    plan: user?.plan || 'FREE',
    stripeCustomerId: user?.stripeCustomerId,
    stripeSubscriptionId: user?.stripeSubscriptionId,
    currentPriceId,
    currentInterval,
    subscriptions,
    invoices,
  });
});

// Create a NEW subscription (for free users only)
router.post('/checkout', async (req: AuthRequest, res) => {
  try {
    const { plan, interval = 'month' } = req.body as { plan: 'pro' | 'team'; interval?: 'month' | 'year' };

    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      console.error(`[Stripe Checkout] Missing price ID for plan=${plan} interval=${interval}`);
      return res.status(500).json({ error: `Stripe ${interval}ly price not configured for ${plan}` });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Checkout] STRIPE_SECRET_KEY is not set');
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Block if user already has an active subscription
    if (user.stripeCustomerId) {
      const existingSubs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 10,
      });
      if (existingSubs.data.length > 0) {
        return res.status(400).json({
          error: 'You already have an active subscription. Use the billing portal or plan switch to change plans.',
          code: 'already_subscribed',
        });
      }
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
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/account?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/account?canceled=true`,
    });

    console.log(`[Stripe Checkout] Session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout] Error:', err.message);
    res.status(500).json({ error: 'Checkout failed. Please try again later.' });
  }
});

// Update existing subscription with proration (upgrade/downgrade/interval change)
router.post('/update-plan', async (req: AuthRequest, res) => {
  try {
    const { plan, interval = 'month' } = req.body as { plan: 'pro' | 'team'; interval?: 'month' | 'year' };

    const newPriceId = getPriceId(plan, interval);
    if (!newPriceId) {
      return res.status(500).json({ error: `Stripe ${interval}ly price not configured for ${plan}` });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found. Subscribe first.' });
    }

    // Find active subscription
    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subs.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found. Use checkout to subscribe.' });
    }

    const subscription = subs.data[0];
    const currentItem = subscription.items.data[0];
    const currentPriceId = currentItem?.price?.id;

    // If already on this exact price, nothing to do
    if (currentPriceId === newPriceId) {
      return res.json({ success: true, message: 'Already on this plan.' });
    }

    console.log(`[Stripe UpdatePlan] Changing subscription ${subscription.id} from ${currentPriceId} to ${newPriceId}`);

    // Update subscription with proration — Stripe calculates the difference automatically
    const updated = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false, // Reactivate if user had scheduled cancellation
    });

    const updatedPriceId = updated.items.data[0]?.price?.id;
    const updatedPlan = getPlanFromPrice(updatedPriceId);

    // Sync immediately so user sees the change without waiting for webhook
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { plan: updatedPlan, stripeSubscriptionId: updated.id },
    });

    res.json({
      success: true,
      plan: updatedPlan,
      interval: getIntervalFromPrice(updatedPriceId),
      subscriptionId: updated.id,
    });
  } catch (err: any) {
    console.error('[Stripe UpdatePlan] Error:', err.message);
    res.status(500).json({ error: err.message || 'Plan update failed. Please try again.' });
  }
});

// Billing portal for cancellations, payment methods, invoice history
router.post('/portal', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/account`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Portal] Error:', err.message);
    res.status(500).json({ error: 'Billing portal failed. Please try again later.' });
  }
});

export default router;
