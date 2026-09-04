import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { API } from '@/lib/api';
import { ShieldCheck, Globe2, Building2, Check } from 'lucide-react';

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [seats, setSeats] = useState(10);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-mimosa-soft/60 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-azul-light/40 blur-3xl" />
      <div className="relative max-w-6xl mx-auto px-5 lg:px-10 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light text-center">Pricing</p>
        <h1 className="font-serif text-4xl md:text-6xl text-willow-dark font-light text-center mt-3 leading-[1.05]">
          Pay for the journey.<br/>
          <em className="not-italic text-orange">Never for safety.</em>
        </h1>
        <p className="text-center text-[#535E56] mt-5 max-w-xl mx-auto leading-relaxed">
          Crisis tools, hotlines, the Safety Layer, and your Anchor Link are free forever — zero paywalls,
          zero accounts needed. Nomad Pass funds the road: clinics, vault, translations.
        </p>

        <div className="grid lg:grid-cols-3 gap-6 mt-14 items-stretch">
          {/* Free — Safety */}
          <div className="card-organic p-8 flex flex-col" data-testid="plan-safety">
            <div className="w-11 h-11 rounded-full bg-azul-light/60 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-azul-dark" />
            </div>
            <h3 className="font-serif text-3xl text-willow-dark mt-5">Survivor & Crisis Safety</h3>
            <p className="font-mono text-sm text-willow-light mt-1">$0 · free forever</p>
            <ul className="mt-6 space-y-3 text-sm text-[#535E56] flex-1">
              {['Resource directory & 24/7 hotlines', 'Survivor Navigator AI', 'Quick-exit & screen blur', 'Evidence Vault', 'Rebuilding action plans'].map(f => (
                <li key={f} className="flex gap-2.5"><Check className="w-4 h-4 text-willow flex-shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
            <Link to="/safety" className="mt-8">
              <Button data-testid="plan-safety-cta" variant="outline" className="w-full rounded-full border-willow/20 hover:bg-mimosa-soft">
                Open safety tools — no account
              </Button>
            </Link>
            <p className="text-[11px] text-willow-light mt-3 text-center">We will never charge anyone in crisis.</p>
          </div>

          {/* Nomad Pass */}
          <div className="relative rounded-3xl p-8 bg-gradient-to-br from-willow to-willow-dark text-cloud flex flex-col overflow-hidden" data-testid="plan-nomad">
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-mimosa/30 blur-2xl" />
            <div className="flex items-center justify-between relative">
              <div className="w-11 h-11 rounded-full bg-cloud/15 flex items-center justify-center">
                <Globe2 className="w-5 h-5 text-mimosa" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] bg-mimosa text-willow-dark px-3 py-1 rounded-full font-semibold">Most loved</span>
            </div>
            <h3 className="font-serif text-3xl mt-5">Nomad Pass</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="font-mono text-2xl">{yearly ? '$99' : '$12'}<span className="text-sm text-cloud/70">/{yearly ? 'year' : 'month'}</span></p>
              <button
                data-testid="nomad-billing-toggle"
                onClick={() => setYearly(!yearly)}
                className="text-xs text-mimosa underline underline-offset-4"
              >
                {yearly ? 'switch to monthly' : 'or $99/year — save 31%'}
              </button>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-cloud/85 flex-1">
              {['Spatial Health Guide & clinic map', 'Medical Vault with records', 'SLM prescription translation', 'Full Sanctuary tools', 'Guardian circle & pulses', 'Memory Vault'].map(f => (
                <li key={f} className="flex gap-2.5"><Check className="w-4 h-4 text-mimosa flex-shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
            <a href={`${API}/stripe/checkout?plan=${yearly ? 'nomad-pass-yearly' : 'nomad-pass'}`} className="mt-8 block">
              <Button data-testid="plan-nomad-cta" className="w-full rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud h-12">
                Start Nomad Pass
              </Button>
            </a>
            <p className="text-[11px] text-cloud/60 mt-3 text-center">Cancel anytime. Your data stays encrypted.</p>
          </div>

          {/* Enterprise */}
          <div className="card-organic p-8 flex flex-col" data-testid="plan-enterprise">
            <div className="w-11 h-11 rounded-full bg-orange-soft flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange" />
            </div>
            <h3 className="font-serif text-3xl text-willow-dark mt-5">Duty-of-Care</h3>
            <p className="font-mono text-sm text-willow-light mt-1">$6 / seat / month</p>
            <ul className="mt-6 space-y-3 text-sm text-[#535E56] flex-1">
              {['Multi-seat management', 'Custom duty-of-care coverage', 'Anonymous crisis support licensing', 'Staff safety compliance', 'Everything in Nomad Pass'].map(f => (
                <li key={f} className="flex gap-2.5"><Check className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-3">
              <label className="text-xs text-willow-light">Seats</label>
              <input
                data-testid="enterprise-seats-input"
                type="range" min="5" max="200" step="5" value={seats}
                onChange={e => setSeats(Number(e.target.value))}
                className="flex-1 accent-orange"
              />
              <span className="font-mono text-sm text-willow-dark w-12 text-right">{seats}</span>
            </div>
            <a href={`${API}/stripe/checkout?plan=enterprise&seats=${seats}`} className="mt-4 block">
              <Button data-testid="plan-enterprise-cta" className="w-full rounded-full bg-orange text-cloud hover:bg-orange/90 h-12">
                Onboard {seats} seats · ${seats * 6}/mo
              </Button>
            </a>
          </div>
        </div>

        <div className="mt-14 card-organic p-6 text-center">
          <p className="text-sm text-[#535E56] max-w-2xl mx-auto leading-relaxed">
            <span className="text-willow-dark font-medium">Private by design.</span> Your health and safety data
            is private to your account, never sold, never mined for ads. If you are in immediate danger,
            skip this page entirely — <Link to="/safety" className="text-orange underline underline-offset-4">safety tools are free, always</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
