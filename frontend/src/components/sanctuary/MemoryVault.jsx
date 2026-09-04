import { useEffect, useState } from 'react';
import { api, fileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Archive, Plus, X, Image as ImageIcon, Video, Mic, FileText } from 'lucide-react';

const KINDS = [
  { k: 'photo', label: 'Photo', icon: ImageIcon },
  { k: 'voice', label: 'Voice note', icon: Mic },
  { k: 'video', label: 'Video', icon: Video },
  { k: 'letter', label: 'Letter / note', icon: FileText },
];

export default function MemoryVault() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [person, setPerson] = useState('');
  const [desc, setDesc] = useState('');
  const [kind, setKind] = useState('photo');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setItems(await api.get('/memory')); } catch {} };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim()) { toast.error('A title, please.'); return; }
    setBusy(true);
    try {
      let media_path = '';
      if (file) { const up = await api.upload('/upload', file); media_path = up.path; }
      await api.post('/memory', { title, description: desc, person, kind, media_path });
      setTitle(''); setPerson(''); setDesc(''); setFile(null);
      toast.success('Kept safe.');
      load();
    } catch { toast.error('Could not save.'); }
    finally { setBusy(false); }
  };

  const remove = async (id) => { await api.del(`/memory/${id}`); load(); };

  return (
    <div className="space-y-6">
      <div className="card-organic p-6 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-mimosa-soft/60 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-4 relative">
          <div className="w-10 h-10 rounded-full bg-willow/10 flex items-center justify-center">
            <Archive className="w-4 h-4 text-willow" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-willow-dark">Memory Vault</h3>
            <p className="text-xs text-willow-light">Preserving voices, faces, and words that platforms can't take away.</p>
          </div>
        </div>
        <div className="relative grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Input data-testid="memory-person-input" value={person} onChange={e => setPerson(e.target.value)} placeholder="Who is this memory of?" className="rounded-full bg-cloud-subtle border-willow/10" />
            <Input data-testid="memory-title-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="A title (e.g. 'Mum's laugh in the kitchen')" className="rounded-full bg-cloud-subtle border-willow/10" />
            <div className="flex gap-2 flex-wrap">
              {KINDS.map(k => {
                const I = k.icon;
                return (
                  <button
                    key={k.k}
                    data-testid={`memory-kind-${k.k}`}
                    onClick={() => setKind(k.k)}
                    className={`rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 transition ${kind === k.k ? 'bg-willow text-cloud' : 'bg-cloud-subtle text-willow-dark hover:bg-mimosa-soft'}`}
                  >
                    <I className="w-3.5 h-3.5" /> {k.label}
                  </button>
                );
              })}
            </div>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="A small note about this memory…" className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[80px]" />
            {kind !== 'letter' && (
              <label className="flex items-center gap-3 text-sm text-willow-dark cursor-pointer">
                <span className="rounded-full px-4 py-2 bg-cloud-subtle border border-willow/10">Attach file</span>
                <span className="text-xs text-willow-light">{file?.name || 'none'}</span>
                <input
                  data-testid="memory-file-input"
                  type="file"
                  accept={kind === 'voice' ? 'audio/*' : kind === 'video' ? 'video/*' : 'image/*,video/*'}
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}
            <Button data-testid="memory-save-btn" onClick={add} disabled={busy} className="rounded-full bg-orange text-cloud gap-2">
              <Plus className="w-4 h-4" /> Keep in vault
            </Button>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {!items.length && <p className="text-sm text-willow-light">The vault is empty. Begin with one face, one voice, one laugh.</p>}
            {items.map(it => {
              const K = KINDS.find(k => k.k === it.kind) || KINDS[0];
              const I = K.icon;
              return (
                <div key={it.id} data-testid={`memory-item-${it.id}`} className="rounded-2xl bg-white/70 border border-willow/10 p-4 relative">
                  <button onClick={() => remove(it.id)} className="absolute top-2 right-2 text-willow-light hover:text-orange"><X className="w-3.5 h-3.5" /></button>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-mimosa-soft flex items-center justify-center flex-shrink-0">
                      <I className="w-4 h-4 text-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {it.person && <p className="text-[10px] uppercase tracking-widest text-willow-light">{it.person}</p>}
                      <p className="font-serif text-lg text-willow-dark leading-tight">{it.title}</p>
                      {it.description && <p className="text-xs text-[#535E56] mt-1 line-clamp-2">{it.description}</p>}
                      <p className="text-[10px] text-willow-light mt-1">{new Date(it.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {it.media_path && it.media_path.match(/\.(png|jpe?g|webp|gif)$/i) && (
                    <img src={fileUrl(it.media_path)} alt="" className="mt-3 rounded-xl w-full max-h-48 object-cover" />
                  )}
                  {it.media_path && it.media_path.match(/\.(mp3|wav|ogg|m4a|webm)$/i) && (
                    <audio controls src={fileUrl(it.media_path)} className="mt-3 w-full" />
                  )}
                  {it.media_path && it.media_path.match(/\.(mp4|mov|avi)$/i) && (
                    <video controls src={fileUrl(it.media_path)} className="mt-3 w-full rounded-xl max-h-48" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
