import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { MapPin, Phone, Clock, Globe, Pill, X, Plus, Stethoscope } from 'lucide-react';

export default function HealthPage() {
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-10 py-10">
      <p className="text-xs uppercase tracking-[0.28em] text-willow-light">Nomadic Health & Medical Vault</p>
      <h1 className="font-serif text-4xl md:text-5xl text-willow-dark font-light mt-2">Care that travels with you.</h1>
      <p className="text-[#535E56] mt-3 max-w-2xl">Vetted clinics, an encrypted vault for your history, and language-aware triage — wherever the day lands.</p>

      <Tabs defaultValue="clinics" className="mt-8">
        <TabsList className="bg-cloud-subtle rounded-full p-1">
          <TabsTrigger value="clinics" data-testid="health-tab-clinics" className="rounded-full data-[state=active]:bg-orange data-[state=active]:text-cloud">Spatial Health Guide</TabsTrigger>
          <TabsTrigger value="vault" data-testid="health-tab-vault" className="rounded-full data-[state=active]:bg-orange data-[state=active]:text-cloud">Medical Vault</TabsTrigger>
          <TabsTrigger value="network" data-testid="health-tab-network" className="rounded-full data-[state=active]:bg-orange data-[state=active]:text-cloud">Doctor Network</TabsTrigger>
        </TabsList>
        <TabsContent value="clinics"><Clinics /></TabsContent>
        <TabsContent value="vault"><MedicalVault /></TabsContent>
        <TabsContent value="network"><DoctorNetwork /></TabsContent>
      </Tabs>
    </div>
  );
}

function Clinics() {
  const [q, setQ] = useState('');
  const [only247, setOnly247] = useState(false);
  const [items, setItems] = useState([]);
  const load = async () => { try { setItems(await api.get(`/clinics?${q ? 'q=' + encodeURIComponent(q) + '&' : ''}only_24_7=${only247}`)); } catch {} };
  useEffect(() => { load(); }, [q, only247]);

  return (
    <div className="mt-6 grid lg:grid-cols-[1fr_1.3fr] gap-6" data-testid="spatial-health-map">
      <div className="card-organic p-5 space-y-3">
        <Input data-testid="search-clinic-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search city, country, name…" className="rounded-full bg-cloud-subtle border-willow/10" />
        <label className="flex items-center gap-2 text-sm text-willow">
          <input data-testid="clinic-filter-emergency" type="checkbox" checked={only247} onChange={e => setOnly247(e.target.checked)} /> 24/7 emergency only
        </label>
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
          {items.map(c => (
            <div key={c.id} className="rounded-2xl border border-willow/10 p-4 bg-white/70" data-testid="clinic-card-item">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-serif text-lg text-willow-dark">{c.name}</p>
                  <p className="text-xs text-willow-light">{c.city} · {c.country}</p>
                </div>
                <span className="text-xs bg-mimosa-soft text-orange px-2 py-1 rounded-full">{c.trust}</span>
              </div>
              <p className="mt-2 text-xs text-[#535E56]">{c.specialty}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {c.languages.map(l => <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-cloud-muted text-willow-dark">{l}</span>)}
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs">
                {c.twenty_four_seven && <span className="flex items-center gap-1 text-willow"><Clock className="w-3 h-3" /> 24/7</span>}
                <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-orange"><Phone className="w-3 h-3" /> {c.phone}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl relative overflow-hidden min-h-[520px] bg-gradient-to-br from-willow to-willow-dark text-cloud p-6">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(247,181,87,0.4) 0, transparent 40%), radial-gradient(circle at 70% 80%, rgba(243,107,56,0.4) 0, transparent 40%)' }} />
        <div className="relative">
          <p className="font-serif text-2xl">A quiet atlas of care.</p>
          <p className="text-cloud/70 text-sm mt-1">Visualised clinics · community trust · language tags</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {items.slice(0, 6).map(c => (
              <div key={c.id} className="rounded-2xl bg-cloud/10 backdrop-blur-md p-4 border border-cloud/20">
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-mimosa" /><p className="text-xs">{c.city}</p></div>
                <p className="font-serif text-lg mt-1">{c.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MedicalVault() {
  const [items, setItems] = useState([]);
  const [kind, setKind] = useState('medication');
  const [label, setLabel] = useState('');
  const [detail, setDetail] = useState('');
  const load = async () => { try { setItems(await api.get('/medical')); } catch {} };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!label.trim()) return;
    await api.post('/medical', { kind, label, detail });
    setLabel(''); setDetail(''); toast.success('Kept safely.'); load();
  };
  return (
    <div className="mt-6 grid md:grid-cols-[1fr_1.3fr] gap-6" data-testid="medical-vault-container">
      <div className="card-organic p-5 space-y-3">
        <p className="text-xs uppercase tracking-[0.24em] text-willow-light">Add a record</p>
        <select value={kind} onChange={e => setKind(e.target.value)} className="w-full rounded-full bg-cloud-subtle border border-willow/10 px-4 py-2.5 text-sm">
          <option value="medication">Medication</option><option value="allergy">Allergy</option><option value="condition">Condition</option><option value="visit">Visit note</option>
        </select>
        <Input data-testid="med-label-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Metoprolol 25mg" className="rounded-full bg-cloud-subtle border-willow/10" />
        <Input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Dosage, notes, brand equivalent" className="rounded-full bg-cloud-subtle border-willow/10" />
        <Button data-testid="add-medical-record-btn" onClick={add} className="rounded-full bg-orange text-cloud gap-2"><Plus className="w-4 h-4" /> Add to vault</Button>
      </div>
      <div className="space-y-3">
        {['medication','allergy','condition','visit'].map(k => (
          <div key={k}>
            <p className="text-xs uppercase tracking-[0.24em] text-willow-light mb-2">{k}s</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {items.filter(i => i.kind === k).map(i => (
                <div key={i.id} className="rounded-2xl bg-white/70 border border-willow/10 p-4 relative">
                  <button onClick={async () => { await api.del(`/medical/${i.id}`); load(); }} className="absolute top-2 right-2 text-willow-light hover:text-orange"><X className="w-3.5 h-3.5" /></button>
                  <p className="font-serif text-base text-willow-dark">{i.label}</p>
                  <p className="text-xs text-[#535E56] mt-0.5">{i.detail}</p>
                </div>
              ))}
              {!items.filter(i => i.kind === k).length && <p className="text-xs text-willow-light">Empty for now.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorNetwork() {
  const doctors = [
    { name: 'Dr. Priya Nair', city: 'Singapore', spec: 'Cardiology', langs: ['English', 'Tamil'], avail: 'Telehealth · today' },
    { name: 'Dr. Adaeze Okafor', city: 'Lisbon', spec: 'Endocrinology', langs: ['English', 'Portuguese'], avail: 'Telehealth · Fri' },
    { name: 'Dr. Ren Takahashi', city: 'Tokyo', spec: 'Dermatology', langs: ['English', 'Japanese'], avail: 'Telehealth · tomorrow' },
    { name: 'Dr. Sofia Costa', city: 'Mexico City', spec: 'OB-GYN', langs: ['English', 'Spanish'], avail: 'In-person · Mon' },
  ];
  return (
    <div className="mt-6 grid md:grid-cols-2 gap-5">
      {doctors.map(d => (
        <div key={d.name} className="card-organic p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mimosa to-orange text-cloud flex items-center justify-center font-serif text-xl">{d.name.split(' ')[1][0]}</div>
          <div className="flex-1">
            <p className="font-serif text-xl text-willow-dark">{d.name}</p>
            <p className="text-xs text-willow-light">{d.spec} · {d.city}</p>
            <p className="text-xs text-[#535E56] mt-1">Languages: {d.langs.join(', ')}</p>
            <p className="text-xs text-orange mt-1">{d.avail}</p>
            <Button className="mt-3 h-8 rounded-full bg-willow text-cloud text-xs">Request consult</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
