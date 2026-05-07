import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Laptop, GitCompare, SatelliteDish, Search, Repeat,
  Terminal, Users, MessageSquare, Check, ChevronDown, ChevronUp,
  Menu, X, Github, Twitter, Globe
} from 'lucide-react';
import Logo from '../components/Logo';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-xl font-bold text-white">HookSwing</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <Link to="/docs" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Docs</Link>
            <a href="#cli" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">CLI</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors">Log In</Link>
            <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Sign Up Free</Link>
          </div>

          <button className="md:hidden text-slate-300" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">Features</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">Pricing</a>
            <Link to="/docs" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">Docs</Link>
            <a href="#cli" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">CLI</a>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <Link to="/login" className="text-slate-300 hover:text-white py-2 text-center">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg text-center font-semibold">Sign Up Free</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 animate-fade-in">
          The Webhook Inbox That<br className="hidden sm:block" /> Doesn't Delete Your Evidence
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Catch, inspect, and replay any HTTP webhook in real time.
          No more lost payloads. No more ngrok nightmares. No more guessing what Stripe actually sent you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate('/register')} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:scale-[1.02]">
            Start Catching Free
          </button>
          <a href="#how-it-works" className="w-full sm:w-auto border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 px-8 py-3 rounded-lg font-medium transition-all">
            View Demo
          </a>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs text-slate-400 font-mono">hookswing forward abc123 http://localhost:3000/webhook</span>
            </div>
            <div className="p-6 font-mono text-sm text-left space-y-2">
              <div className="text-slate-400">🪝 HookSwing Forwarder</div>
              <div className="text-slate-400">   Project: My SaaS (abc123)</div>
              <div className="text-slate-400">   Target:  http://localhost:3000/webhook</div>
              <div className="text-slate-500 mt-4">   [Press Ctrl+C to stop]</div>
              <div className="mt-4 space-y-1">
                <div className="text-emerald-400">[03:17:42] POST  200  1.2KB  45ms  stripe:invoice.payment_succeeded</div>
                <div className="text-red-400">[03:18:15] POST  500  0.8KB  12ms  github:push  ⚠️ Server Error</div>
                <div className="text-emerald-400">[03:20:01] POST  200  2.4KB  89ms  custom:paygate_callback</div>
              </div>
              <div className="text-slate-500 mt-4">Requests: 3  │  Success: 2  │  Failed: 1</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoBar() {
  const logos = [
    { name: 'Stripe', icon: <div className="w-6 h-6 rounded-full bg-slate-600" /> },
    { name: 'GitHub', icon: <Github className="w-6 h-6" /> },
    { name: 'Twilio', icon: <MessageSquare className="w-6 h-6" /> },
    { name: 'Vercel', icon: <Globe className="w-6 h-6" /> },
    { name: 'Railway', icon: <Terminal className="w-6 h-6" /> },
  ];

  return (
    <section className="py-12 border-y border-slate-800 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-slate-500 mb-8 uppercase tracking-wider">Trusted by developers shipping at</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logos.map((logo) => (
            <div key={logo.name} className="flex items-center gap-2 text-slate-500 opacity-50 hover:opacity-100 transition-opacity">
              {logo.icon}
              <span className="font-semibold">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const cards = [
    {
      icon: <Trash2 className="w-8 h-8 text-red-400" />,
      title: 'The payload disappeared',
      body: 'You used a free bin to test Stripe webhooks. You went to bed. You woke up. The request is gone. Now you\'re debugging blind.',
    },
    {
      icon: <Laptop className="w-8 h-8 text-amber-400" />,
      title: 'ngrok + console.log = chaos',
      body: 'You tunnel localhost, add a temporary route, paste JSON into Postman, and pray your laptop doesn\'t sleep. This is not a workflow. This is suffering.',
    },
    {
      icon: <GitCompare className="w-8 h-8 text-blue-400" />,
      title: 'No history, no comparison',
      body: 'Stripe updated their object shape last Tuesday. Your integration broke Wednesday. You have no record of what the old payload looked like. Good luck.',
    },
  ];

  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">You know the feeling.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div key={card.title} className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-slate-600 transition-colors">
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-slate-400 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-lg font-semibold text-white mt-12">
          You need a permanent, replayable inbox for your webhooks.
        </p>
      </div>
    </section>
  );
}

function SolutionSection() {
  const features = [
    {
      icon: <SatelliteDish className="w-10 h-10 text-emerald-400" />,
      title: 'Catch Everything',
      body: 'Get a unique public URL in one click. Accept any HTTP method. Store headers, body, query params, and IP. All in real time.',
    },
    {
      icon: <Search className="w-10 h-10 text-blue-400" />,
      title: 'Inspect Like a Pro',
      body: 'Syntax-highlighted JSON viewer. Headers table. Query param breakdown. Search by body text, filter by status, sort by time. Dark mode included — obviously.',
    },
    {
      icon: <Repeat className="w-10 h-10 text-purple-400" />,
      title: 'Replay & Debug',
      body: 'Click any past webhook. Edit the target URL. Modify the payload. Hit replay. Watch it hit your local server with the exact same data. Fix bugs without waiting for the next real event.',
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">One URL. Infinite Power.</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-2xl mb-6 border border-slate-700">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
              <p className="text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeepDiveSection() {
  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">Built for Developers, Not Committees</h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="order-2 lg:order-1">
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden font-mono text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="p-4 space-y-1 text-slate-300">
                <div><span className="text-emerald-400">$</span> npm install -g hookswing-cli</div>
                <div className="text-slate-500">+ hookswing-cli@1.2.0</div>
                <div className="pt-2"><span className="text-emerald-400">$</span> hookswing forward abc123 http://localhost:3000/webhook</div>
                <div className="text-slate-500 pt-1">Connected. Forwarding webhooks...</div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-2xl font-bold text-white mb-4">Forward to localhost without ngrok</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Install our open-source CLI. Run one command. Every webhook that hits your public URL is instantly forwarded to your local server. See status codes, response times, and errors — all in your terminal.
            </p>
            <Link to="/docs" className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1">
              View CLI Docs →
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Share the pain with your team</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Create a team workspace. Share projects. Comment on specific webhooks. ('This one caused the double-charge bug.') Export logs for compliance. Your backend team and your frontend team finally speak the same language.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">M</div>
              <div>
                <div className="text-white font-semibold">Mike</div>
                <div className="text-slate-500 text-sm">Engineering Lead</div>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4">"Our team was sharing ngrok URLs in Slack like cavemen. Now we have one shared project in HookSwing. Everyone sees the same webhooks. No more chaos."</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="w-4 h-4" />
              <span>Team Plan — 8 members</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 flex items-center justify-center gap-6">
            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-500/30">
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <Globe className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-2xl font-bold text-white mb-4">Get pinged when it matters</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              Connect Slack or Discord. Get notified the moment a webhook arrives — or when your local server returns a 500. No more refreshing the dashboard like a maniac.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create a project',
      body: 'Sign up. Click "New Project". We give you a unique URL: https://api.hookswing.com/hook/abc123',
    },
    {
      num: '02',
      title: 'Paste it anywhere',
      body: 'Drop that URL into Stripe, GitHub, PayPal, your payment gateway, or any service that sends webhooks. They all work. We catch everything.',
    },
    {
      num: '03',
      title: 'Debug on your terms',
      body: 'See the payload in real time. Replay it against localhost. Fix your code. Ship. Sleep.',
    },
  ];

  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">From Zero to Debug in 30 Seconds</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-bold text-lg mb-6">
                {step.num}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button onClick={() => navigate('/register')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]">
            Start Catching Free — No credit card required
          </button>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      badge: 'For side projects',
      price: '$0',
      period: 'forever',
      features: ['3 projects', '500 webhooks/month', '7-day history', 'Basic inspection', 'CLI forwarding', 'Email support'],
      cta: 'Sign Up Free',
      featured: false,
    },
    {
      name: 'Pro',
      badge: 'For serious developers',
      price: yearly ? '$190' : '$19',
      period: yearly ? '/year' : '/month',
      features: ['Unlimited projects', '10,000 webhooks/month', '90-day history', 'Replay (web + CLI)', 'Custom subdomains', 'Slack & Discord alerts', 'Request diff/comparison', 'Export JSON/CSV'],
      cta: 'Start Pro Trial',
      featured: true,
    },
    {
      name: 'Team',
      badge: 'For engineering teams',
      price: yearly ? '$490' : '$49',
      period: yearly ? '/year' : '/month',
      features: ['Everything in Pro', 'Unlimited team members', 'Shared workspaces', 'Team activity log', 'Annotate & comment', 'Priority support'],
      cta: 'Start Team Trial',
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">Simple Pricing. No Surprises.</h2>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!yearly ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative w-12 h-6 bg-slate-700 rounded-full transition-colors"
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm ${yearly ? 'text-white' : 'text-slate-500'}`}>Yearly <span className="text-emerald-400">(save 2 months)</span></span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-8 border ${
                plan.featured
                  ? 'bg-slate-800 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="text-sm text-slate-400 mb-2">{plan.badge}</div>
              <div className="text-3xl font-bold text-white mb-1">{plan.price}</div>
              <div className="text-sm text-slate-500 mb-6">{plan.period}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] ${
                  plan.featured
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500 mt-8">
          All plans include SSL, API access, and dark mode. Upgrade or downgrade anytime.
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      text: 'I was using webhook.site for 2 years. I lost a critical Stripe payload during a production incident. Switched to HookSwing that day. Never looked back.',
      author: 'Alex',
      role: 'Backend Engineer at SaaS Startup',
    },
    {
      text: 'The replay feature alone is worth $19. I can take a webhook from last week, modify the amount field, and replay it against my dev server. Game changer.',
      author: 'Sarah',
      role: 'Full-Stack Developer',
    },
    {
      text: 'Our team was sharing ngrok URLs in Slack like cavemen. Now we have one shared project in HookSwing. Everyone sees the same webhooks. No more chaos.',
      author: 'Mike',
      role: 'Engineering Lead',
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">Developers Actually Like This</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {quotes.map((q) => (
            <div key={q.author} className="bg-slate-800 rounded-xl p-8 border border-slate-700">
              <p className="text-slate-300 italic mb-6 leading-relaxed">"{q.text}"</p>
              <div>
                <div className="text-white font-semibold">— {q.author}</div>
                <div className="text-slate-500 text-sm">{q.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: 'Is there a free plan?', a: 'Yes. 3 projects, 500 webhooks per month, 7-day retention. No credit card required. Upgrade when you need more.' },
    { q: 'Do you store my webhook payloads forever?', a: 'No. Free = 7 days. Pro = 90 days. After that, we delete them. If you need longer retention, contact us for Enterprise.' },
    { q: 'Can I self-host HookSwing?', a: 'Not yet. We are a managed SaaS. Self-hosted version is on the roadmap for Enterprise customers.' },
    { q: 'Does it work with Stripe, GitHub, PayPal, Twilio?', a: 'Yes. Any service that sends HTTP webhooks works. We are payload-agnostic. We don\'t verify signatures — that\'s your code\'s job.' },
    { q: 'Is the CLI open source?', a: 'Yes. The CLI is MIT-licensed and on GitHub. The backend is proprietary. The CLI is free forever.' },
    { q: 'What happens if I exceed my plan\'s webhook limit?', a: 'We still catch the webhook and return 200 to the sender (so they don\'t retry and spam you). But we drop the payload storage and notify you to upgrade. No surprise charges.' },
  ];

  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">Questions? Answers.</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-white">{faq.q}</span>
                {openIndex === i ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 text-slate-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Stop Debugging in the Dark</h2>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
          Join 500+ developers who stopped losing webhooks. Start free. Upgrade when you're ready.
        </p>
        <button onClick={() => navigate('/register')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-[1.02]">
          Start Catching Free — No credit card required
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Changelog</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Roadmap</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Status Page</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">CLI Reference</Link></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">API Reference</Link></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Blog</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Community</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">About</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Careers</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Brand Assets</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Cookie Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">GDPR</span></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Logo className="w-6 h-6" />
            <span className="text-sm text-slate-500">© 2026 HookSwing. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Hero />
      <LogoBar />
      <ProblemSection />
      <SolutionSection />
      <DeepDiveSection />
      <HowItWorks />
      <PricingSection />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
