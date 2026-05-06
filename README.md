# WebhookVault

> The permanent webhook inbox for developers. Catch any HTTP payload, inspect JSON in real time, replay against localhost, and share with your team.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

## Why WebhookVault?

Free webhook bins delete your data. ngrok tunnels die when your laptop sleeps. WebhookVault fixes both:

- **Persistent storage** — webhooks live for 7-90 days, not minutes
- **No tunneling** — forward webhooks to localhost via WebSocket, not TCP tunnels
- **Replay anything** — re-send past webhooks with editable payloads
- **Team sharing** — one URL, whole team sees the same feed

## Architecture

```
webhookvault/
├── apps/
│   ├── web/          # Vite + React + TypeScript + Tailwind CSS (frontend)
│   ├── api/          # Express + Prisma + PostgreSQL + Redis (backend)
│   └── cli/          # Node.js CLI package (npm)
├── docker-compose.yml # Local dev: Postgres + Redis
├── package.json
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS |
| **Backend** | Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Cache / Queue** | Redis, BullMQ |
| **Real-time** | SSE (browser), WebSocket (CLI) |
| **Auth** | JWT + bcrypt |
| **Payments** | Stripe |
| **CLI** | Commander.js, ws, chalk, axios |

## Features

### Web App
- **Webhook Catcher** — Unique public URL per project, accepts any HTTP method
- **Real-time Dashboard** — SSE-powered live feed with syntax-highlighted JSON viewer
- **Replay** — Re-send any past webhook to localhost with editable payload (Pro/Team)
- **Team Workspaces** — Shared projects with role-based access (Team plan)
- **Integrations** — Slack & Discord notifications
- **Billing** — Stripe-powered subscriptions (Free / Pro $19 / Team $49)

### CLI
- **Forward** — WebSocket-based forwarding to localhost (no ngrok needed)
- **List** — Projects and webhook counts
- **Replay** — Replay webhooks from terminal (Pro/Team)

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### 1. Clone & Start Infrastructure

```bash
git clone https://github.com/MBAS89/WebhookVault.git
cd WebhookVault

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

```bash
cd apps/cli
npm link

# Or install from npm
npm install -g webhookvault-cli
```

## Usage

### Web Dashboard

1. Open `http://localhost:5173` and register an account
2. Create a project — you'll get a unique webhook URL:
   ```
   https://api.webhookvault.io/hook/abc123def456
   ```
3. Paste that URL into Stripe, GitHub, PayPal, or any service that sends webhooks
4. Watch webhooks arrive in real time on the dashboard

### CLI Forwarding

```bash
# Authenticate
webhookvault login

# Forward webhooks to localhost
webhookvault forward abc123def456 http://localhost:3000/webhook
```

Output:
```
🪝 WebhookVault Forwarder
   Project: My SaaS (abc123def456)
   Target:  http://localhost:3000/webhook

   [Press Ctrl+C to stop]

[14:32:10] POST  200  1.2KB  45ms  stripe:invoice.payment_succeeded
[14:35:22] POST  500  0.8KB  12ms  github:push  ⚠️ Server Error
```

### Replay a Webhook

```bash
# From CLI
webhookvault replay wh_123abc456 http://localhost:3000/webhook

# Or in the web dashboard — click any webhook, hit Replay, edit the target URL
```

## API Reference

### Authentication

All API requests require a Bearer token:

```bash
curl https://api.webhookvault.io/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Public Hook Endpoint

```
ANY https://api.webhookvault.io/hook/:slug
```

- Accepts any HTTP method and headers
- Max body size: 1MB
- Returns `200 OK` immediately

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id/webhooks` | List webhooks |
| POST | `/api/webhooks/:id/replay` | Replay webhook |
| GET | `/api/stream` | SSE real-time stream |
| WS | `/ws` | WebSocket for CLI |

Full API documentation is available at `/docs` in the web application.

## Database Schema

```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  name     String?
  role     UserRole @default(USER)
  plan     Plan @default(FREE)
  projects Project[]
  teams    TeamMember[]
}

model Project {
  id       String @id @default(cuid())
  name     String
  slug     String @unique
  webhooks Webhook[]
}

model Webhook {
  id         String @id @default(cuid())
  method     String
  headers    Json
  body       Json?
  query      Json?
  ip         String
  userAgent  String?
  source     String?
  statusCode Int?
  isReplay   Boolean @default(false)
}
```

See `apps/api/prisma/schema.prisma` for the full schema.

## Deployment

### Backend (Railway)

1. Create a Railway project from this GitHub repo
2. Add PostgreSQL and Redis plugins
3. Set environment variables (see `apps/api/.env.example`)
4. Deploy

### Frontend (Vercel)

1. Import this repo on Vercel
2. Set root directory to `apps/web`
3. Add `VITE_API_URL` environment variable
4. Deploy

### CLI (npm)

```bash
cd apps/cli
npm publish --access public
```

## Environment Variables

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/webhookvault
JWT_SECRET=your-super-secret-min-32-chars
JWT_REFRESH_SECRET=another-super-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
PORT=3000
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

## Plans

| Feature | Free | Pro ($19/mo) | Team ($49/mo) |
|---------|------|--------------|---------------|
| Projects | 3 | Unlimited | Unlimited |
| Webhooks/Month | 500 | 10,000 | 10,000+ |
| Retention | 7 days | 90 days | 90 days |
| Replay | ❌ | ✅ | ✅ |
| Custom Domain | ❌ | ✅ | ✅ |
| Integrations | Email | Slack + Discord | Slack + Discord |
| Team Members | 1 | 1 | Unlimited |
| Export | ❌ | JSON/CSV | JSON/CSV |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

- **Backend & Web App**: Proprietary
- **CLI**: [MIT](https://opensource.org/licenses/MIT)

## Acknowledgments

- Inspired by the pain of debugging webhooks at 2 AM
- Built for developers who are tired of losing payloads

---

**[Live Demo](https://webhookvault.io)** · **[Documentation](https://webhookvault.io/docs)** · **[Report Bug](https://github.com/MBAS89/WebhookVault/issues)** · **[Request Feature](https://github.com/MBAS89/WebhookVault/issues)**
