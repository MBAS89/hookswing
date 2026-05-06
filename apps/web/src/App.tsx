import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DocsPage from './pages/DocsPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import BillingPage from './pages/BillingPage';
import TeamPage from './pages/TeamPage';
import DashboardLayout from './components/layout/DashboardLayout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><DashboardPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/projects/:id" element={<PrivateRoute><DashboardLayout><ProjectPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/billing" element={<PrivateRoute><DashboardLayout><BillingPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/team" element={<PrivateRoute><DashboardLayout><TeamPage /></DashboardLayout></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
