import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Copy, Check } from 'lucide-react';
import Logo from '../components/Logo';
import SEO from '../components/seo/SEO';
import { useTranslation } from '../i18n';

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

function Sidebar({ active, sections }: { active: string; sections: { id: string; label: string }[] }) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20">
        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => handleClick(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
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
  const { t } = useTranslation();
  const sections = [
    { id: 'quick-start', label: t('docs.quickStart') },
    { id: 'dashboard', label: t('docs.dashboardGuide') },
    { id: 'tester', label: t('docs.webhookTester') },
    { id: 'cli', label: t('docs.cliReference') },
    { id: 'web-cli', label: t('docs.webCli') },
    { id: 'integrations', label: t('docs.integrations') },
    { id: 'teams', label: t('docs.teams') },
    { id: 'billing', label: t('docs.billingPlans') },
    { id: 'security', label: t('docs.security') },
    { id: 'hookshield', label: t('docs.hookshield') },
    { id: 'api', label: t('docs.apiReference') },
    { id: 'troubleshooting', label: t('docs.troubleshooting') },
    { id: 'faq', label: t('docs.faq') },
  ];
  const [activeSection, setActiveSection] = useState('quick-start');
  const mainRef = useRef<HTMLElement>(null);

  // Scroll spy: update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <SEO
        title="HookSwing Documentation — Webhook Testing & Debugging Guide"
        description="Complete documentation for HookSwing. Learn how to catch, inspect, replay, and forward webhooks. Covers Stripe, GitHub, PayPal, Twilio, and more."
        keywords="webhook documentation, how to debug webhooks, webhook testing guide, HookSwing docs"
        canonical="https://hookswing.com/docs"
      />
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">HookSwing</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/docs" className="text-emerald-400 font-medium text-sm">{t("landing.nav.docs")}</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm">{t("landing.nav.login")}</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold">{t("landing.nav.signup")}</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          <Sidebar active={activeSection} sections={sections} />

          <main ref={mainRef} className="flex-1 min-w-0">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">{t("docs.title")}</h1>
              <p className="text-slate-400 text-lg">{t('docs.subtitle')}</p>
            </div>

            <Section id="quick-start" title="Quick Start">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.1 Sign Up</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to <Link to="/" className="text-emerald-400 hover:underline">hookswing.com</Link></li>
                <li>Click <strong className="text-white">"Start Catching Free"</strong></li>
                <li>Enter your email and password</li>
                <li>Verify your email with the 6-digit code we send you</li>
                <li>You land on the Dashboard</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.2 Create Your First Project</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Click <strong className="text-white">"New Project"</strong> in the sidebar</li>
                <li>Name it: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">My First Project</code></li>
                <li>We auto-generate your unique webhook URL</li>
              </ol>
              <CodeBlock code={`https://hookswing.com/hook/abc123def456`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.3 Custom Subdomain (Pro/Team)</h3>
              <p className="text-slate-300 mb-3">On Pro or Team plans, you can set a custom slug for a cleaner URL:</p>
              <CodeBlock code={`https://hookswing.com/hook/my-company`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.4 Send a Test Webhook</h3>
              <p className="text-slate-300 mb-3">Using curl:</p>
              <CodeBlock code={`curl -X POST https://hookswing.com/hook/abc123def456 \\
  -H "Content-Type: application/json" \\
  -d '{"test": true, "message": "hello world"}'`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">1.5 See It Live</h3>
              <p className="text-slate-300">Switch back to the Dashboard. Your webhook appears instantly in the feed. Click it to expand and see method, headers, body, timestamp, and source IP.</p>
              <p className="emerald-400 font-semibold mt-4">Time to complete: ~2 minutes.</p>
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

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.4 Compare Webhooks</h3>
              <p className="text-slate-300 mb-2"><span className="text-amber-400 font-medium">Available on: Pro and Team plans.</span></p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Click the <strong className="text-white">"Compare"</strong> button in the feed header</li>
                <li>Select any 2 webhooks</li>
                <li>See a side-by-side diff of headers and body</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.5 Project Settings</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Rename project</li>
                <li>Set custom slug (Pro/Team) — changes webhook URL to <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">/hook/your-slug</code></li>
                <li>Delete project (permanent — webhooks are disassociated, not deleted)</li>
                <li>Alerts — connect Slack, Discord, or Telegram</li>
                <li>Export webhooks as JSON</li>
                <li>Webhook Tester — send test payloads from real providers</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.6 Webhook Tester</h3>
              <p className="text-slate-300">Navigate to <strong className="text-white">/dashboard/tester</strong> or click <strong className="text-white">"Tester"</strong> in the sidebar. Select a provider (Stripe, GitHub, etc.), pick an event type, enter your target URL, and send a realistic test payload. Perfect for testing your handler before going live.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">2.7 Collapsible Project Header</h3>
              <p className="text-slate-300">The project card above the webhook feed can be collapsed to give you more screen space. Click the chevron icon next to the webhook count.</p>
            </Section>

            <Section id="tester" title="Webhook Tester">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.1 What is the Webhook Tester?</h3>
              <p className="text-slate-300">The built-in Webhook Tester lets you send realistic test payloads from 16+ well-known providers to any URL — without setting up the actual integration. Perfect for testing your webhook handler before going live.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.2 Using the Dashboard Tester</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Navigate to <strong className="text-white">/dashboard/tester</strong> or click <strong className="text-white">"Tester"</strong> in the sidebar</li>
                <li>Select a provider (Stripe, GitHub, Shopify, etc.)</li>
                <li>Select an event type</li>
                <li>Enter your target URL</li>
                <li>Click <strong className="text-white">"Send Test Payload"</strong></li>
                <li>Inspect the response instantly</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.3 Supported Providers</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-300">
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">Stripe</p>
                  <p className="text-slate-500 text-xs">invoice.payment_succeeded, customer.created, charge.succeeded, subscription.created, payment_intent.succeeded</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">GitHub</p>
                  <p className="text-slate-500 text-xs">push, pull_request, issues, star, release</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">PayPal</p>
                  <p className="text-slate-500 text-xs">PAYMENT.CAPTURE.COMPLETED, BILLING.SUBSCRIPTION.CREATED</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">Shopify</p>
                  <p className="text-slate-500 text-xs">orders/create, products/create</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">Twilio</p>
                  <p className="text-slate-500 text-xs">incoming.sms, call.status</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">Slack</p>
                  <p className="text-slate-500 text-xs">slash_command, interactive_message</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">Discord</p>
                  <p className="text-slate-500 text-xs">interaction (slash command)</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="font-semibold text-white">Zoom, Calendly, Typeform, Google, Square, SendGrid, Mailgun, Microsoft Teams, Generic</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.4 Custom Payloads</h3>
              <p className="text-slate-300">Enable "Edit payload before sending" to modify the JSON body before the request is sent. This is useful for edge-case testing.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">3.5 Source Identification</h3>
              <p className="text-slate-300">When you send a test payload to a HookSwing URL, the source is automatically identified. Instead of seeing "custom" in your feed, you'll see <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">stripe</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">github</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">shopify</code>, etc.</p>
            </Section>

            <Section id="cli" title="CLI Reference">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.1 Installation</h3>
              <CodeBlock code={`npm install -g hookswing

hookswing --version
# Expected: 1.x.x`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.2 Login</h3>
              <CodeBlock code={`hookswing login

# Or login with GitHub (opens browser automatically)
hookswing login --github

# Token stored in ~/.hookswing/config.json

hookswing logout
# Removes config file`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.3 Forward Webhooks to Localhost</h3>
              <p className="text-slate-300 mb-2">You can type just the port number, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">localhost:port</code>, or the full URL. Any port works.</p>
              <CodeBlock code={`# Just the port — easiest
hookswing forward abc123def456 3000

# Or localhost:port
hookswing forward abc123def456 localhost:3000

# Or the full URL
hookswing forward abc123def456 http://localhost:3000

# Custom slug works too
hookswing forward my-company 8080`} />
              <p className="text-slate-300 mt-3">Output:</p>
              <CodeBlock code={`  _    _               ____                  _     
 | |  | |             / ___| _   _ ___  __ _| |    
 | |__| | _____      _\\___ \\| | | / __|/ _\` | |    
 |  __  |/ _ \\ \\ /\\ / /___) | |_| \\__ \\ (_| | |    
 | |  | | (_) \\ V  V //___ \\>  _ <| |_) \\__,_| |    
 |_|  |_|\\___/ \\_/\\_/ \\____/_| \\_\\ .__/ \\__, |_|    
                                 |_|    |___/      

  Target: http://localhost:3000
  Project: My SaaS (abc123def456)

  Session: 00:12:34  |  Requests: 8 / 100 ████████░░

  [Press Ctrl+C to stop]

[03:17:42] POST   /api/webhook       200   (stripe)
[03:18:15] POST   /api/webhook       500   (github)  ⚠️ Server Error`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.4 Send Test Payloads</h3>
              <p className="text-slate-300 mb-2">Port shorthand works here too — <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">3000</code> becomes <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">http://localhost:3000</code> automatically.</p>
              <CodeBlock code={`hookswing test stripe invoice.payment_succeeded 3000
# → 200 OK in 245ms — source: stripe

hookswing test github push localhost:3000/webhook
# → 200 OK in 12ms — source: github

hookswing test shopify orders/create https://your-app.com/webhook
# → 201 Created in 89ms — source: shopify`} />
              <p className="text-slate-300 mt-3">Supported providers: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">stripe</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">github</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">paypal</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">shopify</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">twilio</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">slack</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">discord</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">microsoft_teams</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">sendgrid</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">mailgun</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">zoom</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">calendly</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">typeform</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">google</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">square</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">generic</code></p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.5 List Projects</h3>
              <CodeBlock code={`hookswing list`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.6 Replay from CLI</h3>
              <p className="text-slate-300 mb-2"><span className="text-amber-400 font-medium">Available on: Pro and Team plans.</span></p>
              <CodeBlock code={`hookswing replay wh_123abc456 3000
# or
hookswing replay wh_123abc456 http://localhost:3000/webhook`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">4.7 Update CLI</h3>
              <CodeBlock code={`npm update -g hookswing`} />
            </Section>

            <Section id="web-cli" title="Web CLI">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.1 What is the Web CLI?</h3>
              <p className="text-slate-300">A browser-based terminal built into your dashboard. No installation required. Run the same <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">hookswing</code> commands directly from your browser — perfect for quick checks, locked-down machines, or when you don't want to install Node.js.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.2 Access It</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Log in to your dashboard</li>
                <li>Navigate to <strong className="text-white">/dashboard/cli</strong></li>
                <li>Or click <strong className="text-white">"CLI"</strong> in the sidebar</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.3 Available Commands</h3>
              <p className="text-slate-300">All commands from the npm CLI work in the Web CLI:</p>
              <CodeBlock code={`hookswing list
hookswing forward <slug> <target-url>
hookswing webhooks <slug> --limit 20
hookswing replay <webhook-id> <target-url>
hookswing tester <provider> <event-type> <target-url>`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.4 Features</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong className="text-white">HookSwing logo</strong> — Small emerald icon in the header</li>
                <li><strong className="text-white">Colored output</strong> — Method and status code colors match the npm CLI</li>
                <li><strong className="text-white">Session timer</strong> — Live elapsed time since forward/listen started</li>
                <li><strong className="text-white">Usage bar</strong> — Live request count vs plan limit with progress bar</li>
                <li><strong className="text-white">Path preservation</strong> — Original request paths forwarded correctly</li>
                <li><strong className="text-white">Auto-reconnect</strong> — Reconnects automatically on network blips</li>
              </ul>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">5.5 Authentication</h3>
              <p className="text-slate-300">The Web CLI uses your existing dashboard session — no separate login required. Commands run with your user permissions.</p>
            </Section>

            <Section id="integrations" title="Integrations">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.1 Slack</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to your project page</li>
                <li>Find the <strong className="text-white">Alerts</strong> section in the project header</li>
                <li>Click <strong className="text-white">"Add Alert"</strong></li>
                <li>Select <strong className="text-white">Slack</strong> and paste your webhook URL</li>
                <li>Toggle on/off anytime</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.2 Discord</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to your project page → Alerts section</li>
                <li>Click <strong className="text-white">"Add Alert"</strong></li>
                <li>Select <strong className="text-white">Discord</strong> and paste your webhook URL</li>
                <li>Toggle on/off anytime</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">6.3 Telegram</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to your project page → Alerts section</li>
                <li>Click <strong className="text-white">"Add Alert"</strong></li>
                <li>Select <strong className="text-white">Telegram</strong></li>
                <li>Enter your Bot Token and Chat ID</li>
                <li>Toggle on/off anytime</li>
              </ol>
              <p className="text-slate-300 mt-2"><span className="text-amber-400 font-medium">Available on: Pro and Team plans.</span></p>
            </Section>

            <Section id="teams" title="Teams">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.1 Create a Team</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to Account → Teams</li>
                <li>Click <strong className="text-white">"Create Team"</strong></li>
                <li>Name your team</li>
                <li>You're now the Owner</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.2 Invite Members</h3>
              <p className="text-slate-300">Admins can invite by email. Choose role: <strong className="text-white">Admin</strong> (can invite/remove/manage alerts) or <strong className="text-white">Member</strong> (view, replay, and comment).</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.3 Shared Projects</h3>
              <p className="text-slate-300">Any project owned by the team is visible to all members in real time. Free users invited to a team project get full TEAM privileges on that project — unlimited history, replay, alerts, and exports.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">7.4 Activity Log</h3>
              <p className="text-slate-300">Team plans include an activity log showing who created projects, added alerts, deleted webhooks, and changed settings.</p>
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
                    <tr><td className="px-4 py-3">Webhooks/Month</td><td className="px-4 py-3">500</td><td className="px-4 py-3">10,000</td><td className="px-4 py-3">10,000</td></tr>
                    <tr><td className="px-4 py-3">Retention</td><td className="px-4 py-3">7 days</td><td className="px-4 py-3">90 days</td><td className="px-4 py-3">Unlimited</td></tr>
                    <tr><td className="px-4 py-3">Replay</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">✅</td><td className="px-4 py-3 text-emerald-400">✅</td></tr>
                    <tr><td className="px-4 py-3">Compare/Diff</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">✅</td><td className="px-4 py-3 text-emerald-400">✅</td></tr>
                    <tr><td className="px-4 py-3">Custom Slug</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">✅</td><td className="px-4 py-3 text-emerald-400">✅</td></tr>
                    <tr><td className="px-4 py-3">Alerts</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">Slack + Discord</td><td className="px-4 py-3 text-emerald-400">Slack + Discord + Telegram</td></tr>
                    <tr><td className="px-4 py-3">Team Members</td><td className="px-4 py-3">1</td><td className="px-4 py-3">1</td><td className="px-4 py-3">Unlimited</td></tr>
                    <tr><td className="px-4 py-3">Export</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">JSON</td><td className="px-4 py-3 text-emerald-400">JSON</td></tr>
                    <tr><td className="px-4 py-3">Activity Log</td><td className="px-4 py-3">❌</td><td className="px-4 py-3">❌</td><td className="px-4 py-3 text-emerald-400">✅</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">8.1 Upgrade</h3>
              <p className="text-slate-300">Go to Dashboard → Billing. Click "Upgrade to Pro" or "Upgrade to Team". You'll be redirected to Stripe Checkout. Instant activation.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">8.2 Manage Billing</h3>
              <p className="text-slate-300">Click "Manage Billing" to open Stripe Customer Portal for invoices, payment methods, and cancellation.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">8.3 Plan Inheritance</h3>
              <p className="text-slate-300">Free users who are members of a Team project automatically get TEAM-level privileges on that project — unlimited history, replay, alerts, and exports. Your personal projects still follow your own plan limits.</p>
            </Section>

            <Section id="security" title="Security">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">9.1 Email Verification</h3>
              <p className="text-slate-300">All accounts require email verification before login. After registering, you'll receive a 6-digit OTP valid for 15 minutes. You can resend the code if needed.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">9.2 Two-Factor Authentication (2FA)</h3>
              <p className="text-slate-300 mb-3">Add an extra layer of security with TOTP-based 2FA:</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to Account Settings → Security</li>
                <li>Click <strong className="text-white">"Enable 2FA"</strong></li>
                <li>Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Enter the 6-digit code to verify</li>
                <li>Save your 10 backup codes — they won't be shown again</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">9.3 Password Reset</h3>
              <p className="text-slate-300">If you forget your password, click "Forgot password?" on the login page. We'll send a reset link to your email valid for 1 hour.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">9.4 Session Management</h3>
              <p className="text-slate-300">Changing your password invalidates all existing sessions. 2FA disable requires both your password and a valid 2FA code.</p>
            </Section>

            <Section id="hookshield" title={t('docs.hookshieldTitle')}>
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">What is HookShield?</h3>
              <p className="text-slate-300">HookShield is a built-in webhook security scanner that tests your endpoint against real attack scenarios. It sends three test payloads to check whether your webhook handler properly verifies signatures, rejects invalid secrets, and refuses unsigned requests.</p>
              <p className="text-slate-300 mt-3">Inspired by a 2024 security research finding that <strong className="text-white">1,542 production apps accepted forged Stripe webhooks</strong> without any signature verification, HookShield exists so you know whether you are vulnerable <em>before</em> an attacker does.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Running Your First Scan</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Go to <strong className="text-white">Dashboard → HookShield</strong> (or visit <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">/dashboard/hookshield</code>)</li>
                <li>Enter your webhook endpoint URL</li>
                <li>Select your provider (Stripe, GitHub, PayPal, Shopify, Twilio, Slack, Discord, or Custom)</li>
                <li>Click <strong className="text-white">"Start Security Scan"</strong></li>
                <li>HookShield runs three tests asynchronously and updates the score in real time</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">The Three Tests</h3>
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-red-400 mb-2">Test A — No Signature</p>
                  <p className="text-sm text-slate-400">Sends a webhook with <strong className="text-white">no signature header</strong>. A secure server must reject this with a non-2xx status.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-amber-400 mb-2">Test B — Invalid Signature</p>
                  <p className="text-sm text-slate-400">Sends a webhook with a <strong className="text-white">signature that does not match</strong> the payload. A secure server must reject this.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <p className="font-semibold text-emerald-400 mb-2">Test C — Wrong Secret</p>
                  <p className="text-sm text-slate-400">Sends a webhook signed with a <strong className="text-white">different secret</strong>. A secure server must reject this.</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Understanding Your Security Score</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 border border-slate-700 rounded-lg">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr><th className="px-4 py-3">Score</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">What It Means</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="px-4 py-3 font-semibold text-emerald-400">90–100</td><td className="px-4 py-3">Secure</td><td className="px-4 py-3">All tests passed. Your endpoint properly rejects forged webhooks.</td></tr>
                    <tr><td className="px-4 py-3 font-semibold text-amber-400">70–89</td><td className="px-4 py-3">Mostly Safe</td><td className="px-4 py-3">Some tests passed. Review the failed test details.</td></tr>
                    <tr><td className="px-4 py-3 font-semibold text-red-400">0–69</td><td className="px-4 py-3">Vulnerable</td><td className="px-4 py-3">Critical weakness detected. Immediate action recommended.</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Fix Code Snippets</h3>
              <p className="text-slate-300 mb-3">If HookShield finds a vulnerability, it generates framework-specific fix code. Supported frameworks:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong className="text-white">Express.js</strong> (all plans)</li>
                <li><strong className="text-white">FastAPI</strong> (Pro & Team)</li>
                <li><strong className="text-white">Next.js</strong> (Pro & Team)</li>
                <li><strong className="text-white">Django</strong> (Pro & Team)</li>
              </ul>
              <p className="text-slate-300 mt-3"><span className="text-amber-400 font-medium">Free plan:</span> Express.js fix code only. <span className="text-emerald-400 font-medium">Pro & Team:</span> All frameworks.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">HookShield Verified Badge</h3>
              <p className="text-slate-300 mb-3">Scoring 90 or above unlocks a <strong className="text-white">HookShield Verified</strong> badge — a dynamic SVG you can embed in your README, docs, or landing page:</p>
              <CodeBlock code={`![HookShield Verified](https://hookswing.com/shield/scan_abc123.svg)`} />
              <p className="text-slate-300 mt-3">The badge color updates automatically based on your latest score: green (90+), yellow (70–89), red (&lt;70), or gray (incomplete).</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Scan Limits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 border border-slate-700 rounded-lg">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Scans/Month</th><th className="px-4 py-3">History</th><th className="px-4 py-3">Frameworks</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="px-4 py-3">Free</td><td className="px-4 py-3">5</td><td className="px-4 py-3">Last 3 scans</td><td className="px-4 py-3">Express only</td></tr>
                    <tr><td className="px-4 py-3">Pro ($19/mo)</td><td className="px-4 py-3">30</td><td className="px-4 py-3">90 days</td><td className="px-4 py-3">All frameworks</td></tr>
                    <tr><td className="px-4 py-3">Team ($49/mo)</td><td className="px-4 py-3">Unlimited</td><td className="px-4 py-3">Unlimited</td><td className="px-4 py-3">All frameworks</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-slate-300 mt-3">Usage resets on the 1st of each calendar month. Soft-deleting a scan hides it from history but still counts against your monthly limit.</p>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Export Report</h3>
              <p className="text-slate-300"><span className="text-amber-400 font-medium">Pro & Team only.</span> Click <strong className="text-white">"Export Report"</strong> on any completed scan to download a Markdown report with the full test results, security score, detected framework, and recommended fixes. Perfect for compliance documentation and security audits.</p>
            </Section>

            <Section id="api" title="API Reference">
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">10.1 Authentication</h3>
              <p className="text-slate-300 mb-3">All API requests (except /hook/:slug) require a Bearer token:</p>
              <CodeBlock code={`curl https://hookswing.com/api/projects \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">10.2 Public Hook Endpoint</h3>
              <CodeBlock code={`ANY https://hookswing.com/hook/:slug

# Accepts any HTTP method
# Accepts any headers
# Accepts body up to 1MB
# Returns 200 OK immediately
# No authentication required`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">10.3 Projects</h3>
              <p className="text-slate-300 font-semibold mt-4">List Projects</p>
              <CodeBlock code={`GET /api/projects`} />
              <p className="text-slate-300 font-semibold mt-4">Create Project</p>
              <CodeBlock code={`POST /api/projects
Content-Type: application/json

{
  "name": "My Project",
  "description": "Optional description"
}`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">10.4 Webhooks</h3>
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

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">10.5 Tester API</h3>
              <p className="text-slate-300 font-semibold mt-4">List Tester Providers</p>
              <CodeBlock code={`GET /api/tester/providers`} />
              <p className="text-slate-300 font-semibold mt-4">Send Test Payload</p>
              <CodeBlock code={`POST /api/tester/send
Content-Type: application/json

{
  "targetUrl": "https://hookswing.com/hook/abc123",
  "provider": "stripe",
  "eventType": "invoice.payment_succeeded",
  "customPayload": { /* optional */ }
}`} />

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">10.6 Rate Limits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300 border border-slate-700 rounded-lg">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr><th className="px-4 py-3">Endpoint</th><th className="px-4 py-3">Limit</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    <tr><td className="px-4 py-3 font-mono">/hook/:slug</td><td className="px-4 py-3">100 req/min per IP</td></tr>
                    <tr><td className="px-4 py-3 font-mono">/api/auth/*</td><td className="px-4 py-3">10 req/min per IP</td></tr>
                    <tr><td className="px-4 py-3 font-mono">/api/auth/send-verification</td><td className="px-4 py-3">5 req/min per IP</td></tr>
                    <tr><td className="px-4 py-3 font-mono">/api/*</td><td className="px-4 py-3">300 req/min per user</td></tr>
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
              <CodeBlock code={`curl -X POST https://hookswing.com/hook/YOUR_SLUG -d '{"test": true}'`} />
              <ol className="list-decimal list-inside space-y-2 text-slate-300 mt-3" start={3}>
                <li>Check usage bar in project settings.</li>
                <li>We always return 200, so sender retries shouldn't be an issue.</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">"CLI says 'Authentication failed'"</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Run <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">hookswing logout</code> then <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">hookswing login</code></li>
                <li>Check that your account email is verified</li>
                <li>If you changed your password, re-login in CLI</li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">"CLI forward shows 'Connection refused'"</h3>
              <p className="text-slate-300">Your local server isn't running on the URL you specified.</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 mt-2">
                <li>Verify: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">curl http://localhost:3000/webhook</code></li>
                <li>Check the port — maybe it's 3001?</li>
                <li>If using Docker, use <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">host.docker.internal</code></li>
              </ol>

              <h3 className="text-lg font-semibold text-white mt-6 mb-3">"I didn't receive my verification email"</h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300">
                <li>Check your spam/junk folder</li>
                <li>Wait 60 seconds and click "Resend code"</li>
                <li>Maximum 5 verification emails per hour</li>
                <li>If still nothing, contact support</li>
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
                <div>
                  <h4 className="font-semibold text-white mb-2">What happens when I delete a project?</h4>
                  <p className="text-slate-300">The project is deleted but its webhooks are disassociated (projectId set to null), not deleted. This preserves your webhook history while cleaning up your project list.</p>
                </div>
              </div>
            </Section>

            <div className="mt-16 pt-8 border-t border-slate-800 text-center">
              <p className="text-slate-400">Need help? Email us at <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a></p>
              <p className="text-slate-500 text-sm mt-2">Last updated: June 2026</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
