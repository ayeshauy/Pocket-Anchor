import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Flame } from 'lucide-react';
import MoodPulseOrb from '@/components/sanctuary/MoodPulseOrb';

export default function CirclePage() {
  const { token } = useParams();
  const [circle, setCircle] = useState(null);
  const [error, setError] = useState(null);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try { setCircle(await api.get(`/circle/${token}`)); }
      catch { setError('This circle link is not active yet — accept the invite email first.'); }
    })();
  }, [token]);

  const pulse = async () => {
    setBusy(true);
    try {
      await api.post(`/circle/${token}/pulse`, { note });
      setSent(true); setNote('');
      toast.success('A soft pulse is on its way.');
    } catch { toast.error('Could not send.'); }
    finally { setBusy(false); }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="card-organic p-10 max-w-md text-center">
          <h1 className="font-serif text-3xl text-willow-dark">Not yet open.</h1>
          <p className="mt-3 text-sm text-[#535E56]">{error}</p>
        </div>
      </div>
    );
  }
  if (!circle) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-mimosa/30 orb-breath" /></div>;
  }

  const struggling = circle.latest_mood === 'struggling';

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="circle-page">
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-mimosa-soft/60 blur-3xl" />
      <div className="relative max-w-2xl mx-auto px-5 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Your quiet circle</p>
        <h1 className="font-serif text-5xl text-willow-dark font-light mt-4 leading-[1.05]">
          {circle.sanctuary_name}'s<br/>weather, this week.
        </h1>
        <p className="mt-4 text-[#535E56] max-w-lg leading-relaxed">
          You see the sky, never the storm's details. No replies expected, no metrics counted.
        </p>

        <div className="mt-10 card-organic p-8 flex flex-col sm:flex-row items-center gap-8">
          {circle.latest_mood
            ? <MoodPulseOrb state={circle.latest_mood} size={180} />
            : (
              <div className="text-center">
                <div className="w-[180px] h-[180px] rounded-full bg-cloud-muted orb-breath" />
                <p className="font-serif text-xl text-willow-light mt-4">Silence</p>
                <p className="text-xs uppercase tracking-[0.2em] text-willow-light mt-1">No pulse logged yet</p>
              </div>
            )}
          <div className="flex-1 text-center sm:text-left">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-cloud-subtle p-4 text-center">
                <p className="font-serif text-3xl text-willow-dark">{circle.reasons_this_week}</p>
                <p className="text-[10px] uppercase tracking-widest text-willow-light">reasons to stay this week</p>
              </div>
              <div className="rounded-2xl bg-cloud-subtle p-4 text-center">
                <p className="font-serif text-3xl text-willow-dark">{circle.pulses_this_week}</p>
                <p className="text-[10px] uppercase tracking-widest text-willow-light">mood pulses</p>
              </div>
            </div>
            {struggling && (
              <div className="mt-4 rounded-2xl bg-azul-light/50 border border-azul/30 p-4" data-testid="willow-grove-prompt">
                <p className="font-serif text-lg text-azul-dark">A Willow Grove day.</p>
                <p className="text-xs text-azul-dark/80 mt-1 leading-relaxed">
                  The sky over {circle.sanctuary_name}'s sanctuary is heavy right now. A memory, a song,
                  or even a single sentence on their Anchor Link would land softly today.
                </p>
                {circle.owner_slug && (
                  <a href={`/with/${circle.owner_slug}`} data-testid="leave-reason-link"
                     className="inline-block mt-3 text-sm text-orange underline underline-offset-4">
                    Leave a reason to stay →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 card-organic p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-willow-light mb-3">Thinking-of-You Pulse</p>
          {sent ? (
            <p className="font-serif text-xl text-willow-dark" data-testid="pulse-sent-note">
              Sent. It arrives as a soft vibration — nothing to answer.
            </p>
          ) : (
            <div className="flex gap-2">
              <Input
                data-testid="circle-pulse-note"
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Optional whisper: 'saw a sunflower, thought of you'"
                className="rounded-full bg-cloud-subtle border-willow/10"
              />
              <Button
                data-testid="circle-pulse-btn"
                onClick={pulse} disabled={busy}
                className="rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud gap-2 px-6"
              >
                <Flame className="w-4 h-4" /> Send
              </Button>
            </div>
          )}
          <p className="text-[11px] text-willow-light mt-3">
            {circle.guardian_name}, your pulse carries no demand. It simply says: you crossed my mind, and I'm glad you exist.
          </p>
        </div>
      </div>
    </div>
  );
}
