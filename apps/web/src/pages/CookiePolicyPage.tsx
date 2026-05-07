import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function CookiePolicyPage() {
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
              <Link to="/docs" className="text-slate-300 hover:text-white text-sm transition-colors">Docs</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">Cookie Policy</h1>
        <p className="text-slate-500 mb-10">Last updated: May 7, 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. What Are Cookies</h2>
            <p className="leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help us provide, protect, and improve our Services by remembering your preferences, keeping you signed in, and understanding how you use HookSwing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Cookies</h2>
            <p className="leading-relaxed mb-3">HookSwing uses the following types of cookies:</p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Essential Cookies</h3>
            <p className="leading-relaxed">
              These cookies are necessary for the website to function properly. They enable core features like user authentication, security, and session management. You cannot opt out of these cookies.
            </p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Analytics Cookies</h3>
            <p className="leading-relaxed">
              We use analytics cookies to understand how visitors interact with our website. This helps us improve functionality and user experience. All analytics data is anonymized and aggregated.
            </p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Preference Cookies</h3>
            <p className="leading-relaxed">
              These cookies remember your settings and preferences (like dark mode) to provide a more personalized experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Third-Party Cookies</h2>
            <p className="leading-relaxed">
              We do not use third-party advertising cookies. The only third-party services that may set cookies are:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
              <li>Stripe — for secure payment processing</li>
              <li>Analytics providers — for anonymized usage statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Managing Cookies</h2>
            <p className="leading-relaxed mb-3">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>View cookies stored on your device</li>
              <li>Delete existing cookies</li>
              <li>Block all or specific cookies</li>
              <li>Set alerts when cookies are being sent</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Please note that disabling cookies may affect the functionality of HookSwing. Essential cookies required for authentication cannot be disabled without breaking core features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookie Duration</h2>
            <p className="leading-relaxed">
              Session cookies expire when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. Authentication tokens are stored as cookies/localStorage and expire according to your session settings (typically 7 days for refresh tokens).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Cookie Policy from time to time. The updated version will be posted on this page with a revised "Last updated" date. Continued use of our Services after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about our use of cookies, contact us at <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a>.
            </p>
          </section>
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
