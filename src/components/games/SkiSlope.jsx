import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const BEST_KEY = "ski_slope_best";
const SKIER_Y = 0.72;
const rand = (a, b) => a + Math.random() * (b - a);

const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
};

const writeBest = (v) => {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    /* storage unavailable */
  }
};

function makeState(w, h) {
  return {
    w,
    h,
    x: w / 2,
    y: h * SKIER_Y,
    vx: 0,
    speed: 190,
    distance: 0,
    tex: 0,
    spawn: 0.5,
    gateIn: 4,
    items: [],
    trail: [],
    trailT: 0,
    bonus: 0,
    shown: 0,
  };
}

function hits(it, st) {
  const feet = st.y + 10;
  if (it.kind === "gate") {
    const left = it.x - it.gap / 2;
    const right = it.x + it.gap / 2;
    const near = (px) => Math.abs(st.x - px) < 11 && Math.abs(feet - it.y) < 20;
    return near(left) || near(right);
  }
  const r = (it.kind === "rock" ? 14 : 13) * it.s;
  return Math.abs(st.x - it.x) < r + 6 && Math.abs(feet - it.y) < r + 12;
}

// Returns true when the run ends in a crash.
function update(st, dt, dir) {
  const topSpeed = 235 + Math.min(330, st.distance * 1.5);
  st.speed += (topSpeed - st.speed) * Math.min(1, dt * 1.2);
  st.distance += (st.speed * dt) / 13;
  st.tex += st.speed * dt;

  st.vx += dir * 1600 * dt;
  st.vx -= st.vx * Math.min(1, 7 * dt);
  st.vx = Math.max(-400, Math.min(400, st.vx));
  st.x += st.vx * dt;
  if (st.x < 18) {
    st.x = 18;
    st.vx = 0;
  }
  if (st.x > st.w - 18) {
    st.x = st.w - 18;
    st.vx = 0;
  }

  st.spawn -= dt;
  if (st.spawn <= 0) {
    st.spawn = Math.max(0.26, 0.62 - st.distance * 0.0009) * rand(0.75, 1.3);
    const rock = Math.random() < 0.3;
    st.items.push({
      kind: rock ? "rock" : "tree",
      x: rand(24, st.w - 24),
      y: -50,
      s: rock ? rand(0.85, 1.25) : rand(0.85, 1.35),
    });
  }

  st.gateIn -= dt;
  if (st.gateIn <= 0) {
    st.gateIn = rand(6, 10);
    const gap = rand(80, 110);
    st.items.push({
      kind: "gate",
      x: rand(gap / 2 + 26, st.w - gap / 2 - 26),
      y: -60,
      gap,
      scored: false,
    });
  }

  for (const it of st.items) it.y += st.speed * dt;

  for (const it of st.items) {
    if (it.kind === "gate" && !it.scored && it.y > st.y) {
      it.scored = true;
      st.bonus += 25;
    }
  }

  let crashed = false;
  for (const it of st.items) {
    if (hits(it, st)) {
      crashed = true;
      break;
    }
  }

  st.trailT += dt;
  if (st.trailT > 0.05) {
    st.trailT = 0;
    st.trail.push({ x: st.x, y: st.y });
  }
  for (const p of st.trail) p.y += st.speed * dt;
  st.trail = st.trail.filter((p) => p.y < st.h + 20);
  st.items = st.items.filter((it) => it.y < st.h + 90);

  return crashed;
}

function drawTree(ctx, it) {
  const { x, y, s } = it;
  ctx.fillStyle = "#7c4a21";
  ctx.fillRect(x - 3 * s, y + 4 * s, 6 * s, 10 * s);
  ctx.fillStyle = "#14532d";
  ctx.beginPath();
  ctx.moveTo(x, y - 26 * s);
  ctx.lineTo(x + 15 * s, y + 8 * s);
  ctx.lineTo(x - 15 * s, y + 8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.moveTo(x, y - 26 * s);
  ctx.lineTo(x + 8 * s, y - 6 * s);
  ctx.lineTo(x - 8 * s, y - 6 * s);
  ctx.closePath();
  ctx.fill();
}

function drawRock(ctx, it) {
  const { x, y, s } = it;
  ctx.fillStyle = "#64748b";
  ctx.beginPath();
  ctx.ellipse(x, y, 13 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.ellipse(x - 3 * s, y - 3 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGate(ctx, it) {
  const left = it.x - it.gap / 2;
  const right = it.x + it.gap / 2;
  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(left - 2, it.y - 22, 4, 44);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(right - 2, it.y - 22, 4, 44);
  ctx.strokeStyle = it.scored ? "rgba(15,23,42,0.12)" : "rgba(15,23,42,0.32)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(left, it.y + 20);
  ctx.lineTo(right, it.y + 20);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSkier(ctx, st) {
  const lean = Math.max(-1, Math.min(1, st.vx / 400)) * 0.45;
  ctx.save();
  ctx.translate(st.x, st.y);
  ctx.rotate(lean);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-11, 10, 22, 4);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-5, 2, 10, 9);
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(-7, -10);
  ctx.lineTo(7, -10);
  ctx.lineTo(6, 4);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(0, -15, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(-13, 12);
  ctx.moveTo(8, -6);
  ctx.lineTo(13, 12);
  ctx.stroke();
  ctx.restore();
}

function drawScene(ctx, st) {
  const { w, h } = st;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#f1f5f9");
  bg.addColorStop(1, "#ffffff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const stepY = 64;
  const off = st.tex % stepY;
  ctx.fillStyle = "rgba(15,23,42,0.06)";
  for (let y = -stepY + off; y < h; y += stepY) {
    for (let x = 24; x < w; x += 92) ctx.fillRect(x, y, 3, 10);
  }

  ctx.strokeStyle = "rgba(15,23,42,0.13)";
  ctx.lineWidth = 2;
  for (const p of st.trail) {
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y);
    ctx.lineTo(p.x - 8, p.y + 9);
    ctx.moveTo(p.x + 8, p.y);
    ctx.lineTo(p.x + 8, p.y + 9);
    ctx.stroke();
  }

  for (const it of st.items) {
    if (it.kind === "gate") drawGate(ctx, it);
    else if (it.kind === "tree") drawTree(ctx, it);
    else drawRock(ctx, it);
  }

  drawSkier(ctx, st);
}

export default function SkiSlope() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const input = useRef({ left: false, right: false, pointer: false, px: 0 });
  const statusRef = useRef("ready");
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);

  const setPhase = (p) => {
    statusRef.current = p;
    setStatus(p);
  };

  const restart = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    stateRef.current = makeState(rect?.width || 480, rect?.height || 720);
    input.current.left = false;
    input.current.right = false;
    input.current.pointer = false;
    setScore(0);
    statusRef.current = "playing";
    setStatus("playing");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let last = performance.now();

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(rect.width * dpr));
      const ch = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const st = stateRef.current;
      if (!st) {
        stateRef.current = makeState(rect.width, rect.height);
      } else if (Math.abs(st.w - rect.width) > 1 || Math.abs(st.h - rect.height) > 1) {
        st.w = rect.width;
        st.h = rect.height;
        st.y = rect.height * SKIER_Y;
        st.x = Math.min(st.x, rect.width - 18);
      }
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const st = stateRef.current;

      if (st && statusRef.current === "playing") {
        const i = input.current;
        let dir = (i.right ? 1 : 0) - (i.left ? 1 : 0);
        if (!dir && i.pointer) {
          const dx = i.px - st.x;
          dir = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
        }
        const crashed = update(st, dt, dir);
        const total = Math.floor(st.distance) + st.bonus;
        if (total !== st.shown) {
          st.shown = total;
          setScore(total);
        }
        if (crashed) {
          setPhase("crashed");
          if (total > readBest()) {
            writeBest(total);
            setBest(total);
          }
        }
      }

      if (st) drawScene(ctx, st);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const key = (e, down) => {
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") {
        input.current.left = down;
        e.preventDefault();
      }
      if (k === "ArrowRight" || k === "d" || k === "D") {
        input.current.right = down;
        e.preventDefault();
      }
      if (down && (k === " " || k === "Enter") && statusRef.current !== "playing") {
        e.preventDefault();
        restart();
      }
    };
    const onDown = (e) => key(e, true);
    const onUp = (e) => key(e, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [restart]);

  const pointerAt = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    input.current.px = e.clientX - rect.left;
  };
  const onPointerDown = (e) => {
    pointerAt(e);
    input.current.pointer = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (input.current.pointer) pointerAt(e);
  };
  const onPointerUp = () => {
    input.current.pointer = false;
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between px-4 py-3">
        <div className="border border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground" style={MONT}>
            Score
          </p>
          <p className="text-lg font-black leading-none text-foreground" style={MONT}>
            {score}
          </p>
        </div>
        <div className="border border-border/60 bg-background/85 px-3 py-1.5 text-right backdrop-blur-sm">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground" style={MONT}>
            Best
          </p>
          <p className="text-lg font-black leading-none text-foreground" style={MONT}>
            {best}
          </p>
        </div>
      </div>

      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm border border-border bg-card p-6 text-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-foreground" style={MONT}>
              {status === "ready" ? "Ski Slope" : "Crashed"}
            </h2>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground" style={MONT}>
              {status === "ready"
                ? "Dodge the trees and rocks. Thread the gates for bonus points."
                : `Score ${score} · Best ${best}`}
            </p>
            <button
              onClick={restart}
              className="mt-5 inline-flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85"
              style={MONT}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {status === "ready" ? "Start" : "Again"}
            </button>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground" style={MONT}>
              Arrow keys or A/D to steer, or drag
            </p>
          </div>
        </div>
      )}
    </div>
  );
}