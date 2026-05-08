import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

// Auto-resolve failed migrations before starting the server
try {
  execSync('npx prisma migrate resolve --rolled-back "20260508000000_add_github_oauth"', {
    stdio: 'inherit',
  });
} catch {
  // Already resolved or doesn't exist — ignore
}

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
  });
} catch (err) {
  console.error('Migration deploy failed:', err);
}

import { prisma } from './lib/prisma';
import { server } from './server';

const PORT = process.env.PORT || 3000;

// Explicitly connect to the database before starting the server
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected');
    server.listen(PORT, () => {
      console.log(`🚀 HookSwing API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
