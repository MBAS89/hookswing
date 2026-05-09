import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n';

export default function CareersPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">{t('pages.careers.title')}</h1>
        <p className="text-lg text-slate-400 mb-8">
          We're not actively hiring right now, but we're always interested in meeting talented people who care about developer tools.
        </p>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">{t('pages.careers.noOpenPositions')}</h2>
          <p className="text-slate-400 leading-relaxed">
            When positions become available, they will be posted here. Check back later or follow us for updates.
          </p>
        </div>

        <p className="text-slate-500">
          Want to get in touch anyway? Email us at{' '}
          <a href="mailto:support@nuyvo.com" className="text-emerald-400 hover:underline">support@nuyvo.com</a>
        </p>
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
