import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 mb-10">Last updated: May 7, 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="leading-relaxed">
              Nuyvo LLC ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This policy explains how we collect, use, disclose, and safeguard your information when you use HookSwing ("Services").
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Personal Data</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Contact information (name, email address)</li>
              <li>Account credentials (encrypted password hashes)</li>
              <li>Payment information (processed securely through Stripe — we never store card details)</li>
              <li>Two-factor authentication settings (if enabled)</li>
            </ul>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Webhook Data</h3>
            <p className="leading-relaxed">
              We store the HTTP requests sent to your webhook URLs, including headers, body, query parameters, and IP address. This data belongs to you and is only used to display it in your dashboard.
            </p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">Usage Data</h3>
            <p className="leading-relaxed">
              We collect anonymous usage data including IP address, browser type, pages visited, time spent on pages, and referral sources. We use cookies and similar tracking technologies for analytics and functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>To provide, maintain, and improve HookSwing</li>
              <li>To process transactions and send service-related communications</li>
              <li>To send verification emails, password resets, and security alerts</li>
              <li>To personalize user experience and develop new features</li>
              <li>To comply with legal obligations and protect our rights</li>
              <li>To anonymize data for aggregate analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing & Security</h2>
            <p className="leading-relaxed mb-3">
              We implement industry-standard security measures including encryption (TLS 1.3+), regular security audits, and strict access controls. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Service providers (Resend for email, Stripe for payments)</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p className="leading-relaxed mt-3">
              <strong className="text-white">We do not sell your personal information.</strong> We do not read, analyze, or sell your webhook payloads. They are stored as-is for your viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p className="leading-relaxed mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access, correct, or delete your personal data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p className="leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a>. We respond to verified requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p className="leading-relaxed">
              Webhook payloads are retained according to your plan: 7 days (Free), 90 days (Pro), or unlimited (Team). Account data is retained for 24 months after account termination unless required by law. Anonymized analytics data may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
            <p className="leading-relaxed">
              HookSwing is not intended for individuals under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete the information immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Policy Updates</h2>
            <p className="leading-relaxed">
              We may update this policy periodically. The updated version will be posted on this page with a revised "Last updated" date. Continued use of our Services after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p className="leading-relaxed">
              For privacy concerns or requests, contact us at <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a>.
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
