import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';

export default function VoiceRecorder({ onReady, dataTestIdPrefix = 'voice' }) {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState(null);
  const [url, setUrl] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const media = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const stream = useRef(null);

  useEffect(() => () => {
    clearInterval(timer.current);
    stream.current?.getTracks().forEach(t => t.stop());
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mr = new MediaRecorder(s, { mimeType: 'audio/webm' });
      media.current = mr;
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data?.size) chunks.current.push(e.data); };
      mr.onstop = () => {
        const b = new Blob(chunks.current, { type: 'audio/webm' });
        setBlob(b);
        const u = URL.createObjectURL(b);
        setUrl(u);
        s.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds(x => x + 1), 1000);
    } catch (e) {
      alert('Microphone access denied.');
    }
  };

  const stop = () => {
    clearInterval(timer.current);
    setRecording(false);
    media.current?.stop();
  };

  const clear = () => { setBlob(null); setUrl(''); setSeconds(0); };

  const attach = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      await onReady(file);
      clear();
    } finally { setBusy(false); }
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(1, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-2xl border border-willow/10 bg-cloud-subtle p-4" data-testid={`${dataTestIdPrefix}-recorder`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {!recording && !blob && (
            <button
              data-testid={`${dataTestIdPrefix}-record-btn`}
              onClick={start}
              className="w-12 h-12 rounded-full bg-orange text-cloud flex items-center justify-center hover:bg-orange/90 transition"
              title="Record a voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
          {recording && (
            <button
              data-testid={`${dataTestIdPrefix}-stop-btn`}
              onClick={stop}
              className="w-12 h-12 rounded-full bg-willow-dark text-cloud flex items-center justify-center animate-pulse"
              title="Stop recording"
            >
              <Square className="w-4 h-4" fill="currentColor" />
            </button>
          )}
          {blob && (
            <button
              data-testid={`${dataTestIdPrefix}-clear-btn`}
              onClick={clear}
              className="w-12 h-12 rounded-full bg-azul-light text-azul-dark flex items-center justify-center hover:bg-azul/40 transition"
              title="Discard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div>
            <p className="font-serif text-base text-willow-dark">
              {recording ? 'Recording…' : blob ? 'Voice note ready' : 'Leave a voice note'}
            </p>
            <p className="text-xs text-willow-light">
              {recording ? `${fmt(seconds)} · tap stop when done` : blob ? `${fmt(seconds)} recorded` : 'Up to ~2 minutes, soft and steady'}
            </p>
          </div>
        </div>
        {blob && (
          <button
            data-testid={`${dataTestIdPrefix}-attach-btn`}
            onClick={attach}
            disabled={busy}
            className="rounded-full bg-mimosa text-willow-dark px-5 py-2.5 text-sm font-medium hover:bg-mimosa-dark hover:text-cloud transition flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Attach to reason
          </button>
        )}
      </div>
      {blob && url && <audio controls src={url} className="mt-3 w-full" data-testid={`${dataTestIdPrefix}-preview`} />}
      {recording && (
        <div className="mt-3 flex items-end gap-1 h-8">
          {[...Array(28)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-orange to-mimosa"
              style={{ height: `${Math.max(8, Math.sin(i * 0.7 + seconds * 3) * 14 + 20)}px` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
