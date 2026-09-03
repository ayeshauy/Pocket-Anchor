import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function TopNav({ onSignIn }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isDash = loc.pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-cloud/85 border-b border-willow/10">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" data-testid="brand-link">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-mimosa to-orange" />
            <div className="absolute inset-1.5 rounded-full bg-cloud" />
            <div className="absolute inset-2.5 rounded-full bg-willow" />
          </div>
          <div className="leading-none">
            <p className="font-serif text-xl text-willow-dark">Pocket Anchor</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-willow-light">a quiet place</p>
          </div>
        </Link>

        {isDash && user && (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavPill to="/dashboard" label="Sanctuary" testId="nav-sanctuary" />
            <NavPill to="/dashboard/health" label="Health" testId="nav-health" />
            <NavPill to="/safety" label="Safety" testId="nav-safety" />
          </nav>
        )}

        <div className="flex items-center gap-3">
          <Link
            to="/safety"
            className="hidden sm:inline text-xs uppercase tracking-[0.18em] text-willow-dark hover:text-orange transition"
            data-testid="nav-safety-link"
          >
            Safety
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              {user.sanctuary_slug && (
                <Link
                  to="/dashboard"
                  className="hidden md:block text-xs text-willow-light hover:text-willow"
                  data-testid="anchor-link-pill"
                >
                  app.anchor/with/{user.sanctuary_slug}
                </Link>
              )}
              <button
                data-testid="logout-btn"
                onClick={logout}
                className="p-2 rounded-full hover:bg-cloud-muted transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-willow" />
              </button>
            </div>
          ) : (
            <Button
              data-testid="signin-btn"
              onClick={onSignIn}
              className="rounded-full bg-willow hover:bg-willow-dark text-cloud px-5"
            >
              Enter sanctuary
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function NavPill({ to, label, testId }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      data-testid={testId}
      className={`px-4 py-2 rounded-full transition ${active ? 'bg-willow text-cloud' : 'text-willow-dark hover:bg-cloud-muted'}`}
    >
      {label}
    </Link>
  );
}
