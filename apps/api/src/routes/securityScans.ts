import { createSafeRouter } from '../middleware/safeRouter';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { prisma } from '../lib/prisma';
import { getFixSnippet } from '../lib/hookshield-fix-snippets';
import axios from 'axios';

const router = createSafeRouter();

router.use(authMiddleware);
router.use(apiRateLimit);

// Rate limit config per plan
const SCAN_LIMITS = {
  FREE: { perHour: 5, perMonth: 30 },
  PRO: { perHour: 30, perMonth: 500 },
  TEAM: { perHour: 100, perMonth: 2000 },
};

function isValidTargetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return false;
    if (hostname.startsWith('172.')) {
      const second = parseInt(hostname.split('.')[1], 10);
      if (second >= 16 && second <= 31) return false;
    }
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;
    if (hostname.includes('hookswing.com')) return false;
    return true;
  } catch {
    return false;
  }
}

function generateFakePayload(provider: string): object {
  switch (provider) {
    case 'STRIPE':
      return {
        id: 'evt_test_hookshield',
        object: 'event',
        api_version: '2024-12-18.acacia',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 1,
        request: { id: 'req_test_hookshield', idempotency_key: null },
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_hookshield',
            object: 'checkout.session',
            amount_total: 5000,
            currency: 'usd',
            customer: 'cus_test_hookshield',
            payment_status: 'paid',
            status: 'complete',
          },
        },
      };
    case 'GITHUB':
      return {
        action: 'push',
        ref: 'refs/heads/main',
        repository: {
          id: 123456789,
          name: 'test-repo',
          full_name: 'test-user/test-repo',
        },
        sender: { login: 'hookshield-test', id: 987654321 },
      };
    case 'PAYPAL':
      return {
        id: 'WH-TEST-HOOKSHIELD',
        event_version: '1.0',
        create_time: new Date().toISOString(),
        resource_type: 'payment',
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        summary: 'Payment completed',
        resource: {
          id: 'PAYID-TEST-HOOKSHIELD',
          amount: { total: '50.00', currency: 'USD' },
          state: 'completed',
        },
      };
    default:
      return {
        event: 'test.hookshield.security_scan',
        timestamp: new Date().toISOString(),
        data: { test: true, source: 'hookshield-scanner' },
      };
  }
}

function detectFramework(responseHeaders: any, responseBody: string): string {
  const headers = Object.keys(responseHeaders || {}).map((h) => h.toLowerCase());
  const body = (responseBody || '').toLowerCase();

  if (body.includes('fastapi') || body.includes('pydantic') || headers.includes('x-process-time')) {
    return 'fastapi';
  }
  if (body.includes('next.js') || body.includes('vercel') || headers.includes('x-vercel-id')) {
    return 'nextjs';
  }
  if (
    body.includes('express') ||
    body.includes('node.js') ||
    (headers.includes('x-powered-by') && String(responseHeaders['x-powered-by'] || '').includes('Express'))
  ) {
    return 'express';
  }
  if (body.includes('django') || headers.includes('x-frame-options')) {
    return 'django';
  }
  if (body.includes('laravel') || body.includes('symfony')) {
    return 'php';
  }
  if (headers.includes('server') && String(responseHeaders['server'] || '').includes('nginx')) {
    return 'nginx';
  }
  return 'unknown';
}

function generateRecommendation(isVulnerable: boolean, framework: string, provider: string): string {
  if (!isVulnerable) {
    return 'Your endpoint properly rejects unsigned and forged webhooks. Keep it up!';
  }
  const fw = framework !== 'unknown' ? framework.charAt(0).toUpperCase() + framework.slice(1) : 'your';
  return `Your endpoint accepts unsigned webhooks. Implement ${provider.toLowerCase()} signature verification in ${fw}. Use the generated fix code below.`;
}

async function checkRateLimits(userId: string, plan: string) {
  const limits = SCAN_LIMITS[plan as keyof typeof SCAN_LIMITS] || SCAN_LIMITS.FREE;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const hourCount = await prisma.securityScan.count({
    where: { userId, createdAt: { gte: oneHourAgo } },
  });
  if (hourCount >= limits.perHour) {
    return { allowed: false, reason: `Scan limit reached: ${limits.perHour} per hour` };
  }

  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthCount = await prisma.securityScan.count({
    where: { userId, createdAt: { gte: oneMonthAgo } },
  });
  if (monthCount >= limits.perMonth) {
    return { allowed: false, reason: `Scan limit reached: ${limits.perMonth} per month` };
  }

  return { allowed: true };
}

async function runScan(scanId: string) {
  const scan = await prisma.securityScan.findUnique({ where: { id: scanId } });
  if (!scan) return;

  await prisma.securityScan.update({
    where: { id: scanId },
    data: { status: 'RUNNING' },
  });

  const payload = generateFakePayload(scan.provider);
  const payloadJson = JSON.stringify(payload);
  const results: any = {};
  let isVulnerable = false;
  let passedTests = 0;

  const sendTest = async (headers: Record<string, string>) => {
    const start = performance.now();
    try {
      const res = await axios.post(scan.targetUrl, payload, {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'HookShield-Security-Scanner/1.0', ...headers },
        timeout: 30000,
        validateStatus: () => true,
        maxRedirects: 0,
      });
      return {
        statusCode: res.status,
        responseTimeMs: Math.round(performance.now() - start),
        body: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
        headers: res.headers as Record<string, string>,
      };
    } catch (err: any) {
      return {
        statusCode: err.response?.status || 0,
        responseTimeMs: Math.round(performance.now() - start),
        body: err.message || 'Request failed',
        headers: err.response?.headers || {},
      };
    }
  };

  // Test A: No signature header
  const testA = await sendTest({});
  results.testA_noSignature = {
    sent: true,
    statusCode: testA.statusCode,
    responseTimeMs: testA.responseTimeMs,
    responseBody: testA.body.slice(0, 500),
    passed: testA.statusCode >= 400,
  };
  if (testA.statusCode < 400) isVulnerable = true;
  else passedTests++;

  // Test B: Invalid signature header
  const sigHeaders: Record<string, string> = { 'Stripe-Signature': 't=123,v1=fake_signature_invalid' };
  if (scan.provider === 'GITHUB') sigHeaders['X-Hub-Signature-256'] = 'sha256=fake_signature_invalid';
  if (scan.provider === 'PAYPAL') sigHeaders['PAYPAL-TRANSMISSION-ID'] = 'fake_transmission_id';
  if (scan.provider === 'TWILIO') sigHeaders['X-Twilio-Signature'] = 'fake_signature_invalid';
  if (scan.provider === 'SHOPIFY') sigHeaders['X-Shopify-Hmac-Sha256'] = 'fake_signature_invalid';
  if (scan.provider === 'DISCORD') sigHeaders['X-Signature-Ed25519'] = 'fake_signature_invalid';
  if (scan.provider === 'SLACK') sigHeaders['X-Slack-Signature'] = 'v0=fake_signature_invalid';

  const testB = await sendTest(sigHeaders);
  results.testB_invalidSignature = {
    sent: true,
    statusCode: testB.statusCode,
    responseTimeMs: testB.responseTimeMs,
    responseBody: testB.body.slice(0, 500),
    passed: testB.statusCode >= 400,
  };
  if (testB.statusCode < 400) isVulnerable = true;
  else passedTests++;

  // Test C: Well-formed but invalid signature (structurally valid, cryptographically wrong)
  const wellFormedHeaders: Record<string, string> = {
    'Stripe-Signature': 't=1700000000,v1=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };
  if (scan.provider === 'GITHUB')
    wellFormedHeaders['X-Hub-Signature-256'] = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';
  if (scan.provider === 'PAYPAL')
    wellFormedHeaders['PAYPAL-TRANSMISSION-ID'] = '69cd13f0-d67a-11e5-baa3-778b53ac4582';
  if (scan.provider === 'SHOPIFY')
    wellFormedHeaders['X-Shopify-Hmac-Sha256'] = '0000000000000000000000000000000000000000000000000000000000000000';

  const testC = await sendTest(wellFormedHeaders);
  results.testC_wrongSecret = {
    sent: true,
    statusCode: testC.statusCode,
    responseTimeMs: testC.responseTimeMs,
    responseBody: testC.body.slice(0, 500),
    passed: testC.statusCode >= 400,
  };
  if (testC.statusCode < 400) isVulnerable = true;
  else passedTests++;

  const securityScore = Math.round((passedTests / 3) * 100);
  const detectedFramework = detectFramework(testA.headers, testA.body);

  results.summary = {
    totalTests: 3,
    passedTests,
    failedTests: 3 - passedTests,
    recommendation: generateRecommendation(isVulnerable, detectedFramework, scan.provider),
  };

  await prisma.securityScan.update({
    where: { id: scanId },
    data: {
      status: 'COMPLETED',
      results,
      isVulnerable,
      securityScore,
      detectedFramework,
    },
  });
}

// POST /api/security-scans — create and run a scan
router.post('/', async (req: AuthRequest, res) => {
  const { targetUrl, provider = 'STRIPE', projectId } = req.body;
  const userId = req.user!.id;
  const plan = req.user!.plan || 'FREE';

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'targetUrl is required' });
  }

  if (!isValidTargetUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid target URL. Must be a public HTTPS URL.' });
  }

  const rateCheck = await checkRateLimits(userId, plan);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: rateCheck.reason });
  }

  const scan = await prisma.securityScan.create({
    data: {
      userId,
      projectId: projectId || null,
      targetUrl,
      provider: provider.toUpperCase(),
      status: 'PENDING',
      results: {},
    },
  });

  // Run scan asynchronously — don't block the response
  runScan(scan.id).catch((err) => {
    console.error('[HookShield] Scan failed:', err);
    prisma.securityScan.update({
      where: { id: scan.id },
      data: { status: 'FAILED' },
    }).catch(() => {});
  });

  res.status(201).json({
    id: scan.id,
    status: 'RUNNING',
    targetUrl: scan.targetUrl,
    provider: scan.provider,
    createdAt: scan.createdAt,
  });
});

// GET /api/security-scans — list user's scans
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  const [scans, total] = await Promise.all([
    prisma.securityScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        targetUrl: true,
        provider: true,
        status: true,
        securityScore: true,
        isVulnerable: true,
        detectedFramework: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.securityScan.count({ where: { userId } }),
  ]);

  res.json({ scans, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /api/security-scans/:id — get scan details
router.get('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const scan = await prisma.securityScan.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  res.json(scan);
});

// DELETE /api/security-scans/:id — delete a scan
router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const scan = await prisma.securityScan.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  await prisma.securityScan.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// GET /api/security-scans/fix-code — get fix code snippet
router.get('/fix-code', async (req: AuthRequest, res) => {
  const framework = (req.query.framework as string) || 'express';
  const provider = (req.query.provider as string) || 'STRIPE';

  const snippet = getFixSnippet(framework, provider);
  if (!snippet) {
    return res.status(404).json({ error: 'No fix snippet available for this framework/provider' });
  }

  res.json(snippet);
});

export default router;
