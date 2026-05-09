import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Laptop, GitCompare, SatelliteDish, Search, Repeat,
  Terminal, Users, MessageSquare, Check, ChevronDown, ChevronUp,
  Menu, X, Github, Globe, LayoutDashboard, LogOut, User, Zap,
  ArrowRight, Copy, MessagesSquare, Sparkles, Heart, ShieldCheck
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <a href="#features" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{t('landing.nav.features')}</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{t('landing.nav.pricing')}</a>
            <Link to="/docs" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{t('landing.nav.docs')}</Link>
            <a href="#cli" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">{t('landing.nav.cli')}</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  {t('landing.nav.dashboard')}
                </Link>
                <Link to="/dashboard/account" className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {t('landing.nav.account')}
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  {t('landing.nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors">{t('landing.nav.login')}</Link>
                <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">{t('landing.nav.signup')}</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-slate-300" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">{t('landing.nav.features')}</a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">{t('landing.nav.pricing')}</a>
            <Link to="/docs" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">{t('landing.nav.docs')}</Link>
            <a href="#cli" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2">{t('landing.nav.cli')}</a>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white py-2 text-center inline-flex items-center justify-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> {t('landing.nav.dashboard')}
                  </Link>
                  <Link to="/dashboard/account" onClick={() => setMobileOpen(false)} className="text-slate-300 hover:text-white py-2 text-center inline-flex items-center justify-center gap-1.5">
                    <User className="w-4 h-4" /> {t('landing.nav.account')}
                  </Link>
                  <button
                    onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                    className="text-slate-300 hover:text-white py-2 text-center inline-flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> {t('landing.nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-300 hover:text-white py-2 text-center">{t('landing.nav.login')}</Link>
                  <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg text-center font-semibold">{t('landing.nav.signup')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* What's New Banner */}
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs text-sky-300 font-medium">{t('landing.hero.badge')}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 animate-fade-in">
          {t('landing.hero.title')}
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('landing.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate(user ? '/dashboard' : '/register')} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all hover:scale-[1.02]">
            {user ? t('landing.hero.ctaDashboard') : t('landing.hero.ctaStart')}
          </button>
          <a href="#how-it-works" className="w-full sm:w-auto border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 px-8 py-3 rounded-lg font-medium transition-all">
            {t('landing.hero.viewDemo')}
          </a>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs text-slate-400 font-mono">hookswing forward project-1 3000</span>
            </div>
            <div className="p-6 font-mono text-sm text-left space-y-2">
              <div className="text-emerald-400 font-semibold">🪝 HookSwing Forwarder</div>
              <div className="text-slate-400">   Target:  http://localhost:3000</div>
              <div className="text-slate-400">   Project: My SaaS (project-1)</div>
              <div className="text-slate-500 mt-4">   [Press Ctrl+C to stop]</div>
              <div className="mt-4 space-y-1">
                <div><span className="text-slate-600">[03:17:42]</span> <span className="bg-sky-500/20 text-sky-400 px-1 rounded text-xs font-bold">POST</span> <span className="text-slate-400">/api/stripe/webhook</span> <span className="text-emerald-400">200</span> <span className="text-slate-600">(stripe:charge.succeeded)</span></div>
                <div><span className="text-slate-600">[03:18:15]</span> <span className="bg-sky-500/20 text-sky-400 px-1 rounded text-xs font-bold">POST</span> <span className="text-slate-400">/api/paypal/webhook</span> <span className="text-emerald-400">200</span> <span className="text-slate-600">(paypal:PAYMENT.CAPTURE.COMPLETED)</span></div>
                <div><span className="text-slate-600">[03:18:22]</span> <span className="bg-sky-500/20 text-sky-400 px-1 rounded text-xs font-bold">POST</span> <span className="text-slate-400">/api/stripe/webhook</span> <span className="text-emerald-400">200</span> <span className="text-slate-600">(stripe:invoice.payment_succeeded)</span></div>
                <div><span className="text-slate-600">[03:19:01]</span> <span className="bg-sky-500/20 text-sky-400 px-1 rounded text-xs font-bold">POST</span> <span className="text-slate-400">/api/paypal/webhook</span> <span className="text-emerald-400">200</span> <span className="text-slate-600">(paypal:BILLING.SUBSCRIPTION.CREATED)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoBar() {
  const integrations = [
    { name: 'Stripe' },
    { name: 'GitHub' },
    { name: 'PayPal' },
    { name: 'Shopify' },
    { name: 'Slack' },
    { name: 'Twilio' },
  ];
  const { t } = useTranslation();

  return (
    <section className="py-12 border-y border-slate-800 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-slate-500 mb-8 uppercase tracking-wider">{t('landing.logos')}</p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {integrations.map((item) => (
            <span key={item.name} className="text-slate-500 font-semibold opacity-60 hover:opacity-100 transition-opacity">
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const { t } = useTranslation();
  const cards = [
    {
      icon: <Trash2 className="w-8 h-8 text-red-400" />,
      title: t('landing.problem.card1Title'),
      body: t('landing.problem.card1Body'),
    },
    {
      icon: <Laptop className="w-8 h-8 text-amber-400" />,
      title: t('landing.problem.card2Title'),
      body: t('landing.problem.card2Body'),
    },
    {
      icon: <GitCompare className="w-8 h-8 text-blue-400" />,
      title: t('landing.problem.card3Title'),
      body: t('landing.problem.card3Body'),
    },
  ];

  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">{t('landing.problem.title')}</h2>
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
          {t('landing.problem.footer')}
        </p>
      </div>
    </section>
  );
}

function SolutionSection() {
  const { t } = useTranslation();
  const features = [
    {
      icon: <SatelliteDish className="w-10 h-10 text-emerald-400" />,
      title: t('landing.features.catch.title'),
      body: t('landing.features.catch.body'),
    },
    {
      icon: <Search className="w-10 h-10 text-blue-400" />,
      title: t('landing.features.inspect.title'),
      body: t('landing.features.inspect.body'),
    },
    {
      icon: <Repeat className="w-10 h-10 text-purple-400" />,
      title: t('landing.features.replay.title'),
      body: t('landing.features.replay.body'),
    },
    {
      icon: <GitCompare className="w-10 h-10 text-amber-400" />,
      title: t('landing.features.compare.title'),
      body: t('landing.features.compare.body'),
    },
    {
      icon: <Globe className="w-10 h-10 text-indigo-400" />,
      title: t('landing.features.custom.title'),
      body: t('landing.features.custom.body'),
    },
    {
      icon: <MessageSquare className="w-10 h-10 text-pink-400" />,
      title: t('landing.features.alerts.title'),
      body: t('landing.features.alerts.body'),
    },
    {
      icon: <Users className="w-10 h-10 text-rose-400" />,
      title: t('landing.features.team.title'),
      body: t('landing.features.team.body'),
    },
    {
      icon: <MessagesSquare className="w-10 h-10 text-sky-400" />,
      title: t('landing.features.discussion.title'),
      body: t('landing.features.discussion.body'),
    },
    {
      icon: <Zap className="w-10 h-10 text-yellow-400" />,
      title: t('landing.features.tester.title'),
      body: t('landing.features.tester.body'),
    },
    {
      icon: <Terminal className="w-10 h-10 text-cyan-400" />,
      title: t('landing.features.path.title'),
      body: t('landing.features.path.body'),
    },
  ];

  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">{t('landing.features.title')}</h2>
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

function PathPreservationDemo() {
  const [copied, setCopied] = useState(false);
  const hookUrl = 'https://hookswing.com/hook/project-1';
  const { t } = useTranslation();

  const copyUrl = () => {
    navigator.clipboard.writeText(hookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-24 bg-slate-900/50 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            One URL. Every Service. Your Localhost.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            With HookSwing, everything is easy. Point Stripe, PayPal, GitHub — whatever you use — to a single URL. We preserve the path and forward it straight to your local server.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Step-by-step flow */}
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold shrink-0">1</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Copy your HookSwing URL</h3>
                <div className="bg-slate-900 rounded-lg border border-slate-700 p-3 flex items-center gap-3">
                  <code className="text-emerald-400 text-sm font-mono">{hookUrl}</code>
                  <button
                    onClick={copyUrl}
                    className="ml-auto p-1.5 hover:bg-slate-800 rounded transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-slate-600 rotate-90 lg:rotate-0" />
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold shrink-0">2</div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-3">Paste it into your services</h3>
                <div className="space-y-3">
                  {/* Stripe */}
                  <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white">S</div>
                      <span className="text-white font-medium">Stripe Dashboard</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Webhook URL:</span>
                        <code className="text-emerald-400 font-mono">{hookUrl}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Forwards to:</span>
                        <code className="text-blue-400 font-mono">localhost:3000/api/stripe/webhook</code>
                      </div>
                    </div>
                  </div>

                  {/* PayPal */}
                  <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-white">P</div>
                      <span className="text-white font-medium">PayPal Developer</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Webhook URL:</span>
                        <code className="text-emerald-400 font-mono">{hookUrl}</code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Forwards to:</span>
                        <code className="text-blue-400 font-mono">localhost:3000/api/paypal/webhook</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-5 h-5 text-slate-600 rotate-90 lg:rotate-0" />
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold shrink-0">3</div>
              <div>
                <h3 className="text-white font-semibold mb-2">Run one command</h3>
                <div className="bg-slate-900 rounded-lg border border-slate-700 p-3">
                  <code className="text-emerald-400 text-sm font-mono">hookswing forward project-1 3000</code>
                </div>
                <p className="text-slate-500 text-sm mt-2">That's it. Any port number works — 3000, 8080, 1337, whatever you use.</p>
              </div>
            </div>
          </div>

          {/* Right: Terminal output */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-slate-950 rounded-xl border border-slate-700 overflow-hidden font-mono text-sm shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs text-slate-500 font-mono">hookswing forward project-1 3000</span>
              </div>
              <div className="p-5 space-y-1 text-slate-300">
                <div className="text-emerald-400 font-semibold">🪝 HookSwing Forwarder</div>
                <div className="text-slate-400 mt-2">  Target: http://localhost:3000</div>
                <div className="text-slate-400">  Project: My SaaS (project-1)</div>
                <div className="text-slate-500 mt-2">  Session: 00:12:34  |  Requests: 7 / 500 █░░░░░░░░░</div>
                <div className="text-slate-500 mt-1">  [Press Ctrl+C to stop]</div>
                <div className="mt-4 space-y-1.5">
                  <div>
                    <span className="text-slate-600">[14:32:10]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/paypal/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(paypal:PAYMENT.CAPTURE.COMPLETED)</span>
                  </div>
                  <div>
                    <span className="text-slate-600">[14:32:15]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/paypal/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(paypal:PAYMENT.CAPTURE.COMPLETED)</span>
                  </div>
                  <div>
                    <span className="text-slate-600">[14:32:22]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/paypal/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(paypal:BILLING.SUBSCRIPTION.CREATED)</span>
                  </div>
                  <div>
                    <span className="text-slate-600">[14:33:01]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/stripe/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(stripe:charge.succeeded)</span>
                  </div>
                  <div>
                    <span className="text-slate-600">[14:33:08]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/stripe/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(stripe:invoice.payment_succeeded)</span>
                  </div>
                  <div>
                    <span className="text-slate-600">[14:33:15]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/stripe/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(stripe:customer.created)</span>
                  </div>
                  <div>
                    <span className="text-slate-600">[14:34:02]</span>{' '}
                    <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded text-xs font-bold">POST</span>{' '}
                    <span className="text-slate-400">/api/stripe/webhook</span>{' '}
                    <span className="text-emerald-400">200</span>{' '}
                    <span className="text-slate-600">(stripe:charge.succeeded)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepDiveSection() {
  const { t } = useTranslation();
  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">Built for Developers, Not Committees</h2>

        {/* What's New Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6 mb-20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">{t('landing.whatsNew.title')}</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <MessagesSquare className="w-5 h-5 text-sky-400 mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">{t('landing.features.discussion.title')}</h4>
              <p className="text-xs text-slate-400">{t('landing.whatsNew.discussionFeed')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <Heart className="w-5 h-5 text-rose-400 mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">Live Support & Feedback</h4>
              <p className="text-xs text-slate-400">{t('landing.whatsNew.liveSupport')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">Bulletproof Stability</h4>
              <p className="text-xs text-slate-400">{t('landing.whatsNew.stability')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <Zap className="w-5 h-5 text-amber-400 mb-2" />
              <h4 className="text-sm font-semibold text-white mb-1">Smarter Comments</h4>
              <p className="text-xs text-slate-400">{t('landing.whatsNew.smartComments')}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20" id="cli">
          <div className="order-2 lg:order-1">
            <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden font-mono text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="p-4 space-y-1 text-slate-300">
                <div><span className="text-emerald-400">$</span> npm install -g hookswing</div>
                <div className="text-slate-500">+ hookswing@1.0.18</div>
                <div className="pt-2"><span className="text-emerald-400">$</span> hookswing test stripe invoice.payment_succeeded 3000</div>
                <div className="text-slate-500 pt-1">→ 200 OK in 245ms — source: stripe (normalized from "3000")</div>
                <div className="pt-2"><span className="text-emerald-400">$</span> hookswing forward abc123 3000</div>
                <div className="text-slate-500 pt-1">Connected. Forwarding webhooks to http://localhost:3000...</div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h3 className="text-2xl font-bold text-white mb-4">Two CLIs. Your choice.</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              <strong className="text-white">npm CLI:</strong> Install <code className="text-emerald-400">hookswing</code> globally. Run <code className="text-emerald-400">hookswing forward</code> to pipe webhooks straight to localhost. No ngrok. No tunnel config. Just works.
            </p>
            <p className="text-slate-400 leading-relaxed mb-6">
              <strong className="text-white">Web CLI:</strong> Prefer staying in the browser? Open the built-in terminal right in your dashboard at <code className="text-emerald-400">/dashboard/cli</code> — same commands, zero install.
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
              Connect Slack, Discord, or Telegram. Get notified the moment a webhook arrives — or when your server returns a 500. Compare two webhooks side-by-side to spot exactly what changed. No more refreshing the dashboard like a maniac.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const steps = [
    {
      num: '01',
      title: t('landing.howItWorks.step1Title'),
      body: t('landing.howItWorks.step1Body'),
    },
    {
      num: '02',
      title: t('landing.howItWorks.step2Title'),
      body: t('landing.howItWorks.step2Body'),
    },
    {
      num: '03',
      title: t('landing.howItWorks.step3Title'),
      body: t('landing.howItWorks.step3Body'),
    },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">{t('landing.howItWorks.title')}</h2>
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
          <button onClick={() => navigate(user ? '/dashboard' : '/register')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]">
            {user ? t('landing.hero.ctaDashboard') : t('landing.howItWorks.cta')}
          </button>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentPlan = user?.plan || 'FREE';
  const { t } = useTranslation();

  const plans = [
    {
      name: t('landing.pricing.free.name'),
      badge: t('landing.pricing.free.badge'),
      price: t('landing.pricing.free.price'),
      period: t('landing.pricing.free.period'),
      features: t('landing.pricing.free.features') as unknown as string[],
      cta: t('landing.pricing.free.cta'),
      planKey: 'FREE',
      featured: false,
    },
    {
      name: t('landing.pricing.pro.name'),
      badge: t('landing.pricing.pro.badge'),
      price: yearly ? t('landing.pricing.pro.priceYearly') : t('landing.pricing.pro.priceMonthly'),
      period: yearly ? t('landing.pricing.pro.periodYearly') : t('landing.pricing.pro.periodMonthly'),
      features: t('landing.pricing.pro.features') as unknown as string[],
      cta: t('landing.pricing.pro.cta'),
      planKey: 'PRO',
      featured: true,
    },
    {
      name: t('landing.pricing.team.name'),
      badge: t('landing.pricing.team.badge'),
      price: yearly ? t('landing.pricing.team.priceYearly') : t('landing.pricing.team.priceMonthly'),
      period: yearly ? t('landing.pricing.team.periodYearly') : t('landing.pricing.team.periodMonthly'),
      features: t('landing.pricing.team.features') as unknown as string[],
      cta: t('landing.pricing.team.cta'),
      planKey: 'TEAM',
      featured: false,
    },
  ];

  function getCta(plan: typeof plans[0]) {
    if (!user) return { text: plan.cta, action: () => navigate('/register') };
    if (currentPlan === plan.planKey) return { text: t('landing.pricing.currentPlan'), action: () => navigate('/dashboard/account?tab=billing' + (yearly ? '&yearly=true' : '')), disabled: true };
    if (plan.planKey === 'FREE') return { text: 'Downgrade', action: () => navigate('/dashboard/account?tab=billing' + (yearly ? '&yearly=true' : '')) };
    return { text: `Upgrade to ${plan.name}`, action: () => navigate('/dashboard/account?tab=billing' + (yearly ? '&yearly=true' : '')) };
  }

  return (
    <section id="pricing" className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">{t('landing.pricing.title')}</h2>
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-sm ${!yearly ? 'text-white' : 'text-slate-500'}`}>{t('landing.pricing.monthly')}</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative w-12 h-6 bg-slate-700 rounded-full transition-colors"
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? 'translate-x-6' : ''}`} />
          </button>
          <span className={`text-sm ${yearly ? 'text-white' : 'text-slate-500'}`}>{t('landing.pricing.yearly')} <span className="text-emerald-400">{t('landing.pricing.yearlySave')}</span></span>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const cta = getCta(plan);
            const isCurrent = currentPlan === plan.planKey;
            return (
              <div
                key={plan.name}
                className={`relative rounded-xl p-8 border ${
                  plan.featured
                    ? 'bg-slate-800 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800 border-slate-700'
                } ${isCurrent ? 'ring-2 ring-emerald-500/30' : ''}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {t('landing.pricing.pro.popular')}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
                    Your Plan
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
                  onClick={cta.action}
                  disabled={cta.disabled}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    cta.disabled
                      ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                      : plan.featured
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-[1.02]'
                        : 'bg-slate-700 hover:bg-slate-600 text-white hover:scale-[1.02]'
                  }`}
                >
                  {cta.text}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-slate-500 mt-8">
          {t('landing.pricing.footer')}
        </p>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useTranslation();
  const quotes = [
    {
      text: t('landing.testimonials.quote1'),
      tag: t('landing.testimonials.tag1'),
    },
    {
      text: t('landing.testimonials.quote2'),
      tag: t('landing.testimonials.tag2'),
    },
    {
      text: t('landing.testimonials.quote3'),
      tag: t('landing.testimonials.tag3'),
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">{t('landing.testimonials.title')}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {quotes.map((q, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-8 border border-slate-700">
              <p className="text-slate-300 italic mb-6 leading-relaxed">"{q.text}"</p>
              <div>
                <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-full">{q.tag}</span>
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
  const { t } = useTranslation();
  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
    { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
    { q: t('landing.faq.q7'), a: t('landing.faq.a7') },
  ];

  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">{t('landing.faq.title')}</h2>
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
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">{t('landing.finalCta.title')}</h2>
        <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto">
          {user ? t('landing.finalCta.subtitleLoggedIn') : t('landing.finalCta.subtitleLoggedOut')}
        </p>
        <button onClick={() => navigate(user ? '/dashboard' : '/register')} className="bg-emerald-500 hover:bg-emerald-400 text-white px-10 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-[1.02]">
          {user ? t('landing.hero.ctaDashboard') : t('landing.finalCta.ctaStart')}
        </button>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="text-white font-semibold mb-4">{t('landing.footer.product')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.features')}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{t('landing.footer.pricing')}</a></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">{t('landing.footer.documentation')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t('landing.footer.resources')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/docs" className="hover:text-white transition-colors">{t('landing.footer.docs')}</Link></li>
              <li><a href="https://github.com/MBAS89/hookswing-cli" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('landing.footer.cliRepo')}</a></li>
              <li><Link to="/docs" className="hover:text-white transition-colors">{t('landing.footer.apiRef')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t('landing.footer.company')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-white transition-colors">{t('landing.footer.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('landing.footer.contact')}</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">{t('landing.footer.careers')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t('landing.footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/privacy" className="hover:text-white transition-colors">{t('landing.footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">{t('landing.footer.terms')}</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">{t('landing.footer.cookies')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 sm:mb-0">
            <Logo className="w-6 h-6" />
            <span className="text-sm text-slate-500">{t('landing.footer.copyright')}</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-sm text-slate-500">
              <a href="https://nuyvo.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">{t('landing.footer.platform')}</a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/MBAS89/hookswing-cli" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors" title="Open-source CLI"><Github className="w-5 h-5" /></a>
            <a href="https://nuyvo.com" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors" title="Nuyvo LLC"><Globe className="w-5 h-5" /></a>
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
      <PathPreservationDemo />
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
