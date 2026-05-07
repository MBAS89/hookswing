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
  const { plan } = req.body as { plan: 'pro' | 'team' };
  const priceId =
    plan === 'team'
      ? process.env.STRIPE_PRICE_TEAM
      : process.env.STRIPE_PRICE_PRO;

  if (!priceId) {
    return res.status(500).json({ error: 'Stripe price not configured' });
  }

  let user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  let customerId = user?.stripeCustomerId;
  if (!customerId) {
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

  res.json({ url: session.url });
});

router.post('/portal', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

  if (!user?.stripeCustomerId) {
    return res.status(400).json({ error: 'No Stripe customer found' });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL || 'https://hookswing.com'}/dashboard/billing`,
  });

  res.json({ url: session.url });
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

  if (event.type === 'invoice.payment_succeeded') {
    const subscription = event.data.object as any;
    const customerId = subscription.customer as string;
    const priceId = subscription.lines?.data?.[0]?.price?.id;

    const plan = priceId === process.env.STRIPE_PRICE_TEAM ? 'TEAM' : 'PRO';

    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        plan,
        stripeSubscriptionId: subscription.subscription as string,
      },
    });
  }

  res.json({ received: true });
});

export default router;
