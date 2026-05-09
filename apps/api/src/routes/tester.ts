import { Router } from 'express';
import axios from 'axios';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { testerProviders } from '../lib/tester-payloads';

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// GET /api/tester/providers — list all available providers and their events
router.get('/providers', (_req, res) => {
  const providers = Object.entries(testerProviders).map(([key, provider]) => ({
    key,
    name: provider.name,
    events: Object.entries(provider.events).map(([eventKey, event]) => ({
      key: eventKey,
      label: event.label,
    })),
  }));
  res.json({ providers });
});

// POST /api/tester/send — send a test payload to a target URL
router.post('/send', async (req: AuthRequest, res) => {
  const { targetUrl, provider: providerKey, eventType, customPayload } = req.body;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'targetUrl is required' });
  }
  if (!providerKey || typeof providerKey !== 'string') {
    return res.status(400).json({ error: 'provider is required' });
  }
  if (!eventType || typeof eventType !== 'string') {
    return res.status(400).json({ error: 'eventType is required' });
  }

  const provider = testerProviders[providerKey];
  if (!provider) {
    return res.status(400).json({ error: `Unknown provider: ${providerKey}` });
  }

  const event = provider.events[eventType];
  if (!event) {
    return res.status(400).json({ error: `Unknown event type: ${eventType} for provider ${providerKey}` });
  }

  // Use custom payload if provided, otherwise use the sample
  const sample = event.payload;
  const body = customPayload !== undefined ? customPayload : sample.body;
  const headers: Record<string, string> = { ...sample.headers };

  // Override content-type based on actual body type
  if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
    headers['content-type'] = headers['content-type'] || 'application/json';
  }

  const start = performance.now();

  try {
    const axiosRes = await axios({
      method: sample.method as any,
      url: targetUrl,
      headers,
      data: body,
      timeout: 30000,
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const responseTime = Math.round(performance.now() - start);

    res.json({
      success: true,
      request: {
        method: sample.method,
        url: targetUrl,
        headers,
        body,
      },
      response: {
        status: axiosRes.status,
        statusText: axiosRes.statusText,
        headers: axiosRes.headers,
        body: axiosRes.data,
      },
      responseTime,
      source: sample.source,
    });
  } catch (err: any) {
    const responseTime = Math.round(performance.now() - start);

    if (err.response) {
      res.json({
        success: false,
        request: {
          method: sample.method,
          url: targetUrl,
          headers,
          body,
        },
        response: {
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          body: err.response.data,
        },
        responseTime,
        source: sample.source,
        error: `HTTP ${err.response.status}: ${err.response.statusText}`,
      });
    } else if (err.request) {
      res.json({
        success: false,
        request: {
          method: sample.method,
          url: targetUrl,
          headers,
          body,
        },
        response: null,
        responseTime,
        source: sample.source,
        error: 'No response received. The target server may be unreachable.',
      });
    } else {
      res.json({
        success: false,
        request: {
          method: sample.method,
          url: targetUrl,
          headers,
          body,
        },
        response: null,
        responseTime,
        source: sample.source,
        error: err.message || 'Request failed',
      });
    }
  }
});

export default router;
