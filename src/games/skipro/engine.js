// SKIPRO360 run simulation. Pure state + math: no React, no canvas.

import { getDifficulty } from "./config";

const rand = (a, b) => a + Math.random() * (b - a);
export const SKIER_Y = 0.72;

export const ACHIEVEMENTS = [
  { id: "gate1", label: "First Gate", test: (s) => s.gates >= 1 },
  { id: "coins", label: "Coin Rush", test: (s) => s.coins >= 15 },
  { id: "triple", label: "Triple Combo", test: (s) => s.mult >= 3 },
  { id: "tricks", label: "Show Off", test: (s) => s.tricks >= 3 },
  { id: "km", label: "Kilometre Club", test: (s) => s.distance >= 1000 },
  { id: "survivor", label: "Survivor", test: (s) => s.time >= 90 },
  { id: "storm", label: "Storm Rider", test: (s) => s.weather.kind === "blizzard" && s.gates >= 6 },
  { id: "burner", label: "Afterburner", test: (s) => s.boosting && s.speed > 430 },
];

export function createRun(w, h, diffId) {
  const d = getDifficulty(diffId);
  return {
    w,
    h,
    d,
    x: w / 2,
    y: h * SKIER_Y,
    vx: 0,
    speed: d.speed,
    topSpeed: d.speed,
    distance: 0,
    tex: 0,
    time: 0,
    score: 0,
    lives: d.lives,
    invuln: 0,
    boost: 100,
    boosting: false,
    mult: 1,
    comboT: 0,
    coins: 0,
    gates: 0,
    misses: 0,
    tricks: 0,
    items: [],
    trail: [],
    trailT: 0,
    particles: [],
    floats: [],
    gatesIn: 4.5,
    obstIn: 0.8,
    coinIn: 2.2,
    specialIn: 6.5,
    weather: { kind: "clear", t: 13 },
    clock: 0.06,
    shake: 0,
    slowT: 0,
    air: 0,
    airMove: 0,
    onIce: false,
    over: false,
    cause: "",
    unlocked: [],
    newAch: [],
    sfx: [],
  };
}

const burst = (st, x, y, n, color) => {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(30, 190);
    st.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.35, 0.8),
      max: 0.8,
      size: rand(1.5, 3.4),
      color,
    });
  }
};

const award = (st, x, y, text) => st.floats.push({ x, y, text, life: 1.15, max: 1.15 });

const cycleWeather = (st) => {
  const r = Math.random();
  let next = "clear";
  if (st.weather.kind === "clear") next = r < 0.6 ? "snow" : "blizzard";
  else if (st.weather.kind === "snow") next = r < 0.45 ? "clear" : "blizzard";
  else next = r < 0.8 ? "snow" : "clear";
  st.weather = { kind: next, t: next === "blizzard" ? rand(9, 14) : rand(14, 22) };
};

function spawn(st, dt) {
  const ramp = st.d.ramp;

  st.obstIn -= dt;
  if (st.obstIn <= 0) {
    st.obstIn = (Math.max(0.2, 0.66 - st.distance * 0.0011) / ramp) * rand(0.75, 1.35);
    const r = Math.random();
    const kind = r < 0.52 ? "tree" : r < 0.84 ? "rock" : "mogul";
    st.items.push({
      kind,
      x: rand(24, st.w - 24),
      y: -50,
      s: kind === "tree" ? rand(0.85, 1.35) : rand(0.85, 1.25),
    });
  }

  st.gatesIn -= dt;
  if (st.gatesIn <= 0) {
    st.gatesIn = rand(5, 9) / ramp;
    const gap = Math.max(72, rand(118, 152) - st.distance * 0.004);
    st.items.push({
      kind: "gate",
      x: rand(gap / 2 + 28, Math.max(gap / 2 + 29, st.w - gap / 2 - 28)),
      y: -60,
      gap,
      scored: false,
    });
  }

  st.coinIn -= dt;
  if (st.coinIn <= 0) {
    st.coinIn = rand(1.9, 3.4);
    const cx = rand(30, st.w - 30);
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i += 1) {
      st.items.push({ kind: "coin", x: cx + Math.sin(i * 1.6) * 16, y: -60 - i * 34, spin: i });
    }
  }

  st.specialIn -= dt;
  if (st.specialIn <= 0) {
    st.specialIn = rand(6, 11);
    if (Math.random() < 0.6) {
      st.items.push({ kind: "ramp", x: rand(46, st.w - 46), y: -70, w: 78 });
    } else {
      st.items.push({
        kind: "ice",
        x: rand(70, Math.max(71, st.w - 70)),
        y: -70,
        w: rand(100, 150),
        h: rand(100, 160),
      });
    }
  }
}

export function step(st, dt, input) {
  st.time += dt;
  st.clock = (st.clock + dt * 0.014) % 1;

  st.weather.t -= dt;
  if (st.weather.t <= 0) cycleWeather(st);

  if (st.invuln > 0) st.invuln -= dt;
  if (st.slowT > 0) st.slowT -= dt;
  if (st.shake > 0) st.shake = Math.max(0, st.shake - dt * 2.4);

  const base =
    (st.d.speed + Math.min(360, st.distance * 1.6)) * (st.weather.kind === "blizzard" ? 0.94 : 1);
  const wantBoost = input.boost && st.boost > 2;
  st.boosting = wantBoost;
  let target = wantBoost ? base * 1.55 : base;
  if (st.slowT > 0) target *= 0.55;
  st.speed += (target - st.speed) * Math.min(1, dt * 1.8);
  st.topSpeed = Math.max(st.topSpeed, st.speed);
  st.boost = Math.max(0, Math.min(100, st.boost + (wantBoost ? -34 : 7) * dt));

  const gain = (st.speed * dt) / 13;
  st.distance += gain;
  st.score += gain;
  st.tex += st.speed * dt;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const control = st.air > 0 ? 0.55 : st.onIce ? 0.5 : 1;
  st.vx += dir * 1900 * control * dt;
  if (st.weather.kind === "blizzard" && st.air <= 0) st.vx += Math.sin(st.time * 3.1) * 70 * dt;
  st.vx -= st.vx * Math.min(1, (st.onIce && st.air <= 0 ? 2.4 : 7) * dt);
  const cap = st.boosting ? 540 : 430;
  st.vx = Math.max(-cap, Math.min(cap, st.vx));
  st.x += st.vx * dt;
  if (st.x < 18) {
    st.x = 18;
    st.vx = 0;
  }
  if (st.x > st.w - 18) {
    st.x = st.w - 18;
    st.vx = 0;
  }

  spawn(st, dt);
  for (const it of st.items) it.y += st.speed * dt;

  st.onIce = st.items.some(
    (it) => it.kind === "ice" && Math.abs(st.x - it.x) < it.w / 2 && Math.abs(st.y - it.y) < it.h / 2
  );

  // airtime: launch, then land a trick if the player moved enough mid-air
  if (st.air > 0) {
    st.air -= dt;
    st.airMove += Math.abs(st.vx) * dt;
    if (st.air <= 0) {
      const trick = st.airMove > 90;
      burst(st, st.x, st.y + 8, trick ? 14 : 8, "#e2e8f0");
      st.sfx.push("land");
      if (trick) {
        st.tricks += 1;
        st.score += 60 * st.mult;
        st.mult = Math.min(5, st.mult + 0.25);
        st.comboT = 4;
        award(st, st.x, st.y - 34, `TRICK +${Math.round(60 * st.mult)}`);
        st.sfx.push("trick");
      }
      st.airMove = 0;
    }
  }

  // gates, coins and pickups
  for (const it of st.items) {
    if (it.kind === "gate" && !it.scored && it.y > st.y) {
      it.scored = true;
      if (Math.abs(st.x - it.x) < it.gap / 2 - 4) {
        st.gates += 1;
        st.score += 30 * st.mult;
        st.mult = Math.min(5, st.mult + 0.15);
        st.comboT = 4;
        award(st, st.x, st.y - 34, `GATE +${Math.round(30 * st.mult)}`);
        st.sfx.push("gate");
      } else {
        st.misses += 1;
        st.mult = 1;
        st.comboT = 0;
        st.sfx.push("miss");
      }
    }
    if (it.kind === "coin" && Math.abs(st.x - it.x) < 20 && Math.abs(st.y + 6 - it.y) < 26) {
      it.dead = true;
      st.coins += 1;
      st.boost = Math.min(100, st.boost + 16);
      st.score += 15 * st.mult;
      st.mult = Math.min(5, st.mult + 0.1);
      st.comboT = 4;
      burst(st, it.x, it.y, 7, "#fbbf24");
      st.sfx.push("coin");
    }
  }

  // collisions with the scenery
  if (st.air <= 0 && st.invuln <= 0) {
    for (const it of st.items) {
      if (it.kind === "mogul") {
        if (Math.abs(st.x - it.x) < 22 && Math.abs(st.y + 10 - it.y) < 20) {
          it.dead = true;
          st.slowT = 0.9;
          st.shake = 0.45;
          st.score = Math.max(0, st.score - 10);
          burst(st, it.x, it.y, 8, "#cbd5e1");
        }
        continue;
      }
      if (it.kind === "ramp") {
        if (Math.abs(st.x - it.x) < it.w / 2 && Math.abs(st.y + 8 - it.y) < 26) {
          it.dead = true;
          st.air = 0.8;
          st.airMove = 0;
          burst(st, it.x, it.y, 12, "#e2e8f0");
          st.sfx.push("ramps");
        }
        continue;
      }
      if (it.kind !== "tree" && it.kind !== "rock") continue;
      const r = (it.kind === "rock" ? 14 : 13) * it.s;
      if (Math.abs(st.x - it.x) < r + 5 && Math.abs(st.y + 10 - it.y) < r + 12) {
        it.dead = true;
        st.lives -= 1;
        st.invuln = 1.7;
        st.mult = 1;
        st.comboT = 0;
        st.shake = 1;
        burst(st, it.x, it.y, 18, "#94a3b8");
        award(st, st.x, st.y - 34, "-1 LIFE");
        st.sfx.push("crash");
        if (st.lives <= 0) {
          st.over = true;
          st.cause = it.kind === "tree" ? "You clipped a tree." : "You hit a rock.";
        }
        break;
      }
    }
  }

  if (st.comboT > 0) {
    st.comboT -= dt;
    if (st.comboT <= 0) st.mult = 1;
  }

  // trail, particles, floating text
  st.trailT += dt;
  if (st.trailT > 0.05 && st.air <= 0) {
    st.trailT = 0;
    st.trail.push({ x: st.x, y: st.y });
  }
  for (const p of st.trail) p.y += st.speed * dt;
  st.trail = st.trail.filter((p) => p.y < st.h + 20);

  for (const p of st.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt + st.speed * dt * 0.35;
  }
  st.particles = st.particles.filter((p) => p.life > 0);

  for (const f of st.floats) {
    f.life -= dt;
    f.y += st.speed * dt * 0.6 - 26 * dt;
  }
  st.floats = st.floats.filter((f) => f.life > 0);

  st.items = st.items.filter((it) => !it.dead && it.y < st.h + 170);

  // achievements
  for (const a of ACHIEVEMENTS) {
    if (st.unlocked.includes(a.id)) continue;
    if (a.test(st)) {
      st.unlocked.push(a.id);
      st.newAch.push({ id: a.id, label: a.label });
      st.sfx.push("ach");
    }
  }

  return st;
}