import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Database, Repeat, Globe, Zap } from 'lucide-react';
import Logo from '../../components/Logo';
import SEO from '../../components/seo/SEO';

const features = [
  { label: 'Instant public URL', hookswing: true, requestBin: true },
  { label: 'Payload retention', hookswing: '7–90 days', requestBin: '~48 hours' },
  { label: 'Replay webhooks', hookswing: 'Pro', requestBin: false },
  { label: 'Team workspaces', hookswing: true, requestBin: false },
  { label: 'Custom domains', hookswing: 'Pro', requestBin: false },
  { label: 'Provider test templates', hookswing: '15+', requestBin: false },
  { label: 'CLI forwarding', hookswing: true, requestBin: false },
  { label: 'Slack/Discord alerts', hookswing: 'Pro', requestBin: false },
  { label: 'Export JSON/CSV', hookswing: 'Pro', requestBin: false },
  { label: 'Real-time team feed', hookswing: true, requestBin: false },
];

export default function RequestBinAlternativePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <SEO
        title="RequestBin Alternative with Replay & Team Features — HookSwing"
        description="RequestBin deletes payloads after 48 hours. HookSwing keeps them for 7–90 days with replay, team workspaces, and 15+ provider templates."
        keywords="RequestBin alternative, RequestBin vs HookSwing, webhook catcher, webhook testing"
        canonical="https://hookswing.com/alternatives/requestbin"
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
            RequestBin Alternative
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            RequestBin Alternative That Actually Keeps Your Data
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            RequestBin is simple and free — but your payloads vanish after two days. HookSwing gives you permanent storage, replay, and team collaboration.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Database className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Long-Term Storage</h3>
            <p className="text-sm text-slate-400">
              RequestBin: 48 hours. HookSwing Free: 7 days. HookSwing Pro: 90 days. Debug across weekends, sprints, and releases.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Repeat className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Replay & Compare</h3>
            <p className="text-sm text-slate-400">
              Replay any captured webhook against your local server. Compare two webhooks side-by-side to spot schema changes.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Zap className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">15+ Test Templates</h3>
            <p className="text-sm text-slate-400">
              Send realistic test payloads from Stripe, GitHub, Shopify, Twilio, Slack, and more. No setup, no real accounts needed.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">HookSwing vs RequestBin</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Feature</th>
                <th className="text-center px-6 py-3 text-emerald-400 font-medium">HookSwing</th>
                <th className="text-center px-6 py-3 text-slate-400 font-medium">RequestBin</th>
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
                    {f.requestBin === true ? <Check className="w-5 h-5 text-emerald-400 mx-auto" /> :
                     f.requestBin === false ? <X className="w-5 h-5 text-red-400 mx-auto" /> :
                     <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">{f.requestBin}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Move from RequestBin to HookSwing</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Your webhook data deserves better than a 48-hour lifespan. Start preserving it with HookSwing.
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
