# webhookvault-cli

> The open-source CLI for [WebhookVault](https://webhookvault.io). Forward webhooks to localhost without ngrok. Replay payloads on demand.

[![npm version](https://img.shields.io/npm/v/webhookvault-cli.svg)](https://www.npmjs.com/package/webhookvault-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)

## Why this CLI?

- **No tunnels** — Uses WebSockets, not TCP tunnels. Your laptop can sleep and wake up without breaking the connection.
- **Zero config** — One command, no YAML files, no port forwarding.
- **Replay built-in** — Re-send any past webhook from the terminal.
- **Open source & free** — The CLI is MIT-licensed and free forever. The backend is proprietary.

## Install

```bash
npm install -g webhookvault-cli
```

Requires Node.js 16 or higher.

## Quick Start

```bash
# 1. Authenticate with your WebhookVault account
webhookvault login

# 2. Forward webhooks from your project to localhost
webhookvault forward abc123 http://localhost:3000/webhook

# 3. List your projects
webhookvault list

# 4. Replay a webhook (Pro/Team plans)
webhookvault replay wh_123abc http://localhost:3000/webhook
```

## Commands

### `login`

Interactive login. Stores your API token in `~/.webhookvault/config.json`.

```bash
webhookvault login
# ? Email: dev@example.com
# ? Password: ********
# ✓ Authenticated as dev@example.com
```

### `logout`

Removes stored credentials.

```bash
webhookvault logout
# ✓ Logged out. Credentials removed.
```

### `forward <slug> <local-url>`

Forwards webhooks from your WebhookVault project to a local server.

```bash
webhookvault forward abc123 http://localhost:3000/webhook
```

**How it works:**
1. Opens a WebSocket connection to WebhookVault
2. Subscribes to your project's slug
3. When a webhook hits your public URL, the server pushes it via WebSocket
4. The CLI forwards the HTTP request to your local server
5. Prints status code, response time, and payload size

**Output:**

```
🪝 WebhookVault Forwarder
   Project: My SaaS (abc123)
   Target:  http://localhost:3000/webhook

   [Press Ctrl+C to stop]

[03:17:42] POST  200  1.2KB  45ms  stripe:invoice.payment_succeeded
[03:18:15] POST  500  0.8KB  12ms  github:push  ⚠️ Server Error
[03:20:01] POST  200  2.4KB  89ms  custom:paygate_callback

Requests: 3  │  Success: 2  │  Failed: 1
```

**Flags:**

| Flag | Alias | Description |
|------|-------|-------------|
| `--verbose` | `-v` | Print full JSON body for every webhook |
| `--no-color` | | Disable colored output |
| `--quiet` | `-q` | Only print errors |

### `list`

Lists your WebhookVault projects.

```bash
webhookvault list

# Your Projects:
#   abc123  My SaaS        12 webhooks today
#   def456  Telegram Bot    3 webhooks today
```

### `replay <webhook-id> <local-url>`

Replays a past webhook against a local URL. Requires Pro or Team plan.

```bash
webhookvault replay wh_123abc456 http://localhost:3000/webhook

# ↻ Replaying webhook wh_123abc456
#   Original: 2026-05-05 03:17:42
#   POST http://localhost:3000/webhook
#
#   Response: 200 OK in 34ms
#   Body: {"status": "processed"}
```

## Configuration

The CLI stores a single config file at:

```
~/.webhookvault/config.json
```

Example:

```json
{
  "apiUrl": "https://api.webhookvault.io",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `WEBHOOKVAULT_API_URL` | Override the default API URL |
| `NO_COLOR` | Disable colored output |

## Troubleshooting

### "Authentication failed"

```bash
webhookvault logout
webhookvault login
```

### "Connection refused" when forwarding

Your local server isn't running on the specified URL:

```bash
# Verify
 curl http://localhost:3000/webhook

# If using Docker, use host.docker.internal instead of localhost
webhookvault forward abc123 http://host.docker.internal:3000/webhook
```

### Webhooks aren't appearing

1. Check that the slug is correct: `webhookvault list`
2. Test with curl directly:
   ```bash
   curl -X POST https://api.webhookvault.io/hook/YOUR_SLUG -d '{"test": true}'
   ```
3. Check your project usage in the web dashboard — you may have hit your plan limit.

## How it works

```
┌──────────────┐     WebSocket      ┌─────────────────┐
│  Your Local  │ ◄────────────────► │  WebhookVault   │
│  Server      │    (persistent)    │  API Server     │
└──────────────┘                    └─────────────────┘
       ▲                                      ▲
       │         HTTP forward                 │
       │                                      │
       └──────────────────────────────────────┘
                   Any webhook sender
                   (Stripe, GitHub, etc.)
```

Unlike ngrok, which opens a public TCP tunnel to your machine, WebhookVault CLI uses a **WebSocket connection** to the API server. Webhooks hit the public URL, the server stores them, and pushes them to your CLI over the WebSocket. The CLI then makes a local HTTP request to your dev server. This means:

- No public ports exposed on your machine
- Connection survives laptop sleep/wake
- No "tunnel expired" messages

## Changelog

### 1.0.0

- Initial release
- `login`, `logout`, `forward`, `list`, `replay` commands
- WebSocket-based forwarding
- Colored terminal output

## Contributing

This CLI is open source. Issues and PRs welcome at [github.com/MBAS89/WebhookVault](https://github.com/MBAS89/WebhookVault).

## License

MIT © [WebhookVault](https://webhookvault.io)
