import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Crown, CreditCard, Check, Loader2, FileText, Calendar, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function BillingPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<any>(null);
  const [yearly, setYearly] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);
  const { t } = useTranslation();

  const isFree = (user?.plan || 'FREE') === 'FREE';
  const currentPlanName = (user?.plan || 'FREE') as 'FREE' | 'PRO' | 'TEAM';
  const currentInterval = billing?.currentInterval || 'month';

  const fetchBilling = async () => {
    try {
      const res = await api.get('/billing');
      setBilling(res.data);
      if (res.data.currentInterval) {
        setYearly(res.data.currentInterval === 'year');
      }
      const me = await api.get('/auth/me');
      if (me.data.user) updateUser(me.data.user);
    } catch (err) {
      console.error('Failed to refresh billing data', err);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleSubscribe = async (plan: 'pro' | 'team') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/billing/checkout', { plan, interval: yearly ? 'year' : 'month' });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.error || t('billingPage.checkoutFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPlan = async (plan: 'pro' | 'team') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/billing/update-plan', { plan, interval: yearly ? 'year' : 'month' });
      if (res.data.success) {
        const intervalLabel = res.data.interval === 'year' ? t('billingPage.yearly') : t('billingPage.monthly');
        setNotification({ type: 'success', message: t('billingPage.planUpdated').replace('{{plan}}', res.data.plan).replace('{{interval}}', intervalLabel) });
        await fetchBilling();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('billingPage.planSwitchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleYearly = () => {
    setYearly(!yearly);
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await api.post('/billing/portal');
      if (res.data.url) window.location.href = res.data.url;
    } finally {
      setLoading(false);
    }
  };

  const isExactCurrent = (planName: 'FREE' | 'PRO' | 'TEAM', interval: 'month' | 'year') => {
    if (planName === 'FREE') return currentPlanName === 'FREE';
    if (currentPlanName !== planName) return false;
    return currentInterval === interval;
  };

  const plans = [
    {
      name: t('billingPage.free.name'),
      planKey: 'FREE' as const,
      price: '$0',
      period: t('billingPage.free.period'),
      features: t('billingPage.free.features'),
    },
    {
      name: t('billingPage.pro.name'),
      planKey: 'PRO' as const,
      price: yearly ? '$190' : '$19',
      period: yearly ? t('billingPage.pro.periodYearly') : t('billingPage.pro.periodMonthly'),
      features: t('billingPage.pro.features'),
    },
    {
      name: t('billingPage.team.name'),
      planKey: 'TEAM' as const,
      price: yearly ? '$490' : '$49',
      period: yearly ? t('billingPage.team.periodYearly') : t('billingPage.team.periodMonthly'),
      features: t('billingPage.team.features'),
    },
  ];

  const sub = billing?.subscriptions?.find((s: any) => s.status === 'active' || s.status === 'trialing');

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{t('billingPage.title')}</h1>

      {/* {t('billingPage.currentPlan')} */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('billingPage.currentPlan')}</p>
            <p className="text-xl font-bold text-white">
              {user?.plan || t('billingPage.free.name')}
              {!isFree && <span className="text-sm font-normal text-slate-400 ml-2">({currentInterval === 'year' ? t('billingPage.yearly') : t('billingPage.monthly')})</span>}
            </p>
          </div>
          {!isFree && (
            <button
              onClick={handlePortal}
              disabled={loading}
              className="ml-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {t('billingPage.manageBilling')}
            </button>
          )}
        </div>

        {sub && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">{t('billingPage.currentPeriod')}</p>
                <p className="text-sm text-white">{formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-500">{t('billingPage.status')}</p>
                <p className="text-sm text-white capitalize">{sub.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-4 h-4 ${sub.cancelAtPeriodEnd ? 'text-amber-400' : 'text-emerald-400'}`} />
              <div>
                <p className="text-xs text-slate-500">{t('billingPage.renews')}</p>
                <p className={`text-sm ${sub.cancelAtPeriodEnd ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {sub.cancelAtPeriodEnd ? t('billingPage.cancelsOn').replace('{{date}}', formatDate(sub.currentPeriodEnd)) : formatDate(sub.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div className={`rounded-lg p-4 text-sm mb-6 ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {notification.message}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Invoices */}
      {billing?.invoices?.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            {t('billingPage.invoices')}
          </h2>
          <div className="space-y-2">
            {billing.invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-white font-medium">{t('billingPage.invoiceNumber').replace('{{number}}', inv.number)}</p>
                  <p className="text-xs text-slate-500">{formatDate(inv.created)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {inv.status}
                  </span>
                  <span className="text-sm text-white font-medium">{formatCurrency(inv.amountPaid || inv.amountDue, inv.currency)}</span>
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 underline">{t('billingPage.pdf')}</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm ${!yearly ? 'text-white' : 'text-slate-500'}`}>{t('billingPage.monthly')}</span>
        <button
          onClick={handleToggleYearly}
          className="relative w-12 h-6 bg-slate-700 rounded-full transition-colors"
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? 'translate-x-6' : ''}`} />
        </button>
        <span className={`text-sm ${yearly ? 'text-white' : 'text-slate-500'}`}>{t('billingPage.yearly')} <span className="text-emerald-400">{t('billingPage.saveMonths')}</span></span>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const exactCurrent = isExactCurrent(plan.planKey, yearly ? 'year' : 'month');
          const isCurrentPlanTier = currentPlanName === plan.planKey;
          const isSameTierDifferentInterval = !isFree && isCurrentPlanTier && !exactCurrent;
          const showButton = !exactCurrent && plan.planKey !== 'FREE';

          return (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 border ${
                exactCurrent
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {exactCurrent && (
                <div className="absolute -top-2 left-4 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {t('billingPage.current')}
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2 mb-4">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {showButton && (
                <button
                  onClick={() => isFree ? handleSubscribe(plan.planKey.toLowerCase() as 'pro' | 'team') : handleSwitchPlan(plan.planKey.toLowerCase() as 'pro' | 'team')}
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                    isFree ? t('billingPage.subscribeTo').replace('{{plan}}', plan.name) :
                    isSameTierDifferentInterval ? t('billingPage.switchToInterval').replace('{{interval}}', yearly ? t('billingPage.yearly') : t('billingPage.monthly')) :
                    t('billingPage.switchToPlan').replace('{{plan}}', plan.name)
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
