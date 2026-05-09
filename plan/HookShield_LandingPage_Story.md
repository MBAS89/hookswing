# HookShield — Landing Page Story & Copy

> **Product:** HookSwing (hookswing.com)  
> **Feature:** HookShield — Webhook Security Scanner  
> **Tone:** Alarming but empowering. "We found the problem. We built the fix."  
> **Goal:** Convert visitors by showing HookSwing is the ONLY webhook tool that protects you, not just catches you.

---

## 1. The Story Section (Add to Landing Page)

### Placement
Insert this section **immediately after the "One URL. Infinite Power." features section** and **before the "How It Works" section.**

### Background Style
`bg-red-950/30` or `bg-slate-800` with a subtle red left border (`border-l-4 border-red-500`). This makes it look like a security alert, not a sales pitch.

---

### Headline (H2)
```
1,542 Production Apps Were Just Found Accepting Fake Payments
```

### Subheadline
```
A security researcher sent forged Stripe webhooks to 6,000 websites. 1,542 returned "200 OK" and processed them as real payments. No signature. No verification. No actual money.

The attacker didn't hack anything. They just told those servers "I paid" — and the servers believed it.
```

### The 3 Vulnerability Cards

**Card 1 — "The Missing Signature"**
- Icon: Warning triangle
- Title: `"No Stripe-Signature Header = Accepted"`
- Body: `"A researcher sent a fake checkout.session.completed event with NO signature header. 1,542 apps said 'thanks for the payment' and activated accounts, shipped products, or granted premium access."`

**Card 2 — "The express.json() Trap"**
- Icon: Code brackets with X
- Title: `"The #1 Mistake in Express Apps"`
- Body: `"Developers use app.use(express.json()) globally, then try to verify Stripe signatures. But the body is already parsed into a JavaScript object. The signature never matches. Some devs just... remove the verification."`

**Card 3 — "The TODO That Never Gets Done"**
- Icon: Clipboard with checkmark
- Title: `"'I'll Add Verification Later'"`
- Body: `"The developer journey: build route → console.log body → get logic working → 'TODO: add signature check' → ship → 6 months pass → forget → get exploited."`

### The Pivot Line (Centered, bold, white)
```
HookSwing doesn't just catch your webhooks. It makes sure nobody else can fake them.
```

---

## 2. The HookShield Feature Block

### Headline (H2)
```
Meet HookShield: The Security Scanner Built Into HookSwing
```

### Subheadline
```
Test your own webhook endpoint in 10 seconds. Find out if you're one of the 1,542 before an attacker does.
```

### Feature Grid (3 columns)

**Column 1 — "Scan Your Endpoint"**
- Icon: Magnifying glass with shield
- Title: `"3-Point Security Scan"`
- Body: `"Enter your webhook URL. HookShield sends three test payloads: one with no signature, one with an invalid signature, and one with the wrong secret. See exactly how your server responds."`

**Column 2 — "Get Your Score"**
- Icon: Gauge/speedometer
- Title: `"0-100 Security Score"`
- Body: `"Green (90-100): You're secure. Yellow (70-89): Mostly safe. Red (0-69): Vulnerable. No guessing. No "I think it's fine." Just facts."`

**Column 3 — "Copy the Fix"**
- Icon: Code block with checkmark
- Title: `"Framework-Specific Fix Code"`
- Body: `"If you're vulnerable, HookShield generates the exact code you need for Express, FastAPI, Next.js, or Django. Copy, paste, deploy. Signature verification in 5 minutes."`

### Visual: Scan Result Mockup
Show a mockup of the HookShield dashboard:
- URL input: `https://myapp.com/api/webhook/stripe`
- 3 test result cards:
  - No Signature: `200 ❌ ACCEPTED` (red)
  - Invalid Signature: `400 ✅ REJECTED` (green)
  - Wrong Secret: `400 ✅ REJECTED` (green)
- Big red banner: `⚠️ VULNERABLE — Your endpoint accepts unsigned webhooks`
- Below: Express code snippet with `express.raw()` highlighted

---

## 3. The "Why HookSwing" Security Pitch

### Headline (H2)
```
Every Webhook Tool Catches. Only HookSwing Protects.
```

### Comparison Table

| | webhook.site | ngrok | HookSwing |
|---|---|---|---|
| **Catch webhooks** | ✅ 24 hours | ✅ Live only | ✅ 90 days |
| **Replay payloads** | ❌ | ❌ | ✅ |
| **Forward to localhost** | ❌ | ✅ | ✅ |
| **Security scan your endpoint** | ❌ | ❌ | ✅ **HookShield** |
| **Detect signature vulnerabilities** | ❌ | ❌ | ✅ |
| **Generate fix code** | ❌ | ❌ | ✅ |

### Bottom Line
```
Other tools help you test. HookSwing helps you test AND makes sure you don't get exploited in production.
```

---

## 4. The Express Fix Snippet (For Landing Page)

Show this code block prominently. Developers love seeing code on landing pages.

```javascript
// ❌ WRONG: express.json() breaks signature verification
app.use(express.json());
app.post('/api/webhook/stripe', (req, res) => {
  // req.body is already parsed — signature NEVER matches
});

// ✅ CORRECT: Use express.raw() on the webhook route
app.post('/api/webhook/stripe', 
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Process verified event safely
    res.json({ received: true });
  }
);
```

**Caption below:** `"This is the exact fix HookShield generates for your framework."`

---

## 5. The CTA Section

### Headline (H2)
```
Don't Be #1,543
```

### Subheadline
```
Scan your webhook endpoint free. Fix the vulnerability in 5 minutes. Sleep better tonight.
```

### CTA Button
```
[Scan My Endpoint — Free]
```
*Style: `bg-red-500 hover:bg-red-400 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-red-500/30 shadow-lg`*

**Why red?** This is a security alert, not a calm feature. Red = urgency = action.

### Secondary Text
```
No signup required for first scan. Takes 10 seconds. Results in real time.
```

---

## 6. Trust Signals

Add below the CTA:

```
🔒 HookShield only sends test payloads. Never modifies your data.
🛡️ Scans run in isolated workers. No persistent access to your endpoint.
📋 We don't store your webhook secrets. Ever.
```

---

## 7. SEO-Optimized Blog Post (Drive Organic Traffic)

**Title:** *"1,542 Apps Accept Fake Stripe Webhooks: How to Not Be One of Them"*

**Outline:**
1. The security scan that found 1,542 vulnerable apps
2. What the attack looks like (fake checkout.session.completed)
3. Why developers skip signature verification (the TODO that never gets done)
4. The express.json() trap explained with code
5. How to fix it: Express, FastAPI, Next.js, Django
6. How to test YOUR endpoint (introduce HookShield)
7. Conclusion: verify signatures, scan regularly, don't be #1,543

**Target keywords:**
- stripe webhook signature verification
- webhook security vulnerability
- express raw stripe webhook
- fake stripe webhook attack
- payment bypass webhook

**Post on:** hookswing.com/blog/1542-apps-vulnerable-stripe-webhooks
**Cross-post to:** Dev.to, Hashnode, Medium, Hacker News (when account is ready)

---

## 8. Twitter/X Thread (Post This Week)

**Tweet 1 (Hook):**
```
A security researcher just found 1,542 production apps that accept FAKE Stripe payments.

No hack. No breach. Just forged webhooks with no signature.

And the servers said "thanks for the money."

Here's how to not be #1,543 🧵
```

**Tweet 2:**
```
The attack is simple:

1. Attacker sends fake "checkout.session.completed" to /api/webhook/stripe
2. NO Stripe-Signature header
3. Server returns 200 OK
4. Server marks attacker's account as PAID
5. Attacker gets your product for free

That's it. One curl command.
```

**Tweet 3:**
```
Why do 1,542 apps have this bug?

The developer journey:
→ Build webhook route locally
→ console.log the body to test
→ Get the "upgrade user" logic working
→ "TODO: add signature verification"
→ Ship to production
→ 6 months pass
→ Nobody remembers the TODO
→ Attacker sends fake payment → accepted
```

**Tweet 4:**
```
The #1 technical cause:

app.use(express.json()) // parses body globally

Then Stripe signature verification fails because the raw body was already transformed into a JS object.

Some devs "fix" it by... removing signature verification entirely.

💀
```

**Tweet 5:**
```
The actual fix is 5 lines:

app.post('/webhook/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const event = stripe.webhooks.constructEvent(
      req.body, 
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
    // Process verified event
  }
);
```

**Tweet 6:**
```
But how do you KNOW your endpoint is secure?

I built HookShield into HookSwing.

Enter your webhook URL. We send 3 test payloads:
• No signature → should return 400
• Invalid signature → should return 400  
• Wrong secret → should return 400

If any return 200, you're vulnerable.
```

**Tweet 7 (CTA):**
```
Scan your endpoint free:

https://hookswing.com/hookshield

Takes 10 seconds. No signup for first scan.

Don't be #1,543.
```

---

## 9. Email to Existing Users

**Subject:** `🔒 Security Alert: Test Your Webhook Endpoint in 10 Seconds`

**Body:**
```
Hi [Name],

A security researcher just published findings: 1,542 production apps accept forged Stripe webhooks without signature verification.

The attack is simple: send a fake "payment completed" event with no signature header. If your server returns 200, the attacker gets your product for free.

I built HookShield to fix this.

Enter your webhook URL → HookShield sends 3 security tests → See your score → Copy the fix code for your framework.

Scan free: https://hookswing.com/dashboard/hookshield

Takes 10 seconds. No signup required for first scan.

Stay safe,
[Your name]
HookSwing
```

---

## 10. Badge / Viral Marketing

After a user passes a security scan, show them:

```
🎉 Your endpoint is secure! 

Share your HookShield badge:

[![HookShield Verified](https://hookswing.com/badge/secure.svg)](https://hookswing.com)

Markdown:
[![HookShield Verified](https://hookswing.com/badge/secure.svg)](https://hookswing.com)
```

**Why this works:** Developers put badges in their READMEs. Other developers see the badge → click → discover HookSwing.

---

**END OF LANDING PAGE STORY & COPY**

**Instructions for AI:**
1. Add Section 1 (The Story) to the landing page immediately after the features grid.
2. Add Section 2 (HookShield Feature Block) after the story.
3. Add Section 4 (Express Fix Snippet) as a standalone code showcase block.
4. Add Section 5 (The CTA) as a pre-footer hero section.
5. Create the blog post (Section 7) at /blog/1542-apps-vulnerable-stripe-webhooks.
6. Set up the email sequence (Section 9) to send to all existing users.
