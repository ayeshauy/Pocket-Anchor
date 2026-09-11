import { useEffect, useState, useRef } from 'react';
import { API, api, fileUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MoodPulseOrb, { MOOD_STATES } from '@/components/sanctuary/MoodPulseOrb';
import GuardianPanel from '@/components/sanctuary/GuardianPanel';
import MemoryVault from '@/components/sanctuary/MemoryVault';
import { REASONS, reasonTitle } from '@/constants/reasons';
import { toast } from 'sonner';
import { Heart, Star, AlertTriangle, Copy, Wind, BookHeart, Music2, MessageCircleHeart, X, Send, Flag } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [mood, setMood] = useState('grounded');
  const [note, setNote] = useState('');
  const [pulses, setPulses] = useState([]);
  const [hope, setHope] = useState([]);
  const [journal, setJournal] = useState([]);
  const [breakGlass, setBreakGlass] = useState(false);
  const [glassItems, setGlassItems] = useState([]);
  const [breath, setBreath] = useState(null);
  const [comfortOpen, setComfortOpen] = useState(false);

  const load = async () => {
    try {
      const [p, h, j] = await Promise.all([api.get('/mood'), api.get('/hope'), api.get('/journal')]);
      setPulses(p); setHope(h); setJournal(j);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  // Link a successful Stripe checkout to this account
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('session_id');
    if (!sid) return;
    (async () => {
      try {
        await api.get(`/payments/status/${sid}`);
        const r = await api.post('/stripe/link', { session_id: sid });
        toast.success(`Welcome aboard — ${r.plan === 'enterprise' ? 'Duty-of-Care' : 'Nomad Pass'} is active.`);
      } catch {
        toast.error('Payment is still settling — refresh in a moment.');
      }
      window.history.replaceState({}, '', '/dashboard');
    })();
  }, []);

  const logPulse = async () => {
    try { await api.post('/mood', { state: mood, note, intensity: 5 }); setNote(''); toast.success('Pulse logged. Quietly.'); load(); }
    catch { toast.error('Could not log pulse.'); }
  };

  const breakGlassOpen = async () => {
    try { const items = await api.get('/hope/emergency'); setGlassItems(items); setBreakGlass(true); }
    catch { toast.error('Could not open archive.'); }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/api/og/${user.sanctuary_slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Anchor link copied — it shows a warm preview in chats.');
  };

  const mood14 = last14Days(pulses);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-10 py-10 overflow-x-hidden">
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
        {/* Left column */}
        <div className="space-y-6">
          <div className="card-organic p-8 flex flex-col md:flex-row items-center gap-8" data-testid="mood-pulse-card">
            <MoodPulseOrb state={mood} size={200} interactive onChange={setMood} />
            <div className="flex-1 w-full">
              <p className="text-xs uppercase tracking-[0.28em] text-willow-light">Mood Pulse</p>
              <h2 className="font-serif text-3xl text-willow-dark font-light mt-1">How is today landing?</h2>
              <Textarea
                data-testid="mood-note-input"
                value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="A word or a whisper (optional)."
                className="mt-4 rounded-2xl bg-cloud-subtle border-willow/10 min-h-[80px]"
              />
              <div className="flex gap-2 mt-3">
                <Button data-testid="log-pulse-btn" onClick={logPulse} className="rounded-full bg-willow text-cloud">Log pulse</Button>
                <Button data-testid="comfort-ai-btn" onClick={() => setComfortOpen(true)} variant="outline" className="rounded-full border-willow/20 gap-2">
                  <MessageCircleHeart className="w-4 h-4" /> Talk to Anchor
                </Button>
              </div>
            </div>
          </div>

          {/* Anchor link + share */}
          <div className="card-organic p-6" data-testid="anchor-link-card">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-willow-light">Your Anchor Link</p>
                <p className="font-mono text-xs sm:text-sm text-willow-dark mt-1 break-all">
                  {window.location.host}/with/{user.sanctuary_slug}
                </p>
              </div>
              <div className="flex gap-2">
                <Button data-testid="copy-anchor-link-btn" onClick={copyLink} className="rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud gap-2">
                  <Copy className="w-4 h-4" /> Copy link
                </Button>
                <a href={`/with/${user.sanctuary_slug}`} target="_blank" rel="noreferrer" className="text-xs text-willow-light self-center underline">preview</a>
              </div>
            </div>
          </div>

          <AnchorSettings />

          {/* Tabs: Wall / Journal / Breath */}
          <div className="card-organic p-6">
            <Tabs defaultValue="wall">
              <TabsList className="bg-cloud-subtle rounded-full p-1 flex-wrap h-auto">
                <TabsTrigger value="wall" data-testid="tab-wall" className="rounded-full data-[state=active]:bg-willow data-[state=active]:text-cloud">Wall of Hope</TabsTrigger>
                <TabsTrigger value="journal" data-testid="tab-journal" className="rounded-full data-[state=active]:bg-willow data-[state=active]:text-cloud">Journal</TabsTrigger>
                <TabsTrigger value="breath" data-testid="tab-breath" className="rounded-full data-[state=active]:bg-willow data-[state=active]:text-cloud">Breathing</TabsTrigger>
                <TabsTrigger value="guardians" data-testid="tab-guardians" className="rounded-full data-[state=active]:bg-willow data-[state=active]:text-cloud">Guardians</TabsTrigger>
                <TabsTrigger value="memory" data-testid="tab-memory" className="rounded-full data-[state=active]:bg-willow data-[state=active]:text-cloud">Memory Vault</TabsTrigger>
              </TabsList>
              <TabsContent value="wall" className="mt-5">
                <WallOfHope items={hope} onRefresh={load} />
              </TabsContent>
              <TabsContent value="journal" className="mt-5">
                <Journal items={journal} onRefresh={load} />
              </TabsContent>
              <TabsContent value="breath" className="mt-5">
                <Breathing active={breath} setActive={setBreath} />
              </TabsContent>
              <TabsContent value="guardians" className="mt-5">
                <GuardianPanel />
              </TabsContent>
              <TabsContent value="memory" className="mt-5">
                <MemoryVault />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#FBEAE2]/90 to-white border-2 border-dashed border-orange/40" data-testid="break-glass-card">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-orange text-cloud flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-willow-dark">Break Glass Archive</h3>
                <p className="text-sm text-[#535E56] mt-1 leading-relaxed">
                  On the very darkest day, one tap plays the reasons that mattered most.
                </p>
                <Button
                  data-testid="break-glass-trigger"
                  onClick={breakGlassOpen}
                  className="mt-4 rounded-full bg-orange text-cloud hover:bg-orange/90"
                >
                  Open the archive
                </Button>
              </div>
            </div>
          </div>

          <div className="card-organic p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-willow-light">14-Day Mood Rhythm</p>
            <MoodChart data={mood14} />
          </div>

          <div className="card-organic p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-willow/10 flex items-center justify-center"><BookHeart className="w-4 h-4 text-willow" /></div>
              <h3 className="font-serif text-xl text-willow-dark">Guardian Dashboard</h3>
            </div>
            <p className="text-sm text-[#535E56] leading-relaxed">
              Silent pulse indicators for the people you trust. Coming soon: a thinking-of-you soft vibration.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <StatBlock label="Reasons" value={hope.length} />
              <StatBlock label="Pulses" value={pulses.length} />
              <StatBlock label="Entries" value={journal.length} />
            </div>
          </div>

          {/* Emergency SOS */}
          <div className="card-organic p-5 flex items-center gap-4">
            <a href="tel:988" data-testid="sos-988-btn" className="w-14 h-14 rounded-full bg-orange text-cloud flex items-center justify-center text-lg font-bold">988</a>
            <div>
              <p className="font-serif text-xl text-willow-dark">Crisis Lifeline</p>
              <p className="text-xs text-willow-light">Tap 988 (US). We hold this space with you.</p>
            </div>
          </div>
        </div>
      </div>

      <BreakGlassModal open={breakGlass} onOpenChange={setBreakGlass} items={glassItems} />
      <ComfortAI open={comfortOpen} onOpenChange={setComfortOpen} />
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="rounded-2xl bg-cloud-subtle p-3">
      <p className="font-serif text-2xl text-willow-dark">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-willow-light">{label}</p>
    </div>
  );
}

function WallOfHope({ items, onRefresh }) {
  const [reporting, setReporting] = useState(null);
  const felt = async (id) => { await api.post(`/hope/${id}/felt`, {}); onRefresh(); };
  const fav = async (id) => { await api.post(`/hope/${id}/favorite`, {}); onRefresh(); };
  const approve = async (id) => {
    try { await api.post(`/hope/${id}/approve`, {}); toast.success('Welcomed in.'); onRefresh(); }
    catch { toast.error('Could not approve.'); }
  };
  const report = async (id, category) => {
    try {
      await api.post(`/hope/${id}/report`, { category });
      setReporting(null);
      toast.success('Reported and pulled back to private.');
      onRefresh();
    } catch { toast.error('Could not send the report.'); }
  };
  const setVis = async (id, visibility) => {
    try {
      await api.post(`/hope/${id}/visibility`, { visibility });
      toast.success(visibility === 'forever' ? 'Kept forever on your Anchor.' : visibility === 'shared' ? 'Shared on your Anchor.' : visibility === 'public' ? 'Now public on your Anchor.' : 'Back to private.');
      onRefresh();
    } catch (e) {
      toast.error("The supporter didn't allow this level of sharing.");
    }
  };
  if (!items.length) {
    return <p className="text-sm text-willow-light text-center py-8" data-testid="wall-empty">Your Anchor Link has yet to gather reasons. Share it with someone gentle.</p>;
  }
  const groups = {};
  items.forEach(it => { const k = it.reason || 'stay'; (groups[k] = groups[k] || []).push(it); });
  const ordered = REASONS.filter(r => groups[r.k]);
  return (
    <div data-testid="wall-of-hope-grid" className="space-y-6">
      {ordered.map(r => (
        <div key={r.k} data-testid={`wall-group-${r.k}`}>
          <p className="text-xs uppercase tracking-[0.22em] text-willow-light mb-3">{r.title} · {groups[r.k].length}</p>
          <div className="columns-1 md:columns-2 gap-4">
            {groups[r.k].map((it) => {
              const level = it.consent_level || (it.consent_shared ? 'circle' : 'recipient');
              return (
              <div key={it.id} className="mb-4 break-inside-avoid rounded-2xl p-5 bg-gradient-to-br from-white to-mimosa-soft/40 border border-willow/10">
                <p className="text-xs uppercase tracking-widest text-willow-light mb-2">{it.supporter_name}</p>
                {it.text && <p className="text-[15px] text-willow-dark leading-relaxed font-serif">"{it.text}"</p>}
                {it.song_url && <a href={it.song_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-orange hover:underline"><Music2 className="w-4 h-4" /> Listen</a>}
                {it.media_path && it.media_path.match(/\.(png|jpe?g|webp|gif)$/i) && (
                  <img src={fileUrl(it.media_path)} alt="" className="mt-3 rounded-xl w-full" />
                )}
                {it.media_path && it.media_path.match(/\.(mp3|wav|ogg|m4a|webm)$/i) && (
                  <audio controls src={fileUrl(it.media_path)} className="mt-3 w-full" />
                )}
                {it.status === 'pending' && (
                  <div className="mt-3 rounded-xl bg-mimosa-soft/70 px-3 py-2 flex items-center justify-between gap-2" data-testid={`pending-${it.id}`}>
                    <span className="text-[11px] text-willow-dark">Waiting for your approval</span>
                    <button data-testid={`approve-${it.id}`} onClick={() => approve(it.id)} className="text-[11px] px-3 py-1 rounded-full bg-willow text-cloud">Approve</button>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <button data-testid={`felt-btn-${it.id}`} onClick={() => felt(it.id)} className="flex items-center gap-1.5 text-xs text-willow hover:text-orange transition">
                    <Heart className="w-4 h-4" /> Felt this · {it.felt_count || 0}
                  </button>
                  <button data-testid={`fav-btn-${it.id}`} onClick={() => fav(it.id)} className={`flex items-center gap-1.5 text-xs transition ${it.is_favorite ? 'text-mimosa-dark' : 'text-willow-light hover:text-mimosa-dark'}`}>
                    <Star className="w-4 h-4" fill={it.is_favorite ? 'currentColor' : 'none'} /> Favorite
                  </button>
                  {reporting === it.id ? (
                    <span className="flex flex-wrap items-center gap-1" data-testid={`wall-report-options-${it.id}`}>
                      {[['harassment', 'Harassment'], ['threat', 'Threat'], ['abuse', 'Abuse'], ['other', 'Other']].map(([k, label]) => (
                        <button key={k} data-testid={`wall-report-${k}-${it.id}`} onClick={() => report(it.id, k)}
                          className="text-[10px] px-2 py-1 rounded-full bg-cloud-subtle text-willow-dark hover:bg-orange-soft">{label}</button>
                      ))}
                      <button onClick={() => setReporting(null)} className="text-[10px] text-willow-light underline">cancel</button>
                    </span>
                  ) : (
                    <button data-testid={`wall-report-btn-${it.id}`} onClick={() => setReporting(it.id)}
                      className="ml-auto text-willow-light/50 hover:text-orange transition" title="Report quietly — pulls it back to private">
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Visibility: recipient chooses private / anchor / forever / public (supporter consent caps the ceiling) */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-willow/10 flex-wrap" data-testid={`visibility-${it.id}`}>
                  {[['private', 'Private'], ['shared', 'Your Anchor'], ['forever', 'Keep forever'], ['public', 'Public']].map(([v, label]) => {
                    const active = (it.visibility || 'private') === v;
                    const blocked = v !== 'private' && (v === 'public' ? level !== 'public' : level === 'recipient');
                    return (
                      <button
                        key={v}
                        data-testid={`vis-${v}-${it.id}`}
                        onClick={() => !blocked && setVis(it.id, v)}
                        title={blocked ? "The supporter didn't allow this level of sharing" : label}
                        className={`text-[11px] px-3 py-1.5 rounded-full transition ${
                          active ? (v === 'forever' ? 'bg-orange text-cloud' : 'bg-willow text-cloud')
                            : blocked ? 'bg-cloud-subtle text-willow-light/50 cursor-not-allowed'
                            : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnchorSettings() {
  const [s, setS] = useState(null);
  useEffect(() => { (async () => { try { setS(await api.get('/anchor-settings')); } catch {} })(); }, []);
  if (!s) return null;
  const save = async (patch) => {
    const next = { ...s, ...patch };
    setS(next);
    try { await api.put('/anchor-settings', next); toast.success('Anchor settings saved.'); }
    catch { toast.error('Could not save settings.'); }
  };
  return (
    <div className="card-organic p-6" data-testid="anchor-settings-card">
      <p className="text-xs uppercase tracking-[0.28em] text-willow-light">Who can leave something for you?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[['anyone', 'Anyone with my link'], ['approval', 'People I approve first'], ['off', 'Paused — no new messages']].map(([v, label]) => (
          <button
            key={v}
            data-testid={`anchor-who-${v}`}
            onClick={() => save({ who: v })}
            className={`px-4 py-2 rounded-full text-xs transition ${s.who === v ? 'bg-willow text-cloud' : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2.5">
        <label className="flex items-center gap-2.5 text-sm text-willow-dark cursor-pointer">
          <input type="checkbox" data-testid="require-approval-toggle" checked={!!s.require_approval} onChange={e => save({ require_approval: e.target.checked })} />
          Require my approval before messages appear
        </label>
        <label className="flex items-center gap-2.5 text-sm text-willow-dark cursor-pointer">
          <input type="checkbox" data-testid="allow-anonymous-toggle" checked={!!s.allow_anonymous} onChange={e => save({ allow_anonymous: e.target.checked })} />
          Allow anonymous messages
        </label>
      </div>
      <p className="mt-4 text-[11px] text-willow-light leading-relaxed">
        Every message is also screened by Anchor's safety layer before it reaches you — pressuring or harmful
        content is softened with the sender or blocked, so you're never the only gatekeeper.
      </p>
    </div>
  );
}

function Journal({ items, onRefresh }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('Thoughts');
  const save = async () => {
    if (!title.trim() && !body.trim()) return;
    await api.post('/journal', { title: title || 'Untitled', body, mood: 'grounded', tags: [tag], is_private: true });
    setTitle(''); setBody(''); toast.success('Kept quietly.'); onRefresh();
  };
  return (
    <div className="grid md:grid-cols-2 gap-5" data-testid="journal-container">
      <div className="space-y-3">
        <Input data-testid="journal-entry-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="A soft title" className="rounded-full bg-cloud-subtle border-willow/10" />
        <Textarea data-testid="journal-entry-body" value={body} onChange={e => setBody(e.target.value)} placeholder="A page for only you. Nothing here leaves this sanctuary." className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[180px]" />
        <div className="flex gap-2 items-center">
          <select data-testid="journal-tag-selector" value={tag} onChange={e => setTag(e.target.value)} className="rounded-full bg-cloud-subtle border border-willow/10 px-4 py-2 text-sm">
            <option>Thoughts</option><option>Health</option><option>Travel</option><option>Dreams</option>
          </select>
          <Button data-testid="journal-save-btn" onClick={save} className="rounded-full bg-willow text-cloud">Save entry</Button>
        </div>
      </div>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
        {!items.length && <p className="text-sm text-willow-light">No pages yet. Begin whenever.</p>}
        {items.map(it => (
          <div key={it.id} className="rounded-2xl bg-white/70 border border-willow/10 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-serif text-lg text-willow-dark">{it.title}</p>
                <p className="text-[10px] uppercase tracking-widest text-willow-light mt-0.5">{(it.tags||[]).join(' · ')}</p>
              </div>
              <button onClick={async () => { await api.del(`/journal/${it.id}`); onRefresh(); }} className="text-willow-light hover:text-orange"><X className="w-4 h-4" /></button>
            </div>
            <p className="mt-2 text-sm text-[#535E56] whitespace-pre-wrap">{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TECHS = {
  '478': { name: '4-7-8 Calm', in: 4, hold: 7, out: 8, ring: 'ring-478' },
  'box': { name: 'Box Breathing', in: 4, hold: 4, out: 4, ring: 'ring-box' },
  'wave': { name: 'Gentle Wave', in: 3, hold: 2, out: 5, ring: 'ring-wave' },
};
function Breathing({ active, setActive }) {
  return (
    <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-center" data-testid="breathing-player">
      <div className="flex justify-center py-8">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-mimosa/25 ${active ? TECHS[active].ring : ''}`} />
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-mimosa to-orange" />
        </div>
      </div>
      <div className="space-y-3">
        {Object.entries(TECHS).map(([k, t]) => (
          <button
            key={k}
            data-testid={`technique-select-${k}`}
            onClick={() => setActive(active === k ? null : k)}
            className={`w-full rounded-2xl px-5 py-4 text-left transition ${active === k ? 'bg-willow text-cloud' : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}
          >
            <p className="font-serif text-xl">{t.name}</p>
            <p className={`text-xs mt-1 ${active === k ? 'text-cloud/80' : 'text-willow-light'}`}>In {t.in}s · Hold {t.hold}s · Out {t.out}s</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BreakGlassModal({ open, onOpenChange, items }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="emergency-archive-modal" className="max-w-2xl bg-cloud-card rounded-3xl border-orange/30 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-willow-dark font-light">Reasons that mattered most.</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#535E56]">Sit here as long as you need. The people who left these are still here.</p>
        <div className="space-y-3 mt-4">
          {!items.length && <p className="text-sm text-willow-light">Nothing archived yet — share your Anchor Link so warmth can gather.</p>}
          {items.map(it => (
            <div key={it.id} className="rounded-2xl p-5 bg-mimosa-soft/40 border border-willow/10">
              <p className="text-xs uppercase tracking-widest text-willow-light">{it.supporter_name}</p>
              {it.text && <p className="font-serif text-lg text-willow-dark mt-2">"{it.text}"</p>}
              {it.media_path && it.media_path.match(/\.(mp3|wav|ogg|m4a|webm)$/i) && (
                <audio controls autoPlay src={fileUrl(it.media_path)} className="mt-3 w-full" />
              )}
              {it.media_path && it.media_path.match(/\.(png|jpe?g|webp|gif)$/i) && (
                <img src={fileUrl(it.media_path)} className="mt-3 rounded-xl w-full max-h-64 object-cover" alt=""/>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComfortAI({ open, onOpenChange }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const sess = useRef(`comfort-${Date.now()}`);

  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input.trim();
    setInput(''); setBusy(true);
    setMsgs(m => [...m, { role: 'user', text: msg }, { role: 'assistant', text: '' }]);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: sess.current, mode: 'comfort' }),
      });
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop();
        for (const p of parts) {
          if (!p.startsWith('data:')) continue;
          const chunk = p.slice(5).trimStart();
          if (chunk === '[DONE]') continue;
          setMsgs(m => { const c = [...m]; c[c.length-1] = { role: 'assistant', text: c[c.length-1].text + chunk }; return c; });
        }
      }
    } catch { setMsgs(m => [...m, { role: 'assistant', text: 'I am here. Take one slow breath.' }]); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-cloud-card rounded-3xl border-willow/15" data-testid="comfort-ai-dialog">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-willow-dark font-light">Anchor · a gentle companion</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[380px] overflow-y-auto py-2">
          {!msgs.length && <p className="text-sm text-willow-light">Whatever is here right now — say it. Anchor will not fix. It will sit.</p>}
          {msgs.map((m, i) => (
            <div key={i} className={`rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-willow text-cloud ml-8' : 'bg-mimosa-soft/60 text-willow-dark mr-8 font-serif text-base'}`}>
              {m.text || '…'}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input data-testid="comfort-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="say anything, gently…" className="rounded-full bg-cloud-subtle border-willow/10" />
          <Button data-testid="comfort-send-btn" onClick={send} disabled={busy} className="rounded-full bg-orange text-cloud"><Send className="w-4 h-4" /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function last14Days(pulses) {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const p = pulses.find(x => (x.created_at || '').slice(0, 10) === key);
    days.push({ day: key.slice(5), state: p?.state || null });
  }
  return days;
}

function MoodChart({ data }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 mt-4" data-testid="mood-rhythm-chart">
      {data.map((d, i) => {
        const c = d.state ? (MOOD_STATES[d.state]?.color || '#C1521E') : 'rgba(76,93,75,0.12)';
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-full aspect-square rounded" style={{ background: c }} />
            <span className="text-[8px] text-willow-light">{d.day.slice(3)}</span>
          </div>
        );
      })}
    </div>
  );
}
