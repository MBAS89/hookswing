import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../lib/api';

interface TeamMembership {
  team: { id: string; name: string };
  role: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  teams?: TeamMembership[];
}

interface AuthContextType {
  user: User | null;
  pendingInvites: number;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  verify2FA: (tempToken: string, code: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  register: (email: string, password: string, name?: string) => Promise<any>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          setPendingInvites(res.data.pendingInvites || 0);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.requiresEmailVerification) {
      return res.data; // { requiresEmailVerification: true, email }
    }
    if (res.data.requires2FA) {
      return res.data; // { requires2FA: true, tempToken }
    }
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    setPendingInvites(res.data.pendingInvites || 0);
    return res.data;
  }, []);

  const verify2FA = useCallback(async (tempToken: string, code: string) => {
    const res = await api.post('/auth/login/2fa', { tempToken, code });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    setPendingInvites(res.data.pendingInvites || 0);
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const res = await api.post('/auth/verify-email', { email, code });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user);
    setPendingInvites(res.data.pendingInvites || 0);
    return res.data;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const res = await api.post('/auth/send-verification', { email });
    return res.data;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const res = await api.post('/auth/register', { email, password, name });
    return res.data; // { requiresEmailVerification: true, email }
  }, []);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setPendingInvites(0);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, pendingInvites, loading, login, verify2FA, verifyEmail, resendVerification, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
