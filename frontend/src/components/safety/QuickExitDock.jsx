import { useEffect, useState, useCallback } from 'react';

export default function QuickExitDock() {
  const [decoy, setDecoy] = useState(false);
  const [escCount, setEscCount] = useState(0);

  const trigger = useCallback(() => setDecoy(true), []);

  useEffect(() => {
    let timer;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setEscCount((n) => {
          const next = n + 1;
          if (next >= 2) { trigger(); return 0; }
          clearTimeout(timer);
          timer = setTimeout(() => setEscCount(0), 700);
          return next;
        });
      }
    };
    const onCustom = () => trigger();
    window.addEventListener('keydown', onKey);
    window.addEventListener('anchor:quick-exit', onCustom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('anchor:quick-exit', onCustom);
      clearTimeout(timer);
    };
  }, [trigger]);

  if (decoy) return <DecoyScreen onExit={() => setDecoy(false)} />;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <button
        data-testid="quick-exit-floating-btn"
        onClick={trigger}
        title="Press Esc twice for instant hide"
        className="px-5 py-3 rounded-full bg-willow text-cloud shadow-lg hover:bg-willow-dark text-sm font-medium flex items-center gap-2 transition active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-mimosa animate-pulse" />
        Quick Exit
      </button>
      <span className="text-[10px] text-willow-light bg-cloud/80 px-2 py-1 rounded-full hidden sm:block">
        or press Esc × 2
      </span>
    </div>
  );
}

function DecoyScreen({ onExit }) {
  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <div data-testid="decoy-weather-screen" className="fixed inset-0 z-[100] bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Morning Weather</h1>
          <button onClick={onExit} data-testid="decoy-exit-btn" className="text-xs text-slate-400 hover:text-slate-600">return</button>
        </div>
        <div className="rounded-2xl bg-slate-100 p-8 mb-6">
          <p className="text-sm text-slate-500">Local · {time}</p>
          <p className="text-6xl font-light mt-2">68°F</p>
          <p className="text-slate-500 mt-1">Partly cloudy · gentle breeze</p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => (
            <div key={d} className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">{d}</p>
              <p className="text-lg font-medium mt-1">{65 + i}°</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-10 text-center">© Morning Weather · v3.4.1</p>
      </div>
    </div>
  );
}
