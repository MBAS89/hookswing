#!/bin/bash
set -e

# HookSwing VPS Deploy Script
# Run this from /opt/projects/hookswing

echo "🚀 Starting HookSwing deployment..."

cd /opt/projects/hookswing

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building web app..."
npm run build --workspace=@hookswing/web

echo "🐳 Building and starting Docker services..."
cd deploy/hookswing
docker compose -f docker-compose.prod.yml up -d --build

echo "🔄 Restarting Env Admin panel..."
sudo systemctl restart hookswing-admin || true

echo "✅ Deployment complete!"
echo "🌐 Site: https://hookswing.com"
echo "⚙️  Env Admin: https://hookswing.com/admin/env"
echo "📊 API Health: curl http://127.0.0.1:3001/health"
