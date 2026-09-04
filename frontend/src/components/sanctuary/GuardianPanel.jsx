import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserPlus, Bell, Heart, Send, X, Flame } from 'lucide-react';

export default function GuardianPanel() {
  const [guardians, setGuardians] = useState([]);
  const [feed, setFeed] = useState([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pulseNote, setPulseNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [g, f] = await Promise.all([api.get('/guardians'), api.get('/guardians/feed')]);
      setGuardians(g); setFeed(f);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!email.includes('@')) { toast.error('A gentle email, please.'); return; }
    setBusy(true);
    try {
      await api.post('/guardians/invite', { email, name });
      setEmail(''); setName('');
      toast.success('Guardian invited.');
      load();
    } catch { toast.error('Could not invite.'); }
    finally { setBusy(false); }
  };

  const pulse = async (gid, gname) => {
    try {
      await api.post(`/guardians/${gid}/pulse`, { note: pulseNote });
      setPulseNote('');
      toast.success(`A soft pulse is on its way to ${gname}.`);
      load();
    } catch { toast.error('Could not send pulse.'); }
  };

  const remove = async (gid) => {
    await api.del(`/guardians/${gid}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="card-organic p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-willow/10 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-willow" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-willow-dark">Guardian Circle</h3>
            <p className="text-xs text-willow-light">People who watch quietly — no likes, no read receipts.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input data-testid="guardian-name-input" value={name} onChange={e => setName(e.target.value)} placeholder="Their name" className="rounded-full bg-cloud-subtle border-willow/10 flex-1" />
          <Input data-testid="guardian-email-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="their@email.com" className="rounded-full bg-cloud-subtle border-willow/10 flex-1" />
          <Button data-testid="guardian-invite-btn" onClick={invite} disabled={busy} className="rounded-full bg-willow text-cloud">Invite</Button>
        </div>

        <div className="mt-6 space-y-2">
          {!guardians.length && <p className="text-sm text-willow-light">No guardians yet. Invite someone gentle.</p>}
          {guardians.map(g => (
            <div key={g.id} data-testid={`guardian-${g.id}`} className="rounded-2xl bg-cloud-subtle p-4 flex items-center gap-4 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-willow to-willow-dark text-cloud flex items-center justify-center font-serif text-lg">{(g.guardian_name || 'G')[0].toUpperCase()}</div>
              <div className="flex-1 min-w-[140px]">
                <p className="font-medium text-sm text-willow-dark">{g.guardian_name}</p>
                <p className="text-xs text-willow-light">{g.guardian_email} · {g.status}</p>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Input
                  data-testid={`pulse-note-${g.id}`}
                  value={pulseNote} onChange={e => setPulseNote(e.target.value)}
                  placeholder="Thinking-of-You note (optional)"
                  className="rounded-full bg-white/70 border-willow/10 h-9 text-xs"
                />
                <Button data-testid={`pulse-btn-${g.id}`} onClick={() => pulse(g.id, g.guardian_name)} size="sm" className="rounded-full bg-mimosa text-willow-dark hover:bg-mimosa-dark hover:text-cloud">
                  <Flame className="w-3.5 h-3.5" />
                </Button>
                <button onClick={() => remove(g.id)} className="text-willow-light hover:text-orange"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-organic p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-mimosa-soft flex items-center justify-center">
            <Bell className="w-4 h-4 text-orange" />
          </div>
          <div>
            <h3 className="font-serif text-2xl text-willow-dark">Supporter feed</h3>
            <p className="text-xs text-willow-light">Who left warmth. No reply needed.</p>
          </div>
        </div>
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1" data-testid="supporter-feed">
          {!feed.length && <p className="text-sm text-willow-light">Nothing yet. Share your Anchor Link.</p>}
          {feed.map((n) => (
            <div key={n.id} className="rounded-2xl bg-white/70 border border-willow/10 p-3 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.kind === 'toy_pulse' ? 'bg-willow text-cloud' : 'bg-mimosa-soft text-orange'}`}>
                {n.kind === 'toy_pulse' ? <Flame className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-willow-dark">
                  <span className="font-medium">{n.guardian_name}</span>
                  {n.kind === 'toy_pulse' ? ' sent a Thinking-of-You pulse' : ' left a reason to stay'}
                </p>
                {n.note && <p className="text-xs text-willow-light mt-0.5 line-clamp-2">"{n.note}"</p>}
                <p className="text-[10px] text-willow-light mt-1">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
