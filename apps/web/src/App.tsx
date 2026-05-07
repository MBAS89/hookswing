import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DocsPage from './pages/DocsPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import BillingPage from './pages/BillingPage';
import TeamPage from './pages/TeamPage';
import WorkspacePage from './pages/WorkspacePage';
import CliPage from './pages/CliPage';
import AdminPage from './pages/AdminPage';
import AccountPage from './pages/AccountPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CareersPage from './pages/CareersPage';
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
      <Route path="/dashboard/billing" element={<Navigate to="/dashboard/account" replace />} />
      <Route path="/dashboard/account" element={<PrivateRoute><DashboardLayout><AccountPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/team" element={<PrivateRoute><DashboardLayout><TeamPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/workspace/:teamId" element={<PrivateRoute><DashboardLayout><WorkspacePage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/cli" element={<PrivateRoute><DashboardLayout><CliPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/admin" element={<PrivateRoute><DashboardLayout><AdminPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/careers" element={<CareersPage />} />
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
