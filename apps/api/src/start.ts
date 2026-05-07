import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

// Auto-resolve failed migrations before deploying
const failedMigrations = ['20260508000000_add_github_oauth'];

for (const migration of failedMigrations) {
  try {
    execSync(`npx prisma migrate resolve --rolled-back "${migration}"`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log(`✓ Resolved failed migration: ${migration}`);
  } catch {
    // Already resolved or doesn't exist — ignore
  }
}

// Deploy pending migrations
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (err) {
  console.error('Migration deploy failed:', err);
  process.exit(1);
}

// Start the server
import('./index');
