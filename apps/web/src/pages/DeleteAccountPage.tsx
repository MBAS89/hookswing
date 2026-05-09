import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function DeleteAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Deleting your account...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing confirmation token.');
      return;
    }

    api
      .post('/auth/delete-confirm', { token })
      .then(() => {
        setStatus('success');
        setMessage('Your account has been permanently deleted.');
        // Clear any stored tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setTimeout(() => navigate('/'), 3000);
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Failed to delete account. The link may have expired.');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Deleting Account</h1>
            <p className="text-sm text-slate-400">{message}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Account Deleted</h1>
            <p className="text-sm text-slate-400">{message}</p>
            <p className="text-xs text-slate-500 mt-4">Redirecting to homepage...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Deletion Failed</h1>
            <p className="text-sm text-slate-400">{message}</p>
            <button
              onClick={() => navigate('/dashboard/account')}
              className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Back to Account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
