import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Pause, Play, RotateCcw, Trophy, Volume2, VolumeX, Wind, Zap } from "lucide-react";
import { DIFFICULTIES, WEATHER_LABEL, readBest, readMuted, writeBest, writeMuted } from "@/games/skipro/config";
import { createRun, step, SKIER_Y } from "@/games/skipro/engine";
import { drawScene } from "@/games/skipro/render";
import { playSfx } from "@/games/sfx";
import Leaderboard from "./Leaderboard";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const EMPTY_HUD = {
  score: 0,
  lives: 3,
  mult: 1,
  boost: 100,
  coins: 0,
  gates: 0,
  tricks: 0,
  distance: 0,
  speed: 0,
  weather: "clear",
};

export default function Skipro360() {
  const canvasRef = useRef(null);
  const runRef = useRef(null);
  const inputRef = useRef({ left: false, right: false, boost: false, pointer: false, px: 0 });
  const phaseRef = useRef("ready");
  const mutedRef = useRef(false);

  const [phase, setPhase] = useState("ready");
  const [diffId, setDiffId] = useState("standard");
  const [hud, setHud] = useState(EMPTY_HUD);
  const [best, setBest] = useState(() => readBest("standard"));
  const [muted, setMuted] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [result, setResult] = useState(null);

  const go = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const start = useCallback(
    (id) => {
      const canvas = canvasRef.current;
      const rect = canvas?.getBoundingClientRect();
      const w = rect?.width || 480;
      const h = rect?.height || 720;
      runRef.current = createRun(w, h, id);
      const i = inputRef.current;
      i.left = false;
      i.right = false;
      i.boost = false;
      i.pointer = false;
      setHud(EMPTY_HUD);
      setResult(null);
      setToasts([]);
      setDiffId(id);
      setBest(readBest(id));
      go("playing");
    },
    [go]
  );

  useEffect(() => {
    mutedRef.current = readMuted();
    setMuted(mutedRef.current);
  }, []);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 2600);
    return () => clearTimeout(t);
  }, [toasts]);

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let last = performance.now();
    let published = 0;

    const sync = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(rect.width * dpr));
      const ch = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const st = runRef.current;
      if (st && (Math.abs(st.w - rect.width) > 1 || Math.abs(st.h - rect.height) > 1)) {
        st.w = rect.width;
        st.h = rect.height;
        st.y = rect.height * SKIER_Y;
        st.x = Math.min(st.x, rect.width - 18);
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = runRef.current;

      if (st) {
        if (phaseRef.current === "playing" && !st.over) {
          const i = inputRef.current;
          let left = i.left;
          let right = i.right;
          if (!left && !right && i.pointer && Math.abs(i.px - st.x) > 12) {
            if (i.px < st.x) left = true;
            else right = true;
          }
          step(st, dt, { left, right, boost: i.boost });

          if (st.sfx.length) {
            st.sfx.forEach((name) => playSfx(name, mutedRef.current));
            st.sfx.length = 0;
          }
          if (st.newAch.length) {
            const gained = st.newAch.splice(0, st.newAch.length);
            setToasts((prev) => [...prev, ...gained]);
          }
          if (st.over) {
            const total = Math.floor(st.score);
            if (total > readBest(st.d.id)) writeBest(st.d.id, total);
            setBest(Math.max(total, readBest(st.d.id)));
            setResult({
              score: total,
              coins: st.coins,
              gates: st.gates,
              tricks: st.tricks,
              distance: Math.floor(st.distance),
              seconds: Math.floor(st.time),
              topSpeed: Math.round(st.topSpeed),
              cause: st.cause,
              unlocked: [...st.unlocked],
            });
            go("over");
          }
          if (now - published > 90) {
            published = now;
            setHud({
              score: Math.floor(st.score),
              lives: st.lives,
              mult: Number(st.mult.toFixed(2)),
              boost: Math.round(st.boost),
              coins: st.coins,
              gates: st.gates,
              tricks: st.tricks,
              distance: Math.floor(st.distance),
              speed: Math.round(st.speed),
              weather: st.weather.kind,
            });
          }
        }

        if (runRef.current) drawScene(ctx, st);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [go]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === "playing") go("paused");
    else if (phaseRef.current === "paused") go("playing");
  }, [go]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    writeMuted(next);
    setMuted(next);
  }, []);

  useEffect(() => {
    const down = (e) => {
      const k = e.key;
      const playing = phaseRef.current === "playing";
      if (k === "ArrowLeft" || k === "a" || k === "A") {
        inputRef.current.left = true;
        e.preventDefault();
      } else if (k === "ArrowRight" || k === "d" || k === "D") {
        inputRef.current.right = true;
        e.preventDefault();
      } else if (k === "Shift" || k === " ") {
        if (playing) {
          inputRef.current.boost = true;
          e.preventDefault();
        } else if (phaseRef.current !== "paused") {
          start(diffId);
          e.preventDefault();
        }
      } else if (k === "Enter" && !playing && phaseRef.current !== "paused") {
        start(diffId);
      } else if (k === "p" || k === "P" || k === "Escape") {
        togglePause();
      } else if (k === "m" || k === "M") {
        toggleMute();
      } else if ((k === "r" || k === "R") && !playing) {
        start(diffId);
      }
    };
    const up = (e) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") inputRef.current.left = false;
      if (k === "ArrowRight" || k === "d" || k === "D") inputRef.current.right = false;
      if (k === "Shift" || k === " ") inputRef.current.boost = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [diffId, start, togglePause, toggleMute]);

  const pointerAt = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    inputRef.current.px = e.clientX - rect.left;
  };

  const hold = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      inputRef.current[key] = true;
    },
    onPointerUp: () => {
      inputRef.current[key] = false;
    },
    onPointerLeave: () => {
      inputRef.current[key] = false;
    },
    onPointerCancel: () => {
      inputRef.current[key] = false;
    },
  });

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          pointerAt(e);
          inputRef.current.pointer = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (inputRef.current.pointer) pointerAt(e);
        }}
        onPointerUp={() => {
          inputRef.current.pointer = false;
        }}
        onPointerCancel={() => {
          inputRef.current.pointer = false;
        }}
      />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-3 py-3 sm:px-4">
        <div className="border border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground" style={MONT}>
            Score
          </p>
          <p className="text-lg font-black leading-none text-foreground" style={MONT}>
            {hud.score}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground" style={MONT}>
            x{hud.mult.toFixed(2)} · {hud.distance} m
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 border border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
            <Heart className={`h-3.5 w-3.5 ${hud.lives > 1 ? "text-destructive" : "text-destructive/60"}`} />
            <span className="text-sm font-black leading-none text-foreground" style={MONT}>
              {hud.lives}
            </span>
            <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground" style={MONT}>
              Best {best}
            </span>
          </div>
          <div className="flex items-center gap-2 border border-border/60 bg-background/85 px-3 py-1 backdrop-blur-sm">
            <Zap className="h-3 w-3 text-accent" />
            <div className="h-1.5 w-16 overflow-hidden bg-muted">
              <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${hud.boost}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 border border-border/60 bg-background/85 px-3 py-1 backdrop-blur-sm">
            <Wind className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground" style={MONT}>
              {WEATHER_LABEL[hud.weather] || "Clear"}
            </span>
          </div>
        </div>
      </div>

      {/* pause / mute */}
      <div className="absolute right-3 bottom-3 flex gap-2 sm:right-4 sm:bottom-4">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="border border-border/60 bg-background/85 p-2 text-foreground/70 backdrop-blur-sm transition-colors hover:text-foreground"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={togglePause}
          aria-label={phase === "playing" ? "Pause" : "Resume"}
          className="border border-border/60 bg-background/85 p-2 text-foreground/70 backdrop-blur-sm transition-colors hover:text-foreground"
        >
          {phase === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      {/* touch steering */}
      {phase === "playing" && (
        <div className="absolute bottom-3 left-3 flex gap-2 sm:bottom-4 sm:left-4">
          <button
            type="button"
            aria-label="Steer left"
            {...hold("left")}
            className="border border-border/60 bg-background/85 p-3 text-foreground/80 backdrop-blur-sm active:bg-foreground active:text-background"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Steer right"
            {...hold("right")}
            className="border border-border/60 bg-background/85 p-3 text-foreground/80 backdrop-blur-sm active:bg-foreground active:text-background"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Boost"
            {...hold("boost")}
            className="border border-border/60 bg-background/85 px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80 backdrop-blur-sm active:bg-accent active:text-accent-foreground"
            style={MONT}
          >
            Boost
          </button>
        </div>
      )}

      {/* achievement toasts */}
      <div className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center gap-1.5 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 border border-foreground/20 bg-foreground px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-background"
            style={MONT}
          >
            <Trophy className="h-3 w-3" />
            {t.label}
          </div>
        ))}
      </div>

      {phase !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-background/85 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md border border-border bg-card p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-muted-foreground" style={MONT}>
              SKIPRO360
            </p>

            {phase === "ready" && (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-foreground" style={MONT}>
                  Slope Run
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" style={MONT}>
                  Thread gates, bank coins, launch ramps. Chain gates to multiply every point.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDiffId(d.id);
                        setBest(readBest(d.id));
                      }}
                      className={`border px-3 py-2 text-left transition-colors ${
                        diffId === d.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/60 text-foreground hover:border-foreground/40"
                      }`}
                    >
                      <span className="block text-[11px] font-black uppercase tracking-[0.2em]" style={MONT}>
                        {d.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.1em] ${
                          diffId === d.id ? "text-background/70" : "text-muted-foreground"
                        }`}
                        style={MONT}
                      >
                        {d.note}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => start(diffId)}
                  className="mt-4 inline-flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85"
                  style={MONT}
                >
                  <Play className="h-3.5 w-3.5" />
                  Drop in
                </button>
                <div className="mt-4">
                  <Leaderboard game="skipro360" score={0} difficulty="" />
                </div>
                <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground" style={MONT}>
                  ← → or A/D steer · Shift to boost · P pause · M mute
                </p>
              </>
            )}

            {phase === "paused" && (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-foreground" style={MONT}>
                  Paused
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" style={MONT}>
                  Score {hud.score} · {hud.distance} m
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => go("playing")}
                    className="inline-flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85"
                    style={MONT}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => start(diffId)}
                    className="inline-flex items-center gap-2 border border-border/60 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-secondary"
                    style={MONT}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restart
                  </button>
                </div>
              </>
            )}

            {phase === "over" && result && (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-foreground" style={MONT}>
                  Run over
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" style={MONT}>
                  {result.cause} Final score {result.score} · best {best}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-px bg-border/60 text-center">
                  {[
                    ["Gates", result.gates],
                    ["Coins", result.coins],
                    ["Tricks", result.tricks],
                    ["Metres", result.distance],
                    ["Seconds", result.seconds],
                    ["Top speed", result.topSpeed],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-card px-2 py-2">
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground" style={MONT}>
                        {label}
                      </p>
                      <p className="text-sm font-black text-foreground" style={MONT}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {result.unlocked.length > 0 && (
                  <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground" style={MONT}>
                    Badges earned: {result.unlocked.length}
                  </p>
                )}

                <div className="mt-4">
                  <Leaderboard
                    game="skipro360"
                    score={result.score}
                    difficulty={diffId}
                    stats={{
                      gates: result.gates,
                      coins: result.coins,
                      tricks: result.tricks,
                      distance: result.distance,
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => start(diffId)}
                    className="inline-flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85"
                    style={MONT}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Run again
                  </button>
                  <button
                    type="button"
                    onClick={() => go("ready")}
                    className="inline-flex items-center gap-2 border border-border/60 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-secondary"
                    style={MONT}
                  >
                    Change difficulty
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}