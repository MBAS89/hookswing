import { chromium, type Browser, type Page } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = 4321;

// ── Routes ────────────────────────────────────────────────────────────

const STATIC_ROUTES = [
  '/',
  '/blog',
  '/docs',
  '/alternatives/ngrok',
  '/alternatives/webhook-site',
  '/alternatives/requestbin',
  '/alternatives/beeceptor',
  '/about',
  '/contact',
  '/careers',
  '/privacy',
  '/terms',
  '/cookies',
  '/login',
  '/register',
];

function getBlogSlugs(): string[] {
  const content = fs.readFileSync(
    path.join(__dirname, '../src/data/blogPosts.ts'),
    'utf8'
  );
  const matches = content.matchAll(/slug:\s*'([^']+)'/g);
  return [...matches].map((m) => `/blog/${m[1]}`);
}

const ROUTES = [...STATIC_ROUTES, ...getBlogSlugs()];

// ── Static file server ────────────────────────────────────────────────

function startServer(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = (req.url || '/').split('?')[0];
      const filePath = path.join(DIST, url);

      // If the URL points to an actual file (has extension), serve it
      if (path.extname(url) && fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const ct =
          ext === '.js'
            ? 'application/javascript'
            : ext === '.css'
              ? 'text/css'
              : ext === '.svg'
                ? 'image/svg+xml'
                : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': ct });
        res.end(fs.readFileSync(filePath));
        return;
      }

      // SPA fallback — serve index.html so React Router works
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(path.join(DIST, 'index.html')));
    });

    server.listen(PORT, () => {
      console.log(`🖥️  Static server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// ── Prerender ─────────────────────────────────────────────────────────

async function prerender() {
  console.log('🔧 Starting prerender...\n');

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let success = 0;
  let failed = 0;

  for (const route of ROUTES) {
    const label = route === '/' ? '/ (index)' : route;
    process.stdout.write(`  ${label} ... `);

    try {
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'networkidle',
      });

      // Extra wait for React hydration + any lazy content
      await page.waitForTimeout(800);

      // Ensure the root div actually has content (not empty)
      const rootHtml = await page.$eval('#root', (el) => el.innerHTML);
      if (!rootHtml || rootHtml.trim().length < 100) {
        throw new Error('Root div is empty — page did not render');
      }

      const html = await page.content();

      // Write to dist/{route}/index.html  (or dist/index.html for /)
      const outFile =
        route === '/'
          ? path.join(DIST, 'index.html')
          : path.join(DIST, route, 'index.html');

      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, html);

      console.log('✅');
      success++;
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      failed++;
    }
  }

  // ── SPA Fallback: inject route-aware loader into index.html ───────────
  const indexPath = path.join(DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const loaderScript = `<script>(function(){var p=location.pathname;if(p!=='/'&&!p.startsWith('/blog')){var r=document.getElementById('root');if(r)r.innerHTML='<div style="min-height:100vh;background:#020617;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-family:Inter,sans-serif;"><div style="text-align:center;"><div style="width:40px;height:40px;border:3px solid #1e293b;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div><div>Loading...</div></div></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';}})();</script>`;
    // Inject before closing </head> or after <div id="root">
    indexHtml = indexHtml.replace('<div id="root"></div>', '<div id="root"></div>' + loaderScript);
    fs.writeFileSync(indexPath, indexHtml);
    console.log('🔄 Injected SPA route loader into index.html');
  }

  await browser.close();
  server.close();

  console.log(`\n✅ Prerendered ${success} pages`);
  if (failed > 0) console.log(`❌ ${failed} pages failed`);
}

prerender().catch((err) => {
  console.error(err);
  process.exit(1);
});
