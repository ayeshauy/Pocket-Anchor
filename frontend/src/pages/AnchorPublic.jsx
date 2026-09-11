import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, fileUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ImageIcon, Music2, Send, Flag } from 'lucide-react';
import VoiceRecorder from '@/components/sanctuary/VoiceRecorder';
import { REASONS, reasonLabel, reasonTitle } from '@/constants/reasons';

const CONSENT_OPTIONS = [
  { v: 'recipient', label: 'Only them', hint: 'Kept private between you two.' },
  { v: 'circle', label: 'Them + people they choose', hint: 'They may share it on their Anchor for people with the link.' },
  { v: 'public', label: 'They may share it publicly', hint: 'Visible to anyone. Never includes your name unless you give one.' },
];

const REPORT_CATEGORIES = [
  ['harassment', 'Harassment'], ['threat', 'Threat'], ['self_harm', 'Self-harm'],
  ['abuse', 'Abuse'], ['privacy', 'Privacy'], ['other', 'Other'],
];

export default function AnchorPublic() {
  const { slug } = useParams();
  const [sanct, setSanct] = useState(null);
  const [supporter, setSupporter] = useState('');
  const [text, setText] = useState('');
  const [song, setSong] = useState('');
  const [file, setFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [reason, setReason] = useState(null);
  const [consent, setConsent] = useState('recipient');
  const [view, setView] = useState('leave');
  const [mod, setMod] = useState(null); // { kind: 'hold'|'blocked', suggestion, senderSupport }

  useEffect(() => {
    (async () => {
      try { const s = await api.get(`/sanctuary/public/${slug}`); setSanct(s); setCount(s.reasons_count); }
      catch { setSanct({ notFound: true }); }
    })();
  }, [slug]);

  const parseDetail = (e) => { try { return JSON.parse(e.message)?.detail; } catch { return null; } };

  const appeal = async () => {
    try {
      await api.post('/moderate/appeal', { slug, draft_text: text });
      toast.success('Review requested. If Anchor misunderstood your message, a human will take a gentle look.');
    } catch { toast.error('Could not request a review right now.'); }
  };

  const send = async () => {
    if (!text.trim() && !file && !song.trim() && !voiceFile) { toast.error('A word, a song, or a photo — anything gentle.'); return; }
    setLoading(true); setMod(null);
    try {
      let media_path = '';
      let kind = song ? 'song' : 'text';
      const uploadFile = voiceFile || file;
      if (uploadFile) {
        const up = await api.upload(`/upload/public/${slug}`, uploadFile);
        media_path = up.path;
        kind = uploadFile.type.startsWith('audio/') ? 'voice' : 'photo';
      }
      const r = await api.post(`/hope/${slug}`, {
        supporter_name: supporter || 'A kindred soul',
        kind, text, song_url: song, media_path,
        reason: reason || 'smile', consent_level: consent,
      });
      setPending(r.status === 'pending');
      setSent(true); setCount(c => c + 1);
    } catch (e) {
      const d = parseDetail(e);
      if (d && typeof d === 'object' && d.moderation) {
        setMod({ kind: d.moderation, suggestion: d.suggestion || '', senderSupport: !!d.sender_support });
      } else if (d === 'not_accepting') {
        toast.error(`${sanct.name} has paused new messages for now.`);
      } else if (d === 'name_required') {
        toast.error('This Anchor asks supporters to leave a name.');
      } else if (d === 'submissions_paused' || d === 'rate_limited') {
        toast.error('Slow down a little — please try again in a while.');
      } else if (d === 'duplicate') {
        toast.error('This exact message was already tucked in.');
      } else {
        toast.error('Could not send. Try again gently.');
      }
    } finally { setLoading(false); }
  };

  if (!sanct) return <div className="min-h-screen flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-mimosa/30 orb-breath" /></div>;
  if (sanct.notFound) return <div className="min-h-screen flex items-center justify-center"><p className="font-serif text-3xl text-willow">This sanctuary does not exist.</p></div>;

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="anchor-public-container">
      <div className="absolute -top-32 -right-20 w-[560px] h-[560px] rounded-full bg-mimosa-soft/70 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-orange-soft/60 blur-3xl" />
      <div className="relative max-w-2xl mx-auto px-5 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">app.anchor/with/{sanct.slug}</p>
        <h1 className="font-serif text-5xl md:text-6xl text-willow-dark font-light mt-4 leading-[1.02]" data-testid="anchor-headline">
          {reason ? (
            <>Give <em className="text-orange not-italic">{sanct.name}</em><br/>{reasonLabel(reason)}.</>
          ) : (
            <>Leave <em className="text-orange not-italic">{sanct.name}</em><br/>a little kindness.</>
          )}
        </h1>
        <p className="mt-5 text-[#535E56] leading-relaxed">
          Leave a soft memory. A photo. A song they used to hum. Even a single sentence.
          No account, no likes, no read receipts. Just kindness kept in a jar.
        </p>
        <p className="mt-2 text-xs text-willow-light" data-testid="kindness-counter">
          {count} {count === 1 ? 'kindness' : 'kindnesses'} already tucked inside.
        </p>

        {/* View toggle: leave something vs. browse their Anchor */}
        <div className="mt-8 flex gap-2" data-testid="anchor-view-toggle">
          <button
            data-testid="view-leave-btn"
            onClick={() => setView('leave')}
            className={`px-5 py-2.5 rounded-full text-sm transition ${view === 'leave' ? 'bg-willow text-cloud' : 'bg-white/70 border border-willow/15 text-willow-dark hover:bg-mimosa-soft'}`}
          >
            Leave something
          </button>
          <button
            data-testid="view-anchor-btn"
            onClick={() => setView('anchor')}
            className={`px-5 py-2.5 rounded-full text-sm transition ${view === 'anchor' ? 'bg-willow text-cloud' : 'bg-white/70 border border-willow/15 text-willow-dark hover:bg-mimosa-soft'}`}
          >
            {sanct.name}'s Anchor
          </button>
        </div>

        {view === 'leave' && !mod && (
          <div className="mt-6" data-testid="reason-picker">
            <p className="text-xs uppercase tracking-[0.2em] text-willow-light mb-3">What would you like to leave them today?</p>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map(r => (
                <button
                  key={r.k}
                  data-testid={`reason-type-${r.k}`}
                  onClick={() => setReason(r.k)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition ${reason === r.k ? 'bg-orange text-cloud' : 'bg-white/70 border border-willow/10 text-willow-dark hover:bg-mimosa-soft'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'leave' ? (mod ? (
          <ModerationPanel mod={mod} sanct={sanct}
            onUseSuggestion={() => { setText(mod.suggestion); setMod(null); }}
            onEdit={() => setMod(null)}
            onAppeal={appeal} />
        ) : sent ? (
          <div className="mt-10 card-organic p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 firefly" style={{ '--tx': '30px', '--ty': '-40px' }} />
            <div className="absolute top-10 right-16 firefly" style={{ '--tx': '-20px', '--ty': '-30px', animationDelay: '.3s' }} />
            <h2 className="font-serif text-3xl text-willow-dark">Tucked in gently.</h2>
            <p className="mt-3 text-[#535E56]">
              {pending
                ? `Your message is waiting for ${sanct.name}'s approval — it will reach them the moment they welcome it in.`
                : `Your warmth is waiting in ${sanct.name}'s Wall of Hope. Come back with more, anytime.`}
            </p>
            <Button onClick={() => { setSent(false); setPending(false); setText(''); setSong(''); setFile(null); }} className="mt-6 rounded-full bg-willow text-cloud">
              Leave another
            </Button>
          </div>
        ) : (
          <div className="mt-10 card-organic p-6 md:p-8 space-y-5">
            <Input
              value={supporter} onChange={(e) => setSupporter(e.target.value)}
              placeholder="Your name (or leave blank to stay a kindred soul)"
              className="rounded-full bg-cloud-subtle border-willow/10 h-11"
              data-testid="supporter-name-input"
            />
            <Textarea
              data-testid="reason-textarea"
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="You wove me a friendship bracelet in 6th grade. It's still in my jewelry box."
              className="rounded-2xl bg-cloud-subtle border-willow/10 min-h-[140px] resize-none focus-visible:ring-mimosa"
            />
            <Input
              data-testid="song-url-input"
              value={song} onChange={(e) => setSong(e.target.value)}
              placeholder="Or paste a song link (Spotify, YouTube, Apple Music)"
              className="rounded-full bg-cloud-subtle border-willow/10 h-11"
            />
            <label className="flex items-center gap-3 text-sm text-willow-dark cursor-pointer">
              <div className="w-11 h-11 rounded-full bg-mimosa-soft flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-orange" />
              </div>
              <span>{file ? file.name : 'Attach a photo (optional)'}</span>
              <input
                data-testid="reason-file-input"
                type="file"
                accept="image/*,audio/*"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setVoiceFile(null); }}
                className="hidden"
              />
            </label>
            <VoiceRecorder
              dataTestIdPrefix="anchor-voice"
              onReady={async (f) => { setVoiceFile(f); setFile(null); }}
            />
            <div data-testid="consent-options">
              <p className="text-xs uppercase tracking-[0.2em] text-willow-light">Who can see this?</p>
              <div className="mt-2.5 space-y-2.5">
                {CONSENT_OPTIONS.map(o => (
                  <label key={o.v} className="flex items-start gap-2.5 text-sm text-willow-dark cursor-pointer">
                    <input
                      type="radio" name="consent"
                      data-testid={`consent-option-${o.v}`}
                      checked={consent === o.v}
                      onChange={() => setConsent(o.v)}
                      className="mt-1"
                    />
                    <span>{o.label}<span className="block text-xs text-willow-light">{o.hint}</span></span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              data-testid="submit-reason-btn"
              onClick={send} disabled={loading}
              className="w-full rounded-full h-12 bg-orange hover:bg-orange/90 text-cloud gap-2"
            >
              {loading ? 'Sending…' : <>Send warmth <Send className="w-4 h-4" /></>}
            </Button>
            <p className="text-[11px] text-willow-light text-center leading-relaxed">
              Every message is gently screened for kindness before it reaches {sanct.name}. Sadness and hard
              feelings are always welcome — pressure and harm are not. No pressure to reply, ever.
            </p>
          </div>
        )) : (
          <AnchorCollection sanct={sanct} />
        )}

        <p className="mt-12 text-[11px] text-willow-light text-center leading-relaxed max-w-md mx-auto" data-testid="crisis-disclaimer">
          Anchor is not a crisis or emergency service, and no message here can keep someone safe in an emergency.
          If you or someone you love is in immediate danger, please contact local emergency services or a{' '}
          <a href="/safety" className="underline text-orange">free crisis resource</a>.
        </p>
      </div>
    </div>
  );
}

/* -------- Moderation outcomes: gentle pause (YELLOW) or held back (ORANGE/RED) -------- */
function ModerationPanel({ mod, sanct, onUseSuggestion, onEdit, onAppeal }) {
  if (mod.kind === 'hold') {
    return (
      <div className="mt-10 card-organic p-6 md:p-8" data-testid="moderation-hold-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-orange">A gentle pause</p>
        <h2 className="font-serif text-3xl text-willow-dark mt-2">Could we soften this a little?</h2>
        <p className="mt-3 text-sm text-[#535E56] leading-relaxed">
          Your message carries real feeling — and some of it may land as pressure or guilt for {sanct.name}.
          Here's a version that keeps your heart in it:
        </p>
        {mod.suggestion && (
          <p className="mt-4 rounded-2xl bg-mimosa-soft/60 p-5 font-serif text-[17px] text-willow-dark leading-relaxed" data-testid="moderation-suggestion">
            "{mod.suggestion}"
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-5">
          {mod.suggestion && (
            <Button data-testid="use-suggestion-btn" onClick={onUseSuggestion} className="rounded-full bg-willow text-cloud">Use this version</Button>
          )}
          <Button data-testid="edit-original-btn" variant="outline" onClick={onEdit} className="rounded-full border-willow/20">Keep editing mine</Button>
          <button data-testid="appeal-btn" onClick={onAppeal} className="text-xs text-willow-light underline">This was misunderstood — request a review</button>
        </div>
        {mod.senderSupport && <SenderSupportNote />}
      </div>
    );
  }
  return (
    <div className="mt-10 card-organic p-6 md:p-8" data-testid="moderation-blocked-panel">
      <p className="text-xs uppercase tracking-[0.24em] text-orange">Held back with care</p>
      <h2 className="font-serif text-3xl text-willow-dark mt-2">We couldn't send this as written.</h2>
      <p className="mt-3 text-sm text-[#535E56] leading-relaxed">
        Anchor protects the person receiving messages, so some words can't be delivered.
        You're warmly welcome to write something new — kindness always gets through.
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-5">
        <Button data-testid="write-new-btn" onClick={onEdit} className="rounded-full bg-willow text-cloud">Write something new</Button>
        <button data-testid="appeal-blocked-btn" onClick={onAppeal} className="text-xs text-willow-light underline">Request a review</button>
      </div>
      {mod.senderSupport && <SenderSupportNote />}
    </div>
  );
}

function SenderSupportNote() {
  return (
    <div className="mt-6 rounded-2xl bg-cloud-subtle border border-willow/10 p-4" data-testid="sender-support-note">
      <p className="text-sm text-willow-dark leading-relaxed">
        It sounds like you might be carrying something heavy too. If you are, free and confidential help
        exists — <a href="/safety" className="text-orange underline">find crisis support near you</a>.
      </p>
    </div>
  );
}

/* -------- Their Anchor: the recipient-curated public collection -------- */
function AnchorCollection({ sanct }) {
  const items = sanct.collection || [];
  const reasons = items.filter(i => !i.media_path && !i.song_url);
  const memories = items.filter(i => i.media_path || i.song_url);
  const forever = items.filter(i => i.visibility === 'forever');
  const counts = sanct.category_counts || {};

  return (
    <div className="mt-10 space-y-8" data-testid="anchor-collection">
      {!items.length && (
        <div className="card-organic p-8 text-center">
          <p className="font-serif text-2xl text-willow-dark">{sanct.name}'s Anchor is gathering love.</p>
          <p className="text-sm text-[#535E56] mt-2">Nothing has been shared here yet — be the first to leave something they might choose to keep.</p>
        </div>
      )}

      {Object.keys(counts).length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="category-counts">
          {REASONS.filter(r => counts[r.k]).map(r => (
            <span key={r.k} className="text-xs px-3.5 py-1.5 rounded-full bg-mimosa-soft text-willow-dark">
              {r.title} · {counts[r.k]}
            </span>
          ))}
        </div>
      )}

      {forever.length > 0 && (
        <section data-testid="layer-forever">
          <p className="text-xs uppercase tracking-[0.24em] text-orange mb-3">✦ Forever — kept here on purpose</p>
          <div className="columns-1 sm:columns-2 gap-4">
            {forever.map(it => <CollectionCard key={it.id} it={it} />)}
          </div>
        </section>
      )}

      {memories.length > 0 && (
        <section data-testid="layer-memories">
          <p className="text-xs uppercase tracking-[0.24em] text-willow-light mb-3">Memories</p>
          <div className="columns-1 sm:columns-2 gap-4">
            {memories.filter(i => i.visibility !== 'forever').map(it => <CollectionCard key={it.id} it={it} />)}
          </div>
        </section>
      )}

      {reasons.length > 0 && (
        <section data-testid="layer-reasons">
          <p className="text-xs uppercase tracking-[0.24em] text-willow-light mb-3">Reasons</p>
          <div className="columns-1 sm:columns-2 gap-4">
            {reasons.filter(i => i.visibility !== 'forever').map(it => <CollectionCard key={it.id} it={it} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function CollectionCard({ it }) {
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const report = async (category) => {
    try {
      await api.post(`/hope/${it.id}/report`, { category });
      setReported(true); setReporting(false);
      toast.success('Reported quietly. Thank you for keeping this space kind.');
    } catch { toast.error('Could not send the report.'); }
  };
  return (
    <div className="mb-4 break-inside-avoid rounded-2xl p-5 bg-white/80 border border-willow/10">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-willow-light">{it.supporter_name}</p>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cloud-subtle text-willow-light">{reasonTitle(it.reason || 'stay')}</span>
      </div>
      {it.text && <p className="font-serif text-[17px] text-willow-dark leading-relaxed">"{it.text}"</p>}
      {it.song_url && <a href={it.song_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-orange hover:underline"><Music2 className="w-4 h-4" /> Listen</a>}
      {it.media_path && it.media_path.match(/\.(png|jpe?g|webp|gif)$/i) && (
        <img src={fileUrl(it.media_path)} alt="" className="mt-3 rounded-xl w-full" />
      )}
      {it.media_path && it.media_path.match(/\.(mp3|wav|ogg|m4a|webm)$/i) && (
        <audio controls src={fileUrl(it.media_path)} className="mt-3 w-full" />
      )}
      <div className="mt-3 flex justify-end">
        {reported ? (
          <span className="text-[10px] text-willow-light" data-testid={`reported-${it.id}`}>Reported — hidden while reviewed</span>
        ) : reporting ? (
          <div className="flex flex-wrap items-center gap-1" data-testid={`report-options-${it.id}`}>
            {REPORT_CATEGORIES.map(([k, label]) => (
              <button key={k} data-testid={`report-${k}-${it.id}`} onClick={() => report(k)}
                className="text-[10px] px-2 py-1 rounded-full bg-cloud-subtle text-willow-dark hover:bg-orange-soft">{label}</button>
            ))}
            <button data-testid={`report-cancel-${it.id}`} onClick={() => setReporting(false)} className="text-[10px] text-willow-light underline">cancel</button>
          </div>
        ) : (
          <button data-testid={`report-btn-${it.id}`} onClick={() => setReporting(true)}
            className="text-willow-light/50 hover:text-orange transition" title="Report this quietly">
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
