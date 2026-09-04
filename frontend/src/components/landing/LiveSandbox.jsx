import { useEffect, useRef, useState } from 'react';
import { api, API } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Square, Play, Pill, Send, Loader2, RotateCcw } from 'lucide-react';

const TABS = [
  { k: 'voice', label: 'Record a voice note', sub: 'Sanctuary', color: 'willow' },
  { k: 'pharmacy', label: 'Inspect pharmacy stock', sub: 'Nomadic Health', color: 'orange' },
  { k: 'navigator', label: 'Ask the navigator', sub: 'Survivor Safety', color: 'azul-dark' },
];

export default function LiveSandbox() {
  const [tab, setTab] = useState('voice');
  return (
    <section id="sandbox" className="max-w-5xl mx-auto px-5 lg:px-10 py-20" data-testid="live-sandbox-section">
      <p className="text-xs uppercase tracking-[0.3em] text-willow-light">Live Sandbox</p>
      <h2 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-3">Try one feature from each domain.</h2>
      <p className="mt-3 text-[#535E56] max-w-xl leading-relaxed">
        Record a real voice note, inspect pharmacy stock, or ask the survivor navigator something difficult.
        <span className="text-willow-dark font-medium"> No account, no sign-up.</span>
      </p>
      <div className="flex flex-wrap gap-2 mt-8">
        {TABS.map(t => (
          <button
            key={t.k}
            data-testid={`sandbox-tab-${t.k}`}
            onClick={() => setTab(t.k)}
            className={`rounded-full px-5 py-2.5 text-sm transition ${tab === t.k ? `bg-${t.color} text-cloud` : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="card-organic mt-6 p-6 md:p-8">
        {tab === 'voice' && <VoiceDemo />}
        {tab === 'pharmacy' && <PharmacyDemo />}
        {tab === 'navigator' && <NavigatorDemo />}
      </div>
      <p className="text-[11px] text-willow-light mt-4 text-center">
        Everything here runs live against the real product. Nothing you try is stored unless you choose to keep it.
      </p>
    </section>
  );
}

/* ---------- Voice note demo: record + play locally, nothing uploads ---------- */
function VoiceDemo() {
  const [recording, setRecording] = useState(false);
  const [url, setUrl] = useState('');
  const [seconds, setSeconds] = useState(0);
  const media = useRef(null);
  const chunks = useRef([]);
  const stream = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach(t => t.stop());
  }, []);

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mr = new MediaRecorder(s, { mimeType: 'audio/webm' });
      media.current = mr;
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data?.size) chunks.current.push(e.data); };
      mr.onstop = () => {
        setUrl(URL.createObjectURL(new Blob(chunks.current, { type: 'audio/webm' })));
        s.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true); setSeconds(0);
      timer.current = setInterval(() => setSeconds(x => x + 1), 1000);
    } catch {
      alert('Microphone access was denied.');
    }
  };
  const stop = () => { clearInterval(timer.current); setRecording(false); media.current?.stop(); };
  const reset = () => { setUrl(''); setSeconds(0); };

  return (
    <div data-testid="sandbox-voice-demo" className="text-center py-4">
      <p className="font-serif text-2xl text-willow-dark">Say something kind — to yourself, or to someone you love.</p>
      <p className="text-xs text-willow-light mt-2">Recorded entirely in your browser. It never leaves this page.</p>
      <div className="mt-8 flex flex-col items-center gap-5">
        {!url && (
          <button
            data-testid="sandbox-voice-record-btn"
            onClick={recording ? stop : start}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition shadow-lg ${recording ? 'bg-orange text-cloud animate-pulse' : 'bg-willow text-cloud hover:bg-willow-dark'}`}
          >
            {recording ? <Square className="w-7 h-7" fill="currentColor" /> : <Mic className="w-8 h-8" />}
          </button>
        )}
        {recording && (
          <p className="font-mono text-sm text-orange" data-testid="sandbox-voice-timer">
            0:{String(seconds).padStart(2, '0')} · recording
          </p>
        )}
        {recording && (
          <div className="flex items-end gap-1 h-10">
            {[...Array(32)].map((_, i) => (
              <div key={i} className="w-1 rounded-full bg-gradient-to-t from-orange to-mimosa"
                   style={{ height: `${Math.max(8, Math.sin(i * 0.7 + seconds * 3) * 16 + 24)}px` }} />
            ))}
          </div>
        )}
        {url && (
          <div className="w-full max-w-md space-y-4" data-testid="sandbox-voice-playback">
            <audio controls autoPlay src={url} className="w-full" />
            <div className="flex justify-center gap-3">
              <Button data-testid="sandbox-voice-rerecord" onClick={reset} variant="outline" className="rounded-full border-willow/20 gap-2">
                <RotateCcw className="w-4 h-4" /> Record again
              </Button>
            </div>
            <p className="text-[11px] text-willow-light">With a sanctuary, this note could be waiting for someone on their darkest day.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Pharmacy stock demo ---------- */
const MEDS = ['metformin', 'sertraline', 'azithromycin', 'cetirizine'];
function PharmacyDemo() {
  const [med, setMed] = useState('metformin');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (m) => {
    setBusy(true);
    try { setData(await api.get(`/demo/pharmacy?med=${encodeURIComponent(m)}`)); }
    catch { setData(null); }
    finally { setBusy(false); }
  };
  useEffect(() => { run('metformin'); }, []);

  return (
    <div data-testid="sandbox-pharmacy-demo">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Pill className="w-4 h-4 text-orange" />
          <Input
            data-testid="sandbox-pharmacy-input"
            value={med}
            onChange={e => setMed(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run(med)}
            placeholder="medication name…"
            className="rounded-full bg-cloud-subtle border-willow/10"
          />
        </div>
        <Button data-testid="sandbox-pharmacy-check-btn" onClick={() => run(med)} disabled={busy} className="rounded-full bg-orange text-cloud">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check stock'}
        </Button>
        <div className="flex gap-1.5">
          {MEDS.map(m => (
            <button key={m} onClick={() => { setMed(m); run(m); }} className="text-[11px] px-3 py-1 rounded-full bg-cloud-subtle hover:bg-mimosa-soft text-willow-dark transition">{m}</button>
          ))}
        </div>
      </div>
      {data?.found && (
        <div className="mt-6 overflow-x-auto" data-testid="sandbox-pharmacy-results">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-willow-light border-b border-willow/10">
                <th className="pb-3 pr-4">Country</th><th className="pb-3 pr-4">Local brand</th><th className="pb-3 pr-4">Stock</th><th className="pb-3 pr-4">Est. price</th><th className="pb-3">Rx</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.country} className="border-b border-willow/5">
                  <td className="py-3 pr-4 text-willow-dark">{r.country}</td>
                  <td className="py-3 pr-4 font-serif text-base">{r.brand}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${r.stock === 'In stock' ? 'bg-willow/10 text-willow' : r.stock === 'Low stock' ? 'bg-mimosa-soft text-mimosa-dark' : 'bg-azul-light/50 text-azul-dark'}`}>{r.stock}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs">${r.price_usd}</td>
                  <td className="py-3 text-xs text-willow-light">{r.otc ? 'OTC' : 'Prescription'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && !data.found && (
        <p className="mt-6 text-sm text-willow-light">
          We don't track "{med}" in this demo yet — try {data.supported.join(', ')}.
        </p>
      )}
    </div>
  );
}

/* ---------- Survivor navigator demo (real AI, public) ---------- */
function NavigatorDemo() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const sess = useRef(`sandbox-${Date.now()}`);
  const SUGGESTIONS = ['How do I make a safety plan without my partner noticing?', 'What is a protective order, in plain words?'];

  const send = async (msg) => {
    const m = (msg ?? input).trim();
    if (!m || busy) return;
    setInput(''); setBusy(true);
    setMsgs(x => [...x, { role: 'user', text: m }, { role: 'assistant', text: '' }]);
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: m, session_id: sess.current, mode: 'survivor' }),
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
          setMsgs(x => { const c = [...x]; c[c.length - 1] = { role: 'assistant', text: c[c.length - 1].text + chunk }; return c; });
        }
      }
    } catch {
      setMsgs(x => [...x, { role: 'assistant', text: 'I am here. Take one slow breath.' }]);
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="sandbox-navigator-demo">
      <div className="space-y-3 max-h-[320px] overflow-y-auto py-1 mb-4">
        {!msgs.length && (
          <div className="space-y-2">
            <p className="text-sm text-willow-light">Ask something difficult. The navigator answers gently, at your pace. Nothing is stored.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} data-testid="sandbox-nav-suggestion" onClick={() => send(s)} className="text-xs px-4 py-2 rounded-full bg-cloud-subtle hover:bg-mimosa-soft text-willow-dark transition text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-azul-dark text-cloud ml-10' : 'bg-cloud-subtle text-willow-dark mr-10 font-serif text-base'}`}>
            {m.text || <Loader2 className="w-4 h-4 animate-spin text-willow-light" />}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          data-testid="sandbox-navigator-input"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="ask anything, gently…"
          className="rounded-full bg-cloud-subtle border-willow/10"
        />
        <Button data-testid="sandbox-navigator-send" onClick={() => send()} disabled={busy} className="rounded-full bg-azul-dark text-cloud px-5">
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-[11px] text-willow-light mt-3">In immediate danger? Call your local emergency line. US: 911 · Crisis: 988.</p>
    </div>
  );
}
