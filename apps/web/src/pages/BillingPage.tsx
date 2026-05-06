import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { Crown, CreditCard, Check, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<any>(null);

  useEffect(() => {
    api.get('/billing').then((res) => setBilling(res.data));
  }, []);

  const handleCheckout = async (plan: 'pro' | 'team') => {
    setLoading(true);
    try {
      const res = await api.post('/billing/checkout', { plan });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await api.post('/billing/portal');
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      current: user?.plan === 'FREE',
      features: ['3 projects', '500 webhooks/month', '7-day history', 'Basic inspection', 'CLI forwarding'],
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      current: user?.plan === 'PRO',
      features: ['Unlimited projects', '10,000 webhooks/month', '90-day history', 'Replay', 'Slack/Discord alerts', 'Export JSON/CSV'],
    },
    {
      name: 'Team',
      price: '$49',
      period: '/month',
      current: user?.plan === 'TEAM',
      features: ['Everything in Pro', 'Unlimited team members', 'Shared workspaces', 'Team activity log', 'Priority support'],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Billing</h1>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Current Plan</p>
            <p className="text-xl font-bold text-white">{user?.plan || 'FREE'}</p>
          </div>
          {user?.plan !== 'FREE' && (
            <button
              onClick={handlePortal}
              disabled={loading}
              className="ml-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Manage Billing
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl p-6 border ${
              plan.current
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            {plan.current && (
              <div className="absolute -top-2 left-4 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Current
              </div>
            )}
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-4">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              <span className="text-sm text-slate-500">{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {!plan.current && (
              <button
                onClick={() => handleCheckout(plan.name.toLowerCase() as 'pro' | 'team')}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
