import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useTranslation } from '../i18n';

export default function TermsOfServicePage() {
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-2">{t('pages.terms.title')}</h1>
        <p className="text-slate-500 mb-10">{t('pages.terms.lastUpdated')}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.acceptance')}</h2>
            <p className="leading-relaxed">
              By accessing or using HookSwing ("Services"), you agree to be bound by these Terms of Service. If you do not agree, you may not use our Services. These Terms constitute a legally binding agreement between you and Nuyvo LLC.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.description')}</h2>
            <p className="leading-relaxed">
              HookSwing provides a webhook debugging and management platform that allows developers to capture, inspect, replay, and forward HTTP webhooks. We offer Free, Pro, and Team subscription plans with varying features and limits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.accountResponsibilities')}</h2>
            <p className="leading-relaxed mb-3">You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Maintaining account security and confidentiality</li>
              <li>All activities under your account</li>
              <li>Providing accurate, current information</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Ensuring you have rights to the webhook data you send through our platform</li>
            </ul>
            <p className="leading-relaxed mt-3">
              Immediately notify us of unauthorized account access at <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.subscriptionTerms')}</h2>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">{t('pages.terms.billing')}</h3>
            <p className="leading-relaxed">
              Subscription fees are billed in advance on a monthly or annual basis. All payments are non-refundable except as required by law. We use Stripe for payment processing; their terms apply to transactions.
            </p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">{t('pages.terms.cancellation')}</h3>
            <p className="leading-relaxed">
              You may cancel anytime through your account settings. Cancellation takes effect at the end of the current billing cycle. No partial refunds for mid-cycle cancellations.
            </p>
            <h3 className="text-lg font-medium text-white mt-4 mb-2">{t('pages.terms.priceChanges')}</h3>
            <p className="leading-relaxed">
              We may change subscription fees with 30 days' notice. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.intellectualProperty')}</h2>
            <p className="leading-relaxed">
              All Services, content, and technology are owned by Nuyvo LLC or licensors and protected by copyright, trademark, and other laws. These Terms grant a limited, non-exclusive, non-transferable license to use our Services. You retain ownership of your data, but grant us license to use it as necessary to provide Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.prohibitedActivities')}</h2>
            <p className="leading-relaxed mb-3">You may not:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use HookSwing to send spam, phishing, or malicious payloads</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Reverse engineer, decompile, or disassemble our software</li>
              <li>Upload malware or engage in security breaches</li>
              <li>Violate others' privacy or intellectual property</li>
              <li>Use our Services in any way that could damage, disable, or impair our infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.dataPrivacy')}</h2>
            <p className="leading-relaxed">
              Your use of HookSwing is also governed by our <Link to="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>. By using our Services, you consent to the collection and use of information as described therein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.disclaimers')}</h2>
            <p className="leading-relaxed mb-3">
              OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NUYVO LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES. OUR TOTAL LIABILITY SHALL NOT EXCEED AMOUNTS PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.indemnification')}</h2>
            <p className="leading-relaxed">
              You agree to indemnify and hold harmless Nuyvo LLC, its affiliates, and employees from any claims, damages, or expenses (including attorneys' fees) arising from your use of Services, violation of these Terms, or infringement of third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.governingLaw')}</h2>
            <p className="leading-relaxed">
              These Terms are governed by Delaware law without regard to conflict of laws principles. Any disputes shall be resolved through binding arbitration under AAA rules in Wilmington, Delaware. Class actions and jury trials are waived.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.termination')}</h2>
            <p className="leading-relaxed">
              We may terminate or suspend access to Services immediately for violations of these Terms. Upon termination, your license ends, but Sections 5-12 survive. You may delete your account at any time from Account Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">{t('pages.terms.contactInfo')}</h2>
            <p className="leading-relaxed">
              Nuyvo LLC<br />
              Email: <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a><br />
              Phone: +1 (505) 358-3854<br />
              Address: 1209 MOUNTAIN ROAD PL NE STE N, ALBUQUERQUE, BERNALILLO COUNTY, NM 87110 USA
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
