# WebhookVault

> The permanent webhook inbox for developers. Catch any HTTP payload, inspect JSON in real time, replay against localhost, and share with your team.

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

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local database)

### 1. Start Infrastructure

```bash
npm run db:up
```

This starts PostgreSQL and Redis containers.

### 2. Setup Backend

```bash
cd apps/api
cp .env.example .env
npx prisma migrate dev
npx prisma generate
npm run dev
```

The API will run on `http://localhost:3000`.

### 3. Setup Frontend

```bash
cd apps/web
npm install
npm run dev
```

The web app will run on `http://localhost:5173`.

### 4. Setup CLI (optional)

```bash
cd apps/cli
npm link
webhookvault login
```

## Features

- **Webhook Catcher** — Unique public URLs per project, any HTTP method
- **Real-time Dashboard** — SSE-powered live webhook feed with JSON viewer
- **Replay** — Re-send any past webhook to localhost with editable payload (Pro/Team)
- **CLI Forwarding** — Forward webhooks to local servers without ngrok
- **Team Workspaces** — Shared projects with role-based access (Team plan)
- **Integrations** — Slack & Discord notifications
- **Billing** — Stripe-powered subscriptions (Free / Pro $19 / Team $49)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `ALL /hook/:slug` | Public webhook receiver |
| `POST /api/auth/register` | Register |
| `POST /api/auth/login` | Login |
| `GET /api/projects` | List projects |
| `POST /api/projects` | Create project |
| `GET /api/projects/:id/webhooks` | List webhooks |
| `POST /api/webhooks/:id/replay` | Replay webhook |
| `GET /api/stream` | SSE real-time stream |
| `WS /ws` | WebSocket for CLI |

## Documentation

Full user documentation is hosted at `/docs` in the web application.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Express, TypeScript, Prisma, PostgreSQL |
| Real-time | SSE (web), WebSocket (CLI) |
| Queue | Redis + BullMQ |
| Auth | JWT + bcrypt |
| Payments | Stripe |
| CLI | Commander.js, ws, chalk, axios |

## License

- **Backend & Web App**: Proprietary
- **CLI**: MIT
