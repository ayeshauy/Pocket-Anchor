import { useState } from 'react';
import '@/App.css';
import '@/index.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import TopNav from '@/components/layout/TopNav';
import QuickExitDock from '@/components/safety/QuickExitDock';
import AuthModal from '@/components/auth/AuthModal';
import Landing from '@/pages/Landing';
import PricingPage from '@/pages/PricingPage';
import PrivacyPage from '@/pages/PrivacyPage';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import HealthPage from '@/pages/HealthPage';
import DejaPage from '@/pages/DejaPage';
import SafetyPage from '@/pages/SafetyPage';
import AnchorPublic from '@/pages/AnchorPublic';
import GuardianAccept from '@/pages/GuardianAccept';
import CirclePage from '@/pages/CirclePage';
import AuthCallback from '@/pages/AuthCallback';

function Protected({ children, needsSanctuary = true }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-mimosa/30 orb-breath" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (needsSanctuary && !user.sanctuary_slug) return <Navigate to="/onboarding" replace />;
  return children;
}

function Router() {
  const location = useLocation();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (location.hash?.includes('session_id=')) return <AuthCallback />;

  const isPublicAnchor = (location.pathname.startsWith('/with/')
    || location.pathname.startsWith('/circle/')
    || location.pathname.startsWith('/guardian/')) && !user;
  const showNav = !isPublicAnchor;

  return (
    <>
      {showNav && <TopNav onSignIn={() => setAuthOpen(true)} />}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <main id="main-content">
        <Routes>
        <Route path="/" element={<Landing onSignIn={() => setAuthOpen(true)} />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/with/:slug" element={<AnchorPublic />} />
        <Route path="/guardian/accept/:token" element={<GuardianAccept />} />
        <Route path="/circle/:token" element={<CirclePage />} />
        <Route path="/onboarding" element={
          <ProtectedNoSanctuary><Onboarding /></ProtectedNoSanctuary>
        } />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/dashboard/health" element={<Protected><HealthPage /></Protected>} />
        <Route path="/dashboard/deja" element={<Protected><DejaPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <QuickExitDock />
    </>
  );
}

function ProtectedNoSanctuary({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-mimosa/30 orb-breath" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.sanctuary_slug) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Router />
        <Toaster position="top-center" toastOptions={{ style: { background: '#FBFBF9', color: '#1F2623', border: '1px solid rgba(76,93,75,0.15)', fontFamily: 'DM Sans' } }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
