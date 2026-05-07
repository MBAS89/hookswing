import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import {
  User,
  Lock,
  Shield,
  CreditCard,
  Check,
  Loader2,
  Crown,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  FileText,
  Calendar,
  AlertCircle,
  Save,
  QrCode,
  RefreshCw,
  LogOut,
  ChevronRight,
  XCircle,
} from 'lucide-react';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default function AccountPage() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="lg:w-56 shrink-0">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 border-l-2 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
          {activeTab === 'password' && <PasswordTab />}
          {activeTab === 'security' && <SecurityTab user={user} updateUser={updateUser} logout={logout} />}
          {activeTab === 'billing' && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Profile Tab ---------- */
function ProfileTab({ user, updateUser }: { user: any; updateUser: (u: any) => void }) {
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await api.patch('/auth/me', { name: name || undefined });
      updateUser(res.data.user);
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed"
              placeholder="you@example.com"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {user?.emailVerified ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Email cannot be changed.</p>
        </div>

        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

/* ---------- Password Tab ---------- */
function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMessage('Password changed. Please log in again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors pr-10"
            />
            <button
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors pr-10"
            />
            <button
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes('success') || message.includes('changed') ? 'text-emerald-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleChange}
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          Update Password
        </button>
      </div>
    </div>
  );
}

/* ---------- Security / 2FA Tab ---------- */
function SecurityTab({ user, updateUser, logout }: { user: any; updateUser: (u: any) => void; logout: () => void }) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const startSetup = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/auth/2fa/setup');
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setSetupCode('');
      setBackupCodes(null);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!setupCode) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/auth/2fa/verify', { code: setupCode });
      setBackupCodes(res.data.backupCodes);
      updateUser({ ...user, twoFactorEnabled: true });
      setMessage('2FA enabled successfully');
      setQrCode('');
      setSecret('');
      setSetupCode('');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    setMessage('');
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword, code: disableCode });
      updateUser({ ...user, twoFactorEnabled: false });
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableCode('');
      setMessage('2FA disabled successfully');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
            <p className="text-sm text-slate-400 mt-1">
              {user?.twoFactorEnabled
                ? '2FA is enabled on your account.'
                : 'Add an extra layer of security by enabling 2FA.'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${user?.twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {!user?.twoFactorEnabled && !qrCode && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Enable 2FA
          </button>
        )}

        {user?.twoFactorEnabled && (
          <button
            onClick={() => setShowDisableModal(true)}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            Disable 2FA
          </button>
        )}

        {message && (
          <p className={`text-sm mt-4 ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>{message}</p>
        )}
      </div>

      {/* 2FA Setup Flow */}
      {qrCode && !backupCodes && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="text-md font-semibold text-white mb-4">Scan QR Code</h3>
          <p className="text-sm text-slate-400 mb-4">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          <div className="flex flex-col items-center gap-4 mb-6">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-lg" />
            <div className="flex items-center gap-2">
              <code className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-300 font-mono">
                {secret}
              </code>
              <button onClick={copySecret} className="text-slate-400 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-400">
              Enter the 6-digit code from your authenticator app
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value)}
                maxLength={8}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors tracking-widest text-center"
                placeholder="000000"
              />
              <button
                onClick={verifySetup}
                disabled={loading || setupCode.length < 6}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes */}
      {backupCodes && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-md font-semibold text-white">Save Your Backup Codes</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            These codes can be used to access your account if you lose your authenticator device.
            Save them somewhere safe — they will not be shown again.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, i) => (
              <code
                key={i}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-emerald-400 font-mono text-center"
              >
                {code}
              </code>
            ))}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(backupCodes.join('\n'));
            }}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy all codes
          </button>
        </div>
      )}

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-2">Disable 2FA</h3>
            <p className="text-sm text-slate-400 mb-4">
              Enter your password and a 2FA code to disable two-factor authentication.
            </p>

            <div className="space-y-3 mb-4">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Current password"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="2FA code"
                maxLength={8}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 tracking-widest"
              />
            </div>

            {message && <p className="text-sm text-red-400 mb-3">{message}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDisableModal(false); setMessage(''); }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={disable2FA}
                disabled={loading || !disablePassword || !disableCode}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Billing Tab ---------- */
function BillingTab() {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<any>(null);
  const [yearly, setYearly] = useState(searchParams.get('yearly') === 'true');
  const [checkoutError, setCheckoutError] = useState('');
  const [notification, setNotification] = useState<{type: 'success'|'info'|'error', message: string} | null>(null);

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';

  const isFree = (user?.plan || 'FREE') === 'FREE';
  const currentPlanName = (user?.plan || 'FREE') as 'FREE' | 'PRO' | 'TEAM';
  const currentInterval = billing?.currentInterval || 'month';

  const fetchBilling = async () => {
    try {
      const res = await api.get('/billing');
      setBilling(res.data);
      // Sync yearly toggle to actual subscription interval
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

  useEffect(() => {
    if (isSuccess) {
      setNotification({ type: 'success', message: 'Payment successful! Your plan is being updated...' });
      fetchBilling();
      setTimeout(() => {
        navigate('/dashboard/account', { replace: true });
        setNotification(null);
      }, 5000);
    } else if (isCanceled) {
      setNotification({ type: 'info', message: 'Payment canceled. You can try again anytime.' });
      setTimeout(() => {
        navigate('/dashboard/account', { replace: true });
        setNotification(null);
      }, 4000);
    }
  }, [isSuccess, isCanceled]);

  // For FREE users: create new subscription via Stripe Checkout
  const handleSubscribe = async (plan: 'pro' | 'team') => {
    setLoading(true);
    setCheckoutError('');
    try {
      const res = await api.post('/billing/checkout', { plan, interval: yearly ? 'year' : 'month' });
      if (res.data.url) window.location.href = res.data.url;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Checkout failed. Please try again.';
      setCheckoutError(msg);
    } finally {
      setLoading(false);
    }
  };

  // For existing subscribers: update subscription with Stripe proration
  const handleSwitchPlan = async (plan: 'pro' | 'team') => {
    setLoading(true);
    setCheckoutError('');
    try {
      const res = await api.post('/billing/update-plan', { plan, interval: yearly ? 'year' : 'month' });
      if (res.data.success) {
        setNotification({ type: 'success', message: `Plan updated to ${res.data.plan} (${res.data.interval}ly). Stripe will charge or credit the prorated difference.` });
        await fetchBilling();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Plan switch failed. Please try again.';
      setCheckoutError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Toggle billing interval for existing subscribers
  const handleToggleYearly = async () => {
    const newYearly = !yearly;
    setYearly(newYearly);
    if (!isFree && currentPlanName !== 'FREE') {
      // Auto-switch interval for current plan
      setLoading(true);
      try {
        const res = await api.post('/billing/update-plan', {
          plan: currentPlanName.toLowerCase(),
          interval: newYearly ? 'year' : 'month',
        });
        if (res.data.success) {
          setNotification({ type: 'success', message: `Switched to ${newYearly ? 'yearly' : 'monthly'} billing. Stripe handled the proration.` });
          await fetchBilling();
        }
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Interval switch failed.';
        setCheckoutError(msg);
        setYearly(!newYearly); // Revert toggle on error
      } finally {
        setLoading(false);
      }
    }
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

  // Determine if a given plan+interval is the exact current one
  const isExactCurrent = (planName: 'FREE' | 'PRO' | 'TEAM', interval: 'month' | 'year') => {
    if (planName === 'FREE') return currentPlanName === 'FREE';
    if (currentPlanName !== planName) return false;
    return currentInterval === interval;
  };

  const plans = [
    {
      name: 'Free',
      planKey: 'FREE' as const,
      price: '$0',
      period: 'forever',
      features: ['3 projects', '500 webhooks/month', '7-day history', 'Basic inspection', 'CLI forwarding'],
    },
    {
      name: 'Pro',
      planKey: 'PRO' as const,
      price: yearly ? '$190' : '$19',
      period: yearly ? '/year' : '/month',
      features: ['Unlimited projects', '10,000 webhooks/month', '90-day history', 'Replay', 'Slack/Discord alerts', 'Export JSON/CSV'],
    },
    {
      name: 'Team',
      planKey: 'TEAM' as const,
      price: yearly ? '$490' : '$49',
      period: yearly ? '/year' : '/month',
      features: ['Everything in Pro', 'Unlimited team members', 'Shared workspaces', 'Team activity log', 'Priority support'],
    },
  ];

  const sub = billing?.subscriptions?.find((s: any) => s.status === 'active' || s.status === 'trialing');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Current Plan</p>
            <p className="text-xl font-bold text-white">
              {user?.plan || 'FREE'}
              {!isFree && <span className="text-sm font-normal text-slate-400 ml-2">({currentInterval === 'year' ? 'Yearly' : 'Monthly'})</span>}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={fetchBilling}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              title="Refresh subscription status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {!isFree && (
              <button
                onClick={handlePortal}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
              </button>
            )}
          </div>
        </div>

        {sub && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Current period</p>
                <p className="text-sm text-white">{formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm text-white capitalize">{sub.status}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-4 h-4 ${sub.cancelAtPeriodEnd ? 'text-amber-400' : 'text-emerald-400'}`} />
              <div>
                <p className="text-xs text-slate-500">Renews</p>
                <p className={`text-sm ${sub.cancelAtPeriodEnd ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {sub.cancelAtPeriodEnd ? 'Cancels on ' + formatDate(sub.currentPeriodEnd) : formatDate(sub.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {billing?.subscriptions && billing.subscriptions.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            Subscriptions
          </h2>
          <div className="space-y-2">
            {billing.subscriptions.map((sub: any) => (
              <div key={sub.id} className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                sub.status === 'active' ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-slate-800/50'
              }`}>
                <div>
                  <p className="text-sm text-white font-medium">
                    {sub.plan} — {sub.interval === 'year' ? 'Yearly' : 'Monthly'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {sub.status}
                  </span>
                  {sub.cancelAtPeriodEnd && (
                    <span className="text-xs text-amber-400">Cancels soon</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {billing?.invoices?.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            Invoices
          </h2>
          <div className="space-y-2">
            {billing.invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-white font-medium">Invoice #{inv.number}</p>
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
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 underline">PDF</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notification && (
        <div className={`rounded-lg p-4 text-sm ${
          notification.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : notification.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
        }`}>
          {notification.message}
        </div>
      )}

      {checkoutError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {checkoutError}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${!yearly ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
        <button
          onClick={handleToggleYearly}
          disabled={loading}
          className="relative w-12 h-6 bg-slate-700 rounded-full transition-colors disabled:opacity-50"
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${yearly ? 'translate-x-6' : ''}`} />
        </button>
        <span className={`text-sm ${yearly ? 'text-white' : 'text-slate-500'}`}>Yearly <span className="text-emerald-400">(save 2 months)</span></span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const exactCurrent = isExactCurrent(plan.planKey, yearly ? 'year' : 'month');
          const isCurrentPlanTier = currentPlanName === plan.planKey;
          const isDifferentTier = plan.planKey !== 'FREE' && currentPlanName !== 'FREE' && plan.planKey !== currentPlanName;
          const isSameTierDifferentInterval = !isFree && isCurrentPlanTier && !exactCurrent;
          const showButton = !exactCurrent && plan.planKey !== 'FREE';

          return (
            <div
              key={plan.name}
              className={`relative rounded-xl p-5 border ${
                exactCurrent
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {exactCurrent && (
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
              {showButton && (
                <button
                  onClick={() => isFree ? handleSubscribe(plan.planKey.toLowerCase() as 'pro' | 'team') : handleSwitchPlan(plan.planKey.toLowerCase() as 'pro' | 'team')}
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> :
                    isFree ? `Subscribe to ${plan.name}` :
                    isSameTierDifferentInterval ? `Switch to ${yearly ? 'Yearly' : 'Monthly'}` :
                    isDifferentTier ? `Switch to ${plan.name}` :
                    `Switch to ${plan.name}`
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
