const { spawnSync } = require('child_process');

console.log('[Startup] Running database migrations...');
const migrate = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
});

if (migrate.status !== 0) {
  console.error('[Startup] Migration failed with code', migrate.status);
  process.exit(1);
}

console.log('[Startup] Migrations complete. Starting server...');
require('./dist/index.js');
