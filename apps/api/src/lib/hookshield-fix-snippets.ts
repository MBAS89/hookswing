export const fixSnippets: Record<string, Record<string, { code: string; language: string; criticalNote: string }>> = {
  express: {
    STRIPE: {
      language: 'javascript',
      criticalNote: 'Use express.raw() BEFORE any global express.json() middleware on this route.',
      code: `// ⚠️ CRITICAL: Place this BEFORE app.use(express.json())
app.post('/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).send('Missing signature');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(\`Webhook Error: \${err.message}\`);
    }

    // ✅ Event is verified. Process it safely.
    console.log('Verified event:', event.type);
    res.json({ received: true });
  }
);`,
    },
    GITHUB: {
      language: 'javascript',
      criticalNote: 'Always verify the X-Hub-Signature-256 header against your webhook secret.',
      code: `const crypto = require('crypto');

app.post('/api/webhook/github', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!sig) return res.status(400).send('Missing signature');

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(req.body);
  const digest = 'sha256=' + hmac.digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(digest))) {
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(req.body);
  console.log('Verified event:', event);
  res.json({ received: true });
});`,
    },
  },
  fastapi: {
    STRIPE: {
      language: 'python',
      criticalNote: 'Use await request.body() to get the raw payload. Do NOT use request.json().',
      code: `from fastapi import Request, HTTPException, Header
import os

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload,
            stripe_signature,
            os.environ['STRIPE_WEBHOOK_SECRET']
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # ✅ Event is verified. Process it safely.
    return {"received": True}`,
    },
  },
  nextjs: {
    STRIPE: {
      language: 'typescript',
      criticalNote: 'Use req.text() to get the raw payload. Do NOT use req.json().',
      code: `import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const payload = await req.text(); // ⚠️ Use .text(), not .json()

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // ✅ Event is verified. Process it safely.
  return NextResponse.json({ received: true });
}`,
    },
  },
  django: {
    STRIPE: {
      language: 'python',
      criticalNote: 'Use request.body to get raw bytes. Do NOT use request.POST or request.data.',
      code: `import stripe
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def stripe_webhook(request):
    sig = request.headers.get('Stripe-Signature')

    if not sig:
        return HttpResponseBadRequest('Missing signature')

    payload = request.body  # Raw bytes

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig,
            settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponseBadRequest('Invalid payload')
    except stripe.error.SignatureVerificationError:
        return HttpResponseBadRequest('Invalid signature')

    # ✅ Event is verified. Process it safely.
    return HttpResponse(status=200)`,
    },
  },
};

export function getFixSnippet(framework: string, provider: string) {
  const fw = framework.toLowerCase();
  const pv = provider.toUpperCase();
  return fixSnippets[fw]?.[pv] || fixSnippets[fw]?.['STRIPE'] || null;
}
