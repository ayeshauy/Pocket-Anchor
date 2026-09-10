import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChevronDown, Anchor, ShieldCheck, FileHeart, Phone, Check } from 'lucide-react';

function Module({ icon: I, tint, name, tagline, testId, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-organic overflow-hidden" data-testid={testId}>
      <button data-testid={`${testId}-toggle`} onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 p-5 text-left">
        <div className={`w-12 h-12 rounded-full ${tint} flex items-center justify-center flex-shrink-0`}><I className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-2xl text-willow-dark leading-tight">{name}</p>
          <p className="text-xs text-willow-light">{tagline}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-willow-light transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 border-t border-willow/10 pt-4">{children}</div>}
    </div>
  );
}

/* ---------------- Calm Preparedness ("You're anchored") ---------------- */
export function ReadinessCard() {
  const [r, setR] = useState(null);
  useEffect(() => { api.get('/anchor/readiness').then(setR).catch(() => {}); }, []);
  if (!r) return null;
  const c = r.checks;
  const rows = [
    ['Health information organized', c.health_card],
    ['Trusted contacts available', c.trusted_contacts > 0],
    ['Trip pack packed', c.trip_pack],
    ['Emergency card ready', c.emergency_card],
    ['Safety plan written', c.safety_plan],
  ];
  return (
    <div className="card-organic p-6 md:col-span-2" data-testid="readiness-card">
      {r.anchored ? (
        <>
          <p className="font-serif text-2xl text-willow-dark flex items-center gap-2"><Anchor className="w-5 h-5 text-willow" /> You're anchored.</p>
          <p className="text-sm text-[#535E56] mt-2">Nothing needs your attention right now.</p>
        </>
      ) : (
        <p className="font-serif text-2xl text-willow-dark flex items-center gap-2"><Anchor className="w-5 h-5 text-willow-light" /> A few quiet steps to anchored.</p>
      )}
      <div className="grid sm:grid-cols-2 gap-2 mt-4">
        {rows.map(([label, ok]) => (
          <div key={label} className="flex items-center gap-2.5 text-sm">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-willow text-cloud' : 'border-2 border-willow/25'}`}>
              {ok && <Check className="w-3 h-3" />}
            </span>
            <span className={ok ? 'text-willow-dark' : 'text-willow-light'}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- I Need Help (unified entry point) ---------------- */
export function INeedHelp() {
  const OPTIONS = [
    { t: "I'm in immediate danger", d: 'SOS · emergency numbers', href: null, action: () => window.dispatchEvent(new CustomEvent('anchor:quick-exit')), sos: true },
    { t: 'I need medical help', d: 'Health Guide · Doctors', href: null, scroll: 'health-tabs' },
    { t: "I can't communicate", d: 'Translate', href: null, module: 'module-translate' },
    { t: "I'm overwhelmed", d: 'Sanctuary · breathing · 988', href: '/dashboard' },
    { t: 'I need someone to know', d: 'Trusted contacts · Guardians', href: null, module: 'module-trusted' },
    { t: "I don't know where to go", d: 'Nearby Help', href: null, module: 'module-nearby' },
  ];
  const go = (o) => {
    if (o.sos) { document.getElementById('module-sos')?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (o.module) {
      const btn = document.querySelector(`[data-testid="${o.module}-toggle"]`);
      btn?.click();
      document.getElementById(o.module)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (o.scroll) { document.getElementById('health-tabs')?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (o.href) window.location.href = o.href;
  };
  return (
    <div className="card-organic p-6 md:col-span-2" data-testid="module-i-need-help">
      <p className="font-serif text-2xl text-willow-dark flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-orange" /> I need help</p>
      <p className="text-xs text-willow-light mt-1 mb-4">One tap connects you to the right door — nothing here duplicates, everything connects.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {OPTIONS.map((o, i) => (
          <button key={o.t} data-testid={`help-option-${i}`} onClick={() => go(o)}
            className="rounded-2xl bg-cloud-subtle hover:bg-mimosa-soft transition p-4 text-left">
            <p className="text-sm font-medium text-willow-dark">{o.t}</p>
            <p className="text-[11px] text-willow-light mt-0.5">{o.d}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Emergency Card ---------------- */
const EC_FIELDS = [
  ['name', 'Name'], ['blood_type', 'Blood type'], ['allergies', 'Allergies'], ['medications', 'Medications'],
  ['conditions', 'Conditions'], ['emergency_contact', 'Emergency contact'],
];
export function EmergencyCard() {
  const [data, setData] = useState(null);
  const [show, setShow] = useState({});
  const [lang, setLang] = useState('');
  const [instructions, setInstructions] = useState('');
  const [present, setPresent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api.get('/emergency-card');
        setData(d);
        setShow(d.card.show || {});
        setLang(d.card.preferred_language || '');
        setInstructions(d.card.instructions || '');
        // Offline essentials: cache the card on this device
        localStorage.setItem('pa_offline_card', JSON.stringify(d));
      } catch {
        const cached = localStorage.getItem('pa_offline_card');
        if (cached) { setData(JSON.parse(cached)); toast.success('Offline copy loaded from this device.'); }
      }
    })();
  }, []);

  const save = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/emergency-card`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: lang, instructions, show }),
      });
      if (!res.ok) throw new Error();
      toast.success('Emergency card saved (and cached on this device).');
    } catch { toast.error('Could not save.'); }
  };

  const health = data?.health || {};
  const visible = EC_FIELDS.filter(([k]) => show[k] && health[k]);
  return (
    <Module icon={FileHeart} tint="bg-orange-soft text-orange" name="Emergency Card" tagline="Choose exactly what responders see" testId="module-emergency-card">
      <div className="space-y-3">
        <p className="text-[11px] text-willow-light">Toggle what appears. Nothing is shared automatically — ever. A copy is cached on this device for offline moments.</p>
        {EC_FIELDS.map(([k, label]) => (
          <label key={k} className="flex items-center justify-between rounded-xl bg-cloud-subtle px-4 py-2.5">
            <span className="text-sm text-willow-dark">{label} <span className="text-xs text-willow-light">{health[k] ? `— ${health[k]}` : '— empty'}</span></span>
            <input data-testid={`ec-toggle-${k}`} type="checkbox" checked={!!show[k]} onChange={e => setShow({ ...show, [k]: e.target.checked })} />
          </label>
        ))}
        <Input data-testid="ec-language" value={lang} onChange={e => setLang(e.target.value)} placeholder="Preferred language (e.g. Thai)" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
        <Textarea data-testid="ec-instructions" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Important emergency instructions (optional)" className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[60px] text-sm" />
        <div className="flex gap-2">
          <Button data-testid="ec-save-btn" onClick={save} className="rounded-full bg-willow text-cloud flex-1">Save</Button>
          <Button data-testid="ec-show-btn" onClick={() => setPresent(true)} variant="outline" className="rounded-full border-willow/20 flex-1">SHOW EMERGENCY CARD</Button>
        </div>
      </div>
      <Dialog open={present} onOpenChange={setPresent}>
        <DialogContent className="bg-white rounded-3xl border-4 border-orange max-w-md" data-testid="emergency-card-view">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm uppercase tracking-[0.24em] text-orange">Emergency Card</DialogTitle>
            <DialogDescription className="sr-only">Read-only emergency information to show responders</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {visible.map(([k, label]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-willow/10 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-willow-light">{label}</span>
                <span className="font-semibold text-willow-dark text-right text-lg">{health[k]}</span>
              </div>
            ))}
            {lang && <div className="flex justify-between gap-4 border-b border-willow/10 pb-2"><span className="text-[11px] uppercase tracking-widest text-willow-light">Language</span><span className="font-semibold text-lg">{lang}</span></div>}
            {instructions && <p className="rounded-xl bg-mimosa-soft p-3 text-sm text-willow-dark">{instructions}</p>}
            {(data?.contacts || []).slice(0, 2).map(c => (
              <div key={c.id} className="flex justify-between gap-4 border-b border-willow/10 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-willow-light">Contact · {c.relationship || 'trusted'}</span>
                <span className="font-semibold text-right">{c.name}{c.phone ? ` · ${c.phone}` : ''}</span>
              </div>
            ))}
            {!visible.length && !instructions && <p className="text-sm text-willow-light">Nothing selected yet — toggle fields above.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </Module>
  );
}

/* ---------------- My Safety Plan ---------------- */
const SP_FIELDS = [
  ['warning_signs', 'Warning signs', 'What tells me a hard wave is coming…'],
  ['things_that_help', 'Things that help', 'Walks, music, a specific person, cold water…'],
  ['people', 'People I can contact', 'Names and how to reach them…'],
  ['places', 'Places I can go', 'Where I feel safe…'],
  ['avoid', 'Things to avoid', 'What makes it worse…'],
  ['emergency_instructions', 'Emergency instructions', 'If I stop answering, please…'],
];
export function SafetyPlan() {
  const [plan, setPlan] = useState({});
  useEffect(() => {
    (async () => {
      try { setPlan(await api.get('/safety-plan')); }
      catch {
        const cached = localStorage.getItem('pa_offline_plan');
        if (cached) setPlan(JSON.parse(cached));
      }
    })();
  }, []);
  const save = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/safety-plan`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error();
      localStorage.setItem('pa_offline_plan', JSON.stringify(plan));
      toast.success('Safety plan saved — private, cached on this device.');
    } catch { toast.error('Could not save.'); }
  };
  return (
    <Module icon={ShieldCheck} tint="bg-willow/10 text-willow" name="My Safety Plan" tagline="Private by default — yours alone" testId="module-safety-plan">
      <div className="space-y-3">
        {SP_FIELDS.map(([k, label, ph]) => (
          <div key={k}>
            <p className="text-xs text-willow-light mb-1">{label}</p>
            <Textarea data-testid={`sp-${k}`} value={plan[k] || ''} onChange={e => setPlan({ ...plan, [k]: e.target.value })}
              placeholder={ph} className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[52px] text-sm" />
          </div>
        ))}
        <Button data-testid="sp-save-btn" onClick={save} className="rounded-full bg-willow text-cloud w-full">Save my plan</Button>
        <p className="text-[11px] text-willow-light text-center">Only you can read this. Guardians and trusted contacts never see it unless you share it yourself.</p>
      </div>
    </Module>
  );
}

/* ---------------- Group ---------------- */
export default function MyAnchorTools() {
  return (
    <div data-testid="my-anchor-tools">
      <p className="text-xs uppercase tracking-[0.28em] text-willow-light">My Anchor</p>
      <p className="text-sm text-willow-light/80 mt-0.5 mb-4">Your personal safety and preparedness, in one quiet place</p>
      <div className="grid md:grid-cols-2 gap-4">
        <ReadinessCard />
        <INeedHelp />
        <EmergencyCard />
        <SafetyPlan />
      </div>
    </div>
  );
}
