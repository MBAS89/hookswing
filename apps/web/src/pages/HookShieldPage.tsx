import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2, Trash2,
  Copy, Check, AlertTriangle, Zap, Gauge, Code2, Search,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useTranslation } from '../i18n';
import SEO from '../components/seo/SEO';

const PROVIDERS = [
  { key: 'STRIPE', label: 'Stripe' },
  { key: 'GITHUB', label: 'GitHub' },
  { key: 'PAYPAL', label: 'PayPal' },
  { key: 'TWILIO', label: 'Twilio' },
  { key: 'SHOPIFY', label: 'Shopify' },
  { key: 'DISCORD', label: 'Discord' },
  { key: 'SLACK', label: 'Slack' },
  { key: 'CUSTOM', label: 'Custom' },
];

interface ScanResult {
  id: string;
  targetUrl: string;
  provider: string;
  status: string;
  securityScore: number | null;
  isVulnerable: boolean;
  detectedFramework: string | null;
  results: any;
  createdAt: string;
}

function SecurityScoreBadge({ score, t }: { score: number | null; t: any }) {
  if (score === null) return null;
  let color = '';
  let label = '';
  let Icon = ShieldCheck;

  if (score >= 90) {
    color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    label = t('hookshield.results.secure');
    Icon = ShieldCheck;
  } else if (score >= 70) {
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    label = t('hookshield.results.mostlySecure');
    Icon = ShieldAlert;
  } else if (score >= 50) {
    color = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    label = t('hookshield.results.needsAttention');
    Icon = ShieldAlert;
  } else {
    color = 'text-red-400 bg-red-500/10 border-red-500/30';
    label = t('hookshield.results.vulnerable');
    Icon = ShieldX;
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}>
      <Icon className="w-8 h-8" />
      <div>
        <div className="text-2xl font-bold">{score}/100</div>
        <div className="text-sm font-medium">{label}</div>
      </div>
    </div>
  );
}

function TestResultCard({
  title, statusCode, responseTimeMs, passed,
}: { title: string; statusCode: number; responseTimeMs: number; passed: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`rounded-xl border p-4 ${passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-lg font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
          {statusCode}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {passed ? t('hookshield.results.rejected') : t('hookshield.results.accepted')}
        </span>
      </div>
      <div className="text-xs text-slate-500">{t('hookshield.results.responseTime', { ms: responseTimeMs })}</div>
    </div>
  );
}

function FixCodeBlock({ framework, provider }: { framework: string; provider: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [language, setLanguage] = useState('javascript');
  const [criticalNote, setCriticalNote] = useState('');
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/security-scans/fix-code', { params: { framework, provider } })
      .then((res) => {
        setCode(res.data.code);
        setLanguage(res.data.language);
        setCriticalNote(res.data.criticalNote);
      })
      .catch(() => setCode(null));
  }, [framework, provider]);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-white">{t('hookshield.results.fixCode')}</span>
          <span className="text-xs text-slate-500">({language})</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t('hookshield.results.copied') : t('hookshield.results.copyCode')}
        </button>
      </div>
      {criticalNote && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-xs text-amber-300">⚠️ {criticalNote}</p>
        </div>
      )}
      <pre className="p-4 text-xs text-slate-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function HookShieldPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [targetUrl, setTargetUrl] = useState('');
  const [provider, setProvider] = useState('STRIPE');
  const [loading, setLoading] = useState(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [scansLoading, setScansLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const fetchScans = useCallback(async () => {
    setScansLoading(true);
    try {
      const res = await api.get('/security-scans');
      setScans(res.data.scans || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load scan history');
    } finally {
      setScansLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const pollScan = useCallback((scanId: string) => {
    if (pollInterval) clearInterval(pollInterval);
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/security-scans/${scanId}`);
        const scan = res.data;
        if (scan.status === 'COMPLETED' || scan.status === 'FAILED') {
          clearInterval(interval);
          setPollInterval(null);
          setCurrentScan(scan);
          setLoading(false);
          fetchScans();
          if (scan.isVulnerable) {
            toast.error('Vulnerability found! Your endpoint accepts unsigned webhooks.');
          } else if (scan.status === 'COMPLETED') {
            toast.success('Your endpoint is secure!');
          }
        }
      } catch {
        clearInterval(interval);
        setPollInterval(null);
        setLoading(false);
      }
    }, 2000);
    setPollInterval(interval);
    return () => clearInterval(interval);
  }, [pollInterval, toast, fetchScans]);

  const handleScan = async () => {
    if (!targetUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }
    setLoading(true);
    setCurrentScan(null);
    try {
      const res = await api.post('/security-scans', { targetUrl: targetUrl.trim(), provider });
      const scan = res.data;
      setCurrentScan({ ...scan, securityScore: null, isVulnerable: false, detectedFramework: null, results: {}, createdAt: scan.createdAt });
      pollScan(scan.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start scan');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scan?')) return;
    try {
      await api.delete(`/security-scans/${id}`);
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (currentScan?.id === id) setCurrentScan(null);
      toast.success('Scan deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete scan');
    }
  };

  const handleRescan = (scan: ScanResult) => {
    setTargetUrl(scan.targetUrl);
    setProvider(scan.provider);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const plan = user?.plan || 'FREE';
  const scanLimit = plan === 'FREE' ? 30 : plan === 'PRO' ? 500 : 2000;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <SEO
        title="HookShield — Webhook Security Scanner | HookSwing"
        description="Test your webhook endpoint for signature verification vulnerabilities. Find out if you're one of the 1,542 apps accepting fake payments."
        keywords="webhook security, stripe webhook verification, webhook vulnerability scanner, signature verification"
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">{t('hookshield.title')}</h1>
          </div>
          <p className="text-slate-400">{t('hookshield.subtitle')}</p>
        </div>

        {/* Educational Banner */}
        <div className="mb-8 rounded-xl border-l-4 border-red-500 bg-red-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-white mb-2">{t('hookshield.bannerTitle')}</h2>
              <p className="text-sm text-slate-300 mb-2">{t('hookshield.bannerBody1')}</p>
              <p className="text-sm text-slate-300">{t('hookshield.bannerBody2')}</p>
            </div>
          </div>
        </div>

        {/* Scan Input */}
        <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            {t('hookshield.scanInput.label')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={t('hookshield.scanInput.urlPlaceholder')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={handleScan}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? t('hookshield.scanInput.scanning') : t('hookshield.scanInput.scanButton')}
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {plan === 'FREE'
              ? t('hookshield.scanInput.freeLimit', { count: 50 })
              : t('hookshield.scanInput.proLimit', { count: scanLimit })}
          </p>
        </div>

        {/* Current Scan Results */}
        {currentScan && (
          <div className="mb-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-400" />
              {t('hookshield.results.title')}
            </h3>

            {currentScan.status === 'RUNNING' || currentScan.status === 'PENDING' ? (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Scanning {currentScan.targetUrl}...</span>
              </div>
            ) : currentScan.status === 'FAILED' ? (
              <div className="text-red-400">Scan failed. Please try again.</div>
            ) : (
              <>
                <SecurityScoreBadge score={currentScan.securityScore} t={t} />

                {currentScan.results?.summary && (
                  <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold">{t('hookshield.results.recommendation')}:</span>{' '}
                      {currentScan.results.summary.recommendation}
                    </p>
                    {currentScan.detectedFramework && (
                      <p className="mt-2 text-xs text-slate-500">
                        {t('hookshield.results.framework')}: {currentScan.detectedFramework}
                      </p>
                    )}
                  </div>
                )}

                {currentScan.results && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TestResultCard
                      title={t('hookshield.results.testA')}
                      statusCode={currentScan.results.testA_noSignature?.statusCode || 0}
                      responseTimeMs={currentScan.results.testA_noSignature?.responseTimeMs || 0}
                      passed={currentScan.results.testA_noSignature?.passed || false}
                    />
                    <TestResultCard
                      title={t('hookshield.results.testB')}
                      statusCode={currentScan.results.testB_invalidSignature?.statusCode || 0}
                      responseTimeMs={currentScan.results.testB_invalidSignature?.responseTimeMs || 0}
                      passed={currentScan.results.testB_invalidSignature?.passed || false}
                    />
                    <TestResultCard
                      title={t('hookshield.results.testC')}
                      statusCode={currentScan.results.testC_wrongSecret?.statusCode || 0}
                      responseTimeMs={currentScan.results.testC_wrongSecret?.responseTimeMs || 0}
                      passed={currentScan.results.testC_wrongSecret?.passed || false}
                    />
                  </div>
                )}

                {currentScan.isVulnerable && currentScan.detectedFramework && (
                  <FixCodeBlock
                    framework={currentScan.detectedFramework}
                    provider={currentScan.provider}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Scan History */}
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('hookshield.history.title')}</h3>
          {scansLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          ) : scans.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">{t('hookshield.history.noScans')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">{t('hookshield.history.date')}</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">{t('hookshield.history.url')}</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">{t('hookshield.history.score')}</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">{t('hookshield.history.status')}</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-medium">{t('hookshield.history.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[200px] truncate">
                        {scan.targetUrl}
                      </td>
                      <td className="py-2.5 px-3">
                        {scan.securityScore !== null ? (
                          <span className={`font-bold ${
                            scan.securityScore >= 90 ? 'text-emerald-400' :
                            scan.securityScore >= 70 ? 'text-amber-400' :
                            scan.securityScore >= 50 ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {scan.securityScore}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          scan.status === 'COMPLETED'
                            ? scan.isVulnerable ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                            : scan.status === 'RUNNING' || scan.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {t(`hookshield.statuses.${scan.status.toLowerCase()}` as any)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRescan(scan)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            Re-scan
                          </button>
                          <button
                            onClick={() => handleDelete(scan.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title={t('hookshield.history.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
