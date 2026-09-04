import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, fileUrl, API } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ImageIcon, Music2, Mic, Send } from 'lucide-react';
import VoiceRecorder from '@/components/sanctuary/VoiceRecorder';

export default function AnchorPublic() {
  const { slug } = useParams();
  const [sanct, setSanct] = useState(null);
  const [supporter, setSupporter] = useState('');
  const [text, setText] = useState('');
  const [song, setSong] = useState('');
  const [file, setFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    (async () => {
      try { const s = await api.get(`/sanctuary/public/${slug}`); setSanct(s); setCount(s.reasons_count); }
      catch { setSanct({ notFound: true }); }
    })();
  }, [slug]);

  const send = async () => {
    if (!text.trim() && !file && !song.trim()) { toast.error('A word, a song, or a photo — anything gentle.'); return; }
    setLoading(true);
    try {
      let media_path = '';
      let kind = song ? 'song' : 'text';
      const uploadFile = voiceFile || file;
      if (uploadFile) {
        const up = await api.upload(`/upload/public/${slug}`, uploadFile);
        media_path = up.path;
        kind = uploadFile.type.startsWith('audio/') ? 'voice' : 'photo';
      }
      await api.post(`/hope/${slug}`, {
        supporter_name: supporter || 'A kindred soul',
        kind, text, song_url: song, media_path,
      });
      setSent(true); setCount(c => c + 1);
    } catch { toast.error('Could not send. Try again gently.'); }
    finally { setLoading(false); }
  };

  if (!sanct) return <div className="min-h-screen flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-mimosa/30 orb-breath" /></div>;
  if (sanct.notFound) return <div className="min-h-screen flex items-center justify-center"><p className="font-serif text-3xl text-willow">This sanctuary does not exist.</p></div>;

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="anchor-public-container">
      <div className="absolute -top-32 -right-20 w-[560px] h-[560px] rounded-full bg-mimosa-soft/70 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-orange-soft/60 blur-3xl" />
      <div className="relative max-w-2xl mx-auto px-5 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-willow-light">app.anchor/with/{sanct.slug}</p>
        <h1 className="font-serif text-5xl md:text-6xl text-willow-dark font-light mt-4 leading-[1.02]">
          Give <em className="text-orange not-italic">{sanct.name}</em><br/>
          a reason to stay.
        </h1>
        <p className="mt-5 text-[#535E56] leading-relaxed">
          Leave a soft memory. A photo. A song they used to hum. Even a single sentence.
          No account, no likes, no read receipts. Just kindness kept in a jar.
        </p>
        <p className="mt-2 text-xs text-willow-light" data-testid="kindness-counter">
          {count} {count === 1 ? 'reason' : 'reasons'} already tucked inside.
        </p>

        {sent ? (
          <div className="mt-10 card-organic p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 firefly" style={{ '--tx': '30px', '--ty': '-40px' }} />
            <div className="absolute top-10 right-16 firefly" style={{ '--tx': '-20px', '--ty': '-30px', animationDelay: '.3s' }} />
            <h2 className="font-serif text-3xl text-willow-dark">Tucked in gently.</h2>
            <p className="mt-3 text-[#535E56]">
              Your warmth is waiting in {sanct.name}'s Wall of Hope. Come back with more, anytime.
            </p>
            <Button onClick={() => { setSent(false); setText(''); setSong(''); setFile(null); }} className="mt-6 rounded-full bg-willow text-cloud">
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
              placeholder="You wove me a friendship bracelet in 6th grade. It's still in my jewelry box. Please stay."
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
            <Button
              data-testid="submit-reason-btn"
              onClick={send} disabled={loading}
              className="w-full rounded-full h-12 bg-orange hover:bg-orange/90 text-cloud gap-2"
            >
              {loading ? 'Sending…' : <>Send warmth <Send className="w-4 h-4" /></>}
            </Button>
            <p className="text-[11px] text-willow-light text-center leading-relaxed">
              {sanct.name} will never see how many hearts came in — only the reason itself. No pressure to reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
