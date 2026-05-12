import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Shield, Loader2, ArrowRight, AlertTriangle, Copy, CheckCircle2, Zap, LogOut, LayoutDashboard } from 'lucide-react';
import Logo from '../../components/Logo';
import SEO from '../../components/seo/SEO';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';

const PROVIDERS = [
  { key: 'stripe', label: 'Stripe', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { key: 'github', label: 'GitHub', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
  { key: 'paypal', label: 'PayPal', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key: 'shopify', label: 'Shopify', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { key: 'generic', label: 'Generic HMAC', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
] as const;

type Provider = typeof PROVIDERS[number]['key'];

const COMMON_ISSUES: Record<Provider, string[]> = {
  stripe: [
    'Did you use express.raw({ type: "application/json" }) for Stripe webhooks?',
    'Is the payload modified by body-parser middleware before verification?',
    'Is the secret from the correct Stripe environment (test vs live)?',
    'Did you copy the full Stripe-Signature header including the timestamp?',
  ],
  github: [
    'Did you use the raw request body, not a parsed JSON object?',
    'Is the secret the webhook secret, not your personal access token?',
    'Did you include the "sha256=" prefix in your comparison?',
  ],
  paypal: [
    'PayPal production uses RSA-SHA256 with certificates — this tool uses simplified HMAC for debugging.',
    'Did you use the raw webhook payload without any parsing or formatting?',
    'Is the secret from the webhook configuration in your PayPal app?',
  ],
  shopify: [
    'Did you use the raw request body, not a parsed JSON object?',
    'Is the secret your Shopify Admin API secret key?',
    'Did you compare against the X-Shopify-Hmac-SHA256 header?',
  ],
  generic: [
    'Did you use the raw request body string, not a parsed object?',
    'Is your secret key the same one used to generate the signature?',
    'Did you use HMAC-SHA256 with hex encoding?',
  ],
};

const PLACEHOLDERS: Record<Provider, { payload: string; signature: string; secret: string }> = {
  stripe: {
    payload: '{\n  "id": "evt_1234567890abcdef",\n  "object": "event",\n  "type": "invoice.payment_succeeded",\n  "data": { ... }\n}',
    signature: 't=1234567890,v1=abc123def456789abcdef123456789abcdef123456789abcdef123456789abc',
    secret: 'whsec_test_1234567890abcdef1234567890abcdef12345678',
  },
  github: {
    payload: '{\n  "action": "opened",\n  "number": 1,\n  "pull_request": { ... }\n}',
    signature: 'sha256=abc123def456789abcdef123456789abcdef123456789abcdef123456789abc1',
    secret: 'your-github-webhook-secret',
  },
  paypal: {
    payload: '{\n  "id": "WH-1234567890",\n  "event_version": "1.0",\n  "create_time": "2024-01-01T00:00:00Z",\n  "resource_type": "payment",\n  "event_type": "PAYMENT.CAPTURE.COMPLETED"\n}',
    signature: 'sha256=abc123def456789abcdef123456789abcdef123456789abcdef123456789abc1',
    secret: 'your-paypal-webhook-secret',
  },
  shopify: {
    payload: '{\n  "id": 1234567890,\n  "admin_graphql_api_id": "gid://shopify/Order/1234567890",\n  "name": "#1001",\n  "total_price": "100.00"\n}',
    signature: 'abc123def456789abcdef123456789abcdef123456789abcdef123456789abc1==',
    secret: 'shpss_1234567890abcdef1234567890abcdef1234567890abcdef',
  },
  generic: {
    payload: '{\n  "event": "user.created",\n  "user_id": "usr_123"\n}',
    signature: 'abc123def456789abcdef123456789abcdef123456789abcdef123456789abc1',
    secret: 'your-webhook-secret-key',
  },
};

function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <span className="font-bold text-white">HookSwing</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <LanguageSwitcher />
          <Link to="/docs" className="text-slate-400 hover:text-white transition-colors hidden sm:inline">Docs</Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-slate-400 hover:text-white transition-colors hidden sm:flex items-center gap-1"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t('landing.nav.dashboard')}
              </Link>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t('landing.nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-400 hover:text-white transition-colors">{t('landing.nav.login')}</Link>
              <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">{t('landing.nav.signup')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function VerifySignaturePage() {
  const [provider, setProvider] = useState<Provider>('stripe');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [result, setResult] = useState<null | { valid: boolean; message: string; details: Record<string, any> }>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleVerify = async () => {
    setResult(null);
    setIsVerifying(true);
    try {
      const res = await api.post('/tools/verify-signature', {
        provider,
        payload,
        signature,
        secret,
      });
      setResult(res.data);
    } catch (err: any) {
      setResult({
        valid: false,
        message: err.response?.data?.message || 'Verification failed',
        details: err.response?.data?.details || {},
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const placeholders = PLACEHOLDERS[provider];
  const issues = COMMON_ISSUES[provider];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <SEO
        title="Free Webhook Signature Verifier — Stripe, GitHub, PayPal"
        description="Verify Stripe, GitHub, PayPal, and Shopify webhook signatures instantly. Free online tool. No signup required. Paste your payload, signature, and secret to check if your webhook verification is working correctly."
        keywords="stripe webhook signature verify, github webhook signature check, paypal webhook verify, shopify webhook signature, webhook signature verification online, stripe webhook test"
        canonical="https://hookswing.com/tools/verify-signature"
      />

      {/* Navbar */}
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/20 mx-auto mb-4">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Webhook Signature Verifier</h1>
          <p className="text-slate-400">Free tool. No signup required. Verify signatures for Stripe, GitHub, PayPal, Shopify, and generic HMAC.</p>
        </div>

        {/* Provider Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PROVIDERS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setProvider(p.key);
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                provider === p.key
                  ? p.color
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl shadow-black/20 space-y-6">
          {/* Payload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              1. Payload <span className="text-slate-500 font-normal">(raw JSON or body text)</span>
            </label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder={placeholders.payload}
              rows={6}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-sm transition-all resize-y"
            />
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              2. Signature Header
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder={placeholders.signature}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-sm transition-all"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              {provider === 'stripe' && 'Format: t=1234567890,v1=abc123...'}
              {provider === 'github' && 'Format: sha256=abc123... (or just the hex value)'}
              {provider === 'paypal' && 'Format: sha256=abc123... (or just the hex value)'}
              {provider === 'shopify' && 'Format: Base64-encoded HMAC from X-Shopify-Hmac-SHA256 header'}
              {provider === 'generic' && 'Format: Hex-encoded HMAC-SHA256 signature'}
            </p>
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              3. Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={placeholders.secret}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-sm transition-all pr-24"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showSecret ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || !payload || !signature || !secret}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {isVerifying ? 'Verifying...' : 'Verify Signature'}
          </button>

          {/* Result */}
          {result && (
            <div className={`rounded-xl border p-5 ${
              result.valid
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {result.valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <X className="w-6 h-6 text-red-400" />
                )}
                <span className={`font-semibold ${result.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.message}
                </span>
              </div>

              {Object.keys(result.details).length > 0 && (
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 space-y-1.5">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-sm">
                      <span className="text-slate-500 shrink-0 capitalize">{key}:</span>
                      <span className="text-slate-300 font-mono break-all">{String(value)}</span>
                      {typeof value === 'string' && value.length > 20 && (
                        <button
                          onClick={() => copyToClipboard(String(value), key)}
                          className="text-slate-500 hover:text-slate-300 shrink-0 ml-auto"
                          title="Copy"
                        >
                          {copied === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!result.valid && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Common Issues
                  </h4>
                  <ul className="space-y-1.5">
                    {issues.map((issue, i) => (
                      <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                        <span className="text-slate-600 mt-1.5 w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA Banner */}
        <div className="mt-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center ring-1 ring-emerald-500/20 shrink-0">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Testing webhooks locally?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                HookSwing gives you a permanent URL to catch webhooks, 90-day storage, one-click replay against localhost, and the ability to edit payloads before replaying.
              </p>
            </div>
            <Link
              to="/register"
              className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              Try Free — No Card Required
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-10">
          Your secret is used for verification only and is never stored.
        </p>
      </div>
    </div>
  );
}
