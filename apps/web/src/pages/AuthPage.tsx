import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');

  const { login, verify2FA, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.requires2FA) {
          setRequires2FA(true);
          setTempToken(res.tempToken);
          setLoading(false);
          return;
        }
      } else {
        await register(email, password, name || undefined);
      }
      navigate('/dashboard');
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Logo className="w-10 h-10" />
            <span className="text-2xl font-bold text-white">HookSwing</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {requires2FA ? 'Two-Factor Authentication' : mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-slate-400 mt-2">
            {requires2FA
              ? 'Enter the 6-digit code from your authenticator app'
              : mode === 'login'
              ? 'Sign in to catch some webhooks'
              : 'Start catching webhooks for free'}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {requires2FA ? (
            <form onSubmit={handle2FASubmit} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 tracking-widest text-center"
                />
              </div>
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </button>
              <button
                type="button"
                onClick={() => { setRequires2FA(false); setTempToken(''); setCode(''); setError(''); }}
                className="w-full text-slate-400 hover:text-white text-sm transition-colors"
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-lg font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}

          {!requires2FA && (
            <div className="mt-6 text-center text-sm text-slate-400">
              {mode === 'login' ? (
                <>
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign up free</Link>
                </>
              ) : (
                <>
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">Sign in</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
