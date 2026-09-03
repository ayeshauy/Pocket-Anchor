import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = location.hash || window.location.hash;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const sid = params.get('session_id');
    if (!sid) { navigate('/'); return; }
    (async () => {
      try {
        const r = await api.post('/auth/session', { session_id: sid });
        setUser(r.user);
        // clear hash
        window.history.replaceState({}, '', window.location.pathname);
        if (!r.user.sanctuary_slug) navigate('/onboarding', { state: { user: r.user }, replace: true });
        else navigate('/dashboard', { state: { user: r.user }, replace: true });
      } catch (e) {
        navigate('/');
      }
    })();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-mimosa/30 orb-breath" />
        <p className="mt-6 font-serif text-2xl text-willow" data-testid="auth-callback-status">Preparing your sanctuary…</p>
      </div>
    </div>
  );
}
