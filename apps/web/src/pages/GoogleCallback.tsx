import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Google login failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!accessToken || !refreshToken) {
      setError('Invalid login response. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Fetch user and redirect
    fetch(`${(import.meta as any).env?.VITE_API_URL || 'https://hookswing.com'}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          updateUser(data.user);
          navigate('/dashboard');
        } else {
          setError('Could not load user. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      })
      .catch(() => {
        setError('Network error. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      });
  }, [searchParams, navigate, updateUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-slate-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
        <p className="text-white">Completing Google login...</p>
      </div>
    </div>
  );
}
