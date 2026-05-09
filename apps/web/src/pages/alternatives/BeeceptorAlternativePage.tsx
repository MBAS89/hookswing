import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Repeat, Users, Globe, Zap } from 'lucide-react';
import Logo from '../../components/Logo';
import SEO from '../../components/seo/SEO';

const features = [
  { label: 'Mock endpoints', hookswing: false, beeceptor: true },
  { label: 'Webhook capture', hookswing: true, beeceptor: true },
  { label: 'Payload replay', hookswing: 'Pro', beeceptor: false },
  { label: 'Team workspaces', hookswing: true, beeceptor: false },
  { label: 'Custom domains', hookswing: 'Pro', beeceptor: 'Paid' },
  { label: 'Provider test templates', hookswing: '15+', beeceptor: false },
  { label: 'CLI forwarding', hookswing: true, beeceptor: false },
  { label: 'Slack/Discord alerts', hookswing: 'Pro', beeceptor: false },
  { label: 'Export JSON/CSV', hookswing: 'Pro', beeceptor: false },
  { label: 'Free request limit', hookswing: '500/mo', beeceptor: '50/day' },
];

export default function BeeceptorAlternativePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <SEO
        title="Beeceptor Alternative — Free Webhook Testing with HookSwing"
        description="Beeceptor limits free users to 50 requests/day. HookSwing gives you 500 webhooks/month with replay, team sharing, and 15+ provider templates."
        keywords="Beeceptor alternative, Beeceptor vs HookSwing, free webhook testing, webhook catcher"
        canonical="https://hookswing.com/alternatives/beeceptor"
      />

      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">HookSwing</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/blog" className="text-slate-300 hover:text-white text-sm transition-colors">Blog</Link>
              <Link to="/docs" className="text-slate-300 hover:text-white text-sm transition-colors">Docs</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Beeceptor Alternative
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            More Free Requests. More Power. No Limits.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Beeceptor is great for API mocking, but its 50-request/day free limit is tight for active webhook development. HookSwing gives you 500 webhooks/month with replay, team features, and provider templates.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Zap className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">10x More Free Requests</h3>
            <p className="text-sm text-slate-400">
              Beeceptor Free: 50/day. HookSwing Free: 500/month. That is enough for a real side project, not just a quick demo.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Repeat className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Replay & Iterate</h3>
            <p className="text-sm text-slate-400">
              Capture once, replay forever. Fix bugs faster by re-sending the exact same payload to your updated handler.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Users className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Team-First Design</h3>
            <p className="text-sm text-slate-400">
              Comment on webhooks, share projects, and track activity. Built for engineering teams, not solo hackers.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">HookSwing vs Beeceptor</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Feature</th>
                <th className="text-center px-6 py-3 text-emerald-400 font-medium">HookSwing</th>
                <th className="text-center px-6 py-3 text-slate-400 font-medium">Beeceptor</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-slate-800/50 last:border-0">
                  <td className="px-6 py-3 text-slate-300">{f.label}</td>
                  <td className="px-6 py-3 text-center">
                    {f.hookswing === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> :
                     f.hookswing === false ? <X className="w-5 h-5 text-red-400 mx-auto" /> :
                     <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{f.hookswing}</span>}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {f.beeceptor === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> :
                     f.beeceptor === false ? <X className="w-5 h-5 text-red-400 mx-auto" /> :
                     <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">{f.beeceptor}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Switch from Beeceptor to HookSwing</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            10x more free requests, permanent storage, and team collaboration. Built for serious webhook development.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]">
            Start Catching Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            © 2026 HookSwing · A <a href="https://nuyvo.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">Nuyvo LLC</a> platform
          </p>
        </div>
      </footer>
    </div>
  );
}
