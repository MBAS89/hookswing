/**
 * HookShield Self-Security Audit
 * Run this before every deploy to ensure HookSwing's own webhook endpoints
 * properly reject unsigned and forged webhooks.
 *
 * Usage: npx tsx scripts/selfSecurityAudit.ts
 */

async function selfAudit() {
  const baseUrl = process.env.SELF_AUDIT_URL || 'https://hookswing.com';

  const tests = [
    {
      name: 'No Signature Header',
      url: `${baseUrl}/api/billing/webhook`,
      headers: { 'Content-Type': 'application/json' },
      expectedStatus: 400,
    },
    {
      name: 'Invalid Signature',
      url: `${baseUrl}/api/billing/webhook`,
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=123,v1=fake',
      },
      expectedStatus: 400,
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const res = await fetch(test.url, {
        method: 'POST',
        headers: test.headers,
        body: JSON.stringify({ test: true }),
      });

      const passed = res.status === test.expectedStatus;
      console.log(`${test.name}: ${res.status} ${passed ? '✅' : '❌ FAIL'}`);

      if (!passed) allPassed = false;
    } catch (err: any) {
      console.error(`${test.name}: ERROR — ${err.message} ❌ FAIL`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error('❌ SECURITY AUDIT FAILED: HookSwing endpoints are vulnerable!');
    process.exit(1);
  }

  console.log('✅ SECURITY AUDIT PASSED: All endpoints properly reject unsigned webhooks.');
}

selfAudit();
