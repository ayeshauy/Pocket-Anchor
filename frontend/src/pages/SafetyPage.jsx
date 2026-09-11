import { useEffect, useRef, useState } from 'react';
import { api, API } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Phone, Globe, Send, X, Check } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-willow-light">Survivor & IPV Support</p>
      <h1 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-2">Discreet. On your pace.</h1>
      <p className="text-[#535E56] mt-3 max-w-2xl">This section is available without signing in. Press <span className="font-mono">Esc</span> twice at any time — the screen switches to a weather dashboard.</p>

      <Tabs defaultValue="resources" className="mt-8">
        <TabsList className="bg-cloud-subtle rounded-full p-1 flex-wrap h-auto">
          <TabsTrigger value="resources" data-testid="safety-tab-resources" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Resources</TabsTrigger>
          <TabsTrigger value="navigator" data-testid="safety-tab-navigator" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Survivor Navigator</TabsTrigger>
          <TabsTrigger value="evidence" data-testid="safety-tab-evidence" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Evidence Vault</TabsTrigger>
          <TabsTrigger value="rebuild" data-testid="safety-tab-rebuild" className="rounded-full data-[state=active]:bg-azul-dark data-[state=active]:text-cloud">Rebuilding</TabsTrigger>
        </TabsList>
        <TabsContent value="resources"><Resources /></TabsContent>
        <TabsContent value="navigator"><Navigator /></TabsContent>
        <TabsContent value="evidence"><EvidenceVault /></TabsContent>
        <TabsContent value="rebuild"><Rebuilding /></TabsContent>
      </Tabs>
    </div>
  );
}

function Resources() {
  const [items, setItems] = useState([]);
  const [country, setCountry] = useState('');
  useEffect(() => { (async () => setItems(await api.get(`/resources${country ? '?country=' + country : ''}`)))(); }, [country]);
  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2 mb-5">
        {['', 'United States', 'United Kingdom', 'Australia', 'India', 'France', 'Philippines'].map(c => (
          <button
            key={c || 'all'}
            data-testid={`country-filter-${c ? c.toLowerCase().replace(/ /g, '-') : 'all'}`}
            onClick={() => setCountry(c)}
            className={`px-4 py-1.5 rounded-full text-xs ${country === c ? 'bg-azul-dark text-cloud' : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}
          >
            {c || 'All countries'}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map(r => (
          <div key={r.id} className="card-organic p-5" data-testid={`resource-${r.id}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-serif text-xl text-willow-dark">{r.name}</p>
                <p className="text-xs text-willow-light">{r.type} · {r.country}</p>
              </div>
              {r.twenty_four_seven && <span className="text-[10px] uppercase tracking-widest bg-mimosa-soft text-orange px-2 py-1 rounded-full">24/7</span>}
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <a href={`tel:${r.phone}`} className="inline-flex items-center gap-2 rounded-full bg-orange text-cloud px-4 py-2 text-sm"><Phone className="w-4 h-4" /> {r.phone}</a>
              <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-cloud-subtle text-willow-dark px-4 py-2 text-sm"><Globe className="w-4 h-4" /> Visit</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Navigator() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const sess = useRef(`survivor-${Date.now()}`);
  const send = async () => {
    if (!input.trim() || busy) return;
    const msg = input.trim(); setInput(''); setBusy(true);
    setMsgs(m => [...m, { role: 'user', text: msg }, { role: 'assistant', text: '' }]);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, session_id: sess.current, mode: 'survivor' }),
      });
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
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
  const purge = () => { setMsgs([]); sess.current = `survivor-${Date.now()}`; toast.success('Chat cleared.'); };
  return (
    <div className="mt-6 card-organic p-6" data-testid="survivor-chat-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-willow-light">Survivor Navigator</p>
          <p className="font-serif text-2xl text-willow-dark">Trauma-informed. Nothing pressured.</p>
        </div>
        <Button data-testid="chat-purge-instant-btn" onClick={purge} variant="outline" className="rounded-full border-willow/20">Purge chat</Button>
      </div>
      <div className="space-y-3 max-h-[420px] overflow-y-auto py-2 mb-3">
        {!msgs.length && <p className="text-sm text-willow-light">Start whenever you are ready. Nothing here is stored beyond this session.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-azul-dark text-cloud ml-12' : 'bg-cloud-subtle text-willow-dark mr-12 font-serif text-base'}`}>{m.text || '…'}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea data-testid="chat-input-textarea" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => (e.key === 'Enter' && !e.shiftKey) && (e.preventDefault(), send())} placeholder="Whatever you need to say — at your pace." className="rounded-2xl bg-cloud-subtle border-willow/10 resize-none min-h-[52px]" />
        <Button data-testid="chat-send-btn" onClick={send} disabled={busy} className="rounded-full bg-azul-dark text-cloud px-5"><Send className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

function EvidenceVault() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [file, setFile] = useState(null);
  const [decoy, setDecoy] = useState(false);
  const load = async () => { try { if (user) setItems(await api.get('/evidence')); } catch {} };
  useEffect(() => { load(); }, [user]);
  if (!user) return <p className="mt-6 text-sm text-willow-light">Evidence Vault requires a sanctuary to keep records safe. <a className="text-orange" href="/">Open one</a>.</p>;
  const add = async () => {
    if (!title.trim()) return;
    let media_path = '';
    if (file) { const up = await api.upload('/upload', file); media_path = up.path; }
    await api.post('/evidence', { title, description: desc, media_path, incident_date: new Date().toISOString(), tags: [] });
    setTitle(''); setDesc(''); setFile(null); toast.success('Logged. Timestamped.'); load();
  };
  return (
    <div className="mt-6 grid md:grid-cols-[1fr_1.3fr] gap-6" data-testid="evidence-vault-container">
      <div className="card-organic p-5 space-y-3">
        <label className="flex items-center gap-2 text-sm text-willow">
          <input data-testid="decoy-mode-toggle" type="checkbox" checked={decoy} onChange={e => setDecoy(e.target.checked)} />
          Show as "Notes & Recipes"
        </label>
        <Input data-testid="evidence-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={decoy ? 'Recipe title' : 'Incident title (private)'} className="rounded-full bg-cloud-subtle border-willow/10" />
        <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder={decoy ? 'Ingredients & steps' : 'What happened. Only you see this.'} className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[120px]" />
        <label className="flex items-center gap-3 text-sm text-willow-dark cursor-pointer">
          <span className="rounded-full px-4 py-2 bg-cloud-subtle border border-willow/10">Attach file</span>
          <span className="text-xs text-willow-light">{file?.name || 'none'}</span>
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" data-testid="evidence-file-input" />
        </label>
        <Button data-testid="add-incident-log-btn" onClick={add} className="rounded-full bg-azul-dark text-cloud">Save entry</Button>
      </div>
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
        {!items.length && <p className="text-sm text-willow-light">Nothing logged yet.</p>}
        {items.map(it => (
          <div key={it.id} className="rounded-2xl bg-white/70 border border-willow/10 p-4">
            <p className="font-serif text-lg text-willow-dark">{decoy ? 'Recipe ' + it.id.slice(-4) : it.title}</p>
            <p className="text-[10px] uppercase tracking-widest text-willow-light mt-0.5">{new Date(it.incident_date || it.created_at).toLocaleString()}</p>
            <p className="mt-2 text-sm text-[#535E56] whitespace-pre-wrap">{decoy ? '— ingredients & steps —' : it.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Rebuilding() {
  const { user } = useAuth();
  const [tab, setTab] = useState('housing');
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const load = async () => { try { if (user) setItems(await api.get('/rebuilding')); } catch {} };
  useEffect(() => { load(); }, [user]);
  if (!user) return <p className="mt-6 text-sm text-willow-light">The Rebuilding Tracker keeps your progress. <a className="text-orange" href="/">Open a sanctuary first</a>.</p>;
  const add = async () => { if (!title.trim()) return; await api.post('/rebuilding', { track: tab, title, done: false }); setTitle(''); load(); };
  const toggle = async (id) => { await api.patch(`/rebuilding/${id}`, {}); load(); };
  const tracks = [
    { k: 'housing', label: 'Safe Housing', color: 'bg-willow' },
    { k: 'financial', label: 'Financial Independence', color: 'bg-orange' },
    { k: 'emotional', label: 'Emotional Recovery', color: 'bg-mimosa-dark' },
    { k: 'legal', label: 'Legal & Identity', color: 'bg-azul-dark' },
  ];
  return (
    <div className="mt-6" data-testid="rebuilding-tracker-container">
      <div className="flex flex-wrap gap-2 mb-5">
        {tracks.map(t => (
          <button key={t.k} data-testid={`track-tab-${t.k}`} onClick={() => setTab(t.k)} className={`px-4 py-2 rounded-full text-sm ${tab === t.k ? `${t.color} text-cloud` : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}>{t.label}</button>
        ))}
      </div>
      <div className="card-organic p-5">
        <div className="flex gap-2 mb-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={`A small step for ${tracks.find(t => t.k === tab).label}`} className="rounded-full bg-cloud-subtle border-willow/10" />
          <Button onClick={add} className="rounded-full bg-willow text-cloud">Add step</Button>
        </div>
        <div className="space-y-2">
          {items.filter(i => i.track === tab).map(i => (
            <button key={i.id} data-testid={`goal-${i.id}`} onClick={() => toggle(i.id)} className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${i.done ? 'bg-willow/10 line-through text-willow-light' : 'bg-cloud-subtle hover:bg-mimosa-soft'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${i.done ? 'bg-willow text-cloud' : 'border-2 border-willow/30'}`}>{i.done && <Check className="w-3 h-3" />}</span>
              <span>{i.title}</span>
            </button>
          ))}
          {!items.filter(i => i.track === tab).length && <p className="text-sm text-willow-light">Nothing here yet. Small steps count.</p>}
        </div>
      </div>
    </div>
  );
}
