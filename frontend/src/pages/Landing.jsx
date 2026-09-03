import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MoodPulseOrb from '@/components/sanctuary/MoodPulseOrb';
import { ArrowRight, ShieldCheck, HeartPulse, MapPinned } from 'lucide-react';

export default function Landing({ onSignIn }) {
  const [mood, setMood] = useState('hopeful');

  return (
    <div className="relative overflow-hidden">
      <section className="relative max-w-7xl mx-auto px-5 lg:px-10 pt-14 pb-24">
        <div className="absolute -top-20 right-10 w-[520px] h-[520px] rounded-full bg-mimosa-soft/70 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-willow/10 blur-3xl -z-10" />

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Pocket Anchor · Sanctuary Edition</p>
            <h1 className="font-serif text-5xl md:text-7xl text-willow-dark font-light mt-4 leading-[1.02] tracking-tight">
              Support that <em className="text-orange not-italic font-normal">doesn't ask</em><br/>
              for an answer.
            </h1>
            <p className="mt-6 text-lg text-[#535E56] max-w-xl leading-relaxed">
              A quiet, tender space for the days that ask too much. Collect reasons to stay,
              carry your health on the road, and hold survivor tools within one soft doorway.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                data-testid="get-started-btn"
                onClick={onSignIn}
                className="h-13 rounded-full bg-willow hover:bg-willow-dark text-cloud px-7 text-sm gap-2"
              >
                Open a sanctuary <ArrowRight className="w-4 h-4" />
              </Button>
              <Link to="/safety">
                <Button variant="outline" data-testid="safety-cta" className="h-13 rounded-full border-willow/20 hover:bg-mimosa-soft px-7 text-sm">
                  I need safety help now
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-willow-light">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Zero read receipts</div>
              <div className="flex items-center gap-2"><HeartPulse className="w-4 h-4"/> No metrics, no likes</div>
              <div className="flex items-center gap-2"><MapPinned className="w-4 h-4"/> Travels with you</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <MoodPulseOrb state={mood} size={280} interactive onChange={setMood} />
            <p className="text-center text-sm text-willow-light max-w-xs">
              Tap a color. Your Mood Pulse tells the people you trust — silently — how the day is landing.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 lg:px-10 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light text-center">Four soft steps</p>
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light text-center mt-3">How Pocket Anchor holds you</h2>
        <div className="grid md:grid-cols-4 gap-5 mt-12">
          {[
            { n: '01', t: 'Name your sanctuary', d: 'A gentle handle becomes your Anchor Link. app.anchor/with/you.' },
            { n: '02', t: 'Share the doorway', d: 'The people who love you leave a reason to stay — no account required.' },
            { n: '03', t: 'Break glass, softly', d: 'On the darkest day, one tap plays the voice notes and photos they left.' },
            { n: '04', t: 'Travel anchored', d: 'Medical vault, clinic map, and survivor tools travel with you, always.' },
          ].map((s) => (
            <div key={s.n} className="card-organic p-6">
              <p className="font-mono text-xs text-orange">{s.n}</p>
              <h3 className="font-serif text-2xl text-willow-dark mt-3">{s.t}</h3>
              <p className="mt-2 text-sm text-[#535E56] leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three pillars */}
      <section className="max-w-7xl mx-auto px-5 lg:px-10 py-20">
        <div className="grid lg:grid-cols-3 gap-6">
          {[
            { name: 'Sanctuary', desc: 'Silent support, mood pulses, wall of hope, break glass archive.', bg: 'from-willow to-willow-dark', accent: '#F7B557' },
            { name: 'Nomadic Health', desc: 'Clinic finder, medical vault, global doctor network.', bg: 'from-orange to-[#8a3a12]', accent: '#F36B38' },
            { name: 'Survivor Layer', desc: 'Quick exit, evidence vault, rebuilding tracker.', bg: 'from-azul-dark to-[#2d3242]', accent: '#F36B38' },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-3xl p-8 text-cloud bg-gradient-to-br ${p.bg} overflow-hidden min-h-[240px] flex flex-col justify-between`}>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full" style={{ background: p.accent, opacity: 0.35, filter: 'blur(40px)' }} />
              <h3 className="font-serif text-4xl font-light">{p.name}</h3>
              <p className="text-sm text-cloud/80 relative">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-willow/10 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 flex flex-wrap gap-4 items-center justify-between text-xs text-willow-light">
          <p>© Pocket Anchor · A quiet place.</p>
          <p>If you are in immediate danger, call your local emergency line. In the US: 911 · Crisis: 988.</p>
        </div>
      </footer>
    </div>
  );
}
