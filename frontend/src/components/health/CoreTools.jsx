import { useEffect, useState } from 'react';
import { api, fileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Siren, MapPin, Languages, LockKeyhole, UserCheck, Timer, Vault, Luggage,
  Moon, ChevronDown, Phone, X, Plus
} from 'lucide-react';
import MyAnchorTools from '@/components/health/MyAnchorTools';

const LANGS = ['Spanish', 'French', 'Portuguese', 'Japanese', 'Thai', 'Italian', 'German', 'Arabic', 'Hindi', 'Mandarin'];

export default function CoreTools() {
  return (
    <div className="mt-10 space-y-10" data-testid="core-tools">
      <MyAnchorTools />
      <ToolGroup title="Essential" sub="Within seconds, when it matters">
        <SOSModule />
        <NearbyHelp />
        <TranslateModule />
        <HealthCard />
      </ToolGroup>
      <ToolGroup title="Preparedness" sub="Set it before you need it">
        <TrustedContacts />
        <CheckIn />
        <PrivateVault />
        <TripPack />
      </ToolGroup>
      <ToolGroup title="Explore" sub="For the ordinary, wonderful moments">
        <Link to="/dashboard/deja" className="block card-organic p-6 group" data-testid="module-deja">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2d3242] to-azul-dark flex items-center justify-center">
              <Moon className="w-5 h-5 text-mimosa" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-2xl text-willow-dark">Déjà</p>
              <p className="text-sm text-[#535E56]">What if you've already dreamed this moment? Record dreams, capture strange moments, see if life catches up.</p>
            </div>
            <ChevronDown className="w-5 h-5 text-willow-light -rotate-90 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      </ToolGroup>
    </div>
  );
}

function ToolGroup({ title, sub, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.28em] text-willow-light">{title}</p>
      <p className="text-sm text-willow-light/80 mt-0.5 mb-4">{sub}</p>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Module({ icon: I, tint, name, tagline, testId, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-organic overflow-hidden" data-testid={testId}>
      <button
        data-testid={`${testId}-toggle`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <div className={`w-12 h-12 rounded-full ${tint} flex items-center justify-center flex-shrink-0`}>
          <I className="w-5 h-5" />
        </div>
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

/* ---------------- SOS ---------------- */
function SOSModule() {
  return (
    <Module icon={Siren} tint="bg-orange-soft text-orange" name="SOS" tagline="I need help" testId="module-sos" defaultOpen>
      <div className="grid grid-cols-2 gap-2">
        <a href="tel:911" data-testid="sos-call-911" className="rounded-2xl bg-orange text-cloud p-4 text-center">
          <Phone className="w-5 h-5 mx-auto" />
          <p className="font-mono text-lg mt-1">911</p>
          <p className="text-[10px] opacity-80">Emergency (US)</p>
        </a>
        <a href="tel:112" data-testid="sos-call-112" className="rounded-2xl bg-willow text-cloud p-4 text-center">
          <Phone className="w-5 h-5 mx-auto" />
          <p className="font-mono text-lg mt-1">112</p>
          <p className="text-[10px] opacity-80">Emergency (EU/global)</p>
        </a>
        <a href="tel:988" data-testid="sos-call-988" className="rounded-2xl bg-azul-dark text-cloud p-4 text-center">
          <Phone className="w-5 h-5 mx-auto" />
          <p className="font-mono text-lg mt-1">988</p>
          <p className="text-[10px] opacity-80">Crisis line (US)</p>
        </a>
        <button
          data-testid="sos-quick-exit"
          onClick={() => window.dispatchEvent(new CustomEvent('anchor:quick-exit'))}
          className="rounded-2xl bg-cloud-subtle border border-willow/15 p-4 text-center text-willow-dark hover:bg-mimosa-soft transition"
        >
          <LockKeyhole className="w-5 h-5 mx-auto" />
          <p className="font-serif text-base mt-1">Quick Exit</p>
          <p className="text-[10px] text-willow-light">instant disguise</p>
        </button>
      </div>
    </Module>
  );
}

/* ---------------- Nearby Help ---------------- */
const NEARBY_CATS = [
  ['hospital', 'Hospital'], ['clinic', 'Clinic'], ['pharmacy', 'Pharmacy'], ['police', 'Police'],
  ['mental_health', 'Mental health'], ['lgbtq', 'LGBTQ+'], ['embassy', 'Embassy'], ['accessible', 'Accessible'],
];
function NearbyHelp() {
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const pick = async (c, query = q) => {
    setCat(c); setBusy(true);
    try { setItems(await api.get(`/nearby?category=${c}${query ? '&q=' + encodeURIComponent(query) : ''}`)); }
    catch { setItems([]); }
    finally { setBusy(false); }
  };
  return (
    <Module icon={MapPin} tint="bg-willow/10 text-willow" name="Nearby Help" tagline="Find what you need" testId="module-nearby">
      <div className="relative mb-3">
        <Input data-testid="nearby-search" value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cat && pick(cat)}
          placeholder="Search by city or country…" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
      </div>
      <div className="flex flex-wrap gap-2">
        {NEARBY_CATS.map(([k, label]) => (
          <button key={k} data-testid={`nearby-cat-${k}`} onClick={() => pick(k)}
            className={`px-4 py-2 rounded-full text-sm transition ${cat === k ? 'bg-willow text-cloud' : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}>
            {label}
          </button>
        ))}
      </div>
      {busy && <p className="text-sm text-willow-light mt-4">Finding…</p>}
      {!busy && cat && (
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto" data-testid="nearby-results">
          {!items.length && <p className="text-sm text-willow-light">Nothing on file for this category yet.</p>}
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl bg-cloud-subtle p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-willow-dark truncate">
                  {r.name}
                  {r.emergency && <span className="ml-2 text-[9px] uppercase tracking-widest bg-orange-soft text-orange px-1.5 py-0.5 rounded-full">emergency</span>}
                </p>
                <p className="text-xs text-willow-light">{[r.city, r.country].filter(Boolean).join(' · ')}</p>
              </div>
              {r.phone && <a href={`tel:${r.phone.split(' ')[0]}`} className="text-orange flex-shrink-0"><Phone className="w-4 h-4" /></a>}
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-orange underline flex-shrink-0">open</a>}
            </div>
          ))}
        </div>
      )}
    </Module>
  );
}

/* ---------------- Translate (quick + medical modes) ---------------- */
function TranslateModule() {
  const [mode, setMode] = useState('quick'); // quick | medical | wizard
  const [text, setText] = useState('');
  const [lang, setLang] = useState('Spanish');
  const [out, setOut] = useState(null);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wiz, setWiz] = useState({ symptoms: '', started: '', severity: '', allergies: '', medications: '' });

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try { setOut(await api.post('/translate', { text, language: lang })); }
    catch { toast.error('Translation failed.'); }
    finally { setBusy(false); }
  };

  const runMedical = async () => {
    if (!wiz.symptoms.trim()) { toast.error('What hurts? Even one word helps.'); return; }
    setBusy(true);
    try {
      const r = await api.post('/translate/medical', { ...wiz, language: lang });
      setOut({ translation: r.translation, language: r.language });
    } catch { toast.error('Translation failed.'); }
    finally { setBusy(false); }
  };

  return (
    <Module icon={Languages} tint="bg-mimosa-soft text-mimosa-dark" name="Translate" tagline="Communicate when it matters" testId="module-translate">
      <div className="flex gap-1.5 mb-3">
        {[['quick', 'Quick'], ['medical', 'Medical'], ['wizard', "I can't explain it"]].map(([k, label]) => (
          <button key={k} data-testid={`translate-mode-${k}`} onClick={() => setMode(k)}
            className={`px-3.5 py-1.5 rounded-full text-xs transition ${mode === k ? 'bg-willow text-cloud' : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {mode === 'quick' && (
          <Textarea data-testid="translate-input" value={text} onChange={e => setText(e.target.value)}
            placeholder="I am allergic to penicillin." className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[70px]" />
        )}
        {mode === 'medical' && (
          <div className="space-y-2">
            {[['symptoms', 'Symptoms (e.g. Chest pain)'], ['started', 'Started (e.g. 3 hours ago)'], ['severity', 'Severity (e.g. 7/10)'], ['allergies', 'Allergies'], ['medications', 'Current medication']].map(([k, ph]) => (
              <Input key={k} data-testid={`med-${k}`} value={wiz[k]} onChange={e => setWiz({ ...wiz, [k]: e.target.value })}
                placeholder={ph} className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
            ))}
          </div>
        )}
        {mode === 'wizard' && (
          <div className="space-y-2">
            <p className="text-xs text-willow-light">Simple questions. We build the card for you.</p>
            {[['symptoms', 'What hurts?'], ['symptoms_where', 'Where?'], ['started', 'When did it start?'], ['severity', 'How severe? (1–10)'], ['allergies', 'Any allergies?'], ['medications', 'Any medications?']].map(([k, ph]) => (
              <Input key={k} data-testid={`wiz-${k}`} value={wiz[k] || ''} onChange={e => setWiz({ ...wiz, [k]: e.target.value })}
                placeholder={ph} className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <select data-testid="translate-language" value={lang} onChange={e => setLang(e.target.value)}
            className="rounded-full bg-cloud-subtle border border-willow/10 px-4 py-2 text-sm flex-1">
            {LANGS.map(l => <option key={l}>{l}</option>)}
          </select>
          <Button data-testid="translate-btn" onClick={mode === 'quick' ? run : runMedical} disabled={busy} className="rounded-full bg-orange text-cloud">
            {busy ? '…' : mode === 'quick' ? 'Translate' : 'Build card'}
          </Button>
        </div>
        {out && (
          <div className="rounded-2xl bg-mimosa-soft/60 border border-mimosa/40 p-4" data-testid="translate-result">
            <p className="text-[10px] uppercase tracking-widest text-mimosa-dark">{out.language}</p>
            <p className="font-serif text-xl text-willow-dark mt-1 whitespace-pre-wrap">{out.translation}</p>
            <Button data-testid="translate-show-btn" onClick={() => setShow(true)} size="sm"
              className="mt-3 rounded-full bg-willow text-cloud w-full">
              {mode === 'quick' ? 'SHOW THIS TO SOMEONE' : 'SHOW THIS TO A HEALTHCARE PROFESSIONAL'}
            </Button>
          </div>
        )}
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="bg-willow-dark text-cloud rounded-3xl border-none max-w-lg" data-testid="translate-show-card">
          <DialogHeader><DialogTitle className="text-mimosa font-mono text-sm uppercase tracking-widest">{out?.language}</DialogTitle>
            <DialogDescription className="sr-only">Translation to show someone</DialogDescription></DialogHeader>
          <p className="font-serif text-2xl md:text-3xl leading-snug py-6 whitespace-pre-wrap">{out?.translation}</p>
        </DialogContent>
      </Dialog>
    </Module>
  );
}

/* ---------------- Health Card ---------------- */
const HC_FIELDS = [
  ['name', 'Name'], ['blood_type', 'Blood type'], ['allergies', 'Allergies'], ['medications', 'Medications'],
  ['conditions', 'Medical conditions'], ['emergency_contact', 'Emergency contact'], ['insurance', 'Insurance'],
];
function HealthCard() {
  const [card, setCard] = useState({});
  const [show, setShow] = useState(false);
  useEffect(() => { api.get('/health-card').then(setCard).catch(() => {}); }, []);
  const persist = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/health-card`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(card),
      });
      if (!res.ok) throw new Error();
      toast.success('Health card saved.');
    } catch { toast.error('Could not save.'); }
  };
  return (
    <Module icon={LockKeyhole} tint="bg-azul-light/60 text-azul-dark" name="Health Card" tagline="Your essential health information" testId="module-health-card">
      <div className="space-y-2.5">
        {HC_FIELDS.map(([k, label]) => (
          <Input key={k} data-testid={`hc-${k}`} value={card[k] || ''} onChange={e => setCard({ ...card, [k]: e.target.value })}
            placeholder={`${label} (optional)`} className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
        ))}
        <p className="text-[11px] text-willow-light">Fill in only what matters. Everything stays private to your account.</p>
        <div className="flex gap-2">
          <Button data-testid="hc-save-btn" onClick={persist} className="rounded-full bg-willow text-cloud flex-1">Save</Button>
          <Button data-testid="hc-show-btn" onClick={() => setShow(true)} variant="outline" className="rounded-full border-willow/20 flex-1">SHOW HEALTH CARD</Button>
        </div>
      </div>
      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="bg-white rounded-3xl border-2 border-willow/20 max-w-md" data-testid="health-card-view">
          <DialogHeader><DialogTitle className="font-serif text-2xl text-willow-dark">Health Card</DialogTitle>
            <DialogDescription className="sr-only">Read-only health information to show a caregiver</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {HC_FIELDS.filter(([k]) => card[k]).map(([k, label]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-willow/10 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-willow-light">{label}</span>
                <span className="font-medium text-willow-dark text-right">{card[k]}</span>
              </div>
            ))}
            {!HC_FIELDS.some(([k]) => card[k]) && <p className="text-sm text-willow-light">Empty — add your essentials first.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </Module>
  );
}

/* ---------------- Trusted Contacts ---------------- */
function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rel, setRel] = useState('');
  const [prio, setPrio] = useState(2);
  const load = () => api.get('/trusted-contacts').then(setContacts).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim() || !email.includes('@')) { toast.error('Name and email, please.'); return; }
    await api.post('/trusted-contacts', { name, email, relationship: rel, priority: prio });
    setName(''); setEmail(''); setRel(''); setPrio(2); toast.success('Trusted contact added.'); load();
  };
  const ping = async (kind) => {
    try {
      const r = await api.post('/trusted-contacts/ping', { kind, note: '' });
      toast.success(`Sent to ${r.sent} contact${r.sent === 1 ? '' : 's'}.`);
    } catch (e) { toast.error(e.message.includes('contact') ? 'Add a trusted contact first.' : 'Could not send.'); }
  };
  return (
    <Module icon={UserCheck} tint="bg-willow/10 text-willow" name="Trusted Contact" tagline="One tap reaches your people" testId="module-trusted">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input data-testid="tc-name" value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
          <Input data-testid="tc-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
          <Button data-testid="tc-add-btn" onClick={add} size="sm" className="rounded-full bg-willow text-cloud h-10 px-3"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Input data-testid="tc-relationship" value={rel} onChange={e => setRel(e.target.value)} placeholder="Relationship (sister, friend…)" className="rounded-full bg-cloud-subtle border-willow/10 h-9 text-xs flex-1" />
          <select data-testid="tc-priority" value={prio} onChange={e => setPrio(Number(e.target.value))} className="rounded-full bg-cloud-subtle border border-willow/10 px-3 text-xs">
            <option value={1}>Priority 1</option><option value={2}>Priority 2</option><option value={3}>Priority 3</option>
          </select>
        </div>
        {contacts.map(c => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl bg-cloud-subtle px-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-willow-dark">{c.name} {c.priority === 1 && <span className="text-[9px] uppercase tracking-widest text-orange ml-1">first</span>}</p>
              <p className="text-xs text-willow-light">{[c.relationship, c.email].filter(Boolean).join(' · ')}</p>
            </div>
            <button onClick={async () => { await api.del(`/trusted-contacts/${c.id}`); load(); }} className="text-willow-light hover:text-orange"><X className="w-4 h-4" /></button>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button data-testid="ping-safe" onClick={() => ping('safe')} variant="outline" className="rounded-full border-willow/20 text-willow text-xs">I'm safe</Button>
          <Button data-testid="ping-know" onClick={() => ping('know')} variant="outline" className="rounded-full border-willow/20 text-azul-dark text-xs">Need someone to know</Button>
          <Button data-testid="ping-help" onClick={() => ping('help')} className="rounded-full bg-orange text-cloud text-xs">I need help</Button>
        </div>
      </div>
    </Module>
  );
}

/* ---------------- Check-In ---------------- */
function CheckIn() {
  const [items, setItems] = useState([]);
  const [dest, setDest] = useState('');
  const [due, setDue] = useState('');
  const load = () => api.get('/checkins').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);
  const active = items.find(i => i.status === 'active');
  const expired = active && new Date(active.due_at) < new Date();
  const start = async () => {
    if (!dest.trim() || !due) { toast.error('Where, and when should you be back?'); return; }
    await api.post('/checkins', { destination: dest, due_at: new Date(due).toISOString() });
    setDest(''); setDue(''); toast.success('Check-in started.'); load();
  };
  return (
    <Module icon={Timer} tint="bg-mimosa-soft text-mimosa-dark" name="Check-In" tagline="Come back and tell us" testId="module-checkin">
      {active ? (
        <div className={`rounded-2xl p-4 ${expired ? 'bg-orange-soft border border-orange/30' : 'bg-cloud-subtle'}`} data-testid="checkin-active">
          {expired ? (
            <>
              <p className="font-serif text-xl text-orange">Your check-in has ended. Are you okay?</p>
              <p className="text-xs text-[#535E56] mt-1">{active.destination} · due {new Date(active.due_at).toLocaleString()}</p>
              <div className="flex gap-2 mt-3">
                <Button data-testid="checkin-safe-btn" onClick={async () => { await api.post(`/checkins/${active.id}/safe`, {}); load(); }} className="rounded-full bg-willow text-cloud flex-1">I'm safe</Button>
                <Button data-testid="checkin-alert-btn" onClick={async () => { const r = await api.post(`/checkins/${active.id}/alert`, {}); toast.success(`Alerted ${r.sent} contact(s).`); load(); }} className="rounded-full bg-orange text-cloud flex-1">Alert my contact</Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-serif text-xl text-willow-dark">{active.destination}</p>
              <p className="text-xs text-willow-light mt-1">Expected back: {new Date(active.due_at).toLocaleString()}</p>
              <Button data-testid="checkin-safe-early" onClick={async () => { await api.post(`/checkins/${active.id}/safe`, {}); load(); }} size="sm" className="mt-3 rounded-full bg-willow text-cloud">I'm back — mark safe</Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <Input data-testid="checkin-dest" value={dest} onChange={e => setDest(e.target.value)} placeholder="Where are you going? (e.g. Hiking trail)" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
          <Input data-testid="checkin-due" type="datetime-local" value={due} onChange={e => setDue(e.target.value)} className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
          <Button data-testid="checkin-start-btn" onClick={start} className="rounded-full bg-willow text-cloud w-full">Start Check-In</Button>
        </div>
      )}
    </Module>
  );
}

/* ---------------- Private Vault ---------------- */
const VAULT_KINDS = ['note', 'document', 'contact', 'insurance', 'health'];
function PrivateVault() {
  const [items, setItems] = useState([]);
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState('note');
  const [content, setContent] = useState('');
  const load = () => api.get('/vault').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!label.trim()) return;
    await api.post('/vault', { label, kind, content });
    setLabel(''); setContent(''); toast.success('Locked away.'); load();
  };
  return (
    <Module icon={Vault} tint="bg-azul-light/60 text-azul-dark" name="Private Vault" tagline="Important information, kept close" testId="module-vault">
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Input data-testid="vault-label" value={label} onChange={e => setLabel(e.target.value)} placeholder="Label (e.g. Passport photo, policy #)" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm flex-1" />
          <select data-testid="vault-kind" value={kind} onChange={e => setKind(e.target.value)} className="rounded-full bg-cloud-subtle border border-willow/10 px-3 text-sm">
            {VAULT_KINDS.map(k => <option key={k}>{k}</option>)}
          </select>
        </div>
        <Textarea data-testid="vault-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Details…" className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[60px] text-sm" />
        <Button data-testid="vault-add-btn" onClick={add} className="rounded-full bg-willow text-cloud w-full">Add to vault</Button>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map(i => (
            <div key={i.id} className="rounded-2xl bg-cloud-subtle p-3.5 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-willow-dark">{i.label} <span className="text-[10px] text-willow-light uppercase tracking-widest ml-1">{i.kind}</span></p>
                {i.content && <p className="text-xs text-[#535E56] mt-1 whitespace-pre-wrap">{i.content}</p>}
              </div>
              <button onClick={async () => { await api.del(`/vault/${i.id}`); load(); }} className="text-willow-light hover:text-orange flex-shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </Module>
  );
}

/* ---------------- Trip Pack ---------------- */
function TripPack() {
  const [pack, setPack] = useState(null);
  const [country, setCountry] = useState('');
  const [days, setDays] = useState('');
  const load = () => api.get('/trip-pack').then(setPack).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!country.trim()) return;
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/trip-pack`, {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, days_remaining: days ? Number(days) : null }),
    });
    if (res.ok) { toast.success('Trip pack updated.'); setCountry(''); setDays(''); load(); }
  };
  return (
    <Module icon={Luggage} tint="bg-orange-soft text-orange" name="Trip Pack" tagline="What might I need if something happens?" testId="module-trip-pack">
      {pack?.country ? (
        <div className="space-y-2" data-testid="trip-pack-view">
          <div className="flex items-baseline gap-3">
            <p className="font-serif text-3xl text-willow-dark">{pack.country}</p>
            {pack.days_remaining != null && <span className="text-sm text-mimosa-dark">{pack.days_remaining} days remaining</span>}
          </div>
          {[['Emergency number', pack.emergency_number], ['Embassy', pack.embassy],
            ['Trusted contacts', pack.trusted_contacts?.length ? pack.trusted_contacts.map(c => c.name).join(', ') : 'None yet — add one above'],
            ['Health card', pack.health_card?.name ? `${pack.health_card.name} · ${pack.health_card.blood_type || 'blood type —'} · allergies: ${pack.health_card.allergies || '—'}` : 'Not filled in yet'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 rounded-xl bg-cloud-subtle px-4 py-2.5">
              <span className="text-[11px] uppercase tracking-widest text-willow-light">{k}</span>
              <span className="text-sm text-willow-dark text-right">{v}</span>
            </div>
          ))}
          <TravelSafety country={pack.country} />
          <button onClick={() => setPack({})} className="text-xs text-willow-light underline mt-1">change trip</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <Input data-testid="trip-country" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country (e.g. Japan)" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
          <Input data-testid="trip-days" type="number" value={days} onChange={e => setDays(e.target.value)} placeholder="Days remaining (optional)" className="rounded-full bg-cloud-subtle border-willow/10 h-10 text-sm" />
          <Button data-testid="trip-save-btn" onClick={save} className="rounded-full bg-orange text-cloud w-full">Pack it</Button>
        </div>
      )}
    </Module>
  );
}

/* ---------------- Travel Safety (extends Trip Pack) ---------------- */
const PHRASES = {
  japan: [['Help!', 'Tasukete!'], ['I need a doctor', 'Isha wo yonde kudasai'], ['Hospital', 'Byouin'], ['Thank you', 'Arigatou gozaimasu']],
  portugal: [['Help!', 'Socorro!'], ['I need a doctor', 'Preciso de um médico'], ['Hospital', 'Hospital'], ['Thank you', 'Obrigado/a']],
  thailand: [['Help!', 'Chuay duay!'], ['I need a doctor', 'Chan tong kan mor'], ['Hospital', 'Rong phayabaan'], ['Thank you', 'Khop khun kha/khrap']],
  mexico: [['Help!', '¡Ayuda!'], ['I need a doctor', 'Necesito un médico'], ['Hospital', 'Hospital'], ['Thank you', 'Gracias']],
  france: [['Help!', 'Au secours !'], ['I need a doctor', "J'ai besoin d'un médecin"], ['Hospital', 'Hôpital'], ['Thank you', 'Merci']],
  singapore: [['Help!', 'Help!'], ['I need a doctor', 'I need a doctor'], ['Hospital', 'Hospital'], ['Thank you', 'Thank you']],
};
function TravelSafety({ country }) {
  const [hospitals, setHospitals] = useState([]);
  useEffect(() => {
    if (!country) return;
    api.get(`/nearby?category=hospital&q=${encodeURIComponent(country)}`).then(setHospitals).catch(() => {});
  }, [country]);
  const phrases = PHRASES[(country || '').trim().toLowerCase()];
  return (
    <div className="mt-3 rounded-2xl border border-willow/10 p-4" data-testid="travel-safety">
      <p className="text-[11px] uppercase tracking-widest text-willow-light mb-2">Travel Safety · {country}</p>
      <p className="text-xs text-willow-dark font-medium">Hospitals on file</p>
      {hospitals.length ? hospitals.map(h => (
        <p key={h.id} className="text-xs text-[#535E56] mt-1">{h.name} · {h.city} · <a className="text-orange" href={`tel:${h.phone}`}>{h.phone}</a></p>
      )) : <p className="text-xs text-willow-light mt-1">None on file for this country yet — the embassy line above is your fastest route.</p>}
      {phrases && (
        <>
          <p className="text-xs text-willow-dark font-medium mt-3">Useful local phrases</p>
          {phrases.map(([en, local]) => (
            <p key={en} className="text-xs text-[#535E56] mt-1">{en} → <span className="font-medium text-willow-dark">{local}</span></p>
          ))}
        </>
      )}
    </div>
  );
}
