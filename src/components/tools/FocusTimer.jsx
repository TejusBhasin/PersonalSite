import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { cardCls, ghostBtnCls, loadLS, saveLS } from "@/lib/toolUi";

const todayKey = () => new Date().toISOString().slice(0, 10);

function beep(times = 1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.35 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.35 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.35);
      osc.stop(ctx.currentTime + i * 0.35 + 0.32);
    }
  } catch { /* audio unavailable */ }
}

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function FocusTimer() {
  const [settings, setSettings] = useState(() => loadLS("focus-settings", { work: 25, short: 5, long: 15, rounds: 4 }));
  const [phase, setPhase] = useState("work");
  const [round, setRound] = useState(1);
  const [remaining, setRemaining] = useState(settings.work * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(() => loadLS("focus-stats", { date: todayKey(), sessions: 0, minutes: 0 }));
  const endRef = useRef(null);

  useEffect(() => saveLS("focus-settings", settings), [settings]);

  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + remaining * 1000;
    const tick = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) advance();
    }, 250);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round]);

  const duration = settings[phase === "work" ? "work" : phase === "short" ? "short" : "long"] * 60;

  function advance(manual = false) {
    if (!manual) beep(phase === "work" ? 3 : 1);
    setRunning(false);
    if (phase === "work") {
      setStats((s) => {
        const next = s.date === todayKey() ? s : { date: todayKey(), sessions: 0, minutes: 0 };
        const u = { ...next, sessions: next.sessions + 1, minutes: next.minutes + Math.round(duration / 60) };
        saveLS("focus-stats", u);
        return u;
      });
      const long = round % settings.rounds === 0;
      setPhase(long ? "long" : "short");
      setRemaining((long ? settings.long : settings.short) * 60);
    } else {
      if (phase !== "work") setRound((r) => r + 1);
      setPhase("work");
      setRemaining(settings.work * 60);
    }
  }

  const setPhaseManual = (p) => {
    setRunning(false);
    setPhase(p);
    setRemaining(settings[p === "work" ? "work" : p === "short" ? "short" : "long"] * 60);
  };

  const setSetting = (key, value) => {
    const v = Math.max(1, parseInt(value, 10) || 1);
    const next = { ...settings, [key]: v };
    setSettings(next);
    if (!running && phase === key) setRemaining(v * 60);
  };

  const pct = duration ? 1 - remaining / duration : 0;
  const phaseLabels = { work: "Focus", short: "Short break", long: "Long break" };

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-2">
        {Object.entries(phaseLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPhaseManual(key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              phase === key ? "bg-foreground text-background border-foreground" : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={cardCls + " text-center"}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          {phaseLabels[phase]} · round {round}
        </p>
        <p className="text-6xl md:text-7xl font-black tabular-nums tracking-tight">{fmt(remaining)}</p>
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-5">
          <div
            className={`h-full transition-all duration-300 ${phase === "work" ? "bg-foreground" : "bg-accent"}`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className="flex justify-center gap-3 mt-5">
          <button
            onClick={() => setRunning((r) => !r)}
            className="bg-foreground text-background px-6 py-2.5 rounded-lg text-sm font-bold inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => { setRunning(false); setRemaining(duration); }}
            className={ghostBtnCls + " inline-flex items-center gap-1.5"}
            title="Reset phase"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={() => advance(true)} className={ghostBtnCls + " inline-flex items-center gap-1.5"} title="Skip to next phase">
            <SkipForward className="w-4 h-4" /> Skip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([["work", "Focus (min)"], ["short", "Short (min)"], ["long", "Long (min)"], ["rounds", "Rounds"]] ).map(([key, label]) => (
          <div key={key}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
            <input
              type="number"
              min="1"
              value={settings[key]}
              onChange={(e) => setSetting(key, e.target.value)}
              className="w-full bg-card border border-border/60 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-foreground/40"
            />
          </div>
        ))}
      </div>

      {stats.date === todayKey() && (stats.sessions > 0 || stats.minutes > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-black">{stats.sessions}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Focus sessions today</p>
          </div>
          <div className="bg-card border border-border/60 rounded-xl p-4 text-center">
            <p className="text-2xl font-black">{stats.minutes}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Focus minutes today</p>
          </div>
        </div>
      )}
    </div>
  );
}