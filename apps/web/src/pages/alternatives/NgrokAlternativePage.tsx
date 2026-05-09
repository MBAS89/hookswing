import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Zap, Shield, Globe, Users, Repeat } from 'lucide-react';
import Logo from '../../components/Logo';
import SEO from '../../components/seo/SEO';
import JsonLd from '../../components/seo/JsonLd';

const features = [
  { label: 'Public URL for localhost', hookswing: true, ngrok: true },
  { label: 'Permanent URL (never changes)', hookswing: true, ngrok: 'Paid only' },
  { label: 'Payload persistence', hookswing: true, ngrok: false },
  { label: 'One-click replay', hookswing: true, ngrok: false },
  { label: 'Structured JSON inspection', hookswing: true, ngrok: 'Basic UI' },
  { label: 'Team workspaces', hookswing: true, ngrok: 'Paid only' },
  { label: '15+ provider test templates', hookswing: true, ngrok: false },
  { label: 'Custom domains', hookswing: 'Pro', ngrok: 'Pro' },
  { label: 'Slack/Discord alerts', hookswing: 'Pro', ngrok: false },
  { label: 'Path preservation forwarding', hookswing: true, ngrok: false },
];

export default function NgrokAlternativePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <SEO
        title="Best ngrok Alternative for Webhook Development — HookSwing"
        description="HookSwing is the best ngrok alternative for webhook debugging. Permanent URLs, payload replay, team workspaces, and 15+ provider templates. Free plan available."
        keywords="ngrok alternative, best ngrok alternative, ngrok free alternative, webhook tunnel, localhost tunnel"
        canonical="https://hookswing.com/alternatives/ngrok"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'HookSwing',
          applicationCategory: 'DeveloperApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '500' },
        }}
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
              <Link to="/blog" className="text-slate-300 hover:text-white text-sm transition-colors">Blog</Link>
              <Link to="/docs" className="text-slate-300 hover:text-white text-sm transition-colors">Docs</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            ngrok Alternative
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            The ngrok Alternative Built for Webhooks
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            ngrok gives you a tunnel. HookSwing gives you a permanent webhook inbox with replay, team sharing, and 15+ provider templates. Same public URL. Infinitely more power.
          </p>
        </div>

        {/* Key differences */}
        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Repeat className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Replay Any Webhook</h3>
            <p className="text-sm text-slate-400">
              Capture a webhook once, replay it a hundred times. Fix your handler without waiting for the next real event.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Users className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Team Workspaces</h3>
            <p className="text-sm text-slate-400">
              Share webhook feeds with your team. Comment on specific payloads. No more Slack screenshots.
            </p>
          </div>
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <Shield className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Permanent Archive</h3>
            <p className="text-sm text-slate-400">
              Your webhooks are stored for 7–90 days, not streamed once and forgotten. Search history, compare payloads, find evidence.
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden mb-16">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">HookSwing vs ngrok</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="text-left px-6 py-3 text-slate-400 font-medium">Feature</th>
                <th className="text-center px-6 py-3 text-emerald-400 font-medium">HookSwing</th>
                <th className="text-center px-6 py-3 text-slate-400 font-medium">ngrok</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-slate-800/50 last:border-0">
                  <td className="px-6 py-3 text-slate-300">{f.label}</td>
                  <td className="px-6 py-3 text-center">
                    {f.hookswing === true ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : f.hookswing === false ? (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{f.hookswing}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {f.ngrok === true ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : f.ngrok === false ? (
                      <X className="w-5 h-5 text-red-400 mx-auto" />
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">{f.ngrok}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">
            Switch from ngrok to HookSwing today
          </h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Stop streaming webhooks into a void. Start capturing, inspecting, and replaying them like a pro.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]"
          >
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
