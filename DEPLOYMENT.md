# VPS Deployment Guide — Multi-Project Setup

This guide covers deploying **HookSwing** (and other projects) onto a single Ubuntu VPS using **Docker Compose** for services and **Nginx** as a central reverse proxy with SSL.

---

## Architecture Overview

```
Internet
    |
    v
Nginx (ports 80/443)  ← SSL termination, reverse proxy
    |
    |---> hookswing.com  → /opt/projects/hookswing/apps/web/dist (static files)
    |                       + proxies /api, /hook, /ws → localhost:3001
    |
    |---> otherproject.com   → /opt/projects/otherproject/...
    |
    |---> thirdproject.com   → /opt/projects/thirdproject/...

Docker (isolated per project):
    hookswing-network:
        ├── hookswing-api      (port 3001 on host)
        ├── hookswing-postgres (port 5433 on host)
        └── hookswing-redis    (port 6380 on host)
```

**Why this architecture?**
- **Nginx on the host** = fastest static file serving, simplest SSL management
- **Docker per project** = isolated databases, no dependency conflicts
- **Unique ports per project** = you can run 10+ projects without collisions

---

## DNS Setup (Do This First)

Since all your domains point to the **same VPS**, create an `A` record for each domain:

| Domain | Type | Value |
|--------|------|-------|
| `hookswing.com` | A | `<Your VPS IP>` |
| `www.hookswing.com` | A | `<Your VPS IP>` |
| `otherproject.com` | A | `<Your VPS IP>` |
| `www.otherproject.com` | A | `<Your VPS IP>` |

> Nginx will look at the `Host` header (the domain name) and route each request to the correct project automatically.

---

## Step 1: Prepare Your VPS

SSH into your VPS and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Install Docker (official script)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Node.js 20 (needed to build the web app on the host)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v   # should be v20.x
npm -v
docker compose version
```

---

## Step 2: Directory Structure

Create a standard location for all projects:

```bash
sudo mkdir -p /opt/projects
sudo chown $USER:$USER /opt/projects
cd /opt/projects
```

For each project, you will create a folder like `/opt/projects/hookswing`, `/opt/projects/project2`, etc.

---

## Step 3: Deploy HookSwing

### 3.1 Clone the repo

```bash
cd /opt/projects
git clone <your-repo-url> hookswing
cd hookswing
```

### 3.2 Configure environment

```bash
cp deploy/hookswing/.env.example deploy/hookswing/.env
nano deploy/hookswing/.env
```

Fill in **all required values**:
- `POSTGRES_PASSWORD` — strong DB password
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `HOOKSWING_ENCRYPTION_KEY` — generate with `openssl rand -hex 32`
- `FRONTEND_URL` — `https://hookswing.com`
- Add/remove optional services (Stripe, OAuth, Resend) as needed

### 3.3 Build and start the backend

```bash
cd deploy/hookswing

# Build and start API + DB + Redis
docker compose -f docker-compose.prod.yml up -d --build

# Watch logs
docker logs -f hookswing-api

# Check health
curl http://127.0.0.1:3001/health
```

> **Port mapping:** The API is reachable on the **host** at `127.0.0.1:3001`. Other projects should use different ports (e.g., 4001, 5001).

### 3.4 Build the frontend

```bash
cd /opt/projects/hookswing

# Install dependencies
npm install

# Build web app
npm run build --workspace=@hookswing/web
```

> This creates `apps/web/dist/` with static files that Nginx will serve directly.

---

## Step 4: Configure Nginx

### 4.1 Copy the site config

```bash
sudo cp deploy/vps/nginx/hookswing.conf /etc/nginx/sites-available/hookswing
```

Edit it and replace `hookswing.com` with your real domain:

```bash
sudo nano /etc/nginx/sites-available/hookswing
```

Also update the `root` path if you cloned somewhere other than `/opt/projects/hookswing`.

### 4.2 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/hookswing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4.3 Obtain SSL certificate

```bash
sudo certbot --nginx -d hookswing.com -d www.hookswing.com
```

Follow the prompts. Certbot will auto-renew certificates.

---

## Step 5: Verify Deployment

Open `https://hookswing.com` in your browser.

Checklist:
- [ ] Frontend loads
- [ ] `/api/health` responds
- [ ] Registration/login works
- [ ] WebSocket connections work (real-time features)
- [ ] Webhooks can be received at `/hook/{slug}`

---

## Step 6: Add Another Project

To host a second (or third) project on the same VPS:

1. **Pick unique ports** — never reuse 3001, 5433, 6380:
   - OtherProject API → `127.0.0.1:4001:3000`
   - Project 2 Postgres → `127.0.0.1:5434:5432`
   - Project 2 Redis → `127.0.0.1:6381:6379`

2. **Clone into `/opt/projects/project2`**

3. **Create its Docker Compose** with the new ports

4. **Copy the template Nginx config:**
   ```bash
   sudo cp deploy/vps/nginx/project-template.conf /etc/nginx/sites-available/project2
   sudo nano /etc/nginx/sites-available/project2
   sudo ln -s /etc/nginx/sites-available/project2 /etc/nginx/sites-enabled/
   ```

5. **Get SSL:**
   ```bash
   sudo certbot --nginx -d otherproject.com -d www.otherproject.com
   ```

6. **Reload Nginx:**
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

---

## Useful Commands

### HookSwing
```bash
cd /opt/projects/hookswing/deploy/hookswing

# View logs
docker compose -f docker-compose.prod.yml logs -f api

# Restart API
docker compose -f docker-compose.prod.yml restart api

# Update (pull latest, rebuild, restart)
cd /opt/projects/hookswing
git pull
npm install
npm run build --workspace=@hookswing/web
cd deploy/hookswing
docker compose -f docker-compose.prod.yml up -d --build

# Database backup
docker exec hookswing-postgres pg_dump -U hookswing hookswing > backup.sql

# Database restore
cat backup.sql | docker exec -i hookswing-postgres psql -U hookswing hookswing
```

### Nginx
```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# View all enabled sites
ls -la /etc/nginx/sites-enabled/

# View access logs
sudo tail -f /var/log/nginx/hookswing.access.log
```

### SSL / Certbot
```bash
# Renew manually (auto-renew is enabled by default)
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates
```

---

## Security Checklist

- [ ] `.env` file is **never** committed to Git
- [ ] `POSTGRES_PASSWORD`, `JWT_SECRET`, etc. are strong and unique
- [ ] Database ports (5433, 5434…) are bound to `127.0.0.1` only (not `0.0.0.0`)
- [ ] API ports (3001, 4001…) are bound to `127.0.0.1` only
- [ ] UFW firewall is enabled:
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```
- [ ] Automatic security updates:
  ```bash
  sudo apt install -y unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

---

## Troubleshooting

### "502 Bad Gateway"
- API container is down: `docker ps`
- Wrong proxy port in Nginx vs docker-compose
- Check API logs: `docker logs hookswing-api`

### Frontend shows blank page
- `apps/web/dist` wasn't built: run `npm run build --workspace=@hookswing/web`
- Nginx `root` path is wrong

### WebSocket not connecting
- Nginx config missing `/ws/` location with `upgrade` headers
- Firewall blocking

### Database connection errors
- `POSTGRES_PASSWORD` in `.env` doesn't match what's in Docker volume from first run
- If you need to reset: `docker volume rm hookswing_postgres_data` (⚠️ destroys data)

---

## Optional: Automated Deployments with GitHub Actions

You can set up a GitHub Actions workflow to SSH into your VPS and run the update commands on every push to `main`.

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/projects/hookswing
            git pull
            npm install
            npm run build --workspace=@hookswing/web
            cd deploy/hookswing
            docker compose -f docker-compose.prod.yml up -d --build
```

Add `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` to your repository secrets.

---

That's it! Your VPS is now a multi-project powerhouse. 🚀
