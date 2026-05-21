const { spawnSync } = require('child_process');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');

// Resolve any failed migration so we can redeploy
console.log('[Startup] Resolving failed migration if present...');
spawnSync('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', '20260508000000_add_github_oauth', '--schema', schemaPath], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

console.log('[Startup] Running database migrations...');
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--schema', schemaPath], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

if (migrate.status !== 0) {
  console.error('[Startup] Migration deploy failed. Starting server anyway...');
} else {
  console.log('[Startup] Migrations complete.');
}

console.log('[Startup] Starting server...');
require('./dist/index.js');
