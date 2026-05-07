import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Copy, Check } from 'lucide-react';
import Logo from '../components/Logo';

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={copy} className="p-1.5 bg-slate-700 rounded hover:bg-slate-600 text-slate-300">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Sidebar({ active, setActive }: { active: string; setActive: (id: string) => void }) {
  const sections = [
    { id: 'quick-start', label: '1. Quick Start' },
    { id: 'dashboard', label: '2. Dashboard Guide' },
    { id: 'cli', label: '3. CLI Reference' },
    { id: 'integrations', label: '4. Integrations' },
    { id: 'teams', label: '5. Teams' },
    { id: 'billing', label: '6. Billing & Plans' },
    { id: 'api', label: '7. API Reference' },
    { id: 'troubleshooting', label: '8. Troubleshooting' },
    { id: 'faq', label: '9. FAQ' },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                active === s.id ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${active === s.id ? 'rotate-90' : ''}`} />
              {s.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quick-start');

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 text-sm font-mono">
          {id.split('-').map(w => w[0]).join('').toUpperCase()}
        </span>
        {title}
      </h2>
      <div className="prose prose-invert prose-slate max-w-none">
        {children}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">HookSwing</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/docs" className="text-emerald-400 font-medium text-sm">Docs</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          <Sidebar active={activeSection} setActive={setActiveSection} />

          <main className="flex-1 min-w-0">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">User Documentation</h1>
              <p className="text-slate-400 text-lg">Get from signup to first successful webhook replay in under 5 minutes.</p>
            </div>

            <Section id="quick-start" title="Quick Start">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.1 Sign Up</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to <Link to="/" className="text-emerald-400 hover:underline">hookswing.com</Link></li>
                <li>Click <strong className="text-white">"Start Catching Free"</strong></li>
                <li>Enter your email and password</li>
                <li>Verify your email (check spam folder)</li>
                <li>You land on the Dashboard</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.2 Create Your First Project</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Click <strong className="text-white">"New Project"</strong> in the sidebar</li>
                <li>Name it: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">My First Project</code></li>
                <li>We auto-generate your unique webhook URL</li>
              </ol>
              <CodeBlock code={`https://api.hookswing.com/hook/abc123def456`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.3 Send a Test Webhook</h3>
              <p className="text-slate-300 mb-3">Using curl:</p>
              <CodeBlock code={`curl -X POST https://api.hookswing.com/hook/abc123def456 \\
  -H "Content-Type: application/json" \\
  -d '{"test": true, "message": "hello world"}'`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.4 See It Live</h3>
              <p className="text-slate-300">Switch back to the Dashboard. Your webhook appears instantly in the feed. Click it to expand and see method, headers, body, timestamp, and source IP.</p>
              <p className="text-emerald-400 font-semibold mt-4">Time to complete: ~2 minutes.</p>
            </Section>

            <Section id="dashboard" title="Dashboard Guide">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.1 Webhook Feed</h3>
              <p className="text-slate-300 mb-3">The feed shows all webhooks caught by your project.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 border border-slate-700 rounded-lg">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Column</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="px-4 py-3 font-mono">Method</td><td className="px-4 py-3">GET, POST, PUT, PATCH, DELETE (color-coded)</td></tr>
                    <tr><td className="px-4 py-3 font-mono">Status</td><td className="px-4 py-3">Response from your server (if forwarded via CLI)</td></tr>
                    <tr><td className="px-4 py-3 font-mono">Size</td><td className="px-4 py-3">Payload size in KB</td></tr>
                    <tr><td className="px-4 py-3 font-mono">Time</td><td className="px-4 py-3">When it arrived (relative)</td></tr>
                    <tr><td className="px-4 py-3 font-mono">Source</td><td className="px-4 py-3">Inferred sender (Stripe, GitHub, Custom)</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.2 Webhook Detail View</h3>
              <p className="text-slate-300">Click any webhook to open the detail panel with tabs:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 mt-2">
                <li><strong className="text-white">Overview</strong> — Full URL, method, status, response time, IP</li>
                <li><strong className="text-white">Headers</strong> — Table of all request headers (sensitive ones masked)</li>
                <li><strong className="text-white">Body</strong> — Syntax-highlighted JSON viewer, collapsible tree</li>
                <li><strong className="text-white">Replay History</strong> — List of all replays with target URL and status</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.3 Replay a Webhook</h3>
              <p className="text-slate-300 mb-2"><span className="text-amber-400 font-medium">Available on: Pro and Team plans.</span></p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Open any webhook detail</li>
                <li>Click the <strong className="text-white">"Replay"</strong> button</li>
                <li>Edit the target URL, headers, or body</li>
                <li>Click <strong className="text-white">"Send Replay"</strong></li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.4 Project Settings</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Rename project</li>
                <li>Regenerate slug (changes webhook URL)</li>
                <li>Delete project (permanent)</li>
                <li>Custom domain (Pro/Team)</li>
                <li>Integrations — connect Slack/Discord</li>
              </ul>
            </Section>

            <Section id="cli" title="CLI Reference">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.1 Installation</h3>
              <CodeBlock code={`npm install -g hookswing-cli

hookswing --version
# Expected: 1.x.x`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.2 Login</h3>
              <CodeBlock code={`hookswing login

# You'll be prompted for email and password
# Token stored in ~/.hookswing/config.json

hookswing logout
# Removes config file`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.3 Forward Webhooks to Localhost</h3>
              <CodeBlock code={`hookswing forward abc123def456 http://localhost:3000/webhook`} />
              <p className="text-slate-300 mt-3">Output:</p>
              <CodeBlock code={`🪝 HookSwing Forwarder
   Project: My First Project (abc123def456)
   Target:  http://localhost:3000/webhook

   [Press Ctrl+C to stop]

[03:17:42] POST  200  1.2KB  45ms  stripe:invoice.payment_succeeded
[03:18:15] POST  500  0.8KB  12ms  github:push  ⚠️ Server Error`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.4 List Projects</h3>
              <CodeBlock code={`hookswing list`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.5 Replay from CLI</h3>
              <p className="text-slate-300 mb-2"><span className="text-amber-400 font-medium">Available on: Pro and Team plans.</span></p>
              <CodeBlock code={`hookswing replay wh_123abc456 http://localhost:3000/webhook`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.6 Update CLI</h3>
              <CodeBlock code={`npm update -g hookswing-cli`} />
            </Section>

            <Section id="integrations" title="Integrations">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.1 Slack</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to Project Settings → Integrations</li>
                <li>Click <strong className="text-white">"Connect Slack"</strong></li>
                <li>Choose workspace and channel via OAuth</li>
                <li>Configure notification rules</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.2 Discord</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to Project Settings → Integrations</li>
                <li>Click <strong className="text-white">"Connect Discord"</strong></li>
                <li>Paste your Discord webhook URL</li>
                <li>Configure notification rules</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.3 Email Notifications</h3>
              <p className="text-slate-300">Available on all plans. Go to Account Settings → Notifications for daily digest, error alerts, and plan limit warnings.</p>
            </Section>

            <Section id="teams" title="Teams">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.1 Create a Team</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to Account → Teams</li>
                <li>Click <strong className="text-white">"Create Team"</strong></li>
                <li>Name your team</li>
                <li>You're now the Owner</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.2 Invite Members</h3>
              <p className="text-slate-300">Admins can invite by email. Choose role: Admin (can invite/remove) or Member (view and replay only).</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.3 Shared Projects</h3>
              <p className="text-slate-300">Any project owned by the team is visible to all members in real time.</p>
            </Section>

            <Section id="billing" title="Billing & Plans">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 border border-slate-700 rounded-lg">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Feature</th>
                      <th className="px-4 py-3">Free</th>
                      <th className="px-4 py-3">Pro ($19/mo)</th>
                      <th className="px-4 py-3">Team ($49/mo)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="px-4 py-3">Projects</td><td className="px-4 py-3">3</td><td className="px-4 py-3">Unlimited</td><td className="px-4 py-3">Unlimited</td></tr>
                    <tr><td className="px-4 py-3">Webhooks/Month</td><td className="px-4 py-3">500</td><td className="px-4 py-3">10,000</td><td className="px-4 py-3">10,000+</td></tr>
                    <tr><td className="px-4 py-3">Retention</td><td className="px-4 py-3">7 days</td><td className="px-4 py-3">90 days</td><td className="px-4 py-3">90 days</td></tr>
                    <tr><td className="px-4 py-3">Replay</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">✅</td><td className="px-4 py-3 text-emerald-400">✅</td></tr>
                    <tr><td className="px-4 py-3">Custom Domain</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">✅</td><td className="px-4 py-3 text-emerald-400">✅</td></tr>
                    <tr><td className="px-4 py-3">Integrations</td><td className="px-4 py-3">Email</td><td className="px-4 py-3">Slack + Discord</td><td className="px-4 py-3">Slack + Discord</td></tr>
                    <tr><td className="px-4 py-3">Team Members</td><td className="px-4 py-3">1</td><td className="px-4 py-3">1</td><td className="px-4 py-3">Unlimited</td></tr>
                    <tr><td className="px-4 py-3">Export</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">JSON/CSV</td><td className="px-4 py-3 text-emerald-400">JSON/CSV</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.2 Upgrade</h3>
              <p className="text-slate-300">Go to Dashboard → Billing. Click "Upgrade to Pro" or "Upgrade to Team". You'll be redirected to Stripe Checkout. Instant activation.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.3 Manage Billing</h3>
              <p className="text-slate-300">Click "Manage Billing" to open Stripe Customer Portal for invoices, payment methods, and cancellation.</p>
            </Section>

            <Section id="api" title="API Reference">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.1 Authentication</h3>
              <p className="text-slate-300 mb-3">All API requests (except /hook/:slug) require a Bearer token:</p>
              <CodeBlock code={`curl https://api.hookswing.com/api/projects \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.2 Public Hook Endpoint</h3>
              <CodeBlock code={`ANY https://api.hookswing.com/hook/:slug

# Accepts any HTTP method
# Accepts any headers
# Accepts body up to 1MB
# Returns 200 OK immediately
# No authentication required`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.3 Projects</h3>
              <p className="text-slate-300 font-semibold mt-4">List Projects</p>
              <CodeBlock code={`GET /api/projects`} />
              <p className="text-slate-300 font-semibold mt-4">Create Project</p>
              <CodeBlock code={`POST /api/projects
Content-Type: application/json

{
  "name": "My Project",
  "description": "Optional description"
}`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.4 Webhooks</h3>
              <p className="text-slate-300 font-semibold mt-4">List Webhooks</p>
              <CodeBlock code={`GET /api/projects/:projectId/webhooks?page=1&limit=50&method=POST`} />
              <p className="text-slate-300 font-semibold mt-4">Replay Webhook</p>
              <CodeBlock code={`POST /api/webhooks/:id/replay
Content-Type: application/json

{
  "targetUrl": "http://localhost:3000/webhook",
  "headers": {},
  "body": {}
}`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.5 Rate Limits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 border border-slate-700 rounded-lg">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr><th className="px-4 py-3">Endpoint</th><th className="px-4 py-3">Limit</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="px-4 py-3 font-mono">/hook/:slug</td><td className="px-4 py-3">100 req/min per IP</td></tr>
                    <tr><td className="px-4 py-3 font-mono">/api/auth/*</td><td className="px-4 py-3">10 req/min per IP</td></tr>
                    <tr><td className="px-4 py-3 font-mono">/api/*</td><td className="px-4 py-3">100 req/min per user</td></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="troubleshooting" title="Troubleshooting">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">"My webhooks aren't showing up"</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Is the slug correct? Copy it fresh from the dashboard.</li>
                <li>Test with curl first:</li>
              </ol>
              <CodeBlock code={`curl -X POST https://api.hookswing.com/hook/YOUR_SLUG -d '{"test": true}'`} />
              <ol className="list-decimal list-inside space-y-2 text-slate-300 mt-3" start={3}>
                <li>Check usage bar in project settings.</li>
                <li>We always return 200, so sender retries shouldn't be an issue.</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">"CLI says 'Authentication failed'"</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Run <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">hookswing logout</code> then <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">hookswing login</code></li>
                <li>Check that your account is verified</li>
                <li>If you changed your password, re-login in CLI</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">"CLI forward shows 'Connection refused'"</h3>
              <p className="text-slate-300">Your local server isn't running on the URL you specified.</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 mt-2">
                <li>Verify: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">curl http://localhost:3000/webhook</code></li>
                <li>Check the port — maybe it's 3001?</li>
                <li>If using Docker, use <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">host.docker.internal</code></li>
              </ol>
            </Section>

            <Section id="faq" title="FAQ">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Is HookSwing free?</h4>
                  <p className="text-slate-300">Yes, we have a generous free plan: 3 projects, 500 webhooks/month, 7-day retention. No credit card required.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Do you modify or inspect my webhook payloads?</h4>
                  <p className="text-slate-300">No. We store them as-is for your viewing. We don't read, analyze, or sell your data.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Can I use HookSwing in production?</h4>
                  <p className="text-slate-300">Yes, but we recommend it primarily for development, staging, and debugging.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Do you verify webhook signatures?</h4>
                  <p className="text-slate-300">No. We are payload-agnostic. Signature verification is your application's responsibility.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">How do I delete my account?</h4>
                  <p className="text-slate-300">Go to Account Settings → Danger Zone → "Delete Account". This permanently deletes all your data.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Can I self-host?</h4>
                  <p className="text-slate-300">Not yet. We are a managed SaaS. A self-hosted Docker version is planned for Enterprise customers.</p>
                </div>
              </div>
            </Section>

            <div className="mt-16 pt-8 border-t border-slate-800 text-center">
              <p className="text-slate-400">Need help? Email us at <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a></p>
              <p className="text-slate-500 text-sm mt-2">Last updated: May 2026</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
