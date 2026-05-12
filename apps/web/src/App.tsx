import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import { I18nProvider, useTranslation } from './i18n';
import ToastContainer from './components/ui/ToastContainer';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import GitHubCallback from './pages/GitHubCallback';
import GoogleCallback from './pages/GoogleCallback';
import DocsPage from './pages/DocsPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import BillingPage from './pages/BillingPage';
import TeamPage from './pages/TeamPage';
import WorkspacePage from './pages/WorkspacePage';
import CliPage from './pages/CliPage';
import TesterPage from './pages/TesterPage';
import AdminPage from './pages/AdminPage';
import AccountPage from './pages/AccountPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CareersPage from './pages/CareersPage';
import BlogIndexPage from './pages/BlogIndexPage';
import BlogPostPage from './pages/BlogPostPage';
import NgrokAlternativePage from './pages/alternatives/NgrokAlternativePage';
import WebhookSiteAlternativePage from './pages/alternatives/WebhookSiteAlternativePage';
import RequestBinAlternativePage from './pages/alternatives/RequestBinAlternativePage';
import BeeceptorAlternativePage from './pages/alternatives/BeeceptorAlternativePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import HookShieldPage from './pages/HookShieldPage';
import VerifySignaturePage from './pages/tools/VerifySignaturePage';
import DashboardLayout from './components/layout/DashboardLayout';
import { usePageTracking } from './hooks/usePageTracking';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">{t('app.loading')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  usePageTracking();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/auth/github/callback" element={<GitHubCallback />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><DashboardPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/projects/:id" element={<PrivateRoute><DashboardLayout><ProjectPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/billing" element={<Navigate to="/dashboard/account" replace />} />
      <Route path="/dashboard/account" element={<PrivateRoute><DashboardLayout><AccountPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/team" element={<PrivateRoute><DashboardLayout><TeamPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/workspace/:teamId" element={<PrivateRoute><DashboardLayout><WorkspacePage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/tester" element={<PrivateRoute><DashboardLayout><TesterPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/cli" element={<PrivateRoute><DashboardLayout><CliPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/admin" element={<PrivateRoute><DashboardLayout><AdminPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/dashboard/hookshield" element={<PrivateRoute><DashboardLayout><HookShieldPage /></DashboardLayout></PrivateRoute>} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/blog" element={<BlogIndexPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/alternatives/ngrok" element={<NgrokAlternativePage />} />
      <Route path="/alternatives/webhook-site" element={<WebhookSiteAlternativePage />} />
      <Route path="/alternatives/requestbin" element={<RequestBinAlternativePage />} />
      <Route path="/alternatives/beeceptor" element={<BeeceptorAlternativePage />} />
      <Route path="/tools/verify-signature" element={<VerifySignaturePage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/delete-account" element={<DeleteAccountPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
