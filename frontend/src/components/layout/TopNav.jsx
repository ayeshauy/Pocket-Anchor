import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const LANDING_LINKS = [
  { label: 'Platform', hash: 'platform', testId: 'nav-platform' },
  { label: 'About', hash: 'about', testId: 'nav-about' },
  { label: 'How It Works', hash: 'how-it-works', testId: 'nav-how-it-works' },
  { label: 'Best Fit', hash: 'best-fit', testId: 'nav-best-fit' },
  { label: 'Plans', hash: 'plans', testId: 'nav-plans' },
  { label: 'FAQ', hash: 'faq', testId: 'nav-faq' },
];

export default function TopNav({ onSignIn }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const isDash = loc.pathname.startsWith('/dashboard');

  const quickExit = () => window.dispatchEvent(new CustomEvent('anchor:quick-exit'));

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-cloud/85 border-b border-willow/10">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0" data-testid="brand-link">
          <img src="/logo.png" alt="Pocket Anchor" className="w-8 h-8 rounded-lg" data-testid="brand-logo" />
          <div className="leading-none">
            <p className="font-serif text-xl text-willow-dark">Pocket Anchor</p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-willow-light">a quiet place</p>
          </div>
        </Link>

        {isDash && user ? (
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavPill to="/dashboard" label="Sanctuary" testId="nav-sanctuary" />
            <NavPill to="/dashboard/health" label="Health" testId="nav-health" />
            <NavPill to="/safety" label="Safety" testId="nav-safety" />
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-1 text-sm" data-testid="landing-nav">
            {LANDING_LINKS.map((l) => (
              <a
                key={l.hash}
                href={`/#${l.hash}`}
                data-testid={l.testId}
                className="px-3 py-2 rounded-full text-willow-dark hover:bg-cloud-muted transition"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            data-testid="nav-quick-exit-btn"
            onClick={quickExit}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-willow-light hover:text-orange transition px-2"
            title="Instantly hide this page"
          >
            Quick Exit <span className="font-mono text-[10px] border border-willow/20 rounded px-1">ESC</span>
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              {!isDash && (
                <Link to="/dashboard">
                  <Button data-testid="launch-sanctuary-btn" className="rounded-full bg-willow hover:bg-willow-dark text-cloud px-5">
                    Launch Sanctuary
                  </Button>
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
              data-testid="launch-sanctuary-btn"
              onClick={onSignIn}
              className="rounded-full bg-willow hover:bg-willow-dark text-cloud px-5"
            >
              Launch Sanctuary
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
