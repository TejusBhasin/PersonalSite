import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Shield } from "lucide-react";
import { playSfx } from "@/games/sfx";
import Leaderboard from "./Leaderboard";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const rand = (a, b) => a + Math.random() * (b - a);

const makeRun = (w, h) => ({
  w,
  h,
  x: 88,
  y: h / 2,
  vy: 0,
  time: 0,
  score: 0,
  shields: 3,
  invuln: 0,
  fireT: 0,
  asteroids: [],
  bullets: [],
  dust: [],
  spawnT: 0.6,
  over: false,
});

export default function OrbitDash() {
  const canvasRef = useRef(null);
  const runRef = useRef(null);
  const inputRef = useRef({ up: false, down: false, pointer: false, py: 0 });
  const phaseRef = useRef("ready");
  const [phase, setPhase] = useState("ready");
  const [hud, setHud] = useState({ score: 0, shields: 3 });
  const [result, setResult] = useState(null);

  const go = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const start = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    runRef.current = makeRun(rect?.width || 640, rect?.height || 480);
    inputRef.current.pointer = false;
    setHud({ score: 0, shields: 3 });
    setResult(null);
    go("playing");
  }, [go]);

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
        st.y = Math.min(st.y, rect.height - 24);
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(canvas);

    const update = (st, dt) => {
      st.time += dt;
      const i = inputRef.current;
      if (i.pointer) st.vy += Math.max(-1, Math.min(1, (i.py - st.y) / 60)) * 2600 * dt;
      if (i.up) st.vy -= 2100 * dt;
      if (i.down) st.vy += 2100 * dt;
      st.vy -= st.vy * Math.min(1, 6 * dt);
      st.y = Math.max(20, Math.min(st.h - 20, st.y + st.vy * dt));

      st.spawnT -= dt;
      if (st.spawnT <= 0) {
        st.spawnT = Math.max(0.28, 0.85 - st.time * 0.012) * rand(0.7, 1.3);
        const r = rand(11, 30);
        st.asteroids.push({ x: st.w + r + 10, y: rand(r + 8, st.h - r - 8), r, vx: -rand(120, 220) - st.time * 3, vy: rand(-24, 24), spin: rand(0, 6.28) });
      }

      if (st.invuln > 0) st.invuln -= dt;
      st.fireT -= dt;
      if (st.fireT <= 0) {
        st.fireT = 0.17;
        st.bullets.push({ x: st.x + 16, y: st.y });
        playSfx("shoot", false);
      }

      for (const b of st.bullets) b.x += 720 * dt;
      st.bullets = st.bullets.filter((b) => b.x < st.w + 20);

      for (const a of st.asteroids) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.spin += dt;
        if (a.y < a.r) {
          a.y = a.r;
          a.vy = Math.abs(a.vy);
        }
        if (a.y > st.h - a.r) {
          a.y = st.h - a.r;
          a.vy = -Math.abs(a.vy);
        }
      }

      for (const a of st.asteroids) {
        for (const b of st.bullets) {
          if (b.dead || a.dead) continue;
          if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + 3) {
            a.dead = true;
            b.dead = true;
            st.score += 25;
            for (let k = 0; k < 8; k += 1) {
              st.dust.push({ x: a.x, y: a.y, vx: rand(-120, 120), vy: rand(-120, 120), life: 0.5, max: 0.5 });
            }
            playSfx("coin", false);
          }
        }
        if (!a.dead && st.invuln <= 0 && Math.hypot(a.x - st.x, a.y - st.y) < a.r + 13) {
          a.dead = true;
          st.shields -= 1;
          st.invuln = 1.3;
          playSfx("crash", false);
          for (let k = 0; k < 14; k += 1) {
            st.dust.push({ x: st.x, y: st.y, vx: rand(-180, 180), vy: rand(-180, 180), life: 0.6, max: 0.6 });
          }
          if (st.shields <= 0) st.over = true;
        }
      }

      st.asteroids = st.asteroids.filter((a) => !a.dead && a.x > -a.r - 20);
      st.bullets = st.bullets.filter((b) => !b.dead);

      for (const d of st.dust) {
        d.life -= dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
      }
      st.dust = st.dust.filter((d) => d.life > 0);

      st.score += dt * 7;
    };

    const draw = (st) => {
      const g = ctx.createLinearGradient(0, 0, st.w, st.h);
      g.addColorStop(0, "#050914");
      g.addColorStop(1, "#0b1224");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, st.w, st.h);

      ctx.fillStyle = "rgba(226,232,240,0.5)";
      for (let i = 0; i < 60; i += 1) {
        const px = (i * 977) % st.w;
        const py = (i * 613) % st.h;
        ctx.fillRect(px, py, 1.4, 1.4);
      }

      for (const a of st.asteroids) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.spin * 0.4);
        ctx.fillStyle = "#475569";
        ctx.beginPath();
        ctx.moveTo(a.r, 0);
        for (let k = 1; k < 7; k += 1) {
          const ang = (k / 7) * Math.PI * 2;
          const rr = a.r * (0.82 + ((k * 37) % 11) / 40);
          ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(148,163,184,0.5)";
        ctx.beginPath();
        ctx.arc(-a.r * 0.2, -a.r * 0.25, a.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = "#fbbf24";
      for (const b of st.bullets) ctx.fillRect(b.x, b.y - 1.5, 12, 3);

      ctx.globalAlpha = Math.max(0, Math.min(1, st.dust.length ? st.dust[0].life / st.dust[0].max : 1));
      for (const d of st.dust) {
        ctx.globalAlpha = Math.max(0, d.life / d.max);
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(d.x, d.y, 2, 2);
      }
      ctx.globalAlpha = 1;

      const flash = st.invuln > 0 && Math.floor(st.invuln * 12) % 2 === 0;
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.globalAlpha = flash ? 0.35 : 1;
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -11);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-12, 11);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-12, -3, 7, 6);
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = runRef.current;

      if (st) {
        if (phaseRef.current === "playing" && !st.over) {
          update(st, dt);
          if (now - published > 90) {
            published = now;
            setHud({ score: Math.floor(st.score), shields: Math.max(0, st.shields) });
          }
          if (st.over) {
            setResult({ score: Math.floor(st.score), seconds: Math.floor(st.time) });
            go("over");
          }
        }
        draw(st);
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [go]);

  useEffect(() => {
    const down = (e) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") {
        inputRef.current.up = true;
        e.preventDefault();
      } else if (k === "ArrowDown" || k === "s" || k === "S") {
        inputRef.current.down = true;
        e.preventDefault();
      } else if (k === " " || k === "Enter") {
        if (phaseRef.current !== "playing") {
          start();
          e.preventDefault();
        }
      } else if (k === "p" || k === "P" || k === "Escape") {
        if (phaseRef.current === "playing") go("paused");
        else if (phaseRef.current === "paused") go("playing");
      } else if (k === "r" || k === "R") {
        if (phaseRef.current !== "playing") start();
      }
    };
    const up = (e) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W") inputRef.current.up = false;
      if (k === "ArrowDown" || k === "s" || k === "S") inputRef.current.down = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [go, start]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#050914]">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          inputRef.current.py = e.clientY - rect.top;
          inputRef.current.pointer = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!inputRef.current.pointer) return;
          const rect = e.currentTarget.getBoundingClientRect();
          inputRef.current.py = e.clientY - rect.top;
        }}
        onPointerUp={() => {
          inputRef.current.pointer = false;
        }}
        onPointerCancel={() => {
          inputRef.current.pointer = false;
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-3 py-3 sm:px-4">
        <div className="border border-white/15 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50" style={MONT}>
            Score
          </p>
          <p className="text-lg font-black leading-none text-white" style={MONT}>
            {hud.score}
          </p>
        </div>
        <div className="flex items-center gap-1.5 border border-white/15 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <Shield className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-sm font-black text-white" style={MONT}>
            {hud.shields}
          </span>
        </div>
      </div>

      <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4">
        <button
          type="button"
          onClick={() => go(phase === "playing" ? "paused" : "playing")}
          aria-label={phase === "playing" ? "Pause" : "Resume"}
          className="border border-white/15 bg-black/50 p-2 text-white/70 backdrop-blur-sm transition-colors hover:text-white"
        >
          {phase === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
      </div>

      {phase !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/15 bg-[#080d18] p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-white/40" style={MONT}>
              Orbit Dash
            </p>

            {phase === "paused" ? (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-white" style={MONT}>
                  Paused
                </h2>
                <button
                  type="button"
                  onClick={() => go("playing")}
                  className="mt-5 inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/85"
                  style={MONT}
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume
                </button>
              </>
            ) : (
              <>
                <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-white" style={MONT}>
                  {phase === "over" ? "Ship lost" : "Asteroid Alley"}
                </h2>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50" style={MONT}>
                  {phase === "over"
                    ? `Score ${result?.score ?? 0} · survived ${result?.seconds ?? 0}s`
                    : "Auto-cannons fire forward. Hold altitude, shoot rocks, keep a shield spare."}
                </p>

                {phase === "over" && result && (
                  <div className="mt-4">
                    <Leaderboard
                      game="orbitdash"
                      score={result.score}
                      difficulty="standard"
                      stats={{ seconds: result.seconds }}
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={start}
                    className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/85"
                    style={MONT}
                  >
                    {phase === "over" ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {phase === "over" ? "Fly again" : "Launch"}
                  </button>
                </div>
                <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/40" style={MONT}>
                  ↑ ↓ or W/S to climb and dive · drag on touch
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}