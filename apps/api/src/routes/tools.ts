import { createSafeRouter } from '../middleware/safeRouter';
import { authRateLimit } from '../middleware/rateLimit';
import { stripe } from '../lib/stripe';
import crypto from 'crypto';
import { z } from 'zod';

const router = createSafeRouter();

const verifySchema = z.object({
  provider: z.enum(['stripe', 'github', 'paypal', 'shopify', 'generic']),
  payload: z.string().max(1024 * 1024, 'Payload too large (max 1MB)'),
  signature: z.string(),
  secret: z.string(),
});

router.post('/verify-signature', authRateLimit, async (req, res) => {
  const result = verifySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ valid: false, message: 'Invalid input', details: { error: result.error.message } });
  }

  const { provider, payload, signature, secret } = result.data;

  try {
    let isValid = false;
    let details: Record<string, any> = {};

    switch (provider) {
      case 'stripe': {
        try {
          const event = stripe.webhooks.constructEvent(payload, signature, secret);
          isValid = true;
          details = {
            timestamp: event.created,
            type: event.type,
            id: event.id,
          };
        } catch (err: any) {
          isValid = false;
          details = { error: err.message };
        }
        break;
      }

      case 'github': {
        const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
        const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        try {
          isValid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed));
        } catch {
          isValid = false;
        }
        details = {
          computed: computed.slice(0, 16) + '...',
          provided: sig.slice(0, 16) + '...',
          algorithm: 'HMAC-SHA256',
        };
        break;
      }

      case 'shopify': {
        const computed = crypto.createHmac('sha256', secret).update(payload).digest('base64');
        isValid = computed === signature;
        details = {
          computed: computed.slice(0, 16) + '...',
          provided: signature.slice(0, 16) + '...',
          algorithm: 'HMAC-SHA256 (base64)',
        };
        break;
      }

      case 'paypal': {
        // Simplified HMAC check for developer debugging
        const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const sig = signature.startsWith('sha256=') ? signature.slice(7) : signature;
        try {
          isValid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(computed));
        } catch {
          isValid = sig === computed;
        }
        details = {
          computed: computed.slice(0, 16) + '...',
          provided: sig.slice(0, 16) + '...',
          algorithm: 'HMAC-SHA256 (simplified)',
          note: 'PayPal production uses RSA-SHA256 with certificates. This is a simplified HMAC check for debugging.',
        };
        break;
      }

      case 'generic': {
        const computed = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        isValid = computed === signature;
        details = {
          computed: computed.slice(0, 16) + '...',
          provided: signature.slice(0, 16) + '...',
          algorithm: 'HMAC-SHA256',
        };
        break;
      }
    }

    res.json({
      valid: isValid,
      message: isValid ? 'Signature is valid ✅' : 'Signature is invalid ❌',
      details,
    });
  } catch (err: any) {
    res.status(400).json({ valid: false, message: 'Verification error', details: { error: err.message } });
  }
});

export default router;
