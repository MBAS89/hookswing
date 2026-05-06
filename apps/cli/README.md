# webhookvault-cli

> The open-source CLI for [WebhookVault](https://webhookvault.io). Forward webhooks to localhost without ngrok. Replay payloads on demand.

## Install

```bash
npm install -g webhookvault-cli
```

## Quick Start

```bash
# 1. Login
webhookvault login

# 2. Forward webhooks from your project to localhost
webhookvault forward abc123 http://localhost:3000/webhook

# 3. List your projects
webhookvault list

# 4. Replay a webhook (Pro/Team plans)
webhookvault replay wh_123abc http://localhost:3000/webhook
```

## Commands

| Command | Description |
|---------|-------------|
| `login` | Authenticate with your WebhookVault account |
| `logout` | Remove stored credentials |
| `forward <slug> <local-url>` | Forward webhooks to your local server |
| `list` | List your projects |
| `replay <webhook-id> <local-url>` | Replay a past webhook |

## Forward Command Options

```bash
webhookvault forward abc123 http://localhost:3000/webhook --verbose
```

| Flag | Description |
|------|-------------|
| `-v, --verbose` | Print full JSON body for every webhook |
| `--no-color` | Disable colored output |
| `-q, --quiet` | Only print errors |

## How Forwarding Works

1. CLI connects to WebhookVault via WebSocket
2. Subscribes to your project's unique slug
3. When a webhook hits your public URL, the server pushes it to the CLI
4. CLI forwards the HTTP request to your local server
5. You see status codes, response times, and errors in your terminal

```
🪝 WebhookVault Forwarder
   Project: My SaaS (abc123)
   Target:  http://localhost:3000/webhook

[03:17:42] POST  200  1.2KB  45ms  stripe:invoice.payment_succeeded
[03:18:15] POST  500  0.8KB  12ms  github:push  ⚠️ Server Error
```

## License

MIT © WebhookVault
