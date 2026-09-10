import { useMemo, useState } from 'react';

const STATES = {
  grounded: { color: '#4C5D4B', glow: 'rgba(76,93,75,.35)', name: 'Grounded', label: 'Willow Grove' },
  hopeful:  { color: '#F7B557', glow: 'rgba(247,181,87,.45)', name: 'Hopeful',  label: 'Mimosa' },
  struggling:{ color: '#9197AA', glow: 'rgba(145,151,170,.4)', name: 'Struggling',label: 'Azul' },
  need_help: { color: '#C1521E', glow: 'rgba(193,82,30,.45)', name: 'I need help', label: 'Signal' },
  no_talk:   { color: '#B9BDB0', glow: 'rgba(185,189,176,.4)', name: "Don't want to talk", label: 'Quiet' },
};

export default function MoodPulseOrb({ state = 'grounded', size = 220, onChange, interactive = false }) {
  const cur = STATES[state] || STATES.grounded;
  return (
    <div className="relative inline-flex flex-col items-center gap-4" data-testid="mood-pulse-orb">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-70"
          style={{ background: cur.glow }}
        />
        <div
          className="relative w-full h-full rounded-full orb-breath"
          style={{
            background: `radial-gradient(circle at 32% 30%, #fff8e6 0%, ${cur.color} 55%, #1F2623 130%)`,
            boxShadow: `inset -20px -30px 60px rgba(0,0,0,.25), 0 30px 60px ${cur.glow}`,
          }}
        />
        <div className="absolute top-6 left-8 w-10 h-10 rounded-full bg-white/30 blur-md" />
      </div>
      {interactive && (
        <div className="flex gap-2 mt-2">
          {Object.entries(STATES).map(([k, v]) => (
            <button
              key={k}
              data-testid={`mood-select-${k}`}
              onClick={() => onChange && onChange(k)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                state === k ? 'text-cloud shadow' : 'bg-cloud-subtle text-willow border border-willow/10 hover:bg-mimosa-soft'
              }`}
              style={state === k ? { background: v.color } : {}}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}
      {!interactive && (
        <div className="text-center">
          <p className="font-serif text-xl text-willow-dark">{cur.name}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-willow-light mt-1">{cur.label}</p>
        </div>
      )}
    </div>
  );
}

export { STATES as MOOD_STATES };
