#!/bin/bash
set -e

echo "============================================"
echo "  HookSwing VPS Server Setup"
echo "  Domain: hookswing.com"
echo "============================================"

# Update system
echo "[1/6] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essentials
echo "[2/6] Installing essentials (git, nginx, certbot)..."
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw

# Install Playwright/Chromium dependencies (needed for web app prerender build)
echo "[2.5/6] Installing Playwright system dependencies..."
sudo apt install -y libnss3 libatk-bridge2.0-0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libasound2 libpangocairo-1.0-0 libxshmfence1 libgtk-3-0 libgdk-pixbuf2.0-0

# Install Docker
echo "[3/6] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes."
else
    echo "Docker already installed."
fi

# Install Node.js 20
echo "[4/6] Installing Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" != "20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js 20 already installed."
fi

# Create projects directory
echo "[5/6] Creating /opt/projects directory..."
sudo mkdir -p /opt/projects
sudo chown $USER:$USER /opt/projects

# Configure UFW firewall
echo "[6/6] Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable || true

# Verify installations
echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo "Docker:     $(docker --version 2>/dev/null || echo 'RELOGIN REQUIRED')"
echo "Docker Compose: $(docker compose version 2>/dev/null || echo 'RELOGIN REQUIRED')"
echo "Node.js:    $(node -v 2>/dev/null || echo 'N/A')"
echo "NPM:        $(npm -v 2>/dev/null || echo 'N/A')"
echo "Nginx:      $(nginx -v 2>&1 | head -1 || echo 'N/A')"
echo ""
echo "Next steps:"
echo "  1. If Docker shows 'RELOGIN REQUIRED', run: exit && ssh back in"
echo "  2. Continue with Step 3: Clone your repo to /opt/projects/hookswing"
echo ""
