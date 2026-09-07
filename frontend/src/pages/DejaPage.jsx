import { useEffect, useRef, useState } from 'react';
import { api, API } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Moon, Mic, Square, Sparkles, Eye, Trash2, Download, MapPin, Search, X, Brain, Globe2, Lock } from 'lucide-react';

const MOON_BG = 'bg-gradient-to-br from-[#2d3242] via-azul-dark to-willow-dark';

export default function DejaPage() {
  const [dreams, setDreams] = useState([]);
  const [moments, setMoments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  useEffect(() => { api.get('/stripe/status').then(setSub).catch(() => setSub({ active: false })); }, []);

  const load = async () => {
    try {
      const [d, m, p] = await Promise.all([api.get('/deja/dreams'), api.get('/deja/moments'), api.get('/deja/profile')]);
      setDreams(d); setMoments(m); setProfile(p);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  if (sub && !sub.active) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-20 text-center" data-testid="deja-upgrade-gate">
        <div className={`rounded-3xl ${MOON_BG} text-cloud p-10 relative overflow-hidden`}>
          <Moon className="w-10 h-10 text-mimosa mx-auto" />
          <h1 className="font-serif text-4xl font-light mt-4">Déjà travels with a Nomad Pass.</h1>
          <p className="text-cloud/75 mt-4 leading-relaxed">
            Dreams, moments, and the strange familiar — part of the Core Layer, $12/month or $99/year.
          </p>
          <a href="/pricing">
            <Button data-testid="deja-upgrade-cta" className="mt-6 rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud px-8 h-12">
              See Nomad Pass →
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-10 py-10 overflow-x-hidden">
      {/* Hero */}
      <div className={`relative rounded-3xl ${MOON_BG} text-cloud p-8 md:p-12 overflow-hidden`} data-testid="deja-hero">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-mimosa/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-72 h-72 rounded-full bg-azul/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.3em] text-mimosa flex items-center gap-2"><Moon className="w-4 h-4" /> Déjà · Core Layer</p>
          <h1 className="font-serif text-4xl md:text-6xl font-light mt-4 leading-[1.05]">What if you've already<br/>dreamed this moment?</h1>
          <p className="mt-4 text-cloud/80 max-w-xl leading-relaxed">
            Your dreams disappear when you wake up. Déjà helps you remember them — and discover when life feels strangely familiar.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl" data-testid="deja-stats">
            <Stat label="Dreams" value={profile?.dreams ?? 0} testId="stat-dreams" />
            <Stat label="Possible matches" value={profile?.possible ?? 0} testId="stat-possible" />
            <Stat label="Confirmed" value={profile?.confirmed ?? 0} testId="stat-confirmed" />
            <Stat label="Countries" value={profile?.countries ?? 0} testId="stat-countries" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="record" className="mt-8">
        <TabsList className="bg-cloud-subtle rounded-full p-1 flex-wrap h-auto">
          <TabsTrigger value="record" data-testid="deja-tab-record" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Record a Dream</TabsTrigger>
          <TabsTrigger value="moment" data-testid="deja-tab-moment" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">👁 I'm Experiencing Déjà Vu</TabsTrigger>
          <TabsTrigger value="vault" data-testid="deja-tab-vault" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Dream Vault</TabsTrigger>
          <TabsTrigger value="map" data-testid="deja-tab-map" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">My Déjà Map</TabsTrigger>
          <TabsTrigger value="profile" data-testid="deja-tab-profile" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Your Déjà</TabsTrigger>
        </TabsList>
        <TabsContent value="record" className="mt-6"><RecordDream onSaved={load} /></TabsContent>
        <TabsContent value="moment" className="mt-6"><DejaVuMoment dreams={dreams} onSaved={load} /></TabsContent>
        <TabsContent value="vault" className="mt-6"><DreamVault dreams={dreams} onChanged={load} /></TabsContent>
        <TabsContent value="map" className="mt-6"><DejaMap /></TabsContent>
        <TabsContent value="profile" className="mt-6"><DejaProfile profile={profile} dreams={dreams} onChanged={load} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, testId }) {
  return (
    <div className="rounded-2xl bg-cloud/10 border border-cloud/15 p-4 text-center" data-testid={testId}>
      <p className="font-serif text-3xl">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.18em] text-cloud/60 mt-1">{label}</p>
    </div>
  );
}

/* ---------------- Record a Dream ---------------- */
function RecordDream({ onSaved }) {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(null);

  const save = async () => {
    if (!text.trim()) { toast.error('Tell the dream first — even a fragment.'); return; }
    setBusy(true);
    try {
      const d = await api.post('/deja/dreams', { text, location, country, tags: tags.split(',').map(t => t.trim()).filter(Boolean) });
      setJustSaved(d);
      setText(''); setLocation(''); setCountry(''); setTags('');
      toast.success('Dream preserved — timestamped and untouched.');
      onSaved();
    } catch { toast.error('Could not save the dream.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="record-dream-form">
      <div className="card-organic p-6 space-y-4">
        <VoiceToText onText={(t) => setText((cur) => (cur ? cur + ' ' : '') + t)} />
        <Textarea
          data-testid="dream-text-input"
          value={text} onChange={e => setText(e.target.value)}
          placeholder="I was walking through an airport with a blue suitcase. It was raining and there was a little girl beside me…"
          className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[140px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input data-testid="dream-location-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Place (optional)" className="rounded-full bg-cloud-subtle border-willow/10" />
          <Input data-testid="dream-country-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country (optional)" className="rounded-full bg-cloud-subtle border-willow/10" />
        </div>
        <Input data-testid="dream-tags-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags, comma separated (optional)" className="rounded-full bg-cloud-subtle border-willow/10" />
        <Button data-testid="dream-save-btn" onClick={save} disabled={busy} className="rounded-full bg-azul-dark text-cloud hover:bg-azul-dark/90 w-full h-12">
          {busy ? 'Listening to the dream…' : 'Preserve this dream'}
        </Button>
        <p className="text-[11px] text-willow-light text-center">AI extracts places, objects, people, weather, and emotions automatically. You never categorize.</p>
      </div>

      <div className="space-y-4">
        {justSaved ? (
          <div className="card-organic p-6" data-testid="dream-saved-card">
            <p className="text-xs uppercase tracking-[0.24em] text-willow-light flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> Original Dream · preserved</p>
            <p className="font-serif text-lg text-willow-dark mt-2 leading-relaxed">"{justSaved.text}"</p>
            <p className="text-[11px] text-willow-light mt-2">Recorded {new Date(justSaved.created_at).toLocaleString()}</p>
            <Elements elements={justSaved.elements} />
            <p className="text-xs text-willow-light mt-4">This original will never change. You can add reflections later — they live beside it, not inside it.</p>
          </div>
        ) : (
          <div className={`rounded-3xl ${MOON_BG} text-cloud p-8 h-full flex flex-col justify-center`}>
            <Moon className="w-8 h-8 text-mimosa mb-4" />
            <p className="font-serif text-2xl font-light leading-snug">Dreams fade within minutes of waking.</p>
            <p className="text-sm text-cloud/70 mt-3 leading-relaxed">Record it now — voice or text. Déjà keeps the original forever, so months from now you can prove to yourself: <em className="text-mimosa not-italic">I wrote this down before it happened.</em></p>
          </div>
        )}
      </div>
    </div>
  );
}

function Elements({ elements }) {
  if (!elements) return null;
  const groups = [
    ['places', '📍'], ['objects', '🧳'], ['people', '👤'], ['environment', '🌧'],
    ['actions', '🚶'], ['emotions', '💭'], ['colors', '🎨'], ['sounds', '🎵'],
  ];
  return (
    <div className="flex flex-wrap gap-1.5 mt-4" data-testid="dream-elements">
      {groups.map(([k, icon]) => (elements[k] || []).map(v => (
        <span key={`${k}-${v}`} className="text-xs px-2.5 py-1 rounded-full bg-mimosa-soft text-willow-dark">{icon} {v}</span>
      )))}
    </div>
  );
}

function VoiceToText({ onText }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const media = useRef(null); const chunks = useRef([]); const stream = useRef(null);

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mr = new MediaRecorder(s, { mimeType: 'audio/webm' });
      media.current = mr; chunks.current = [];
      mr.ondataavailable = e => { if (e.data?.size) chunks.current.push(e.data); };
      mr.onstop = async () => {
        s.getTracks().forEach(t => t.stop());
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append('file', new File([new Blob(chunks.current, { type: 'audio/webm' })], 'dream.webm', { type: 'audio/webm' }));
          const res = await fetch(`${API}/deja/transcribe`, { method: 'POST', body: fd, credentials: 'include' });
          const data = await res.json();
          if (data.text) { onText(data.text); toast.success('Dream transcribed.'); }
          else toast.error('Could not hear that — try again or type it.');
        } catch { toast.error('Transcription failed — type it instead.'); }
        finally { setBusy(false); }
      };
      mr.start(); setRecording(true);
    } catch { toast.error('Microphone access denied.'); }
  };
  const stop = () => { setRecording(false); media.current?.stop(); };

  return (
    <div className="flex items-center gap-3">
      <button
        data-testid="dream-voice-btn"
        onClick={recording ? stop : start}
        disabled={busy}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow ${recording ? 'bg-orange text-cloud animate-pulse' : 'bg-azul-dark text-cloud hover:bg-azul-dark/90'}`}
      >
        {busy ? <Sparkles className="w-5 h-5 animate-spin" /> : recording ? <Square className="w-5 h-5" fill="currentColor" /> : <Mic className="w-6 h-6" />}
      </button>
      <div>
        <p className="font-serif text-lg text-willow-dark">{busy ? 'Transcribing your dream…' : recording ? 'Recording… tap to stop' : 'Speak the dream'}</p>
        <p className="text-xs text-willow-light">Voice becomes text automatically — then AI reads the symbols.</p>
      </div>
    </div>
  );
}

/* ---------------- I'm Experiencing Déjà Vu ---------------- */
function DejaVuMoment({ onSaved }) {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [verdictDone, setVerdictDone] = useState(false);

  const analyze = async () => {
    if (!text.trim()) { toast.error('Describe what feels familiar.'); return; }
    setBusy(true); setResult(null); setVerdictDone(false);
    try {
      const r = await api.post('/deja/moments', { text, location, country });
      setResult(r);
    } catch { toast.error('Could not search your dreams.'); }
    finally { setBusy(false); }
  };

  const verdict = async (v) => {
    try {
      await api.post(`/deja/moments/${result.id}/verdict`, { verdict: v });
      setVerdictDone(true);
      toast.success(v === 'confirmed' ? 'Marked as a confirmed match.' : v === 'possible' ? 'Kept as a possible match.' : 'Marked as coincidence.');
      onSaved();
    } catch { toast.error('Could not save.'); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="deja-moment-form">
      <div className="card-organic p-6 space-y-4">
        <p className="font-serif text-2xl text-willow-dark flex items-center gap-2"><Eye className="w-5 h-5 text-azul-dark" /> What feels familiar?</p>
        <VoiceToText onText={(t) => setText((cur) => (cur ? cur + ' ' : '') + t)} />
        <Textarea
          data-testid="moment-text-input"
          value={text} onChange={e => setText(e.target.value)}
          placeholder="I'm sitting in a café in Lisbon and I suddenly feel like I've dreamed about this…"
          className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[120px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input data-testid="moment-location-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Where are you? (optional)" className="rounded-full bg-cloud-subtle border-willow/10" />
          <Input data-testid="moment-country-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country (optional)" className="rounded-full bg-cloud-subtle border-willow/10" />
        </div>
        <Button data-testid="moment-search-btn" onClick={analyze} disabled={busy} className="rounded-full bg-orange text-cloud hover:bg-orange/90 w-full h-12">
          {busy ? 'Searching your dreams…' : 'Search my dreams'}
        </Button>
      </div>

      <div>
        {busy && (
          <div className={`rounded-3xl ${MOON_BG} text-cloud p-8 text-center h-full flex flex-col items-center justify-center`}>
            <Brain className="w-8 h-8 text-mimosa animate-pulse" />
            <p className="font-serif text-xl mt-4">Reading your dream history…</p>
            <p className="text-xs text-cloud/60 mt-2">Semantic search — not just keywords. Meanings, not words.</p>
          </div>
        )}
        {result && !result.matches?.length && (
          <div className="card-organic p-8 text-center" data-testid="no-match-card">
            <p className="font-serif text-2xl text-willow-dark">Nothing in your dream vault resembles this — yet.</p>
            <p className="text-sm text-[#535E56] mt-3">This moment is preserved. If a dream ever echoes it, Déjà will find the thread.</p>
          </div>
        )}
        {result && result.matches?.length > 0 && (
          <div className="rounded-3xl bg-white border-2 border-mimosa/50 p-6" data-testid="match-result-card">
            <p className="text-xs uppercase tracking-[0.24em] text-orange flex items-center gap-2"><Brain className="w-4 h-4" /> We found something</p>
            <p className="font-serif text-xl text-willow-dark mt-2">Your current experience may resemble a dream you recorded {result.matches[0].days_ago} days ago.</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="rounded-2xl bg-azul-light/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-azul-dark">Your dream · {result.matches[0].dream_date}</p>
                <p className="font-serif text-sm text-willow-dark mt-2 leading-relaxed">"{result.matches[0].dream_text}"</p>
              </div>
              <div className="rounded-2xl bg-mimosa-soft p-4">
                <p className="text-[10px] uppercase tracking-widest text-orange">Today{result.location ? ` · ${result.location}` : ''}</p>
                <p className="font-serif text-sm text-willow-dark mt-2 leading-relaxed">"{result.text}"</p>
              </div>
            </div>
            <p className="text-center font-mono text-2xl text-orange mt-4" data-testid="similarity-score">{result.matches[0].similarity}% similarity</p>
            <div className="mt-4 space-y-1.5">
              {result.matches[0].matching_elements?.map((m, i) => (
                <div key={i} className="flex justify-between text-sm px-3 py-1.5 rounded-xl bg-cloud-subtle">
                  <span className="text-willow-dark">{m.element}</span>
                  <span className="text-xs text-willow-light">{m.strength}</span>
                </div>
              ))}
            </div>
            {!verdictDone ? (
              <div className="mt-6">
                <p className="text-sm text-willow-dark text-center mb-3">Did this feel like the same moment? <span className="text-willow-light">You decide what it means.</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button data-testid="verdict-confirmed" onClick={() => verdict('confirmed')} className="rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud">✨ Yes — this is it</Button>
                  <Button data-testid="verdict-possible" onClick={() => verdict('possible')} variant="outline" className="rounded-full border-willow/20">🤔 Similar, not the same</Button>
                  <Button data-testid="verdict-rejected" onClick={() => verdict('rejected')} variant="outline" className="rounded-full border-willow/20 text-willow-light">❌ Just a coincidence</Button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-willow-light mt-6 font-serif text-lg">Recorded. Only you decide what it means.</p>
            )}
            <p className="text-[11px] text-willow-light text-center mt-4">This is a similarity, not proof that the events are connected.</p>
          </div>
        )}
        {!busy && !result && (
          <div className={`rounded-3xl ${MOON_BG} text-cloud p-8 h-full flex flex-col justify-center`}>
            <Eye className="w-8 h-8 text-mimosa mb-4" />
            <p className="font-serif text-2xl font-light leading-snug">That sudden chill of familiarity — capture it while it's fresh.</p>
            <p className="text-sm text-cloud/70 mt-3 leading-relaxed">Déjà compares this moment against every dream you've recorded, using meaning rather than keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Dream Vault ---------------- */
function DreamVault({ dreams, onChanged }) {
  const [q, setQ] = useState('');
  const [reflecting, setReflecting] = useState(null);
  const [reflection, setReflection] = useState('');

  const filtered = dreams.filter(d => {
    if (!q.trim()) return true;
    const hay = (d.text + ' ' + (d.tags || []).join(' ') + ' ' + JSON.stringify(d.elements || {})).toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const del = async (id) => { await api.del(`/deja/dreams/${id}`); toast.success('Dream deleted.'); onChanged(); };
  const addReflection = async () => {
    if (!reflection.trim()) return;
    await api.post(`/deja/dreams/${reflecting.id}/reflection`, { text: reflection });
    setReflecting(null); setReflection('');
    toast.success('Reflection added — original untouched.');
    onChanged();
  };

  return (
    <div data-testid="dream-vault">
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-willow-light" />
        <Input data-testid="vault-search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search dreams — places, objects, feelings…" className="rounded-full bg-cloud-subtle border-willow/10 pl-11" />
      </div>
      {!filtered.length && <p className="text-sm text-willow-light">{dreams.length ? 'No dreams match that search.' : 'The vault is empty. Record your first dream.'}</p>}
      <div className="space-y-3">
        {filtered.map(d => (
          <div key={d.id} className="card-organic p-5" data-testid={`dream-card-${d.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-xs text-willow-light">{new Date(d.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
                  <MatchBadge status={d.match_status} />
                  {d.location && <span className="text-[11px] text-willow-light flex items-center gap-1"><MapPin className="w-3 h-3" />{d.location}</span>}
                </div>
                <p className="font-serif text-lg text-willow-dark mt-2 leading-relaxed">"{d.text}"</p>
                <Elements elements={d.elements} />
                {(d.reflections || []).length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-mimosa/50 space-y-2">
                    {d.reflections.map((r, i) => (
                      <p key={i} className="text-xs text-[#535E56]"><span className="text-willow-light">{new Date(r.at).toLocaleDateString()} —</span> {r.text}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button data-testid={`dream-reflect-${d.id}`} onClick={() => setReflecting(d)} className="text-xs text-azul-dark hover:underline">+ reflection</button>
                <button data-testid={`dream-delete-${d.id}`} onClick={() => del(d.id)} className="text-willow-light hover:text-orange"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!reflecting} onOpenChange={() => setReflecting(null)}>
        <DialogContent className="bg-cloud-card rounded-3xl border-willow/15 max-w-md" data-testid="reflection-dialog">
          <DialogHeader><DialogTitle className="font-serif text-2xl text-willow-dark font-light">Add a later reflection</DialogTitle></DialogHeader>
          <DialogDescription className="text-xs text-willow-light">The original dream stays untouched. This lives beside it.</DialogDescription>
          <Textarea data-testid="reflection-input" value={reflection} onChange={e => setReflection(e.target.value)} placeholder="What you remembered later…" className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[100px]" />
          <Button data-testid="reflection-save-btn" onClick={addReflection} className="rounded-full bg-azul-dark text-cloud">Add reflection</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchBadge({ status }) {
  const map = {
    confirmed: ['✨ Confirmed match', 'bg-mimosa-soft text-mimosa-dark'],
    possible: ['🧠 Possible match', 'bg-azul-light/50 text-azul-dark'],
    rejected: ['❌ Coincidence', 'bg-cloud-muted text-willow-light'],
  };
  if (!status || !map[status]) return <span className="text-[10px] px-2 py-0.5 rounded-full bg-cloud-subtle text-willow-light">no match yet</span>;
  const [label, cls] = map[status];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`} data-testid="match-badge">{label}</span>;
}

/* ---------------- Déjà Map ---------------- */
function DejaMap() {
  const [map, setMap] = useState([]);
  useEffect(() => { api.get('/deja/map').then(setMap).catch(() => {}); }, []);
  return (
    <div data-testid="deja-map">
      <p className="font-serif text-2xl text-willow-dark flex items-center gap-2"><Globe2 className="w-5 h-5 text-willow" /> My Déjà Map</p>
      <p className="text-sm text-willow-light mt-1 mb-6">Completely private — only you see where your dreams and moments connect.</p>
      {!map.length && <p className="text-sm text-willow-light">No places connected yet. Add a country when recording dreams or moments.</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {map.map(c => (
          <div key={c.country} className={`rounded-3xl ${MOON_BG} text-cloud p-6`} data-testid={`map-country-${c.country}`}>
            <p className="font-serif text-2xl">{c.country}</p>
            <div className="flex gap-4 mt-3 text-sm text-cloud/80">
              <span>🌙 {c.dreams} dreams</span>
              <span>👁 {c.moments} moments</span>
              <span>✨ {c.confirmed} confirmed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Profile + Privacy + Share ---------------- */
function DejaProfile({ profile, dreams, onChanged }) {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const themes = profile?.themes || [];
  const confirmed = (profile?.confirmed_moments || []);

  const exportData = async () => {
    const data = await api.get('/deja/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'deja-export.json';
    a.click();
    toast.success('Your Déjà data is downloading.');
  };
  const wipe = async () => {
    await api.del('/deja/all');
    setConfirmWipe(false);
    toast.success('All Déjà data deleted.');
    onChanged();
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="deja-profile">
      <div className="space-y-6">
        <div className="card-organic p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-willow-light flex items-center gap-2"><Brain className="w-4 h-4" /> Your recurring themes</p>
          {!themes.length && <p className="text-sm text-willow-light mt-3">Record a few dreams and patterns will surface here.</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            {themes.map(t => (
              <span key={t.label} className="text-sm px-4 py-2 rounded-full bg-mimosa-soft text-willow-dark">{t.icon} {t.label} · {t.count}×</span>
            ))}
          </div>
          {themes.length > 0 && <p className="text-xs text-willow-light mt-4">These are descriptive patterns, not interpretations. Only you decide what they mean.</p>}
        </div>

        {confirmed.length > 0 && (
          <div className="card-organic p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-willow-light mb-4">Shareable cards</p>
            {confirmed.map(m => <ShareCard key={m.id} moment={m} />)}
          </div>
        )}
      </div>

      <div className="card-organic p-6" data-testid="deja-privacy">
        <p className="text-xs uppercase tracking-[0.24em] text-willow-light flex items-center gap-2"><Lock className="w-4 h-4" /> Privacy — private by default</p>
        <ul className="mt-4 space-y-2 text-sm text-[#535E56]">
          <li>· Dreams and experiences are private. There is no public dream feed.</li>
          <li>· AI reads your dreams only to extract elements and find similarities — nothing else.</li>
          <li>· Your dream data is never sold. Ever.</li>
          <li>· Nothing is shared unless you explicitly create a share card.</li>
          <li>· Original dream records keep their timestamp and never change.</li>
        </ul>
        <div className="mt-6 space-y-3">
          <Button data-testid="deja-export-btn" onClick={exportData} variant="outline" className="rounded-full border-willow/20 gap-2 w-full">
            <Download className="w-4 h-4" /> Export my Déjà data (JSON)
          </Button>
          {!confirmWipe ? (
            <Button data-testid="deja-wipe-btn" onClick={() => setConfirmWipe(true)} variant="outline" className="rounded-full border-orange/30 text-orange gap-2 w-full">
              <Trash2 className="w-4 h-4" /> Delete all Déjà data
            </Button>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-orange/40 p-4 text-center">
              <p className="text-sm text-orange">Delete every dream, moment, and match? This cannot be undone.</p>
              <div className="flex justify-center gap-2 mt-3">
                <Button data-testid="deja-wipe-confirm" onClick={wipe} className="rounded-full bg-orange text-cloud">Yes, delete everything</Button>
                <Button onClick={() => setConfirmWipe(false)} variant="outline" className="rounded-full border-willow/20">Keep them</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Shareable card (canvas render) ---------------- */
function ShareCard({ moment }) {
  const [showLocation, setShowLocation] = useState(true);
  const ref = useRef(null);

  const draw = () => {
    const c = ref.current;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;
    // night gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#2d3242'); g.addColorStop(0.6, '#4D5468'); g.addColorStop(1, '#4C5D4B');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // moon
    ctx.fillStyle = '#F7B557';
    ctx.beginPath(); ctx.arc(W - 140, 130, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(45,50,66,0.85)';
    ctx.beginPath(); ctx.arc(W - 120, 118, 48, 0, Math.PI * 2); ctx.fill();

    const wrap = (text, x, y, maxW, lh, font, color) => {
      ctx.font = font; ctx.fillStyle = color;
      const words = text.split(' '); let line = '';
      for (const w of words) {
        if (ctx.measureText(line + w).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = ''; }
        line += w + ' ';
      }
      ctx.fillText(line.trim(), x, y);
      return y + lh;
    };

    let y = 90;
    ctx.textBaseline = 'top';
    ctx.font = '600 26px "IBM Plex Mono", monospace'; ctx.fillStyle = '#F7B557';
    ctx.fillText(`I DREAMED THIS ${moment.days_ago ?? ''} DAYS AGO.`.toUpperCase(), 60, y); y += 70;
    ctx.font = '500 20px "DM Sans", sans-serif'; ctx.fillStyle = '#9197AA';
    ctx.fillText('DREAM', 60, y); y += 34;
    y = wrap(`"${moment.dream_text}"`, 60, y, W - 120, 40, 'italic 30px Georgia, serif', '#FBFBF9') + 20;
    ctx.strokeStyle = 'rgba(247,181,87,.5)'; ctx.beginPath(); ctx.moveTo(W / 2, y); ctx.lineTo(W / 2, y + 34); ctx.stroke();
    ctx.fillStyle = '#F7B557'; ctx.beginPath(); ctx.moveTo(W / 2 - 8, y + 34); ctx.lineTo(W / 2 + 8, y + 34); ctx.lineTo(W / 2, y + 46); ctx.fill();
    y += 66;
    ctx.font = '500 20px "DM Sans", sans-serif'; ctx.fillStyle = '#9197AA';
    ctx.fillText('REALITY', 60, y); y += 34;
    y = wrap(`"${moment.text}"`, 60, y, W - 120, 40, 'italic 30px Georgia, serif', '#FBFBF9') + 16;
    ctx.font = '700 34px "IBM Plex Mono", monospace'; ctx.fillStyle = '#F7B557';
    ctx.fillText(`${moment.similarity}% SIMILARITY`, 60, H - 150);
    if (showLocation && moment.location) {
      ctx.font = '500 22px "DM Sans", sans-serif'; ctx.fillStyle = 'rgba(251,251,249,.75)';
      ctx.fillText(`📍 ${moment.location}`, 60, H - 100);
    }
    ctx.font = '500 18px "DM Sans", sans-serif'; ctx.fillStyle = 'rgba(251,251,249,.5)';
    ctx.fillText('Déjà · Pocket Anchor', W - 280, H - 60);
  };
  useEffect(() => { draw(); });

  const download = () => {
    const a = document.createElement('a');
    a.href = ref.current.toDataURL('image/png');
    a.download = 'deja-card.png';
    a.click();
  };

  return (
    <div className="mb-4" data-testid={`share-card-${moment.id}`}>
      <canvas ref={ref} width={900} height={720} className="w-full rounded-2xl border border-willow/10" />
      <div className="flex items-center gap-3 mt-3">
        <label className="flex items-center gap-2 text-xs text-willow">
          <input data-testid={`share-location-toggle-${moment.id}`} type="checkbox" checked={showLocation} onChange={e => setShowLocation(e.target.checked)} /> Show location
        </label>
        <Button data-testid={`share-download-${moment.id}`} onClick={download} size="sm" className="rounded-full bg-azul-dark text-cloud gap-2">
          <Download className="w-3.5 h-3.5" /> Download card
        </Button>
      </div>
    </div>
  );
}
