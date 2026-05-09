import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n';
import SEO from '../components/seo/SEO';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <SEO
        title="About HookSwing — Webhook Debugging Platform by Nuyvo LLC"
        description="HookSwing is the permanent webhook inbox for developers. Built by Nuyvo LLC to solve webhook debugging, replay, and team collaboration."
        keywords="about HookSwing, webhook company, Nuyvo LLC, webhook debugging platform"
        canonical="https://hookswing.com/about"
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
              <Link to="/docs" className="text-slate-300 hover:text-white text-sm transition-colors">{t('landing.nav.docs')}</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">{t('landing.nav.login')}</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">{t('landing.nav.signup')}</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-6">{t('pages.about.title')}</h1>

        <div className="space-y-6">
          <p className="leading-relaxed text-lg">
            HookSwing is the permanent webhook inbox for developers. We built it because we were tired of losing payloads, wrestling with ngrok tunnels, and debugging webhooks in the dark.
          </p>

          <p className="leading-relaxed">
            Our platform gives you a unique public URL that catches any HTTP webhook, stores it securely, and lets you inspect, replay, compare, and forward payloads in real time. Whether you're integrating Stripe, GitHub, Twilio, or a custom payment gateway — HookSwing makes webhook debugging painless.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('pages.about.mission')}</h2>
          <p className="leading-relaxed">
            We believe developers deserve better tools for debugging integrations. Webhooks are the glue of the modern internet, yet the tooling around them hasn't evolved. We're changing that — one payload at a time.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('pages.about.company')}</h2>
          <p className="leading-relaxed">
            HookSwing is a product of <a href="https://nuyvo.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Nuyvo LLC</a>, a U.S.-registered technology company dedicated to developing intelligent, privacy-first SaaS platforms for professionals across the globe.
          </p>
          <p className="leading-relaxed">
            Founded on principles of innovation, transparency, and user empowerment, Nuyvo creates software solutions that streamline complex workflows and enhance productivity. We believe technology should empower professionals to focus on what they do best.
          </p>
        </div>
      </main>

      {/* Footer */}
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
