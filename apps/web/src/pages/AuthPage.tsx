import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield, Mail, RotateCcw, ArrowLeft, KeyRound, Github } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      const messages: Record<string, string> = {
        github_denied: 'GitHub authorization was cancelled.',
        no_code: 'GitHub did not return an authorization code.',
        token_exchange_failed: 'Failed to exchange GitHub code for token. Check your GitHub app credentials.',
        oauth_failed: 'GitHub login failed. Please try again.',
        github_auth_failed: 'GitHub authentication failed after redirect.',
        oauth_not_configured: 'GitHub OAuth is not configured on the server.',
        github_no_email: 'Your GitHub account does not have a verified email. Please add one and try again.',
        github_api_error: 'Could not fetch your GitHub profile. Try again.',
        github_email_error: 'Could not fetch your GitHub emails. Try again.',
        db_error: 'Database error while creating your account. Try again.',
        token_gen_error: 'Failed to create session. Try again.',
      };
      const detail = searchParams.get('detail');
      const baseMsg = messages[urlError] || `OAuth error: ${urlError}`;
      setError(detail ? `${baseMsg} (${detail})` : baseMsg);
    }
  }, [searchParams]);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');

  // Email verification state
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const { t } = useTranslation();
  const { login, verify2FA, verifyEmail, resendVerification, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.requiresEmailVerification) {
          setRequiresVerification(true);
          setVerificationEmail(res.email);
          setLoading(false);
          return;
        }
        if (res.requires2FA) {
          setRequires2FA(true);
          setTempToken(res.tempToken);
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      } else {
        const res = await register(email, password, name || undefined);
        if (res.requiresEmailVerification) {
          setRequiresVerification(true);
          setVerificationEmail(res.email);
          if (res.emailError) {
            setError(res.emailError);
          }
          setLoading(false);
          return;
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verify2FA(tempToken, code);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(verificationEmail, otp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await resendVerification(verificationEmail);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setRequires2FA(false);
    setRequiresVerification(false);
    setShowForgot(false);
    setForgotSent(false);
    setTempToken('');
    setCode('');
    setOtp('');
    setError('');
  };

  const getTitle = () => {
    if (showForgot) return t('auth.resetPassword');
    if (requires2FA) return 'Two-Factor Authentication';
    if (requiresVerification) return t('auth.resetSent');
    return mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle');
  };

  const getSubtitle = () => {
    if (showForgot) return t('auth.resetSent');
    if (requires2FA) return 'Enter the 6-digit code from your authenticator app';
    if (requiresVerification) return `We sent a 6-digit code to ${verificationEmail}`;
    return mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex flex-col items-center gap-3 mb-4 group">
            <Logo className="w-16 h-16 group-hover:scale-105 transition-transform duration-300" />
            <span className="text-3xl font-bold text-white tracking-tight">HookSwing</span>
          </Link>
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>
          <h1 className="text-2xl font-bold text-white">{getTitle()}</h1>
          <p className="text-slate-400 mt-2">{getSubtitle()}</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl shadow-black/20">
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {error}
            </div>
          )}

          {requires2FA ? (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/20">
                  <Shield className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Authentication Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={8}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 tracking-[0.3em] text-center text-lg transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.confirm')}
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="w-full text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.signIn')}
              </button>
            </form>
          ) : requiresVerification ? (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/20">
                  <Mail className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  inputMode="numeric"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 tracking-[0.3em] text-center text-lg transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.confirm')}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                {resendCooldown > 0 ? `${resendCooldown}s` : t('common.retry')}
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="w-full text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.signIn')}
              </button>
            </form>
          ) : showForgot ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgotSent ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/20 mx-auto">
                    <Mail className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{t('auth.resetSent')}</h3>
                  <p className="text-slate-400 text-sm">
                    If an account exists for <strong className="text-white">{forgotEmail}</strong>, we've sent a password reset link. The link expires in 1 hour.
                  </p>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                  >
                    {t('auth.signIn')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center ring-1 ring-emerald-500/20">
                      <KeyRound className="w-7 h-7 text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.email')}</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('auth.resetPassword')}
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="w-full text-slate-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('auth.signIn')}
                  </button>
                </>
              )}
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.name')}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">{t('auth.password')}</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setShowForgot(true); setError(''); }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 pr-11 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-3 text-slate-500">{t('auth.orContinueWith')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const apiUrl = (import.meta as any).env?.VITE_API_URL || window.location.origin;
                  const githubUrl = `${apiUrl}/api/auth/github`;
                  console.log('[GitHub OAuth] Navigating to:', githubUrl);
                  window.location.href = githubUrl;
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border border-slate-700"
              >
                <Github className="w-5 h-5" />
                {t('auth.github')}
              </button>

              <div className="mt-6 pt-6 border-t border-slate-800 text-center text-sm text-slate-400">
                {mode === 'login' ? (
                  <>
                    {t('auth.noAccount')}{' '}
                    <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">{t('auth.signUp')}</Link>
                  </>
                ) : (
                  <>
                    {t('auth.hasAccount')}{' '}
                    <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">{t('auth.signIn')}</Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
