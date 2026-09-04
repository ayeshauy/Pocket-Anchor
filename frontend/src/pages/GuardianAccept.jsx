import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function GuardianAccept() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      try { setResult(await api.get(`/guardians/accept/${token}`)); }
      catch { setError('This invite link has expired or was never sent.'); }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-5" data-testid="guardian-accept-page">
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-mimosa-soft/70 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-willow/10 blur-3xl" />
      <div className="relative card-organic p-10 max-w-md w-full text-center">
        {!result && !error && <div className="w-14 h-14 mx-auto rounded-full bg-mimosa/30 orb-breath" />}
        {error && (
          <>
            <h1 className="font-serif text-3xl text-willow-dark">This doorway has closed.</h1>
            <p className="mt-3 text-sm text-[#535E56]">{error}</p>
          </>
        )}
        {result && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-willow to-willow-dark flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-mimosa" />
            </div>
            <h1 className="font-serif text-3xl text-willow-dark mt-6" data-testid="accept-heading">
              You are now a quiet guardian.
            </h1>
            <p className="mt-3 text-sm text-[#535E56] leading-relaxed">
              {result.guardian_name}, {result.sanctuary_name}'s sanctuary now includes you.
              You'll see their weather — never their words — and you can send a Thinking-of-You pulse anytime.
            </p>
            <Link to={result.circle_url}>
              <Button data-testid="open-circle-btn" className="mt-6 rounded-full bg-willow text-cloud px-8">
                Open your circle →
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
