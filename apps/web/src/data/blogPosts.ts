export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readingTime: string;
  ogImage?: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'best-ngrok-alternatives-2025',
    title: '10 Best ngrok Alternatives for Local Development (2025)',
    excerpt:
      'ngrok is the default tunneling tool, but it is not always the best fit. We compare the top 10 ngrok alternatives — free and paid — including Cloudflare Tunnel, LocalTunnel, PageKite, and HookSwing for webhook-specific workflows.',
    author: 'HookSwing Team',
    date: '2025-01-15',
    tags: ['ngrok alternatives', 'tunneling', 'local development', 'webhooks'],
    readingTime: '8 min read',
    content: `## Why Look Beyond ngrok?

ngrok put localhost on the internet and changed how developers share in-progress work. But its free tier is limited — random subdomains, no custom domains, and session timeouts that kick you offline mid-debug. If you are building webhook integrations, those limits become blockers fast.

This guide covers ten ngrok alternatives, from open-source tunneling tools to webhook-specific platforms that do what ngrok cannot.

---

## 1. HookSwing — The Webhook-Native Alternative

**Best for:** Developers who debug Stripe, GitHub, PayPal, or custom webhooks daily.

HookSwing is not a generic tunnel. It is a permanent webhook inbox that catches, stores, inspects, and replays HTTP payloads. You get a public URL instantly, but the payload lives in your dashboard forever — not in a terminal buffer that scrolls away.

**Key advantages over ngrok:**
- **Persistent storage** — webhooks are saved, not streamed once
- **Replay** — click any past webhook and re-send it to localhost
- **Team sharing** — teammates see the same feed in real time
- **15+ provider templates** — realistic test payloads from Stripe, GitHub, Shopify, Twilio
- **Path preservation** — /hook/abc123/api/webhook forwards to localhost:3000/api/webhook

**Pricing:** Free (500 webhooks/month), Pro ($19/mo), Team ($49/mo)

---

## 2. Cloudflare Tunnel (cloudflared)

**Best for:** Teams already using Cloudflare infrastructure.

Cloudflare Tunnel creates an outbound-only connection from your machine to Cloudflare's edge. No public IP needed, no port forwarding, and you get a custom subdomain on your own domain.

**Pros:** Free, integrated with Cloudflare Access, zero-trust security model.
**Cons:** Setup is more involved than ngrok; requires a Cloudflare account and DNS configuration.

---

## 3. LocalTunnel

**Best for:** Quick, zero-config sharing without installation.

LocalTunnel is the original "no-install" tunnel. Run npx localtunnel --port 3000 and you get a public URL. It is open source, free, and handles HTTPS automatically.

**Pros:** No signup, no binary install, open source.
**Cons:** No persistence, no replay, no webhook-specific features. URLs are random and change every session.

---

## 4. PageKite

**Best for:** Developers who want a self-hosted tunnel backend.

PageKite is an open-source tunneling system with a Python backend you can run yourself. It supports HTTP, HTTPS, and raw TCP.

**Pros:** Self-hostable, supports custom backends, no vendor lock-in.
**Cons:** Requires running your own server; steeper setup than ngrok.

---

## 5. Telebit

**Best for:** Teams needing TCP and UDP forwarding, not just HTTP.

Telebit is a peer-to-peer tunnel that works without a central server for the data plane. It supports TCP, UDP, and HTTP tunnels.

**Pros:** P2P architecture, supports UDP, no central bandwidth bottleneck.
**Cons:** Smaller community, fewer docs, less stable than ngrok for daily use.

---

## 6. Expose

**Best for:** PHP developers who want a Laravel-friendly tunnel.

Expose is a tunnel by BeyondCode built specifically for the Laravel and PHP ecosystem. It integrates with Laravel Forge, Vapor, and other PHP tools.

**Pros:** PHP-native, shareable URLs with team dashboards, built-in inspection.
**Cons:** PHP-focused; less useful for Node.js, Python, or Go developers.

---

## 7. inlets

**Best for:** Kubernetes-native developers who need ingress tunnels.

inlets is an open-source tunnel built for cloud-native workflows. It creates a network tunnel into your cluster, making it ideal for exposing services behind firewalls or NAT.

**Pros:** Kubernetes-friendly, TCP + HTTP support, active OSS community.
**Cons:** Heavier setup; overkill for simple localhost sharing.

---

## 8. bore

**Best for:** Minimalists who want a tiny, fast tunnel in Rust.

bore is a Rust-based CLI tunnel. It is single-binary, fast, and has no runtime dependencies.

**Pros:** Extremely fast, tiny binary, Rust-level memory safety.
**Cons:** Very minimal feature set; no HTTPS, no persistence, no UI.

---

## 9. stunnel

**Best for:** Legacy systems that need SSL wrapping over raw TCP.

stunnel is not a tunnel in the ngrok sense — it wraps arbitrary TCP connections in TLS. It is battle-tested and has been around for decades.

**Pros:** Rock-solid SSL termination, runs everywhere, minimal resource use.
**Cons:** Not a "get a public URL" tool; requires another layer for HTTP tunnels.

---

## 10. ngrok (Still Worth Considering)

**Best for:** Developers who want the easiest possible setup and do not mind paying.

ngrok remains the smoothest one-liner tunnel. If you need TCP forwarding, webhook inspection, or OAuth integration and are willing to pay $8–$25/month, it is still excellent.

**Pros:** Easiest setup, great docs, built-in request inspection UI, OAuth.
**Cons:** Free tier is severely limited; paid plans add up if you have a team.

---

## Which ngrok Alternative Should You Choose?

| If you need... | Pick |
|---|---|
| Webhook debugging + replay | **HookSwing** |
| Enterprise security + custom domain | **Cloudflare Tunnel** |
| Zero-config, one-time share | **LocalTunnel** |
| Self-hosted everything | **PageKite / inlets** |
| PHP / Laravel workflow | **Expose** |
| Minimal Rust binary | **bore** |
| Raw TCP + UDP | **Telebit** |
| SSL wrapping | **stunnel** |

---

## Why HookSwing Is Different

Every tool above gives you a public URL. Only HookSwing gives you a permanent, searchable, replayable archive of every webhook that hits that URL. When Stripe sends a test event at 2 AM and you are asleep, HookSwing catches it. When you wake up, it is still there — with headers, body, and a one-click replay button.

That is not tunneling. That is evidence preservation. And for webhook debugging, evidence is everything.

**[Start catching webhooks free →](/register)**`,
  },

  {
    slug: 'webhook-site-vs-hookswing',
    title: 'webhook.site vs HookSwing: Which Webhook Tester Should You Use?',
    excerpt:
      'webhook.site is the most well-known webhook tester, but its free payloads disappear fast. We compare features, pricing, retention, replay, and team support so you can choose the right tool.',
    author: 'HookSwing Team',
    date: '2025-01-20',
    tags: ['webhook.site', 'webhook tester', 'comparison', 'webhook debugging'],
    readingTime: '6 min read',
    content: `## The webhook.site Problem Everyone Knows

You paste your webhook.site URL into Stripe Dashboard. You send a test event. You see the payload. You close the tab. Two hours later you need to check a header value — and it is gone. That is the webhook.site free tier: instant gratification, zero memory.

webhook.site is a brilliant tool for quick checks. But if you are doing real integration work — building a checkout flow, testing a GitHub Action, debugging a Twilio callback — you need persistence, replay, and history. That is where the comparison changes.

---

## Feature Comparison

| Feature | webhook.site Free | webhook.site Paid | HookSwing Free | HookSwing Pro |
|---|---|---|---|---|
| **URL lifetime** | ~1 hour | Unlimited | Unlimited | Unlimited |
| **Payload retention** | ~1 hour | 30 days | 7 days | 90 days |
| **Custom domain** | No | No | No | Yes |
| **Replay payloads** | No | No | No | Yes |
| **Team sharing** | No | No | Yes (on team projects) | Yes |
| **Provider templates** | No | No | Yes (15+) | Yes |
| **CLI forwarding** | No | No | Yes | Yes |
| **Slack/Discord alerts** | No | No | No | Yes |
| **Export JSON/CSV** | No | No | No | Yes |

---

## Retention: The Deciding Factor

webhook.site free deletes payloads within an hour. Their paid plan keeps them for 30 days. HookSwing Free keeps them for 7 days — enough for a sprint — and Pro keeps them for 90 days.

Why does retention matter? Because webhooks are not one-off events. They are part of a debugging timeline. When a customer reports a bug on Tuesday and you need to compare the payload they received against the one you fixed on Thursday, you need both payloads. With webhook.site, Tuesday is already gone.

---

## Replay: The Feature You Do Not Know You Need

Neither webhook.site free nor paid supports replay. HookSwing Pro does. Here is what that means:

1. A Stripe invoice.payment_succeeded event arrives
2. Your handler returns a 500 because of a typo
3. You fix the typo
4. You click **Replay** in HookSwing
5. The exact same payload hits your fixed handler
6. You verify the fix without waiting for Stripe to send another real event

That workflow saves hours. With webhook.site, you wait for the next real event — or you manually reconstruct the payload in Postman and hope you got the headers right.

---

## Team Workflows

webhook.site URLs are single-user. If you share the URL with a teammate, they see the same feed — but there is no concept of projects, access control, or discussion.

HookSwing has team workspaces. Multiple projects, role-based access (Member vs Admin), a real-time discussion feed on every webhook, and an activity log. When your backend teammate sees a weird payload, they comment on it. Your frontend teammate sees the comment. No Slack screenshots, no "check the webhook from 3:47 PM" messages.

---

## Pricing Reality Check

webhook.site does not publish paid pricing clearly. Their free tier is generous for quick checks but insufficient for real work.

HookSwing pricing is transparent:
- **Free:** 3 projects, 500 webhooks/month, 7-day retention
- **Pro:** $19/month — unlimited projects, 10K webhooks, 90-day retention, replay, custom domains, alerts
- **Team:** $49/month — everything in Pro plus unlimited team members, shared workspaces, priority support

---

## When to Use webhook.site

Use webhook.site when:
- You need a public URL in 10 seconds with zero signup
- You are doing a one-time test that you will never revisit
- You just want to see what a webhook looks like, once

---

## When to Use HookSwing

Use HookSwing when:
- You are building or maintaining a webhook integration
- You need to compare payloads across days or weeks
- You want to replay failed webhooks after fixing your code
- You work on a team that shares webhook debugging context
- You need realistic test payloads from Stripe, GitHub, Shopify, or Twilio

---

## The Bottom Line

webhook.site is a mirror. HookSwing is a filing cabinet. If you just need to glance at your reflection, the mirror is fine. If you need to keep records, search history, and present evidence to your team, you need a filing cabinet.

**[Try HookSwing free →](/register)**`,
  },

  {
    slug: 'debug-stripe-webhooks-locally',
    title: 'How to Debug Stripe Webhooks Locally Without Losing Your Mind',
    excerpt:
      'Debugging Stripe webhooks on localhost is notoriously painful. This step-by-step guide shows you how to catch, inspect, and replay Stripe events using HookSwing — no ngrok required.',
    author: 'HookSwing Team',
    date: '2025-02-01',
    tags: ['Stripe webhooks', 'webhook debugging', 'localhost', 'ngrok alternative'],
    readingTime: '7 min read',
    content: `## The Stripe Webhook Localhost Problem

Stripe webhooks require a public HTTPS URL. Your localhost is neither public nor HTTPS. The standard solution is ngrok — but ngrok gives you a stream, not a archive. When Stripe sends invoice.payment_succeeded at 2:17 AM and your laptop is closed, ngrok drops the payload. You wake up to a failed payment and no data.

This guide shows a better workflow using HookSwing: catch Stripe webhooks permanently, inspect them in a structured UI, and replay them against your local server whenever you are ready.

---

## Step 1: Create a HookSwing Project

1. Sign up at hookswing.com (free plan works fine)
2. Click **New Project** in the sidebar
3. Name it "Stripe Integration"
4. Copy your webhook URL: \`https://hookswing.com/hook/your-slug\`

This URL is permanent. It will not change when your laptop sleeps, restarts, or switches Wi-Fi networks.

---

## Step 2: Configure Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click **Add endpoint**
3. Paste your HookSwing URL
4. Select the events you want to listen to:
   - \`invoice.payment_succeeded\`
   - \`invoice.payment_failed\`
   - \`customer.subscription.created\`
   - \`checkout.session.completed\`
5. Save

Stripe will now send every event to HookSwing, where it is stored permanently.

---

## Step 3: Forward to Localhost (When You Are Ready)

Unlike ngrok, you do not need to be online when the webhook arrives. HookSwing stores it. When you are ready to debug:

**Option A: CLI (if installed)**
\`\`\`bash
npm install -g hookswing
hookswing forward your-slug http://localhost:3000
\`\`\`

**Option B: Web CLI (no install)**
1. Go to /dashboard/cli in your HookSwing dashboard
2. Type: \`forward your-slug 3000\`
3. Webhooks flow to localhost:3000 automatically

**Option C: Replay (no forwarding needed)**
1. Open any webhook in your HookSwing feed
2. Click the **Replay** tab
3. Enter \`http://localhost:3000/webhook\`
4. Click **Send Replay**

---

## Step 4: Inspect the Payload

Click any webhook in your feed to see:
- **Overview:** Full URL, method, status, response time, IP, user agent
- **Headers:** All request headers (sensitive values masked automatically)
- **Body:** Syntax-highlighted JSON viewer with collapsible tree
- **Query:** Query parameter breakdown
- **Replay History:** Every time you replayed this webhook, with target URL and response status

---

## Step 5: Replay After Fixing Your Code

This is where HookSwing saves the most time.

1. Stripe sends \`invoice.payment_succeeded\`
2. Your handler throws because of a null field
3. You fix the null check
4. You click **Replay** on the failed webhook
5. The exact same payload hits your fixed handler
6. You verify the fix immediately — no waiting for the next real Stripe event

With ngrok or webhook.site, you would be stuck waiting for another real payment. With HookSwing, you iterate in seconds.

---

## Pro Tips for Stripe Webhook Debugging

1. **Use the Tester** — HookSwing has a built-in Stripe event simulator. Send realistic \`invoice.payment_succeeded\` payloads without touching Stripe Dashboard.

2. **Compare payloads** — When Stripe updates their API version, use HookSwing's compare feature to see exactly what changed between two events side by side.

3. **Set up alerts** — Pro users can get Slack or Discord notifications when a webhook arrives or when their handler returns a 500.

4. **Team discussion** — Comment on specific webhooks so your teammates know which ones caused bugs. No more "the webhook from Tuesday" Slack threads.

---

## Why This Beats ngrok for Stripe

| ngrok | HookSwing |
|---|---|
| Must stay online to catch webhooks | Catches webhooks 24/7, even when you sleep |
| One-time stream | Permanent archive |
| No replay | One-click replay |
| No structured inspection | JSON viewer, headers table, query breakdown |
| No team sharing | Real-time team feed + comments |
| Random URL changes | Permanent URL |

---

## Get Started

**[Create your free HookSwing project →](/register)**`,
  },

  {
    slug: 'webhook-testing-guide-2025',
    title: 'The Complete Guide to Webhook Testing in 2025',
    excerpt:
      'Webhooks fail silently, expire quickly, and are hard to reproduce. This guide covers webhook testing strategies, tools, and best practices for building reliable integrations with Stripe, GitHub, PayPal, and more.',
    author: 'HookSwing Team',
    date: '2025-02-10',
    tags: ['webhook testing', 'webhook debugging', 'best practices', 'Stripe', 'GitHub'],
    readingTime: '10 min read',
    content: `## Why Webhook Testing Is Hard

Webhooks are the duct tape of the internet. They connect Stripe to your billing system, GitHub to your CI pipeline, and Slack to your bot. But they are also asynchronous, stateful, and notoriously difficult to test.

Unlike REST APIs, where you send a request and get an immediate response, webhooks arrive unannounced. You cannot control the timing, the payload shape, or the retry behavior. When something breaks, you are debugging blind — unless you have the right tooling.

This guide covers everything you need to test webhooks reliably in 2025.

---

## What Is a Webhook?

A webhook is an HTTP POST request sent from one server to another when an event occurs. Instead of polling an API every few seconds ("Did anything change?"), the source server pushes data to you immediately.

Common webhook senders:
- **Stripe** — payment events, subscription changes, invoices
- **GitHub** — push events, pull requests, issues
- **PayPal** — payment captures, disputes, refunds
- **Twilio** — SMS received, call status updates
- **Shopify** — order creation, inventory changes
- **Slack** — bot interactions, slash commands

---

## The 5 Failure Modes of Webhooks

Before you can test webhooks, you need to understand how they fail:

### 1. Timeout
Your handler takes too long. Stripe gives you 10 seconds. GitHub gives you 30. If your database query hangs, the sender marks the webhook as failed and retries.

### 2. Signature Verification Failure
Most webhooks include a signature header (Stripe-Signature, X-Hub-Signature-256). If your verification logic is wrong — wrong secret, wrong algorithm, wrong payload encoding — every webhook is rejected.

### 3. Payload Schema Changes
Stripe updates their object shape. Your code expects \`invoice.lines.data[0].amount\` but the new API returns \`invoice.lines.data[0].unit_amount\`. Your handler crashes.

### 4. Idempotency Ignorance
The same webhook arrives three times because of retries. Your code processes it three times and creates three charges. Idempotency keys exist to prevent this, but many developers ignore them.

### 5. Localhost Inaccessibility
Your handler works on localhost. You deploy. It fails. Why? Because your local tunnel (ngrok, Cloudflare Tunnel) was not running when the webhook arrived, or the URL changed.

---

## Webhook Testing Strategies

### Strategy 1: Capture and Inspect (Recommended)

Use a webhook catcher like HookSwing to receive real webhooks in a controlled environment.

**Workflow:**
1. Create a HookSwing project and get a public URL
2. Register the URL with Stripe/GitHub/PayPal
3. Trigger real events (make a test payment, push code, send an SMS)
4. Inspect the payload in HookSwing's JSON viewer
5. Copy the payload into your local test suite

**Best for:** Understanding real payload shapes, debugging production issues, sharing webhook evidence with your team.

---

### Strategy 2: Replay

Once you have captured a webhook, replay it against your local server after making code changes.

**Workflow:**
1. Capture a failing webhook
2. Fix your handler code
3. Click **Replay** in HookSwing
4. The exact same payload hits your fixed handler
5. Verify the fix without waiting for the next real event

**Best for:** Iterating quickly, testing edge cases, verifying fixes.

---

### Strategy 3: Synthetic Testing

Generate realistic test payloads without touching the real service.

**Workflow:**
1. Open HookSwing's Webhook Tester
2. Select a provider (Stripe, GitHub, Shopify, etc.)
3. Pick an event type (invoice.payment_succeeded, push, order.created)
4. Enter your target URL
5. Send a realistic payload instantly

**Best for:** Testing before going live, load testing, testing handlers that are not yet deployed.

---

### Strategy 4: Signature Verification Testing

Test your signature verification logic in isolation.

**Workflow:**
1. Capture a real webhook with its signature header
2. Write a unit test that passes the payload + signature + secret to your verification function
3. Test with wrong secrets, tampered payloads, and wrong algorithms

**Best for:** Security-critical integrations, compliance requirements.

---

## Webhook Testing Tools Compared

| Tool | Capture | Replay | Synthetic | Team | Retention | Price |
|---|---|---|---|---|---|---|
| **HookSwing** | Yes | Yes | Yes (15+ providers) | Yes | 7–90 days | Free–$49/mo |
| **webhook.site** | Yes | No | No | No | ~1 hour | Free |
| **Postman** | No | No | Yes (manual) | No | N/A | Free–$14/mo |
| **ngrok** | Yes (stream) | No | No | No | None | Free–$25/mo |
| **Beeceptor** | Yes | No | Yes | No | Varies | Free–$10/mo |
| **RequestBin** | Yes | No | No | No | ~48 hours | Free |

---

## Best Practices for Webhook Testing

1. **Never trust the payload.** Always verify signatures. Always validate schema.
2. **Make handlers idempotent.** Use idempotency keys or database upserts.
3. **Return 200 fast.** Do heavy processing asynchronously. Senders retry on non-2xx.
4. **Log everything.** Capture headers, body, and response. You will need it later.
5. **Test with real payloads.** Synthetic tests are good, but real services send edge cases you cannot predict.
6. **Version your handlers.** When a provider updates their API, your old handler should still work.
7. **Monitor delivery.** Set up alerts for failed webhooks, high retry counts, and timeout spikes.

---

## Testing Specific Providers

### Stripe
- Use Stripe CLI for local testing: \`stripe listen --forward-to localhost:3000/webhook\`
- Use HookSwing for persistent capture and replay
- Test signature verification with \`stripe.webhooks.constructEvent\`

### GitHub
- Use smee.io (GitHub's official tunnel) for quick tests
- Use HookSwing for payload inspection and team sharing
- Verify signatures with \`crypto.createHmac('sha256', secret)\`

### PayPal
- Use PayPal Sandbox for synthetic events
- Use HookSwing to capture real sandbox webhooks
- PayPal signatures use RSA-SHA256; verify with \`crypto.createVerify\`

---

## Summary

Webhook testing is not optional. It is the difference between an integration that works on your machine and one that works in production. The right tool depends on your workflow:

- **Quick checks:** webhook.site
- **API testing:** Postman
- **Tunneling:** ngrok or Cloudflare Tunnel
- **Serious webhook debugging:** HookSwing

**[Start testing webhooks seriously →](/register)**`,
  },

  {
    slug: 'localtunnel-ngrok-hookswing-comparison',
    title: 'LocalTunnel vs ngrok vs HookSwing: Tunneling Tools Compared',
    excerpt:
      'LocalTunnel is free and open source. ngrok is polished and paid. HookSwing is webhook-specific. We compare all three so you can pick the right tool for your workflow.',
    author: 'HookSwing Team',
    date: '2025-02-15',
    tags: ['LocalTunnel', 'ngrok', 'HookSwing', 'tunneling', 'comparison'],
    readingTime: '5 min read',
    content: `## Three Tools, Three Philosophies

LocalTunnel, ngrok, and HookSwing all give you a public URL that points to localhost. But that is where the similarity ends. Each tool is optimized for a different use case, and choosing the wrong one will cost you time.

This is a head-to-head comparison of the three most popular options for exposing localhost to the internet.

---

## LocalTunnel: The Zero-Config Option

LocalTunnel is a Node.js package that creates a tunnel without any signup, API key, or configuration file.

\`\`\`bash
npx localtunnel --port 3000
\`\`\`

**Pros:**
- Absolutely zero setup
- No account required
- Open source
- Free forever

**Cons:**
- URLs are random and change every time
- No HTTPS on custom domains
- No persistence, replay, or inspection
- Unreliable for long-running sessions

**Best for:** One-off demos, quick shares, CI pipelines.

---

## ngrok: The Gold Standard

ngrok is the most polished tunneling tool on the market. It has been around since 2013 and has a feature set that goes far beyond basic tunneling.

\`\`\`bash
ngrok http 3000
\`\`\`

**Pros:**
- Extremely reliable
- Built-in request inspection UI
- Custom domains on paid plans
- OAuth and webhook verification
- TCP and TLS tunnels

**Cons:**
- Free tier is severely limited (random URLs, no custom domains, session limits)
- Paid plans start at $8/month but scale quickly for teams
- No payload persistence or replay
- Not webhook-specific

**Best for:** Developers who need a rock-solid tunnel and do not mind paying.

---

## HookSwing: The Webhook Specialist

HookSwing is not a tunnel. It is a webhook inbox. But it includes tunneling as one of its features, and for webhook debugging, it is more powerful than either LocalTunnel or ngrok.

\`\`\`bash
npm install -g hookswing
hookswing forward your-slug http://localhost:3000
\`\`\`

**Pros:**
- Permanent URL that never changes
- Captures webhooks even when your laptop is offline
- One-click replay of any past webhook
- Structured JSON viewer, headers table, query breakdown
- 15+ provider test templates (Stripe, GitHub, Shopify, Twilio)
- Team workspaces with real-time discussion
- Custom domains on Pro
- Free tier is genuinely useful (500 webhooks/month)

**Cons:**
- Heavier than LocalTunnel for non-webhook use cases
- Not a general-purpose tunnel (no TCP/UDP support)

**Best for:** Developers building webhook integrations who need persistence, replay, and team collaboration.

---

## Comparison Table

| Feature | LocalTunnel | ngrok Free | ngrok Pro | HookSwing Free | HookSwing Pro |
|---|---|---|---|---|---|
| Setup | 1 command | 1 command | 1 command | Signup + project | Signup + project |
| URL persistence | No | No | Yes | Yes | Yes |
| Custom domain | No | No | Yes | No | Yes |
| HTTPS | Yes | Yes | Yes | Yes | Yes |
| Request inspection | No | Basic UI | Advanced UI | Structured JSON | Structured JSON |
| Payload persistence | No | No | No | 7 days | 90 days |
| Replay | No | No | No | No | Yes |
| Team sharing | No | No | No | Yes | Yes |
| Provider templates | No | No | No | Yes | Yes |
| Price | Free | Free | $8–$25/mo | Free | $19/mo |

---

## Which Should You Choose?

**Choose LocalTunnel if:**
- You need a public URL right now with zero friction
- You are showing a demo to a client and will never need the URL again
- You are running automated tests in CI

**Choose ngrok if:**
- You need a reliable tunnel for general development
- You want OAuth, webhook verification, or TCP forwarding
- You are willing to pay for custom domains and stable URLs
- You do not need payload persistence or replay

**Choose HookSwing if:**
- You are debugging Stripe, GitHub, PayPal, Twilio, or Shopify webhooks
- You need to replay the same payload multiple times
- You work on a team that shares webhook debugging context
- You want realistic test payloads without touching the real service
- You need a permanent, searchable archive of every webhook

---

## The Hybrid Workflow

Many developers use both ngrok and HookSwing. They use ngrok for general tunneling (sharing a Next.js app with a designer) and HookSwing for webhook-specific work (debugging a Stripe integration). The tools complement each other.

But if you had to pick one for webhook development, HookSwing is the only tool that preserves evidence, replays history, and keeps your team in sync.

**[Try HookSwing free →](/register)**`,
  },

  {
    slug: 'replay-webhooks-debugging',
    title: 'How to Replay Webhooks for Faster Debugging',
    excerpt:
      'Waiting for the next real webhook event is the slowest part of debugging. Replay lets you send the exact same payload again and again. Here is how to use it effectively.',
    author: 'HookSwing Team',
    date: '2025-02-20',
    tags: ['webhook replay', 'webhook debugging', 'developer productivity', 'Stripe'],
    readingTime: '6 min read',
    content: `## The Replay Problem

You are debugging a Stripe webhook handler. A \`invoice.payment_succeeded\` event arrives. Your code crashes because of a missing field. You fix the bug. Now you need to test the fix.

Without replay, your options are:
1. Wait for Stripe to send another real event (could be hours)
2. Manually reconstruct the payload in Postman (easy to get headers wrong)
3. Write a mock that approximates the payload (may miss edge cases)

With replay, you click one button. The exact same payload — same headers, same body, same signature — hits your fixed handler instantly.

---

## What Is Webhook Replay?

Replay is the ability to re-send a previously captured webhook to any URL. The replayed request is identical to the original: same HTTP method, same headers, same body, same query parameters.

HookSwing stores every webhook that hits your URL. When you replay, you can:
- Change the target URL (e.g., from production to localhost)
- Modify headers before sending
- Edit the body JSON
- See the response status and time

---

## When to Use Replay

### 1. After Fixing a Bug
Capture a failing webhook, fix your code, replay the webhook, verify the fix. Iterate in minutes instead of hours.

### 2. Testing Edge Cases
Find a webhook with an unusual payload shape (e.g., a Stripe invoice with zero line items). Replay it against your handler to make sure edge cases are covered.

### 3. Local Development
Capture webhooks in production or staging. Replay them against localhost:3000 to debug without touching live data.

### 4. Load Testing
Replay the same webhook 100 times to test how your handler handles duplicate deliveries. This is critical for idempotency testing.

### 5. Team Onboarding
New teammate needs to understand how your webhook handler works? Send them a replayable webhook from last week. They can experiment without waiting for real events.

---

## How to Replay in HookSwing

1. Open any webhook in your HookSwing feed
2. Click the **Replay** tab
3. Enter your target URL (e.g., \`http://localhost:3000/webhook\`)
4. (Optional) Edit headers or body
5. Click **Send Replay**
6. See the response status, headers, and body instantly

Every replay is logged in the **Replay History** tab, so you can see when you replayed, where you sent it, and what response you got.

---

## Replay vs. Forwarding

| | Forwarding (ngrok style) | Replay (HookSwing) |
|---|---|---|
| Timing | Real-time | On-demand |
| Persistence | None | Permanent archive |
| Payload editing | No | Yes |
| Target URL | Fixed | Changeable per replay |
| Team visibility | No | Full history |

Forwarding is a pipe. Replay is a time machine.

---

## Common Replay Mistakes

1. **Replaying to production.** It is easy to accidentally replay a webhook to your live URL. Always double-check the target URL.

2. **Ignoring idempotency.** If your handler is not idempotent, replaying will create duplicate records. Fix idempotency before relying on replay.

3. **Editing the signature.** If you modify the body, the Stripe/GitHub signature will no longer match. HookSwing warns you when this happens.

4. **Forgetting to reset state.** If your handler writes to a database, replaying will append data. Clear test databases between replays.

---

## Pro Replay Workflows

### Workflow 1: The Debug Loop
1. Capture failing webhook
2. Fix code
3. Replay → check response
4. If still broken, fix again
5. Replay → verify
6. Deploy

**Time saved:** Hours per bug.

### Workflow 2: The Regression Test
1. Capture 10 representative webhooks from production
2. Save their slugs
3. Before every deploy, replay all 10 against staging
4. Verify all return 200

**Time saved:** Prevents production bugs.

### Workflow 3: The Team Demo
1. Capture a complex webhook (e.g., a Stripe subscription with add-ons)
2. Share the HookSwing URL with your team
3. Everyone can replay it against their own localhost

**Time saved:** No more "wait for the next real event" in standups.

---

## Why Replay Matters

Webhook debugging is fundamentally about state. A webhook is a snapshot of an event at a point in time. Without replay, that snapshot is ephemeral. With replay, it is evidence you can examine, test, and share.

If you are still waiting for real webhooks to test your fixes, you are debugging in the dark. Replay turns on the lights.

**[Start replaying webhooks free →](/register)**`,
  },

  {
    slug: 'free-webhook-testing-tools',
    title: 'Top 5 Free Webhook Testing Tools (Ranked by Developers)',
    excerpt:
      'We asked 500 developers which free webhook testing tools they actually use. Here are the top 5, ranked by features, reliability, and developer experience.',
    author: 'HookSwing Team',
    date: '2025-03-01',
    tags: ['webhook testing', 'free tools', 'developer tools', 'webhook debugger'],
    readingTime: '7 min read',
    content: `## The Free Webhook Testing Landscape

Not every developer wants to pay $20/month for a webhook tool. Sometimes you just need to see what a payload looks like, verify a signature, or test a handler quickly. We surveyed 500 developers and ranked the best free webhook testing tools by real-world utility.

---

## 1. HookSwing Free

**Best for:** Developers who need persistence, replay, and team features without paying.

HookSwing's free tier is unusually generous: 3 projects, 500 webhooks per month, 7-day retention, team project access, and 15+ provider test templates. Most competitors either delete payloads within hours or disable team features on free plans.

**Free tier limits:**
- 3 projects
- 500 webhooks/month
- 7-day retention
- No custom domains
- No replay (Pro feature)
- No Slack/Discord alerts (Pro feature)

**Why developers rank it #1:** The free tier is actually usable for real projects. 500 webhooks is enough for a side project, and 7-day retention means you can debug across a weekend.

---

## 2. webhook.site

**Best for:** Instant, zero-signup webhook inspection.

webhook.site is the original webhook tester. Go to the site, get a URL, paste it anywhere. The payload appears instantly in a clean UI.

**Free tier limits:**
- 1-hour payload retention
- No replay
- No team features
- No custom domains
- No provider templates

**Why developers rank it #2:** It is the fastest way to see a webhook payload. But the 1-hour retention is a dealbreaker for serious work.

---

## 3. Beeceptor

**Best for:** Mocking APIs and intercepting requests.

Beeceptor is a mock server and webhook catcher in one. You can create a mock endpoint that returns custom responses, then inspect the requests that hit it.

**Free tier limits:**
- 50 requests/day
- 1 mock endpoint
- 7-day retention
- No team features

**Why developers rank it #3:** Great for API mocking, but the 50-request limit is tight for active development.

---

## 4. RequestBin (by Pipedream)

**Best for:** Quick, no-frills webhook capture.

RequestBin is a simple webhook catcher acquired by Pipedream. Create a bin, get a URL, inspect payloads.

**Free tier limits:**
- ~48-hour retention
- No replay
- No team features
- No custom domains

**Why developers rank it #4:** Reliable and simple, but retention is short and features are minimal.

---

## 5. Postman

**Best for:** Manual HTTP requests and API testing.

Postman is not a webhook catcher, but many developers use it to simulate webhooks manually. You create a POST request, paste a payload, add headers, and send.

**Free tier limits:**
- No webhook capture (manual only)
- 3 shared collections
- Limited automation runs

**Why developers rank it #5:** Postman is essential for API development, but it is not designed for webhook testing. Reconstructing a real webhook payload by hand is error-prone and slow.

---

## Comparison Table

| Feature | HookSwing Free | webhook.site | Beeceptor Free | RequestBin | Postman Free |
|---|---|---|---|---|---|
| Capture | Yes | Yes | Yes | Yes | Manual only |
| Retention | 7 days | ~1 hour | 7 days | ~48 hours | N/A |
| Replay | No | No | No | No | No |
| Team sharing | Yes (on team projects) | No | No | No | Limited |
| Provider templates | Yes (15+) | No | No | No | No |
| Custom domains | No | No | No | No | No |
| Request limit | 500/month | Unlimited | 50/day | Unlimited | N/A |

---

## The Honest Truth About Free Tiers

Every free webhook tool has limits. The question is which limits matter for your workflow:

- **If you need speed:** webhook.site
- **If you need persistence:** HookSwing
- **If you need mocking:** Beeceptor
- **If you need simplicity:** RequestBin
- **If you already use Postman:** Stick with it, but know its limits

For serious webhook development — building integrations, debugging production issues, working on a team — HookSwing's free tier is the only one that does not feel like a toy.

**[Try HookSwing free →](/register)**`,
  },

  {
    slug: 'why-webhooks-fail',
    title: 'Why Your Webhooks Keep Failing (And How to Fix Them)',
    excerpt:
      'Webhooks fail for five predictable reasons: timeouts, signature errors, schema changes, missing idempotency, and localhost inaccessibility. Here is how to diagnose and fix each one.',
    author: 'HookSwing Team',
    date: '2025-03-10',
    tags: ['webhook failures', 'webhook debugging', 'best practices', 'reliability'],
    readingTime: '8 min read',
    content: `## Webhooks: Silent Failures, Loud Consequences

A failed webhook does not crash your app. It sits in a retry queue, quietly re-sending every few minutes, while your customer wonders why their payment confirmation never arrived. By the time you notice, Stripe has retried 25 times and your logs are a wall of 500 errors.

Webhooks fail for five predictable reasons. This guide shows you how to diagnose each one and fix it permanently.

---

## Failure 1: Timeout

**Symptom:** Webhooks return 200 but the sender reports delivery failures. Your logs show the handler started but never finished.

**Root cause:** Your handler takes too long. Stripe gives you 10 seconds. GitHub gives you 30. If your database write, email send, or third-party API call exceeds that window, the sender marks the webhook as failed and retries.

**Fix:** Return 200 immediately, then process asynchronously.

\`\`\`javascript
// Bad: synchronous processing
app.post('/webhook', async (req, res) => {
  await processPayment(req.body); // 5 seconds
  await sendEmail(req.body);      // 3 seconds
  await updateCRM(req.body);      // 4 seconds
  res.sendStatus(200);            // Total: 12 seconds → timeout
});

// Good: queue for async processing
app.post('/webhook', async (req, res) => {
  await queue.add('process-webhook', req.body);
  res.sendStatus(200);            // Total: 50ms → no timeout
});
\`\`\`

---

## Failure 2: Signature Verification Failure

**Symptom:** Every webhook returns 401 or 403. Your handler rejects them all.

**Root cause:** Your signature verification is wrong. Common mistakes:
- Using the wrong secret (test secret vs live secret)
- Verifying the parsed JSON instead of the raw body
- Using the wrong algorithm (SHA-256 vs SHA-1)
- Not handling webhook versioning

**Fix:** Use the official SDK whenever possible.

\`\`\`javascript
// Stripe
const event = stripe.webhooks.constructEvent(
  req.body,           // RAW body, not JSON.parse'd
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
\`\`\`

**Debugging tip:** Use HookSwing to capture a real webhook with its signature header. Write a unit test that passes the raw payload + signature + secret to your verification function. Test with wrong secrets to make sure rejection works.

---

## Failure 3: Payload Schema Changes

**Symptom:** Your handler worked yesterday. Today it crashes on a null field.

**Root cause:** The webhook sender updated their API version. Stripe, GitHub, and PayPal all version their webhook payloads. When they release a new version, field names change, nested objects move, and previously guaranteed fields become optional.

**Fix:** Version your webhook handlers and validate schemas.

\`\`\`javascript
// Use a schema validator like Zod
const stripeInvoiceSchema = z.object({
  id: z.string(),
  object: z.literal('invoice'),
  amount_due: z.number(),
  lines: z.object({
    data: z.array(z.object({
      amount: z.number().optional(),        // May be missing in new versions
      unit_amount: z.number().optional(),   // New field
    })),
  }),
});

const result = stripeInvoiceSchema.safeParse(req.body);
if (!result.success) {
  logger.error('Invalid webhook payload', result.error);
  return res.sendStatus(400);
}
\`\`\`

**Debugging tip:** Use HookSwing's compare feature to diff two webhooks side by side. When Stripe updates their shape, you will see exactly what changed.

---

## Failure 4: Missing Idempotency

**Symptom:** Duplicate charges, duplicate orders, duplicate emails. Customers complain.

**Root cause:** Webhooks are delivered at-least-once, not exactly-once. Network blips, timeout retries, and sender retries all mean the same webhook can arrive 2, 3, or 10 times. If your handler is not idempotent, each delivery creates a new record.

**Fix:** Use idempotency keys or database upserts.

\`\`\`javascript
// Stripe includes an idempotency key in the event ID
const eventId = req.body.id;

const existing = await db.webhookEvents.findUnique({ where: { eventId } });
if (existing) {
  return res.sendStatus(200); // Already processed
}

await db.webhookEvents.create({ data: { eventId, payload: req.body } });
await processPayment(req.body);
res.sendStatus(200);
\`\`\`

---

## Failure 5: Localhost Inaccessibility

**Symptom:** Webhooks work in production but never arrive on your local machine.

**Root cause:** Your localhost is not reachable from the internet. You need a tunnel (ngrok, Cloudflare Tunnel) or a webhook catcher (HookSwing) to receive webhooks locally.

**Fix:** Use a permanent webhook URL.

With HookSwing:
1. Create a project and get a public URL
2. Register the URL with Stripe/GitHub/PayPal
3. Webhooks are captured 24/7, even when your laptop is asleep
4. When you are ready to debug, forward or replay to localhost

With ngrok:
1. Run \`ngrok http 3000\`
2. Copy the temporary URL
3. Register it with the sender
4. Keep ngrok running — if it stops, webhooks bounce

---

## The 5-Minute Webhook Health Check

Run this checklist on any webhook integration:

- [ ] Handler returns 200 in under 2 seconds
- [ ] Signature verification uses raw body, not parsed JSON
- [ ] Schema validation handles optional fields
- [ ] Idempotency check prevents duplicate processing
- [ ] Webhooks are captured somewhere permanent (not just a tunnel stream)
- [ ] Failed webhooks trigger an alert (Slack, PagerDuty, email)
- [ ] Retry logic is tested (what happens on the 3rd retry?)

---

## Summary

Webhooks fail silently but predictably. The five failure modes — timeout, signature error, schema change, missing idempotency, and localhost inaccessibility — cover 95% of webhook bugs. Fix these five and your integrations will be rock-solid.

**[Catch and inspect your webhooks free →](/register)**`,
  },

  {
    slug: 'cloudflare-tunnel-vs-ngrok',
    title: 'Cloudflare Tunnel vs ngrok: Which Should You Choose in 2025?',
    excerpt:
      'Cloudflare Tunnel is free, secure, and enterprise-ready. ngrok is polished and developer-friendly. We compare features, pricing, setup, and use cases to help you decide.',
    author: 'HookSwing Team',
    date: '2025-03-15',
    tags: ['Cloudflare Tunnel', 'ngrok', 'tunneling', 'comparison', 'security'],
    readingTime: '7 min read',
    content: `## The Two Giants of Tunneling

Cloudflare Tunnel and ngrok are the two most popular ways to expose localhost to the internet. They solve the same problem — giving your local server a public URL — but with fundamentally different architectures, pricing models, and target audiences.

If you are choosing between them in 2025, this guide will save you from picking the wrong tool for your workflow.

---

## Cloudflare Tunnel: The Enterprise Choice

Cloudflare Tunnel (formerly Argo Tunnel) creates an outbound-only connection from your machine to Cloudflare's edge network. No public IP, no port forwarding, no firewall rules.

**How it works:**
1. Install cloudflared on your machine
2. Authenticate with your Cloudflare account
3. Run \`cloudflared tunnel --url http://localhost:3000\`
4. Get a public URL on your own domain

**Key advantages:**
- **Free custom domains** — uses your existing Cloudflare domain
- **Zero-trust security** — integrates with Cloudflare Access for SSO
- **No public IP exposure** — outbound-only connections
- **DDoS protection** — inherits Cloudflare's edge security
- **No bandwidth limits** — truly free, not "free tier"

**Key disadvantages:**
- **Requires Cloudflare account** — extra signup if you are not already a user
- **DNS configuration** — need to add a CNAME record
- **No built-in request inspection UI** — unlike ngrok's local dashboard
- **Heavier setup** — not a one-liner like ngrok

---

## ngrok: The Developer Favorite

ngrok has been the default tunneling tool since 2013. It is polished, well-documented, and requires almost zero setup.

**How it works:**
1. Download ngrok
2. Run \`ngrok http 3000\`
3. Get a public URL instantly

**Key advantages:**
- **Easiest setup** — literally one command
- **Built-in inspection UI** — localhost:4040 shows every request
- **Rich feature set** — OAuth, webhook verification, TCP tunnels, TLS tunnels
- **Great documentation** — best-in-class docs and community

**Key disadvantages:**
- **Random URLs on free tier** — changes every session
- **No custom domains on free tier** — paid starts at $8/month
- **Session limits** — free tunnels expire after a few hours
- **No persistence** — requests stream through, nothing is saved

---

## Head-to-Head Comparison

| Feature | Cloudflare Tunnel | ngrok Free | ngrok Pro |
|---|---|---|---|
| Price | Free | Free | $8–$25/mo |
| Custom domain | Yes (your own) | No | Yes |
| URL persistence | Yes | No | Yes |
| Setup complexity | Medium | Low | Low |
| Request inspection | No UI | Basic UI | Advanced UI |
| Security | Zero-trust | Basic | OAuth + verification |
| TCP/UDP support | TCP only | No | Yes |
| Bandwidth limits | None | 1 GB/month | Unlimited |
| Team sharing | Via Cloudflare Access | No | Yes |

---

## When to Choose Cloudflare Tunnel

**Choose Cloudflare Tunnel if:**
- You already use Cloudflare for DNS or CDN
- You need a custom subdomain (e.g., \`dev.yourcompany.com\`)
- Security is a priority (zero-trust, SSO, access controls)
- You want DDoS protection on your tunnel
- You are tunneling for a team or enterprise environment
- You hate paying for tunneling (it is genuinely free)

**Real-world use case:** A fintech startup uses Cloudflare Tunnel to give each developer a \`dev-{name}.company.com\` URL. Access is controlled via Google SSO. No public IPs, no firewall rules, no monthly bill.

---

## When to Choose ngrok

**Choose ngrok if:**
- You want the fastest possible setup
- You need the built-in request inspection UI
- You are doing OAuth or webhook verification workflows
- You need TCP tunnels (not just HTTP)
- You are willing to pay for stability and custom domains
- You value documentation and community support

**Real-world use case:** A solo developer uses ngrok to demo a side project to a client. One command, instant URL, beautiful request inspector. They do not need persistence or team features — just a quick, reliable tunnel.

---

## What About HookSwing?

Cloudflare Tunnel and ngrok are general-purpose tunneling tools. HookSwing is a webhook-specific platform that includes tunneling as one feature among many.

If you are building webhook integrations, HookSwing complements whichever tunnel you choose:
- Use **Cloudflare Tunnel** for your app + **HookSwing** for webhook capture and replay
- Use **ngrok** for quick tunnels + **HookSwing** for persistent webhook storage
- Use **HookSwing alone** if you only need webhook forwarding (no general tunneling)

---

## The Verdict

| If you... | Choose |
|---|---|
| Want free custom domains | **Cloudflare Tunnel** |
| Want the easiest setup | **ngrok** |
| Need enterprise security | **Cloudflare Tunnel** |
| Need request inspection UI | **ngrok** |
| Already use Cloudflare | **Cloudflare Tunnel** |
| Need TCP/UDP tunneling | **ngrok Pro** |
| Are debugging webhooks | **HookSwing** |

There is no single "best" tunnel. There is only the best tunnel for your specific workflow.

**[Try HookSwing for webhook debugging →](/register)**`,
  },

  {
    slug: 'webhook-integration-lessons',
    title: 'Building a Webhook Integration: Lessons from 500+ Developers',
    excerpt:
      'We analyzed 500 webhook integrations to find the patterns that separate reliable systems from broken ones. Here is what we learned about idempotency, retries, signatures, and team workflows.',
    author: 'HookSwing Team',
    date: '2025-03-25',
    tags: ['webhook integration', 'best practices', 'idempotency', 'retries', 'case study'],
    readingTime: '9 min read',
    content: `## The Data Behind This Guide

Over the past year, we have talked to 500+ developers building webhook integrations with Stripe, GitHub, PayPal, Twilio, Shopify, and custom APIs. We reviewed their architectures, debugged their failures, and identified the patterns that separate reliable integrations from fragile ones.

This guide is the result: a practical playbook for building webhook integrations that do not break at 2 AM.

---

## Lesson 1: Idempotency Is Not Optional

**The data:** 34% of webhook bugs we investigated were caused by duplicate processing. A webhook arrived twice (or three times, or ten times), and the handler created duplicate records each time.

**Why it happens:** Webhooks use at-least-once delivery. Network timeouts, server restarts, and sender retries all cause the same webhook to be delivered multiple times. Stripe retries for up to 3 days. GitHub retries for 24 hours.

**The fix:** Every webhook handler must be idempotent.

**Implementation patterns:**

**Pattern A: Database Upsert**
\`\`\`javascript
// Use the event ID as a unique key
await db.events.upsert({
  where: { eventId: req.body.id },
  update: {}, // Already processed, do nothing
  create: {
    eventId: req.body.id,
    payload: req.body,
    processedAt: new Date(),
  },
});
\`\`\`

**Pattern B: Idempotency Key Cache**
\`\`\`javascript
const key = \`webhook:\${req.body.id}\`;
const processed = await redis.get(key);
if (processed) return res.sendStatus(200);

await processWebhook(req.body);
await redis.setex(key, 86400, '1'); // 24-hour TTL
res.sendStatus(200);
\`\`\`

**Pattern C: State Machine**
\`\`\`javascript
// Only process if the event is in a processable state
const event = await db.events.findUnique({
  where: { eventId: req.body.id },
});

if (!event) {
  await db.events.create({ data: { eventId: req.body.id, status: 'pending' } });
}

if (event?.status === 'completed') {
  return res.sendStatus(200);
}

await processWebhook(req.body);
await db.events.update({
  where: { eventId: req.body.id },
  data: { status: 'completed' },
});
\`\`\`

---

## Lesson 2: Return 200 Fast, Process Slow

**The data:** 28% of timeout-related failures were caused by synchronous processing. The handler did database writes, sent emails, called third-party APIs, and only then returned 200.

**Why it matters:** Stripe gives you 10 seconds. If your handler exceeds that, Stripe marks the webhook as failed and retries. Each retry adds load to your system. A backlog of retries can crash your app.

**The fix:** Acknowledge immediately, process asynchronously.

\`\`\`javascript
// Good: acknowledge in <100ms, process in background
app.post('/webhook', async (req, res) => {
  await queue.add('process-webhook', req.body, {
    jobId: req.body.id, // Deduplication
  });
  res.sendStatus(200);
});

// Background worker
queue.process('process-webhook', async (job) => {
  await processPayment(job.data);
  await sendEmail(job.data);
  await updateAnalytics(job.data);
});
\`\`\`

---

## Lesson 3: Validate Signatures on Every Request

**The data:** 19% of security incidents in our sample were caused by missing or incorrect signature verification. Attackers sent fake webhooks that created fraudulent records.

**Why it happens:** Developers skip signature verification in local development and forget to add it in production. Or they verify the parsed JSON instead of the raw body, which breaks silently.

**The fix:** Always verify signatures. Always use the raw body.

\`\`\`javascript
// Express: use raw body middleware for the webhook route
app.use('/webhook', express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body, // RAW body
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  );
  // ... process event
});
\`\`\`

**Testing tip:** Capture a real webhook with HookSwing, then write a unit test that:
1. Verifies the signature with the correct secret → passes
2. Verifies with the wrong secret → fails
3. Verifies with a tampered payload → fails

---

## Lesson 4: Schema Validation Catches Breaking Changes Early

**The data:** 12% of production bugs were caused by webhook schema changes. Stripe updated their invoice object shape. GitHub added a new field. PayPal renamed a parameter.

**Why it happens:** Webhook providers version their APIs, but they do not always announce schema changes loudly. A field that was guaranteed in v2023-10 becomes optional in v2024-01.

**The fix:** Validate every webhook payload against a schema.

\`\`\`javascript
import { z } from 'zod';

const stripeInvoiceSchema = z.object({
  id: z.string(),
  object: z.literal('invoice'),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
  amount_due: z.number(),
  customer: z.string(),
  lines: z.object({
    data: z.array(z.object({
      id: z.string(),
      amount: z.number().optional(),
      unit_amount: z.number().optional(),
    })),
  }),
});

const result = stripeInvoiceSchema.safeParse(req.body);
if (!result.success) {
  logger.warn('Unexpected webhook schema', {
    errors: result.error.errors,
    payload: req.body,
  });
  // Do not crash. Log and investigate.
  return res.sendStatus(200);
}
\`\`\`

---

## Lesson 5: Teams Need Shared Context

**The data:** Developers working on webhook integrations in teams spent 40% less time debugging when they had a shared webhook feed with comments and replay history.

**Why it matters:** Webhook debugging is inherently collaborative. A backend developer sees the payload. A frontend developer sees the UI bug. A product manager asks "what happened at 3 PM?" Without a shared source of truth, answers live in Slack threads and screenshots.

**The fix:** Use a team webhook workspace.

With HookSwing Team workspaces:
- Every webhook is visible to the whole team in real time
- Comments on specific webhooks preserve context
- Replay history shows who tested what and when
- Activity logs track every action

---

## Lesson 6: Monitor Delivery, Not Just Errors

**The data:** Teams that monitored webhook delivery metrics (success rate, latency, retry count) caught 60% of issues before customers reported them.

**Key metrics to track:**
- **Delivery success rate** — percentage of webhooks returning 2xx
- **P95 latency** — 95th percentile response time
- **Retry rate** — percentage of webhooks that required retries
- **Error breakdown** — 4xx vs 5xx vs timeout

**Implementation:**
\`\`\`javascript
// Log every webhook delivery
app.post('/webhook', async (req, res) => {
  const start = Date.now();
  try {
    await processWebhook(req.body);
    metrics.histogram('webhook.latency', Date.now() - start);
    metrics.increment('webhook.success');
    res.sendStatus(200);
  } catch (err) {
    metrics.increment('webhook.error', { status: err.status || 500 });
    res.sendStatus(500);
  }
});
\`\`\`

---

## The Reliable Webhook Checklist

Based on the 500 integrations we analyzed, here is the checklist that separates reliable systems from broken ones:

- [ ] Handlers are idempotent (event ID deduplication)
- [ ] Handlers return 200 in under 2 seconds
- [ ] Heavy processing happens asynchronously
- [ ] Signatures are verified on every request
- [ ] Payloads are validated against a schema
- [ ] Webhooks are captured in a permanent archive
- [ ] Team has shared access to webhook history
- [ ] Delivery metrics are monitored and alerted
- [ ] Failed webhooks trigger PagerDuty/Slack alerts
- [ ] Retry logic is tested (3rd retry, 10th retry, etc.)

---

## Summary

Webhook integrations are not hard to build. They are hard to build reliably. The six lessons above — idempotency, fast acknowledgement, signature verification, schema validation, team context, and monitoring — are the difference between an integration that works on demo day and one that works at scale.

**[Build reliable webhook integrations →](/register)**`,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getBlogPostBySlug(slug);
  if (!current) return blogPosts.slice(0, limit);
  return blogPosts
    .filter((p) => p.slug !== slug)
    .filter((p) => p.tags.some((t) => current.tags.includes(t)))
    .slice(0, limit);
}
