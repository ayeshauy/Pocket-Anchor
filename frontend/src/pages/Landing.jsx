import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import MoodPulseOrb from '@/components/sanctuary/MoodPulseOrb';
import LiveSandbox from '@/components/landing/LiveSandbox';
import { API } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { HeartHandshake, Globe2, ShieldCheck, Lock, DoorOpen, Compass, ArrowRight, Check, Clapperboard, Siren, MapPin, Languages, LockKeyhole, Luggage, Moon as MoonIcon } from 'lucide-react';

const PILLARS = [
  {
    icon: HeartHandshake,
    num: 'Pillar I',
    name: 'Sanctuary',
    sub: 'Mental Health & Silent Support',
    tagline: 'Passive support for the days when talking is too much. Your people show up without asking you to answer.',
    features: [
      ['Anchor Link (/with/:slug)', 'a permanent link — reasons, memories & forever'],
      ['Wall of Hope', 'a growing archive of reasons, by category'],
      ['Silent Hugs', 'someone felt this, no reply needed'],
      ['Emergency "Break-Glass" Archive', 'for the worst hours'],
      ['Private Journal', 'mood colors & tags, private by default'],
    ],
    modules: ['♡ Anchor', '◈ Journal', '⛨ Guardian', '〜 Breath'],
    bg: 'from-willow to-willow-dark', accent: '#F7B557',
  },
  {
    icon: Globe2,
    num: 'Pillar II',
    name: 'Core Layer',
    sub: 'Nomadic Health & Medical Infrastructure',
    tagline: 'Non-custodial health infrastructure for people who move: your records, your money, your care, across borders.',
    features: [
      ['Spatial Health Guide', 'live clinic map with trust scores'],
      ['My Anchor hub', 'emergency card, safety plan, trusted contacts'],
      ['Medical Vault', 'records, labs, prescriptions, documents'],
      ['Medical Translator', 'doctor-ready cards in 10 languages'],
      ['Déjà', 'dreams, memory & the strange familiar'],
      ['Global Doctor Network', 'telehealth-aware specialists'],
    ],
    modules: ['◉ Health Guide', '⚓ My Anchor', '▤ Med Vault', '🗣 Translate', '🌙 Déjà', '✚ Doctors'],
    bg: 'from-orange to-[#8a3a12]', accent: '#F36B38',
  },
  {
    icon: ShieldCheck,
    num: 'Pillar III',
    name: 'Safety Layer',
    sub: 'Survivor & IPV Support Services',
    tagline: 'Zero-auth help for anyone being hurt by another person. Nothing here waits behind an account.',
    features: [
      ['Zero-auth Resource Directory', 'hotlines, shelters, legal aid'],
      ['Survivor Navigator AI', 'options, never orders'],
      ['Evidence Vault', 'private, timestamped incident logs'],
      ['Rebuilding Roadmap', 'across four pillars'],
      ['Quick-exit & blur-screen controls', 'on every page'],
    ],
    modules: ['⚑ Resources', '➤ Navigator', '⛉ Evidence', '❀ Rebuilding'],
    bg: 'from-azul-dark to-[#2d3242]', accent: '#F36B38',
  },
];

const CHAPTERS = [
  {
    n: '01',
    t: 'Your Sanctuary, Live in One Step',
    points: [
      'Instant deployment of custom Anchor Links (/with/:slug) and low-stimulation communication channels.',
      'Send low-energy "Silent Hugs" and invite guardians whose Thinking-of-You pulses never demand a reply.',
    ],
  },
  {
    n: '02',
    t: 'Cross-Border Nomadic Healthcare',
    points: [
      'Instant mapping of safe-haven clinics and medical providers with trust scores, language tags, and 24/7 filters.',
      'A Medical Vault for medications, allergies, conditions, and visits — plus a global specialist network with telehealth availability.',
    ],
  },
  {
    n: '03',
    t: 'Zero-Auth Survivor & IPV Safety',
    points: [
      'Immediate, non-custodial access to crisis shelters, legal aid, and hotlines with zero account registration.',
      'Private, timestamped Evidence Vault entries and one-tap quick-exit controls on every page.',
    ],
  },
];

const AUDIENCES = [
  { t: 'Global Nomads & Backpackers', d: 'Navigating unfamiliar healthcare systems, language barriers, and local pharmacy name changes abroad.' },
  { t: 'Individuals in Crisis & Survivors', d: 'Needing tamper-proof evidence logging, discreet shelter resources, and zero-auth safety planning without leaving digital footprints.' },
  { t: 'Remote-First Teams & Organizations', d: 'Seeking modern Duty-of-Care coverage that protects employees globally while respecting total data privacy.' },
];

const FAQS = [
  ['Is my health and personal data really private on Anchor?',
   'Yes. Your journal entries, medical records, and evidence uploads are private to your account, encrypted in transit and at rest, and never sold or used for advertising. Supporters see only what your Anchor Link shows them — never your journal. Full client-side encryption (so not even our engineering team could read your records) is on our near-term roadmap.'],
  ['What happens if I need to leave the app immediately in an emergency?',
   'Clicking the Quick-Exit button or pressing the ESC key twice instantly swaps your screen to a neutral weather dashboard. The Evidence Vault can also be disguised as "Notes & Recipes" with a single toggle.'],
  ['How does the decoy mode work for the Evidence Vault?',
   'With one toggle, your Evidence Vault renders as an innocent "Notes & Recipes" list — titles and details are replaced with neutral filler while your real entries stay hidden underneath. Combined with Quick-Exit, the vault never looks like a vault.'],
  ['How does the Spatial Health Guide work while traveling?',
   'The Nomadic Health layer maps vetted clinics with community trust scores, spoken languages, and 24/7 emergency filtering on a live interactive map. Your Medical Vault keeps medications, allergies, conditions, and visit notes one tap away, wherever you land.'],
  ['Why are all Survivor & IPV Safety tools 100% free?',
   'We believe safety is a fundamental human right. All Domain 3 tools—including the zero-auth crisis hotline directory, emergency evidence vault, trauma-informed AI navigator, and shelter finder—have zero paywalls. They are fully subsidized by our consumer Nomad Pass subscriptions and B2B Enterprise seats.'],
  ['What is the difference between the Nomad Pass and Enterprise Duty-of-Care?',
   'Nomad Pass ($12/mo or $99/yr): Built for individual digital nomads, backpackers, and solo travelers who need full access to spatial health guides, medical translations, encrypted health vaults, and Sanctuary mental health check-ins. Enterprise Duty-of-Care ($5–$8/seat/mo): Built for remote-first employers, co-living networks, and tour operators needing multi-seat administrative management to protect staff or members globally while respecting complete employee privacy.'],
  ['Does Anchor track my live GPS location or digital footprint?',
   'No. We do not track continuous background GPS, sell telemetry, or deploy third-party advertising tracking cookies. City or country-level searches in our Nomadic Health and Crisis directories occur locally or through anonymized spatial queries.'],
  ['What is the "Thinking-of-You Pulse" in the Sanctuary layer?',
   'On low-energy or struggling days, opening a full conversation can feel overwhelming. The Thinking-of-You Pulse lets designated supporters send a low-stimulation, single-tap notification to let you know you\u2019re in their thoughts without placing any pressure on you to reply.'],
  ['Do I need an account to use the crisis and safety tools?',
   'No. The entire Safety Layer — hotline directory, Survivor Navigator AI, safety resources — works with zero sign-up, directly from the homepage. Accounts are only needed to keep your own Evidence Vault and Rebuilding plan.'],
  ['Can I control exactly what supporters see?',
   'Yes — completely, in two layers. When supporters leave something, they choose who may see it: only you, you plus people you choose, or they may allow public sharing. You then choose per contribution: Private (only you and the sender), Your Anchor (people with your Anchor link), or Public (anyone). Nothing becomes visible automatically, and nothing without the supporter\'s consent. Public sharing never reveals the sender\'s email, IP address, or any moderation details.'],
  ['What are Reasons, Memories, and Forever on an Anchor?',
   'Your Anchor Link has three layers. Reasons are encouragements people leave for you — a reason to smile, a favorite memory, a reminder you\'re loved, something to look forward to. Memories are the photos, songs, and voice notes they share. Forever is what you deliberately choose to keep for the long term. Your link is permanent and living — pocketanchor.tech/with/you stays yours until you change it. It works whether you\'re traveling, having an ordinary day, or going through something hard.'],
  ['How does Anchor protect me from harmful or pressuring messages?',
   'Every message left on your Anchor passes through a five-level safety and wellbeing layer before it reaches you. Clearly kind messages are delivered — and so are sensitive-but-supportive ones, because grief, worry and hard topics shared with care are not harm. Messages that could pressure or guilt you are gently paused and the sender is invited to soften them; harmful or threatening content is blocked, and senders can request a human review if they believe Anchor misunderstood. You stay in control: you choose who can leave messages, whether your approval is required, and whether anonymous messages are allowed. Repeat abuse is quietly restricted without ever revealing who the sender is. Anchor is not a crisis or emergency service and can never replace professional help — urgent situations are always redirected to local emergency and crisis resources.'],
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
              <Lock className="w-3 h-3 text-orange" /> AI-Native · Privacy-First · Crisis Tools Always Free
            </div>
            <h1 className="font-serif text-5xl md:text-7xl text-willow-dark font-light mt-6 leading-[1.02] tracking-tight">
              Your Private Digital<br/>
              <em className="text-orange not-italic">Health & Safety</em> Sanctuary
            </h1>
            <p className="mt-6 text-lg text-[#535E56] max-w-xl leading-relaxed">
              Private mental health support, real-time international travel health infrastructure, and
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
              <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> We never sell your data</span>
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
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Every feature belongs to one of three.</h2>
        <p className="mt-4 text-[#535E56] max-w-2xl leading-relaxed">
          The product is deliberately split so that a person in crisis never has to wade through features
          built for someone else's problem.
        </p>
        <div className="grid lg:grid-cols-3 gap-6 mt-12">
          {PILLARS.map((p) => {
            const I = p.icon;
            return (
              <div key={p.name} data-testid={`pillar-${p.name.toLowerCase().replace(/\s/g, '-')}`}
                   className={`relative rounded-3xl p-8 text-cloud bg-gradient-to-br ${p.bg} overflow-hidden flex flex-col`}>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: p.accent, opacity: 0.35, filter: 'blur(40px)' }} />
                <div className="flex items-center justify-between relative">
                  <div className="w-11 h-11 rounded-full bg-cloud/15 flex items-center justify-center"><I className="w-5 h-5" style={{ color: p.accent }} /></div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cloud/60">{p.num}</span>
                </div>
                <h3 className="font-serif text-3xl font-light mt-5">{p.name}</h3>
                <p className="text-[11px] uppercase tracking-[0.2em] mt-1" style={{ color: p.accent }}>{p.sub}</p>
                <p className="font-serif text-base text-cloud/90 italic relative mt-4 leading-relaxed">"{p.tagline}"</p>
                <div className="relative mt-6 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cloud/50 mb-3">What it includes</p>
                  <ul className="space-y-2.5">
                    {p.features.map(([name, note]) => (
                      <li key={name} className="flex gap-2.5 text-sm text-cloud/85 leading-snug">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: p.accent }} />
                        <span><span className="text-cloud">{name}</span> — <span className="text-cloud/70">{note}</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative mt-6 pt-5 border-t border-cloud/15">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cloud/50 mb-2.5">Interactive modules</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.modules.map((m) => (
                      <span key={m} className="text-[11px] px-2.5 py-1 rounded-full bg-cloud/10 border border-cloud/15 text-cloud/85">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ONE APP · SIX MOMENTS */}
      <section id="moments" className="max-w-5xl mx-auto px-5 lg:px-10 py-16" data-testid="section-moments">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">One app. Six moments.</p>
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">One app. Six moments.</h2>
        <p className="mt-4 text-[#535E56] max-w-xl leading-relaxed">
          From everyday travel to unexpected moments, Anchor keeps the essentials within reach.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-10">
          {[
            { icon: Siren, when: 'When something goes wrong', answer: 'Anchor helps.' },
            { icon: MapPin, when: 'When you need information', answer: 'Anchor finds it.' },
            { icon: Languages, when: 'When you need to communicate', answer: 'Anchor translates it.' },
            { icon: LockKeyhole, when: 'When you need your personal information', answer: 'Anchor protects it.' },
            { icon: Luggage, when: "When you're traveling normally", answer: 'Anchor keeps you prepared.' },
            { icon: MoonIcon, when: 'When you want something fun', answer: 'Déjà.' },
          ].map((m, i) => {
            const I = m.icon;
            return (
              <div key={m.when} data-testid={`moment-row-${i + 1}`}
                   className="flex items-center gap-4 rounded-2xl bg-white/70 border border-willow/10 px-5 py-4 hover:bg-mimosa-soft/40 transition">
                <div className="w-10 h-10 rounded-full bg-cloud-subtle flex items-center justify-center flex-shrink-0">
                  <I className="w-4.5 h-4.5 text-willow" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-willow-light">{m.when}</p>
                  <p className="font-serif text-xl text-willow-dark leading-tight">{m.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-10 text-center font-serif italic text-willow-light">
          One layer for the moments you can plan for — and the ones you can't.
        </p>
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
            or personal safety. Your health notes, voice memos, and emergency evidence stay private to your
            account — encrypted in transit and at rest. We never sell your data, track your location, or
            monetize your identity. Full client-side encryption, so that not even our engineers can read your
            records, is on our near-term roadmap.
          </p>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-5 lg:px-10 py-20" data-testid="section-how-it-works">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">How It Works</p>
        <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">How Pocket Anchor works.</h2>
        <p className="mt-4 text-[#535E56] max-w-2xl leading-relaxed">
          See the platform in action, or read the quick reference summaries below.
        </p>

        {/* Video frame */}
        <div className="mt-10" data-testid="demo-video-frame">
          <div className="relative rounded-3xl overflow-hidden border border-willow/15 bg-willow-dark shadow-xl">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-cloud/10">
              <span className="w-2.5 h-2.5 rounded-full bg-aperol/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-mimosa/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-willow-light/60" />
              <span className="ml-3 font-mono text-[11px] text-cloud/60">2-minute product demo</span>
            </div>
            <video
              data-testid="demo-video"
              controls
              playsInline
              preload="metadata"
              className="w-full aspect-video bg-willow-dark"
            >
              <source src="/demo.webm" type="video/webm" />
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
          <p className="mt-3 text-center text-xs text-willow-light">
            The summaries below provide a text alternative and quick reference for the product demonstration.
          </p>
        </div>

        {/* Quick reference summaries matching video chapters */}
        <div className="mt-12">
          <p className="text-[11px] uppercase tracking-[0.24em] text-willow-light mb-5 flex items-center gap-2">
            <Clapperboard className="w-3.5 h-3.5 text-orange" /> Quick reference summaries · matching video chapters
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {CHAPTERS.map((c) => (
              <div key={c.n} className="card-organic p-7" data-testid={`chapter-${c.n}`}>
                <p className="font-mono text-xs text-orange">{c.n}</p>
                <h3 className="font-serif text-2xl text-willow-dark mt-2 leading-tight">{c.t}</h3>
                <ul className="mt-4 space-y-3">
                  {c.points.map((pt) => (
                    <li key={pt.slice(0, 24)} className="flex gap-2.5 text-sm text-[#535E56] leading-relaxed">
                      <Check className="w-4 h-4 text-willow flex-shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-orange transition" data-testid="footer-privacy-link">Privacy</Link>
            <p>If you are in immediate danger, call your local emergency line. In the US: 911 · Crisis: 988.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
