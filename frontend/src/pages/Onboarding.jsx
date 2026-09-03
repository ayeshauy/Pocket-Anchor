import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import MoodPulseOrb from '@/components/sanctuary/MoodPulseOrb';

export default function Onboarding() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const auto = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'your-anchor';
  const finalSlug = slug || auto;

  const submit = async () => {
    if (!name.trim()) { toast.error('A gentle name, please.'); return; }
    setLoading(true);
    try {
      await api.post('/onboarding', { sanctuary_name: name, slug: finalSlug });
      await refresh();
      toast.success('Your sanctuary is open.');
      nav('/dashboard', { replace: true });
    } catch (e) {
      toast.error('Could not create sanctuary.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="onboarding-step-container">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-mimosa-soft/60 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-azul-light/40 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-6 py-16 lg:py-24">
        <p className="text-xs uppercase tracking-[0.28em] text-willow-light">Sanctuary · Step 1</p>
        <h1 className="font-serif text-4xl md:text-6xl text-willow-dark font-light mt-3 leading-[1.05]">
          Name the quiet<br/> place you're building.
        </h1>
        <p className="mt-4 text-[#535E56] max-w-lg leading-relaxed">
          This becomes your Anchor Link — a soft doorway where people who love you can leave a reason to stay.
          Nothing here is a metric. Nothing demands a reply.
        </p>

        <div className="mt-10 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div className="space-y-6">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-willow-dark">Sanctuary name</span>
              <Input
                data-testid="sanctuary-name-input"
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ayesha's Anchor"
                className="mt-2 h-13 rounded-2xl bg-white/80 border-willow/15 text-lg py-6 focus-visible:ring-mimosa"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-willow-dark">Anchor Link</span>
              <div className="mt-2 flex items-center rounded-2xl overflow-hidden border border-willow/15 bg-white/80">
                <span className="pl-4 pr-2 py-3.5 text-sm text-willow-light font-mono">app.anchor/with/</span>
                <input
                  data-testid="sanctuary-slug-input"
                  value={slug || auto}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 bg-transparent outline-none py-3.5 pr-4 text-willow-dark font-mono text-sm"
                />
              </div>
              <p className="mt-2 text-xs text-willow-light">Anyone who visits this link can leave you warmth. They never need an account.</p>
            </label>
            <Button
              data-testid="onboarding-finish-btn"
              onClick={submit}
              disabled={loading}
              className="mt-4 rounded-full bg-orange hover:bg-orange/90 text-cloud px-8 h-12 text-sm"
            >
              {loading ? 'Opening…' : 'Open my sanctuary →'}
            </Button>
          </div>
          <div className="hidden md:block">
            <MoodPulseOrb state="hopeful" size={220} />
          </div>
        </div>
      </div>
    </div>
  );
}
