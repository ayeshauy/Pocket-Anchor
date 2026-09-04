import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MoodPulseOrb from '@/components/sanctuary/MoodPulseOrb';
import LiveSandbox from '@/components/landing/LiveSandbox';
import { API } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { HeartHandshake, Globe2, ShieldCheck, Lock, DoorOpen, Compass, ArrowRight } from 'lucide-react';

const PILLARS = [
  {
    icon: HeartHandshake,
    num: 'Pillar I',
    name: 'Sanctuary',
    sub: 'Mental Health & Silent Support',
    desc: 'Low-energy tools, passive mood insights, in-browser voice note recording, and low-stimulation "Thinking-of-You" pulse check-ins.',
    bg: 'from-willow to-willow-dark', accent: '#F7B557',
  },
  {
    icon: Globe2,
    num: 'Pillar II',
    name: 'Nomadic Health',
    sub: 'Medical Infrastructure',
    desc: 'Client-side non-custodial medical vaults, spatial clinic/pharmacy maps, and real-time SLM clinical prescription translation into local brand names.',
    bg: 'from-orange to-[#8a3a12]', accent: '#F36B38',
  },
  {
    icon: ShieldCheck,
    num: 'Pillar III',
    name: 'Survivor Safety',
    sub: 'IPV & Emergency Care',
    desc: '100% free zero-auth crisis directory, trauma-informed AI navigator, EXIF metadata stripping, and client-side AES-256 encrypted evidence vaults with decoy unlock support.',
    bg: 'from-azul-dark to-[#2d3242]', accent: '#F36B38',
  },
];

const STEPS = [
  { n: '01', t: 'Client-Side Encryption', d: 'Your data is encrypted directly in your browser using AES-256 before touching any server.' },
  { n: '02', t: 'Zero-Barrier Access', d: 'Instant crisis access with zero authentication requirements, one-tap quick-exit safety controls, and discreet camouflage UI.' },
  { n: '03', t: 'Seamless Care', d: 'From local medicine translations while backpacking to silent check-ins on low-energy days, Anchor adapts to your immediate context.' },
];

const AUDIENCES = [
  { t: 'Global Nomads & Backpackers', d: 'Navigating unfamiliar healthcare systems, language barriers, and local pharmacy name changes abroad.' },
  { t: 'Individuals in Crisis & Survivors', d: 'Needing tamper-proof evidence logging, discreet shelter resources, and zero-auth safety planning without leaving digital footprints.' },
  { t: 'Remote-First Teams & Organizations', d: 'Seeking modern Duty-of-Care coverage that protects employees globally while respecting total data privacy.' },
];

const FAQS = [
  ['Is my health and personal data really unreadable by Anchor?',
   'Yes. Anchor is engineered on zero-knowledge cryptographic principles. Using client-side Web Crypto API (AES-256), your journal entries, medical records, and uploaded files are encrypted directly in your browser before hitting our database. We do not hold your private keys, meaning no one—not even our engineering team—can read your records.'],
  ['What happens if I need to leave the app immediately in an emergency?',
   'Clicking the Quick-Exit button or pressing the ESC key instantly redirects your active tab to a neutral, common web page while instantly clearing local session memory.'],
  ['How does the decoy password / duress unlock work for the Evidence Vault?',
   'If you are ever forced or coerced into opening your vault, entering your designated Decoy Password decrypts a secondary, completely neutral "fake" vault containing non-sensitive filler records—keeping your actual evidence vault completely hidden and unlinked.'],
  ['How does the Spatial Health Guide and pharmacy translator work while traveling?',
   'Our Nomadic Health layer uses a Small Language Model (SLM) to parse medication active ingredients and translate them into local brand names across international markets. Combined with our interactive map, you can locate verified clinics, pharmacies, and emergency services wherever you land.'],
  ['Why are all Survivor & IPV Safety tools 100% free?',
   'We believe safety is a fundamental human right. All Domain 3 tools—including the zero-auth crisis hotline directory, emergency evidence vault, trauma-informed AI navigator, and shelter finder—have zero paywalls. They are fully subsidized by our consumer Nomad Pass subscriptions and B2B Enterprise seats.'],
  ['What is the difference between the Nomad Pass and Enterprise Duty-of-Care?',
   'Nomad Pass ($12/mo or $99/yr): Built for individual digital nomads, backpackers, and solo travelers who need full access to spatial health guides, medical translations, encrypted health vaults, and Sanctuary mental health check-ins. Enterprise Duty-of-Care ($5–$8/seat/mo): Built for remote-first employers, co-living networks, and tour operators needing multi-seat administrative management to protect staff or members globally while respecting complete employee privacy.'],
  ['Does Anchor track my live GPS location or digital footprint?',
   'No. We do not track continuous background GPS, sell telemetry, or deploy third-party advertising tracking cookies. City or country-level searches in our Nomadic Health and Crisis directories occur locally or through anonymized spatial queries.'],
  ['What is the "Thinking-of-You Pulse" in the Sanctuary layer?',
   'On low-energy or struggling days, opening a full conversation can feel overwhelming. The Thinking-of-You Pulse lets designated supporters send a low-stimulation, single-tap notification to let you know you\u2019re in their thoughts without placing any pressure on you to reply.'],
  ['How does image metadata stripping work when uploading evidence files?',
   'When uploading images to the Emergency Evidence Vault, Anchor automatically strips EXIF metadata (such as device type, GPS coordinates, and camera timestamps) directly inside your browser prior to client-side encryption, preventing accidental location leaks.'],
  ['Can I share specific journal entries or medical records without revealing my whole account?',
   'Yes. Anchor supports granular, view-only access. You can generate encrypted, time-limited read links for specific tagged entries or medical lists to share with trusted healthcare providers or loved ones without granting access to your master vault.'],
];

export default function Landing({ onSignIn }) {
  const { user } = useAuth();
  const [mood, setMood] = useState('hopeful');

  const LaunchCta = ({ testId, className, children }) => (
    user
      ? <Link to="/dashboard"><Button data-testid={testId} className={className}>{children}</Button></Link>
      : <Button data-testid={testId} onClick={onSignIn} className={className}>{children}</Button>
  );

  return (
    <div className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-5 lg:px-10 pt-16 pb-24" data-testid="hero-section">
        <div className="absolute -top-20 right-10 w-[520px] h-[520px] rounded-full bg-mimosa-soft/70 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-20 w-[420px] h-[420px] rounded-full bg-willow/10 blur-3xl -z-10" />
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-14 items-center">
          <div>
            <div data-testid="hero-badge" className="inline-flex items-center gap-2 rounded-full border border-willow/15 bg-white/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-willow-dark">
              <Lock className="w-3 h-3 text-orange" /> AI-Native · Zero-Knowledge · Privacy-First
            </div>
            <h1 className="font-serif text-5xl md:text-7xl text-willow-dark font-light mt-6 leading-[1.02] tracking-tight">
              Your Private Digital<br/>
              <em className="text-orange not-italic">Health & Safety</em> Sanctuary
            </h1>
            <p className="mt-6 text-lg text-[#535E56] max-w-xl leading-relaxed">
              Encrypted mental healthcare, real-time international travel health infrastructure, and
              zero-auth crisis resources—built to protect you anywhere on Earth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={`${API}/stripe/checkout?plan=nomad-pass`}>
                <Button data-testid="hero-nomad-cta" className="h-13 rounded-full bg-willow hover:bg-willow-dark text-cloud px-7 text-sm gap-2">
                  Get Nomad Pass — $12/mo <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link to="/safety">
                <Button data-testid="hero-crisis-cta" variant="outline" className="h-13 rounded-full border-willow/20 hover:bg-mimosa-soft px-7 text-sm">
                  Explore Free Crisis Tools
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-willow-light">
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> We can't read your data</span>
              <span className="flex items-center gap-2"><DoorOpen className="w-4 h-4" /> ESC × 2 hides everything</span>
              <span className="flex items-center gap-2"><Compass className="w-4 h-4" /> Travels with you</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-center gap-6">
            <MoodPulseOrb state={mood} size={280} interactive onChange={setMood} />
            <p className="text-center text-sm text-willow-light max-w-xs">
              The Mood Pulse orb — silent weather for the people you trust.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 1 — PLATFORM */}
      <section id="platform" className="max-w-7xl mx-auto px-5 lg:px-10 py-20" data-testid="section-platform">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Platform</p>
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Three pillars, one sanctuary.</h2>
        <div className="grid lg:grid-cols-3 gap-6 mt-12">
          {PILLARS.map((p) => {
            const I = p.icon;
            return (
              <div key={p.name} data-testid={`pillar-${p.name.toLowerCase().replace(/\s/g, '-')}`}
                   className={`relative rounded-3xl p-8 text-cloud bg-gradient-to-br ${p.bg} overflow-hidden min-h-[300px] flex flex-col`}>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full" style={{ background: p.accent, opacity: 0.35, filter: 'blur(40px)' }} />
                <div className="flex items-center justify-between relative">
                  <div className="w-11 h-11 rounded-full bg-cloud/15 flex items-center justify-center"><I className="w-5 h-5" style={{ color: p.accent }} /></div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cloud/60">{p.num}</span>
                </div>
                <h3 className="font-serif text-3xl font-light mt-5">{p.name}</h3>
                <p className="text-[11px] uppercase tracking-[0.2em] mt-1" style={{ color: p.accent }}>{p.sub}</p>
                <p className="text-sm text-cloud/85 relative mt-4 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* LIVE SANDBOX */}
      <LiveSandbox />

      {/* SECTION 2 — ABOUT */}
      <section id="about" className="py-20 bg-white/60 border-y border-willow/10" data-testid="section-about">
        <div className="max-w-4xl mx-auto px-5 lg:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-willow-light">About</p>
          <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3 leading-tight">
            Privacy as a Fundamental Human Right
          </h2>
          <p className="mt-6 text-lg text-[#535E56] leading-relaxed">
            Anchor was born out of a simple necessity: care shouldn't come at the cost of your digital identity
            or personal safety. Built on a zero-knowledge architecture, Anchor ensures your health notes, voice
            memos, and emergency evidence remain encrypted client-side using Web Crypto API (AES-256). We cannot
            read your data, track your location, or monetize your identity.
          </p>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 lg:px-10 py-20" data-testid="section-how-it-works">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">How It Works</p>
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Three quiet steps.</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {STEPS.map((s) => (
            <div key={s.n} className="card-organic p-7" data-testid={`step-${s.n}`}>
              <p className="font-mono text-xs text-orange">{s.n}</p>
              <h3 className="font-serif text-2xl text-willow-dark mt-3">{s.t}</h3>
              <p className="mt-2 text-sm text-[#535E56] leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — BEST FIT */}
      <section id="best-fit" className="py-20 bg-white/60 border-y border-willow/10" data-testid="section-best-fit">
        <div className="max-w-6xl mx-auto px-5 lg:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Best Fit</p>
          <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Who Anchor holds.</h2>
          <div className="grid md:grid-cols-3 gap-5 mt-12">
            {AUDIENCES.map((a, i) => (
              <div key={a.t} className="card-organic p-7" data-testid={`audience-${i + 1}`}>
                <div className="w-2 h-2 rounded-full bg-mimosa mb-4" />
                <h3 className="font-serif text-2xl text-willow-dark">{a.t}</h3>
                <p className="mt-2 text-sm text-[#535E56] leading-relaxed">{a.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — PLANS */}
      <section id="plans" className="max-w-6xl mx-auto px-5 lg:px-10 py-20" data-testid="section-plans">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Plans</p>
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Pay for the journey. Never for safety.</h2>
        <div className="grid md:grid-cols-3 gap-5 mt-12 items-stretch">
          <div className="card-organic p-7 flex flex-col" data-testid="landing-plan-nomad">
            <h3 className="font-serif text-2xl text-willow-dark">Nomad Pass</h3>
            <p className="font-mono text-sm text-orange mt-1">$12 / mo · $99 / yr</p>
            <p className="mt-4 text-sm text-[#535E56] leading-relaxed flex-1">
              Full access to Nomadic Health tools, Spatial Health Map, SLM Medicine Translation,
              Encrypted Health Vaults, and Sanctuary tools.
            </p>
            <a href={`${API}/stripe/checkout?plan=nomad-pass`} className="mt-6 block">
              <Button data-testid="landing-nomad-cta" className="w-full rounded-full bg-willow text-cloud hover:bg-willow-dark">Get Nomad Pass</Button>
            </a>
          </div>
          <div className="card-organic p-7 flex flex-col" data-testid="landing-plan-enterprise">
            <h3 className="font-serif text-2xl text-willow-dark">Enterprise Duty-of-Care</h3>
            <p className="font-mono text-sm text-orange mt-1">$5–$8 / seat / mo</p>
            <p className="mt-4 text-sm text-[#535E56] leading-relaxed flex-1">
              For remote teams, co-living networks, and travel organizations. Multi-seat billing,
              custom compliance, and funded crisis access.
            </p>
            <a href={`${API}/stripe/checkout?plan=enterprise&seats=10`} className="mt-6 block">
              <Button data-testid="landing-enterprise-cta" variant="outline" className="w-full rounded-full border-willow/20 hover:bg-mimosa-soft">Start Enterprise</Button>
            </a>
          </div>
          <div className="rounded-3xl p-7 bg-gradient-to-br from-azul-dark to-[#2d3242] text-cloud flex flex-col" data-testid="landing-plan-free">
            <h3 className="font-serif text-2xl">Survivor & IPV Safety</h3>
            <p className="font-mono text-sm text-mimosa mt-1">$0 · Free Forever</p>
            <p className="mt-4 text-sm text-cloud/85 leading-relaxed flex-1">
              All emergency hotlines, zero-auth shelter searches, trauma-informed AI navigation, and
              encrypted evidence vaults remain 100% free with zero paywalls.
            </p>
            <Link to="/safety" className="mt-6 block">
              <Button data-testid="landing-free-cta" className="w-full rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud">Open free safety tools</Button>
            </Link>
          </div>
        </div>
        <p className="text-center mt-8 text-sm text-willow-light">
          <Link to="/pricing" className="underline underline-offset-4 hover:text-orange transition" data-testid="full-pricing-link">See full pricing details →</Link>
        </p>
      </section>

      {/* SECTION 6 — FAQ */}
      <section id="faq" className="py-20 bg-white/60 border-t border-willow/10" data-testid="section-faq">
        <div className="max-w-3xl mx-auto px-5 lg:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-willow-light">FAQ</p>
          <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Gentle answers.</h2>
          <Accordion type="single" collapsible className="mt-10" data-testid="faq-accordion">
            {FAQS.map(([q, a], i) => (
              <AccordionItem key={i} value={`faq-${i + 1}`} className="border-willow/10" data-testid={`faq-item-${i + 1}`}>
                <AccordionTrigger data-testid={`faq-question-${i + 1}`} className="text-left font-serif text-lg text-willow-dark hover:text-orange hover:no-underline py-5">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#535E56] leading-relaxed pb-6">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA + FOOTER */}
      <section className="max-w-4xl mx-auto px-5 py-20 text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light leading-tight">
          A quiet doorway is<br/>always open.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LaunchCta testId="footer-launch-cta" className="h-13 rounded-full bg-orange hover:bg-orange/90 text-cloud px-8 text-sm">
            Launch Sanctuary →
          </LaunchCta>
          <Link to="/safety">
            <Button variant="outline" className="h-13 rounded-full border-willow/20 hover:bg-mimosa-soft px-8 text-sm" data-testid="footer-crisis-cta">
              I need help now
            </Button>
          </Link>
        </div>
      </section>
      <footer className="border-t border-willow/10 py-10">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 flex flex-wrap gap-4 items-center justify-between text-xs text-willow-light">
          <p>© Pocket Anchor · A quiet place.</p>
          <p>If you are in immediate danger, call your local emergency line. In the US: 911 · Crisis: 988.</p>
        </div>
      </footer>
    </div>
  );
}
