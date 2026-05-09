<p align="center">
  <img src="https://raw.githubusercontent.com/MBAS89/hookswing-cli/main/logo.svg" width="80" alt="HookSwing">
</p>

# HookSwing

> The permanent webhook inbox for developers. Catch any HTTP payload, inspect JSON in real time, replay against localhost, compare diffs, and share with your team.

<p align="center">
  <a href="https://hookswing.com"><img src="https://img.shields.io/badge/Live-hookswing.com-%2310B981?style=flat-square" alt="Live"></a>
  <a href="https://www.npmjs.com/package/hookswing-cli"><img src="https://img.shields.io/npm/v/hookswing-cli.svg?style=flat-square&color=%2310B981" alt="CLI npm"></a>
  <img src="https://img.shields.io/badge/Node.js-20%2B-green.svg?style=flat-square" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18-61DAFB.svg?style=flat-square" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.4-blue.svg?style=flat-square" alt="TypeScript">
</p>

---

## What is HookSwing?

Free webhook bins delete your data. ngrok tunnels die when your laptop sleeps. HookSwing fixes both:

- **Persistent storage** — webhooks live for 7 days (Free) to unlimited (Team), not minutes
- **No tunneling** — forward webhooks to localhost via WebSocket, not TCP tunnels
- **Replay anything** — re-send past webhooks with editable payloads
- **Compare diffs** — side-by-side comparison of any two webhooks
- **Team sharing** — one URL, whole team sees the same feed in real time
- **Smart alerts** — Slack, Discord, and Telegram notifications
- **Custom subdomains** — clean URLs like `/hook/my-company` (Pro/Team)
- **Webhook Tester** — send realistic test payloads from 16+ providers to any URL
- **Path preservation** — webhooks sent to `/hook/abc123/api/webhook` forward to `localhost:3000/api/webhook`
- **Comments & Annotations** — comment on webhooks with replies and reactions (Team)
- **GitHub OAuth login** — one-click CLI authentication
- **Email verification & 2FA** — enterprise-grade security

## Architecture

```
hookswing/
├── apps/
│   ├── web/          # Vite + React 18 + TypeScript + Tailwind CSS (frontend)
│   └── api/          # Express + Prisma + PostgreSQL + Redis/BullMQ (backend)
├── docker-compose.yml # Local dev: Postgres + Redis
├── package.json
└── README.md
```

> **The CLI lives in its own open-source repo:** [github.com/MBAS89/hookswing-cli](https://github.com/MBAS89/hookswing-cli)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts, Socket.IO |
| **Backend** | Express, TypeScript, Prisma ORM, Zod validation |
| **Database** | PostgreSQL |
| **Cache / Queue** | Redis, BullMQ |
| **Real-time** | Socket.IO (dashboard), WebSocket (CLI) |
| **Auth** | JWT + bcrypt, Email OTP, TOTP 2FA, backup codes |
| **Email** | Resend HTTP API |
| **Payments** | Stripe (Checkout + Customer Portal) |
| **CLI** | Commander.js, ws, chalk, axios — [open source](https://github.com/MBAS89/hookswing-cli) |

## Features

### Web App
- **Webhook Catcher** — Unique public URL per project, accepts any HTTP method
- **Real-time Dashboard** — Socket.IO-powered live feed with syntax-highlighted JSON viewer
- **Replay** — Re-send any past webhook to localhost with editable payload (Pro/Team)
- **Compare / Diff** — Select any 2 webhooks and see exactly what changed (Pro/Team)
- **Custom Slugs** — Clean URLs like `hookswing.com/hook/my-company` (Pro/Team)
- **Team Workspaces** — Shared projects with role-based access, activity logs (Team)
- **Plan Inheritance** — Free users on team projects get TEAM privileges on those projects
- **Integrations** — Slack, Discord, and Telegram alerts (Pro/Team)
- **Export** — Download webhooks as JSON (Pro/Team)
- **Collapsible Header** — Project card above the feed can be collapsed for more space
- **Webhook Tester** — Built-in tester with realistic payloads from Stripe, GitHub, Shopify, Twilio, Slack, Discord, and 10+ more providers
- **Comments System** — Comment on webhooks, reply to comments, like/dislike reactions (Team plan)
- **Billing** — Stripe-powered subscriptions with Customer Portal

### CLI (Open Source)
- **Forward** — WebSocket-based forwarding to localhost (no ngrok), preserves original request paths
- **GitHub OAuth** — `hookswing login --github` opens browser, no copy-paste
- **Auto token refresh** — Uses 30-day refresh tokens, stays connected through access token expiry
- **Webhook Tester** — `hookswing test` sends realistic payloads from 16+ providers to any URL
- **List** — Projects and webhook counts
- **Replay** — Replay webhooks from terminal (Pro/Team)
- **Web CLI** — Browser-based terminal at `/dashboard/cli`, no install required
- **Visual feedback** — ASCII logo, colored method/status output, session timer, live usage bar

## Quick Start (Local Dev)

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Clone & Start Infrastructure

```bash
git clone https://github.com/MBAS89/hookswing.git
cd hookswing

# Start PostgreSQL and Redis
docker-compose up -d
```

### 2. Setup Backend

```bash
cd apps/api
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`.

### 3. Setup Frontend

```bash
cd apps/web
npm install
npm run dev
```

The web app will open at `http://localhost:5173`.

### 4. Setup CLI (optional)

The CLI is now a separate open-source package:

```bash
npm install -g hookswing-cli
```

Or clone it for local development:

```bash
git clone https://github.com/MBAS89/hookswing-cli.git
cd hookswing-cli
npm link
```

## Usage

### Web Dashboard

1. Open `http://localhost:5173` and register an account
2. Verify your email with the 6-digit OTP
3. Create a project — you'll get a unique webhook URL:
   ```
   https://hookswing.com/hook/abc123def456
   ```
4. Paste that URL into Stripe, GitHub, PayPal, or any service that sends webhooks
5. Watch webhooks arrive in real time on the dashboard

### CLI Forwarding

```bash
# Authenticate
hookswing login

# Or log in with GitHub (opens browser automatically)
hookswing login --github

# Forward webhooks to localhost (path preserved automatically)
# Shorthand: just type the port number
hookswing forward abc123def456 3000

# Or the full localhost URL
hookswing forward abc123def456 http://localhost:3000

# Or use your custom slug
hookswing forward my-company localhost:3000
```

**URL shorthand:** You can type just the port number (`3000`), `localhost:3000`, or the full URL (`http://localhost:3000`). Any port works — `8080`, `1337`, `9999`, etc.

**Path preservation:** A webhook sent to `/hook/abc123/api/webhook` is forwarded to `http://localhost:3000/api/webhook` automatically. The path after the slug is kept intact.

Output:
🪝 HookSwing Forwarder

  Target:  http://localhost:3000
  Project: My SaaS (abc123def456)

  Session: 00:12:34  |  Requests: 8 / 100 ████████░░

  [Press Ctrl+C to stop]

[14:32:10] POST   /api/stripe/webhook    200   (stripe:charge.succeeded)
[14:35:22] POST   /api/paypal/webhook    200   (paypal:PAYMENT.CAPTURE.COMPLETED)
[14:37:01] GET    /health                200   (custom)
```

### Replay a Webhook

```bash
# From CLI (port shorthand works here too)
hookswing replay wh_123abc456 3000

# Send a realistic test payload (any port or full URL)
hookswing test stripe invoice.payment_succeeded 3000
hookswing test stripe invoice.payment_succeeded https://hookswing.com/hook/abc123

# Or in the web dashboard — click any webhook, hit Replay, edit the target URL
# Or use the built-in Webhook Tester at /dashboard/tester
```

## API Reference

### Authentication

All API requests require a Bearer token:

```bash
curl https://hookswing.com/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Public Hook Endpoint

```
ANY https://hookswing.com/hook/:slug
```

- Accepts any HTTP method and headers
- Max body size: 1MB
- Returns `200 OK` immediately
- No authentication required

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/send-verification` | Resend email OTP |
| POST | `/api/auth/verify-email` | Verify email with OTP |
| POST | `/api/auth/2fa/setup` | Initiate 2FA setup |
| POST | `/api/auth/2fa/verify` | Enable 2FA |
| POST | `/api/auth/2fa/disable` | Disable 2FA |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id/webhooks` | List webhooks |
| POST | `/api/webhooks/:id/replay` | Replay webhook |
| GET | `/api/tester/providers` | List tester providers & events |
| POST | `/api/tester/send` | Send test payload to any URL |
| GET | `/api/billing` | Subscription status |
| POST | `/api/billing/checkout` | Stripe Checkout |
| POST | `/api/billing/portal` | Stripe Customer Portal |
| WS | `/ws` | WebSocket for CLI forwarding |

Full API documentation is available at `/docs` in the web application.

## Database Schema

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  role              UserRole @default(USER)
  plan              Plan     @default(FREE)
  emailVerified     Boolean  @default(false)
  twoFactorEnabled  Boolean  @default(false)
  twoFactorSecret   String?
  twoFactorBackupCodes String?
  projects          Project[]
  teams             TeamMember[]
  sessions          Session[]
}

model Project {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  customSlug  String?   @unique
  description String?
  webhooks    Webhook[]
  alerts      Alert[]
  teamId      String?
}

model Webhook {
  id           String   @id @default(cuid())
  method       String
  headers      Json
  body         Json?
  rawBody      String?
  query        Json?
  ip           String
  userAgent    String?
  source       String?
  statusCode   Int?
  responseTime Int?
  isReplay     Boolean  @default(false)
}
```

See `apps/api/prisma/schema.prisma` for the full schema.

## Deployment

### Backend (Railway)

1. Create a Railway project from this GitHub repo
2. Add PostgreSQL and Redis plugins
3. Set environment variables (see `apps/api/.env.example`)
4. Deploy

Required env vars:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RESEND_API_KEY=re_...
FROM_EMAIL=support@hookswing.com
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
REDIS_URL=redis://...
FRONTEND_URL=https://hookswing.com
PORT=8080
```

### Frontend (Vercel / Railway)

1. Import this repo
2. Set root directory to `apps/web`
3. Add `VITE_API_URL` environment variable
4. Deploy

### CLI (npm)

The CLI is published independently from [github.com/MBAS89/hookswing-cli](https://github.com/MBAS89/hookswing-cli):

```bash
cd hookswing-cli
npm publish --access public
```

## Plans

| Feature | Free | Pro ($19/mo) | Team ($49/mo) |
|---------|------|--------------|---------------|
| Projects | 3 | Unlimited | Unlimited |
| Webhooks/Month | 500 | 10,000 | 10,000 |
| Retention | 7 days | 90 days | Unlimited |
| Replay | ❌ | ✅ | ✅ |
| Compare/Diff | ❌ | ✅ | ✅ |
| Custom Slug | ❌ | ✅ | ✅ |
| Alerts | ❌ | Slack + Discord | Slack + Discord + Telegram |
| Team Members | 1 | 1 | Unlimited |
| Export | ❌ | JSON | JSON |
| Webhook Tester | ✅ | ✅ | ✅ |
| Comments | ❌ | ❌ | ✅ |
| Activity Log | ❌ | ❌ | ✅ |
| Plan Inheritance | — | — | Free members get TEAM privileges on team projects |

## Security

- **Email verification** required before login
- **TOTP 2FA** with backup codes
- **Password reset** via JWT token (1hr expiry)
- **Session invalidation** on password change
- **Rate limiting** on all endpoints
- **Anti-enumeration** on email endpoints

## Contributing

This is a private repository. Contributions are by team members only.

## License

- **Backend & Web App**: Proprietary — © 2026 HookSwing
- **CLI**: [MIT](https://github.com/MBAS89/hookswing-cli/blob/main/LICENSE) — open source at [github.com/MBAS89/hookswing-cli](https://github.com/MBAS89/hookswing-cli)

## A Nuyvo LLC Platform

HookSwing is a product of [Nuyvo LLC](https://nuyvo.com).

---

**[Live Site](https://hookswing.com)** · **[Docs](https://hookswing.com/docs)** · **[CLI Repo](https://github.com/MBAS89/hookswing-cli)** · **[Nuyvo LLC](https://nuyvo.com)**
