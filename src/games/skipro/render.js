// SKIPRO360 canvas renderer.

const mix = (a, b, t) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(
    a[2] + (b[2] - a[2]) * t
  )})`;

const flake = (i) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

function tree(ctx, it) {
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

function rock(ctx, it) {
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

function mogul(ctx, it) {
  const { x, y } = it;
  ctx.fillStyle = "rgba(148,163,184,0.55)";
  ctx.beginPath();
  ctx.ellipse(x, y, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(226,232,240,0.9)";
  ctx.beginPath();
  ctx.ellipse(x - 4, y - 4, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function gate(ctx, it, t) {
  const left = it.x - it.gap / 2;
  const right = it.x + it.gap / 2;
  ctx.fillStyle = it.scored ? "rgba(29,78,216,0.45)" : "#1d4ed8";
  ctx.fillRect(left - 2, it.y - 22, 4, 44);
  ctx.fillStyle = it.scored ? "rgba(220,38,38,0.45)" : "#dc2626";
  ctx.fillRect(right - 2, it.y - 22, 4, 44);
  ctx.strokeStyle = it.scored ? "rgba(15,23,42,0.12)" : "rgba(15,23,42,0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(left, it.y + 20);
  ctx.lineTo(right, it.y + 20);
  ctx.stroke();
  ctx.setLineDash([]);
  if (!it.scored) {
    ctx.fillStyle = "rgba(29,78,216,0.5)";
    ctx.fillRect(left, it.y - 2, right - left, 4);
  }
  void t;
}

function coin(ctx, it) {
  const r = 7 + Math.sin(it.y * 0.15) * 1.2;
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(it.x, it.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(it.x - 1.5, it.y - 1.5, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function ramps(ctx, it) {
  const half = it.w / 2;
  ctx.fillStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(it.x - half, it.y + 12);
  ctx.lineTo(it.x + half, it.y + 12);
  ctx.lineTo(it.x + half, it.y - 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(it.x - half, it.y + 12);
  ctx.lineTo(it.x + half, it.y - 12);
  ctx.stroke();
}

function ice(ctx, it) {
  ctx.fillStyle = "rgba(147,197,253,0.32)";
  ctx.beginPath();
  ctx.ellipse(it.x, it.y, it.w / 2, it.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(it.x, it.y, it.w / 2 - 4, it.h / 2 - 4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function skier(ctx, st, light) {
  const lean = Math.max(-1, Math.min(1, st.vx / 420)) * 0.45;
  const lift = st.air > 0 ? Math.sin((1 - st.air / 0.8) * Math.PI) * 34 : 0;
  const flash = st.invuln > 0 && Math.floor(st.invuln * 12) % 2 === 0;

  if (st.air > 0) {
    ctx.fillStyle = "rgba(15,23,42,0.18)";
    ctx.beginPath();
    ctx.ellipse(st.x, st.y + 14, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(st.x, st.y - lift);
  ctx.rotate(lean);
  ctx.globalAlpha = flash ? 0.35 : 1;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-11, 10, 22, 4);
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(-5, 2, 10, 9);
  ctx.fillStyle = st.boosting ? "#f97316" : "#dc2626";
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
  ctx.globalAlpha = 1;
  ctx.restore();

  if (st.boosting) {
    const g = ctx.createLinearGradient(st.x, st.y + 12, st.x, st.y + 34);
    g.addColorStop(0, "rgba(249,115,22,0.85)");
    g.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = g;
    ctx.fillRect(st.x - 5, st.y + 12, 10, 22);
  }

  if (light < 0.45) {
    const lamp = ctx.createRadialGradient(st.x, st.y - 6, 4, st.x, st.y - 6, 110);
    lamp.addColorStop(0, "rgba(254,249,195,0.35)");
    lamp.addColorStop(1, "rgba(254,249,195,0)");
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(st.x, st.y - 6, 110, 0, Math.PI * 2);
    ctx.fill();
  }
}

function weather(ctx, st) {
  if (st.weather.kind === "clear") return;
  const blizzard = st.weather.kind === "blizzard";
  const count = blizzard ? Math.round(st.w * 0.34) + 60 : Math.round(st.w * 0.12) + 24;
  const drift = blizzard ? 2.4 : 1;
  ctx.fillStyle = blizzard ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.8)";
  for (let i = 0; i < count; i += 1) {
    const r1 = flake(i);
    const r2 = flake(i + 137);
    const r3 = flake(i + 311);
    const speed = (55 + r2 * 130) * drift;
    const y = ((r1 * st.h + st.time * speed) % (st.h + 40)) - 20;
    const x =
      (((r3 * st.w + Math.sin(st.time * 0.8 + i) * 14 + st.time * (blizzard ? 60 : 12) + st.tex * 0.15) % (st.w + 30)) + st.w + 30) %
        (st.w + 30) -
      15;
    const size = blizzard ? 1.4 + r2 * 2 : 1.2 + r2 * 1.6;
    ctx.fillRect(x, y, size, size);
  }
  if (blizzard) {
    ctx.fillStyle = "rgba(248,250,252,0.24)";
    ctx.fillRect(0, 0, st.w, st.h);
  }
}

export function drawScene(ctx, st) {
  const { w, h } = st;
  const light = 0.5 - 0.5 * Math.cos(st.clock * Math.PI * 2);

  ctx.save();
  if (st.shake > 0) {
    const s = st.shake * 9;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, mix([11, 18, 32], [219, 234, 254], light));
  sky.addColorStop(1, mix([30, 41, 59], [255, 255, 255], light));
  ctx.fillStyle = sky;
  ctx.fillRect(-30, -30, w + 60, h + 60);

  // slope texture
  const stepY = 64;
  const off = st.tex % stepY;
  ctx.fillStyle = `rgba(15,23,42,${0.05 + 0.04 * (1 - light)})`;
  for (let y = -stepY + off; y < h; y += stepY) {
    for (let x = 24; x < w; x += 92) ctx.fillRect(x, y, 3, 10);
  }

  // skier tracks
  ctx.strokeStyle = `rgba(15,23,42,${0.1 + 0.12 * light})`;
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
    if (it.kind === "ice") ice(ctx, it);
    else if (it.kind === "gate") gate(ctx, it, st.time);
    else if (it.kind === "tree") tree(ctx, it);
    else if (it.kind === "rock") rock(ctx, it);
    else if (it.kind === "mogul") mogul(ctx, it);
    else if (it.kind === "coin") coin(ctx, it);
    else if (it.kind === "ramp") ramps(ctx, it);
  }

  skier(ctx, st, light);

  for (const p of st.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  weather(ctx, st);

  ctx.textAlign = "center";
  ctx.font = "700 13px Montserrat, system-ui, sans-serif";
  for (const f of st.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    ctx.fillStyle = "#0f172a";
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;

  if (light < 0.45) {
    ctx.fillStyle = `rgba(2,6,23,${(0.45 - light) * 0.9})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}