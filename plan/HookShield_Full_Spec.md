# HookShield — Webhook Security Scanner Feature Specification

> **Product:** HookSwing (hookswing.com)  
> **Feature Name:** HookShield  
> **Goal:** Help developers detect and fix Stripe/webhook signature verification vulnerabilities  
> **Motivation:** A recent security scan found 1,542 production apps accepting forged Stripe webhooks without signature verification. HookShield protects our users from being in that number.  
> **Builder:** AI-assisted full-stack dev (Node/Express/Prisma/React/Vite)

---

## 1. Feature Overview

HookShield is a built-in security audit tool inside HookSwing. It allows users to test their own production webhook endpoints to see if they properly reject unsigned or forged webhook payloads.

**What it does:**
1. User enters their webhook endpoint URL (e.g., `https://myapp.com/api/webhook/stripe`)
2. HookShield sends 3 test requests:
   - **Test A:** Fake payload with **NO signature header** → Should return 400
   - **Test B:** Fake payload with **INVALID signature header** → Should return 400
   - **Test C:** Fake payload with **valid structure but wrong secret** → Should return 400
3. HookShield analyzes the response codes and response times
4. Generates a **Security Report** with vulnerability status
5. Provides **framework-specific fix code** (Express, FastAPI, Next.js, etc.)
6. Stores scan history so users can track security over time

**Why this is a killer feature:**
- Nobody else offers this. Competitors catch webhooks. HookSwing **protects** you.
- Positions HookSwing as the security-conscious choice.
- Drives Pro conversions (security scans = Pro feature).
- The recent 1,542-app vulnerability makes this extremely timely.

---

## 2. User Flow

```
User opens Dashboard
    ↓
Clicks "HookShield" in sidebar (new nav item with shield icon)
    ↓
Sees HookShield page with:
  - "Scan Your Endpoint" input box
  - "Recent Scans" history table
  - "Why This Matters" educational banner
    ↓
Enters their webhook URL + selects provider (Stripe, GitHub, PayPal, etc.)
    ↓
Clicks "Run Security Scan"
    ↓
HookShield sends 3 test requests to their endpoint
    ↓
Results appear:
  - ✅ SECURE: Endpoint rejects unsigned webhooks
  - ⚠️ VULNERABLE: Endpoint accepts forged webhooks
  - 📋 Framework-specific fix code
  - 🔗 Link to docs
    ↓
User can "Re-scan" anytime or "Export Report" as PDF/text
```

---

## 3. Database Schema Additions (Prisma)

Add to `schema.prisma`:

```prisma
model SecurityScan {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  projectId   String?  @map("project_id")
  targetUrl   String   @map("target_url")
  provider    Provider @default(STRIPE)
  status      ScanStatus @default(PENDING)

  // Test results stored as JSON
  results     Json

  // Computed score 0-100
  securityScore Int?    @map("security_score")

  // Is the endpoint vulnerable?
  isVulnerable Boolean @default(false) @map("is_vulnerable")

  // Framework detected (express, fastapi, nextjs, unknown)
  detectedFramework String? @map("detected_framework")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("security_scans")
}

enum Provider {
  STRIPE
  GITHUB
  PAYPAL
  TWILIO
  SHOPIFY
  DISCORD
  SLACK
  CUSTOM
}

enum ScanStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

**Note:** The `results` JSON structure:
```json
{
  "testA_noSignature": {
    "sent": true,
    "statusCode": 200,
    "responseTimeMs": 145,
    "responseBody": "{...}",
    "passed": false
  },
  "testB_invalidSignature": {
    "sent": true,
    "statusCode": 400,
    "responseTimeMs": 132,
    "responseBody": "{...}",
    "passed": true
  },
  "testC_wrongSecret": {
    "sent": true,
    "statusCode": 400,
    "responseTimeMs": 128,
    "responseBody": "{...}",
    "passed": true
  },
  "summary": {
    "totalTests": 3,
    "passedTests": 2,
    "failedTests": 1,
    "recommendation": "Your endpoint accepts unsigned webhooks. Implement signature verification immediately."
  }
}
```

---

## 4. API Endpoints

### 4.1 Create Security Scan
```
POST /api/security-scans
Auth: Required
Body: {
  "targetUrl": "https://myapp.com/api/webhook/stripe",
  "provider": "STRIPE",
  "projectId": "optional-project-id"
}
```

**Validation:**
- `targetUrl` must be valid HTTPS URL
- `targetUrl` cannot be localhost/private IP (security)
- Rate limit: 5 scans per hour per user
- Max 50 scans per month on Free, unlimited on Pro

**Response:**
```json
{
  "id": "scan_123",
  "status": "RUNNING",
  "targetUrl": "https://myapp.com/api/webhook/stripe",
  "provider": "STRIPE",
  "createdAt": "2026-05-09T21:00:00Z"
}
```

### 4.2 Get Scan Results
```
GET /api/security-scans/:id
Auth: Required
```

**Response (completed):**
```json
{
  "id": "scan_123",
  "status": "COMPLETED",
  "targetUrl": "https://myapp.com/api/webhook/stripe",
  "provider": "STRIPE",
  "isVulnerable": true,
  "securityScore": 33,
  "detectedFramework": "express",
  "results": { ... },
  "createdAt": "2026-05-09T21:00:00Z",
  "completedAt": "2026-05-09T21:00:03Z"
}
```

### 4.3 List User's Scans
```
GET /api/security-scans?page=1&limit=20
Auth: Required
```

### 4.4 Delete Scan
```
DELETE /api/security-scans/:id
Auth: Required
```

### 4.5 Get Fix Code Snippet
```
GET /api/security-scans/fix-code?framework=express&provider=STRIPE
Auth: Required (or public — marketing feature)
```

**Response:**
```json
{
  "framework": "express",
  "provider": "STRIPE",
  "code": "// Express + Stripe webhook signature verification\napp.post('/api/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {\n  const sig = req.headers['stripe-signature'];\n  let event;\n  try {\n    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);\n  } catch (err) {\n    return res.status(400).send(`Webhook Error: ${err.message}`);\n  }\n  // Process verified event\n  res.json({received: true});\n});",
  "language": "javascript",
  "criticalNote": "Use express.raw() BEFORE any global express.json() middleware on this route."
}
```

---

## 5. Scanner Engine (Backend Logic)

### 5.1 Scan Worker

Create a new worker file: `src/workers/securityScanWorker.ts`

**Step-by-step scan process:**

```typescript
async function runSecurityScan(scanId: string) {
  const scan = await prisma.securityScan.findUnique({ where: { id: scanId } });

  // 1. Update status to RUNNING
  await prisma.securityScan.update({
    where: { id: scanId },
    data: { status: 'RUNNING' }
  });

  const results: any = {};
  let isVulnerable = false;
  let passedTests = 0;

  // 2. TEST A: No signature header
  const testA = await sendTestRequest({
    url: scan.targetUrl,
    payload: generateFakePayload(scan.provider),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'HookShield-Security-Scanner/1.0'
    }
  });

  results.testA_noSignature = {
    sent: true,
    statusCode: testA.statusCode,
    responseTimeMs: testA.responseTimeMs,
    responseBody: truncate(testA.body, 500),
    passed: testA.statusCode >= 400 // Should reject
  };

  if (testA.statusCode < 400) {
    isVulnerable = true;
  } else {
    passedTests++;
  }

  // 3. TEST B: Invalid signature header
  const testB = await sendTestRequest({
    url: scan.targetUrl,
    payload: generateFakePayload(scan.provider),
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': 't=123,v1=fake_signature_invalid',
      'User-Agent': 'HookShield-Security-Scanner/1.0'
    }
  });

  results.testB_invalidSignature = {
    sent: true,
    statusCode: testB.statusCode,
    responseTimeMs: testB.responseTimeMs,
    responseBody: truncate(testB.body, 500),
    passed: testB.statusCode >= 400 // Should reject
  };

  if (testB.statusCode < 400) {
    isVulnerable = true;
  } else {
    passedTests++;
  }

  // 4. TEST C: Valid structure but wrong secret (if we can detect)
  // For Stripe, we can't generate a valid signature without the secret
  // So we skip or send a well-formed but unverifiable signature
  const testC = await sendTestRequest({
    url: scan.targetUrl,
    payload: generateFakePayload(scan.provider),
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': generateWellFormedButInvalidSignature(),
      'User-Agent': 'HookShield-Security-Scanner/1.0'
    }
  });

  results.testC_wrongSecret = {
    sent: true,
    statusCode: testC.statusCode,
    responseTimeMs: testC.responseTimeMs,
    responseBody: truncate(testC.body, 500),
    passed: testC.statusCode >= 400
  };

  if (testC.statusCode < 400) {
    isVulnerable = true;
  } else {
    passedTests++;
  }

  // 5. Calculate security score
  const securityScore = Math.round((passedTests / 3) * 100);

  // 6. Detect framework (best guess from response headers/body)
  const detectedFramework = detectFramework(testA.headers, testA.body);

  // 7. Generate recommendation
  results.summary = {
    totalTests: 3,
    passedTests,
    failedTests: 3 - passedTests,
    recommendation: generateRecommendation(isVulnerable, detectedFramework, scan.provider)
  };

  // 8. Save results
  await prisma.securityScan.update({
    where: { id: scanId },
    data: {
      status: 'COMPLETED',
      results,
      isVulnerable,
      securityScore,
      detectedFramework
    }
  });
}
```

### 5.2 Fake Payload Generator

```typescript
function generateFakePayload(provider: Provider): object {
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
            status: 'complete'
          }
        }
      };

    case 'GITHUB':
      return {
        action: 'push',
        ref: 'refs/heads/main',
        repository: {
          id: 123456789,
          name: 'test-repo',
          full_name: 'test-user/test-repo'
        },
        sender: {
          login: 'hookshield-test',
          id: 987654321
        }
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
          state: 'completed'
        }
      };

    default:
      return {
        event: 'test.hookshield.security_scan',
        timestamp: new Date().toISOString(),
        data: { test: true, source: 'hookshield-scanner' }
      };
  }
}
```

### 5.3 Framework Detection

```typescript
function detectFramework(responseHeaders: any, responseBody: string): string {
  const headers = Object.keys(responseHeaders).map(h => h.toLowerCase());
  const body = responseBody.toLowerCase();

  if (body.includes('fastapi') || body.includes('pydantic') || headers.includes('x-process-time')) {
    return 'fastapi';
  }
  if (body.includes('next.js') || body.includes('vercel') || headers.includes('x-vercel-id')) {
    return 'nextjs';
  }
  if (body.includes('express') || body.includes('node.js') || headers.includes('x-powered-by') && responseHeaders['x-powered-by']?.includes('Express')) {
    return 'express';
  }
  if (body.includes('django') || headers.includes('x-frame-options')) {
    return 'django';
  }
  if (body.includes('laravel') || body.includes('symfony')) {
    return 'php';
  }
  if (headers.includes('server') && responseHeaders['server']?.includes('nginx')) {
    return 'nginx'; // Might be proxying to anything
  }

  return 'unknown';
}
```

### 5.4 Security & Rate Limiting

**CRITICAL: Prevent abuse of the scanner**

```typescript
// Rate limits
const SCAN_RATE_LIMITS = {
  free: { perHour: 5, perMonth: 50 },
  pro: { perHour: 30, perMonth: 500 },
  team: { perHour: 100, perMonth: 2000 }
};

// URL validation
function isValidTargetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== 'https:') return false;

    // Block localhost, private IPs, internal networks
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return false;
    if (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31) return false;
    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) return false;

    // Block hookswing.com itself (prevent self-scanning loops)
    if (hostname.includes('hookswing.com')) return false;

    return true;
  } catch {
    return false;
  }
}
```

---

## 6. Frontend Components

### 6.1 HookShield Page (`/dashboard/hookshield`)

**Layout:**
```
┌─────────────────────────────────────────┐
│  HookShield 🔒 Webhook Security Scanner │
├─────────────────────────────────────────┤
│  [Educational Banner]                   │
│  "1,542 apps were found vulnerable..."  │
├─────────────────────────────────────────┤
│  [Scan Input Card]                      │
│  URL: [________________] Provider: [▼]  │
│  [Run Security Scan]                    │
├─────────────────────────────────────────┤
│  [Scan Results - appears after scan]    │
│  Score: 33/100 ⚠️ VULNERABLE            │
│  ┌─────────┬─────────┬─────────┐       │
│  │ No Sig  │ Bad Sig │ Wrong   │       │
│  │   200   │   400   │   400   │       │
│  │   ❌    │   ✅    │   ✅    │       │
│  └─────────┴─────────┴─────────┘       │
├─────────────────────────────────────────┤
│  [Fix Code Snippet - if vulnerable]     │
│  Framework: Express + Stripe            │
│  [Copyable code block]                  │
├─────────────────────────────────────────┤
│  [Recent Scans Table]                   │
│  Date | URL | Score | Status | Actions  │
└─────────────────────────────────────────┘
```

### 6.2 Components to Build

```
src/components/hookshield/
├── HookShieldPage.tsx          # Main page layout
├── ScanInputCard.tsx           # URL input + provider select + scan button
├── ScanResultsCard.tsx         # Results display with score + test grid
├── SecurityScoreBadge.tsx      # 0-100 score with color coding
├── VulnerabilityAlert.tsx      # Red/yellow/green alert banner
├── FixCodeBlock.tsx            # Syntax-highlighted code snippet with copy button
├── ScanHistoryTable.tsx        # Table of past scans
├── EducationalBanner.tsx       # "1,542 apps vulnerable" banner
└── FrameworkSelector.tsx       # Dropdown for framework override
```

### 6.3 Score Color Coding

| Score | Color | Label | Icon |
|-------|-------|-------|------|
| 90-100 | Green | SECURE | Shield checkmark |
| 70-89 | Yellow | MOSTLY SECURE | Shield with warning |
| 50-69 | Orange | NEEDS ATTENTION | Shield with exclamation |
| 0-49 | Red | VULNERABLE | Shield with X |

### 6.4 Test Result Grid

Display 3 cards side by side:

**Test A: No Signature**
- Status badge: 200 = Red "ACCEPTED" / 400+ = Green "REJECTED"
- Response time
- Truncated response body (click to expand)

**Test B: Invalid Signature**
- Same format

**Test C: Wrong Secret**
- Same format

---

## 7. Code Snippet Library

Pre-built snippets for common frameworks. Store as template strings.

### 7.1 Express + Stripe
```javascript
// ⚠️ CRITICAL: Place this BEFORE app.use(express.json())
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
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Event is verified. Process it safely.
    console.log('Verified event:', event.type);
    res.json({ received: true });
  }
);
```

### 7.2 FastAPI + Stripe
```python
from fastapi import Request, HTTPException, Header

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
    return {"received": True}
```

### 7.3 Next.js App Router + Stripe
```typescript
import { NextResponse } from 'next/server';
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
}
```

### 7.4 Django + Stripe
```python
import stripe
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
    return HttpResponse(status=200)
```

---

## 8. CRITICAL TASK: Self-Check HookSwing's Own Endpoints

**The AI must audit the existing HookSwing codebase to ensure WE are not vulnerable.**

### 8.1 Checklist for Self-Audit

The AI must search the entire codebase for:

1. **Stripe webhook endpoint** (likely `/api/billing/webhook`)
   - Does it use `express.raw()` or `express.json()`?
   - Does it call `stripe.webhooks.constructEvent()`?
   - Does it return 400 for missing/invalid signatures?
   - Is the `STRIPE_WEBHOOK_SECRET` env variable properly loaded?

2. **Any other webhook-receiving endpoints**
   - PayPal IPN handler?
   - GitHub webhook handler?
   - Any third-party integration webhooks?

3. **Middleware order**
   - Is `app.use(express.json())` placed globally BEFORE webhook routes?
   - If yes, the webhook route must use `express.raw()` specifically to override.

### 8.2 Self-Test Script

Create an internal script that tests HookSwing's own billing webhook:

```typescript
// scripts/selfSecurityAudit.ts
// Run this before every deploy

async function selfAudit() {
  const baseUrl = process.env.SELF_AUDIT_URL || 'https://hookswing.com';

  // Test our own Stripe webhook endpoint
  const tests = [
    {
      name: 'No Signature Header',
      url: `${baseUrl}/api/billing/webhook`,
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 400
    },
    {
      name: 'Invalid Signature',
      url: `${baseUrl}/api/billing/webhook`,
      headers: { 
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=123,v1=fake'
      },
      expectedStatus: 400
    }
  ];

  let allPassed = true;

  for (const test of tests) {
    const res = await fetch(test.url, {
      method: 'POST',
      headers: test.headers,
      body: JSON.stringify({ test: true })
    });

    const passed = res.status === test.expectedStatus;
    console.log(`${test.name}: ${res.status} ${passed ? '✅' : '❌ FAIL'}`);

    if (!passed) allPassed = false;
  }

  if (!allPassed) {
    console.error('❌ SECURITY AUDIT FAILED: HookSwing endpoints are vulnerable!');
    process.exit(1);
  }

  console.log('✅ SECURITY AUDIT PASSED: All endpoints properly reject unsigned webhooks.');
}

selfAudit();
```

**Add to CI/CD:** Run `npm run security:audit` before every deploy. If it fails, block the deploy.

### 8.3 Expected Fix for HookSwing's Billing Endpoint

If the audit finds vulnerability, apply this fix immediately:

```typescript
// In your Express server setup

// ❌ WRONG: This breaks Stripe signature verification
// app.use(express.json()); // Don't put this globally before webhook routes

// ✅ CORRECT: Use express.raw() specifically for the webhook route
app.post('/api/billing/webhook', 
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle verified event
    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Update user subscription
        break;
      case 'customer.subscription.deleted':
        // Downgrade user
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// ✅ Safe to use express.json() for ALL OTHER routes AFTER the webhook route
app.use(express.json());
app.use('/api', apiRoutes);
```

---

## 9. Feature Gating (Free vs Pro)

| Feature | Free | Pro | Team |
|---------|------|-----|------|
| Security Scans | 5/month | 30/month | Unlimited |
| Scan History | Last 3 scans | 90 days | Unlimited |
| Fix Code Snippets | Express only | All frameworks | All frameworks |
| Export Report | ❌ | PDF export | PDF + CSV export |
| CI/CD Audit Script | ❌ | ✅ | ✅ |
| Priority Scan Queue | ❌ | ✅ | ✅ |

---

## 10. Marketing Integration

### 10.1 Landing Page Section

Add a new section to the HookSwing landing page called **"Built With Security in Mind"** or integrate into the existing "Inspect Like a Pro" section.

**Copy provided in separate document.**

### 10.2 Badge System

After a user passes a security scan, offer a **"HookShield Verified"** badge they can embed in their README:

```markdown
[![HookShield Verified](https://hookswing.com/shield/verified.svg)](https://hookswing.com)
```

This is viral marketing — other developers see the badge and visit HookSwing.

---

## 11. Analytics & Tracking

Track these events:
- `hookshield_scan_started`
- `hookshield_scan_completed` (with score)
- `hookshield_vulnerability_found`
- `hookshield_fix_code_copied`
- `hookshield_upgrade_from_scan` (if user upgrades after seeing vulnerability)

---

## 12. Implementation Order (Priority)

**Week 1:**
1. Self-audit existing codebase (CRITICAL — do this first)
2. Fix any vulnerable endpoints in HookSwing
3. Add `SecurityScan` Prisma model
4. Build scan API endpoint + worker
5. Build basic frontend (input + results display)

**Week 2:**
6. Add code snippet library (Express, FastAPI, Next.js)
7. Add scan history table
8. Add educational banner
9. Add Pro gating
10. Write landing page copy

**Week 3:**
11. Add CI/CD self-audit script
12. Add "HookShield Verified" badge generator
13. Marketing push: Tweet about the 1,542 vulnerable apps

---

**END OF SPECIFICATION**

**AI Instructions:**
1. Start with the self-audit (Section 8). Search the codebase for `/api/billing/webhook` or any Stripe webhook handler.
2. If vulnerable, fix it immediately using Section 8.3.
3. Then implement the database schema (Section 3).
4. Then build the API endpoints (Section 4).
5. Then build the scanner worker (Section 5).
6. Then build the frontend components (Section 6).
7. Then add the landing page story (use the separate Landing Page document).
8. Then add the CI/CD audit script (Section 8.2).
