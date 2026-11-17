import { useEffect, useRef } from "react";
import { dinoSfx } from "@/lib/dinoSfx";

const W = 600;
const H = 150;
const GROUND = 127;
const PX = 2;

const GRAVITY = 0.55;
const JUMP_V = 8.6;
const START_SPEED = 6;
const MAX_SPEED = 13;
const ACCEL = 0.0016;

const DINO_BODY = [
  "................XXXXXXXX",
  "...............XXXXXXXXX",
  "...............XXXXXXXXX",
  "...............XXXXXXXXX",
  "...............XXXXXXXXX",
  "...............XXXXXXX..",
  "...............XXXXXXXX.",
  "...............XXXXXX...",
  "..X............XXXXXX...",
  "..XX..........XXXXXXX...",
  "..XXX........XXXXXXXX...",
  "..XXXX......XXXXXXXXX...",
  "..XXXXX....XXXXXXXXXX...",
  "..XXXXXXXXXXXXXXXXXXX...",
  "...XXXXXXXXXXXXXXXX.....",
  "....XXXXXXXXXXXXXXX.....",
  "......XXXXXXXXXXXX......",
];

const DINO_DUCK = [
  "..........................XXXXXXXX",
  ".........................XXXXXXXXXX",
  "...............XXXXXXXX..XXXXXXXXXX",
  "..............XXXXXXXXX..XXXXXXXXXX",
  "..X...........XXXXXXXXX..XXXXXX....",
  "..XX.........XXXXXXXXXXXXXXXXXXXXX",
  "..XXX.......XXXXXXXXXXXXXXXXXXXXXX",
  "..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.",
  "....XXXXXXXXXXXXXXXXXXXXXXXXXXX...",
  "......XXXXX....XXXXX....XXXXX.....",
  "......XXX.......XXX......XXX......",
];

const CACTUS_SMALL = [
  "...XX...",
  "...XX...",
  "...XX...",
  "X..XX...",
  "X..XX.X.",
  "X..XX.X.",
  "XXXXX.X.",
  "...XXXXX",
  "...XX.X.",
  "...XX.X.",
  "...XX...",
  "...XX...",
  "...XX...",
  "...XX...",
  "...XX...",
  "...XX...",
  "...XX...",
];

const CACTUS_LARGE = [
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "X...XXX..",
  "X...XXX.X",
  "X...XXX.X",
  "XX..XXX.X",
  "XX..XXX.X",
  "XXXXXXX.X",
  "XX..XXXXX",
  "XX..XXX.X",
  "....XXX.X",
  "....XXXXX",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
  "....XXX..",
];

const BIRD = [
  [
    "....................",
    "..XXXX..............",
    ".XXXXXX.............",
    "XXXXXXX.............",
    "XXXXXXXXXXX.........",
    ".XXXXXXXXXXXXXX.....",
    "..XXXXXXXXXXXXXXXX..",
    "...XXXXXXXXXXXXXXX..",
    "....XXXXXXXXXXXX....",
    ".....XXXXXXXXX......",
    "......XXXXX.........",
    ".......XXX..........",
    "....................",
    "....................",
  ],
  [
    "....................",
    "....................",
    "....................",
    "....................",
    ".......XXX..........",
    ".....XXXXXXX........",
    "....XXXXXXXXXXXX....",
    "..XXXXXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXX....",
    "XXXXXXX.............",
    "XXXXXXX.............",
    ".XXXXX..............",
    "..XXX...............",
    "....................",
  ],
];

const DINO_W = DINO_BODY[0].length * PX;
const DINO_H = DINO_BODY.length * PX + 8;
const DUCK_W = DINO_DUCK[0].length * PX;
const DUCK_H = DINO_DUCK.length * PX;

function drawGrid(ctx, grid, x, y, color) {
  ctx.fillStyle = color;
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r];
    let c = 0;
    while (c < row.length) {
      if (row[c] === "X") {
        let run = 1;
        while (row[c + run] === "X") run += 1;
        ctx.fillRect(x + c * PX, y + r * PX, run * PX, PX);
        c += run;
      } else {
        c += 1;
      }
    }
  }
}

function drawCloud(ctx, cloud, color) {
  const w = 44 * cloud.scale;
  const h = 12 * cloud.scale;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = color;
  ctx.fillRect(cloud.x, cloud.y + h * 0.5, w, h * 0.35);
  ctx.fillRect(cloud.x + w * 0.18, cloud.y + h * 0.25, w * 0.42, h * 0.45);
  ctx.fillRect(cloud.x + w * 0.46, cloud.y + h * 0.02, w * 0.3, h * 0.5);
  ctx.globalAlpha = 1;
}

const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(5, "0");

export default function DinoCanvas({ hi = 0, muted = false, onGameOver }) {
  const canvasRef = useRef(null);
  const mutedRef = useRef(muted);
  const hiRef = useRef(hi);
  const overRef = useRef(onGameOver);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    hiRef.current = hi;
  }, [hi]);

  useEffect(() => {
    overRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    let raf = 0;
    let last = performance.now();
    let overSent = false;

    const makeCloud = (x) => ({ x, y: 16 + Math.random() * 32, scale: 0.7 + Math.random() * 0.6 });

    const s = {
      status: "ready",
      y: 0,
      v: 0,
      ducking: false,
      legFrame: 0,
      legTimer: 0,
      speed: START_SPEED,
      score: 0,
      obstacles: [],
      clouds: [makeCloud(140), makeCloud(320), makeCloud(500)],
      gap: 320,
      groundOffset: 0,
      invert: false,
      nextInvert: 700,
      milestone: 0,
      flash: 0,
      tick: 0,
    };

    const reset = () => {
      s.status = "ready";
      s.y = 0;
      s.v = 0;
      s.ducking = false;
      s.speed = START_SPEED;
      s.score = 0;
      s.obstacles = [];
      s.gap = 320;
      s.invert = false;
      s.nextInvert = 700;
      s.milestone = 0;
      s.flash = 0;
      overSent = false;
    };

    const start = () => {
      s.status = "running";
      s.y = 0;
      s.v = 0;
      s.ducking = false;
      s.speed = START_SPEED;
      s.score = 0;
      s.obstacles = [];
      s.gap = 340;
      s.invert = false;
      s.nextInvert = 700;
      s.milestone = 0;
      s.flash = 0;
      overSent = false;
    };

    const spawn = () => {
      const birdChance = s.score > 380 ? 0.28 : 0;
      if (Math.random() < birdChance) {
        const tops = [GROUND - 92, GROUND - 66, GROUND - 46];
        s.obstacles.push({
          kind: "bird",
          x: W + 20,
          y: tops[Math.floor(Math.random() * tops.length)],
          w: BIRD[0][0].length * PX,
          h: BIRD[0].length * PX,
          frame: 0,
        });
      } else {
        const large = Math.random() < 0.35;
        const grid = large ? CACTUS_LARGE : CACTUS_SMALL;
        const w = grid[0].length * PX;
        const h = grid.length * PX;
        const count = large
          ? 1 + (Math.random() < 0.35 ? 1 : 0)
          : 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i += 1) {
          s.obstacles.push({
            kind: large ? "large" : "small",
            x: W + 20 + i * (w + 4),
            y: GROUND - h,
            w,
            h,
          });
        }
      }
      s.gap = Math.max(230, s.speed * 34 + Math.random() * 250);
    };

    const hit = () => {
      const ducking = s.ducking && s.y === 0;
      const box = ducking
        ? { x: 31, y: GROUND - DUCK_H, w: DUCK_W - 16, h: DUCK_H }
        : { x: 32, y: GROUND - DINO_H - s.y, w: DINO_W - 12, h: DINO_H };
      return s.obstacles.some((o) => {
        const oBox =
          o.kind === "bird"
            ? { x: o.x + 6, y: o.y + 6, w: o.w - 14, h: o.h - 12 }
            : { x: o.x + 3, y: o.y + 4, w: o.w - 6, h: o.h - 4 };
        return (
          box.x < oBox.x + oBox.w &&
          box.x + box.w > oBox.x &&
          box.y < oBox.y + oBox.h &&
          box.y + box.h > oBox.y
        );
      });
    };

    const jump = () => {
      if (s.status === "ready") {
        start();
        return;
      }
      if (s.status === "over") {
        reset();
        start();
        return;
      }
      if (s.y === 0) {
        s.ducking = false;
        s.v = JUMP_V;
        s.y = 0.1;
        dinoSfx.jump(mutedRef.current);
      }
    };

    const onKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        if (!e.repeat) jump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        if (s.status !== "running") return;
        e.preventDefault();
        s.ducking = true;
        if (s.y > 0) s.v = -8;
      }
    };

    const onKeyUp = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        if (s.v > 0) s.v *= 0.5;
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        s.ducking = false;
      }
    };

    const onPointerDown = (e) => {
      e.preventDefault();
      jump();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);

    const update = (k) => {
      s.tick += 1;
      if (s.status !== "running") return;

      s.speed = Math.min(MAX_SPEED, s.speed + ACCEL * k);
      s.score += s.speed * 0.025 * k;
      s.groundOffset = (s.groundOffset + s.speed * k) % 2400;

      if (s.y > 0 || s.v > 0) {
        s.y += s.v * k;
        s.v -= GRAVITY * k;
        if (s.y <= 0) {
          s.y = 0;
          s.v = 0;
        }
      }

      s.legTimer += k;
      if (s.legTimer > 6) {
        s.legTimer = 0;
        s.legFrame = s.legFrame ? 0 : 1;
      }

      s.gap -= s.speed * k;
      if (s.gap <= 0) spawn();

      s.obstacles.forEach((o) => {
        o.x -= (o.kind === "bird" ? s.speed + 0.6 : s.speed) * k;
        if (o.kind === "bird") o.frame = Math.floor(s.tick / 7) % 2;
      });
      s.obstacles = s.obstacles.filter((o) => o.x + o.w > -20);

      s.clouds.forEach((c) => {
        c.x -= s.speed * 0.28 * k;
      });
      s.clouds = s.clouds.filter((c) => c.x > -80);
      if (s.clouds.length < 3 && Math.random() < 0.008 * k) s.clouds.push(makeCloud(W + 40));

      const milestone = Math.floor(s.score / 100);
      if (milestone > s.milestone) {
        s.milestone = milestone;
        s.flash = 30;
        dinoSfx.point(mutedRef.current);
      }
      if (s.flash > 0) s.flash -= k;

      if (s.score >= s.nextInvert) {
        s.invert = !s.invert;
        s.nextInvert += 700;
      }

      if (hit()) {
        s.status = "over";
        dinoSfx.die(mutedRef.current);
        if (!overSent) {
          overSent = true;
          overRef.current?.(Math.floor(s.score));
        }
      }
    };

    const drawDino = (fg, bg) => {
      if (s.ducking && s.y === 0) {
        const x = 25;
        const y = GROUND - DUCK_H;
        drawGrid(ctx, DINO_DUCK, x, y, fg);
        ctx.fillStyle = bg;
        ctx.fillRect(x + 60, y + 6, 4, 4);
        ctx.fillStyle = fg;
        ctx.fillRect(x + 61, y + 7, 2, 2);
        return;
      }
      const x = 25;
      const y = GROUND - DINO_H - Math.round(s.y);
      drawGrid(ctx, DINO_BODY, x, y, fg);

      const bodyBottom = y + DINO_BODY.length * PX;
      const legH = 8;
      const lift = s.y > 0 ? 0 : s.legFrame ? 4 : 0;
      ctx.fillStyle = fg;
      ctx.fillRect(x + 14, bodyBottom, 4, legH - (s.y > 0 ? 0 : lift));
      ctx.fillRect(x + 24, bodyBottom, 4, legH - (s.y > 0 ? 4 : 4 - lift));
      ctx.fillRect(x + 4, bodyBottom - 6, 8, 4);

      ctx.fillStyle = bg;
      ctx.fillRect(x + 38, y + 6, 4, 4);
      ctx.fillStyle = fg;
      ctx.fillRect(x + 39, y + 7, 2, 2);
    };

    const render = () => {
      const fg = s.invert ? "#f7f7f7" : "#535353";
      const bg = s.invert ? "#1a1a1a" : "#f7f7f7";

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      s.clouds.forEach((c) => drawCloud(ctx, c, fg));

      ctx.fillStyle = fg;
      ctx.fillRect(0, GROUND, W, 1);
      const off = s.groundOffset;
      for (let i = 0; i < 26; i += 1) {
        const seed = (i * 977) % 2400;
        let gx = seed - off;
        if (gx < -60) gx += 2400;
        if (gx < -60 || gx > W) continue;
        ctx.fillRect(gx, GROUND + 2 + (i % 3), 4 + (i % 4) * 2, 1);
      }

      s.obstacles.forEach((o) => {
        if (o.kind === "bird") {
          drawGrid(ctx, BIRD[o.frame], o.x, o.y, fg);
        } else {
          drawGrid(ctx, o.kind === "large" ? CACTUS_LARGE : CACTUS_SMALL, o.x, o.y, fg);
        }
      });

      drawDino(fg, bg);

      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.font = "bold 12px 'Courier New', monospace";
      const scoreVisible = s.flash <= 0 || Math.floor(s.flash / 5) % 2 === 1;
      if (scoreVisible) {
        const shownHi = Math.max(Math.floor(hiRef.current || 0), Math.floor(s.score));
        ctx.fillStyle = fg;
        ctx.fillText(`HI ${pad(shownHi)}  ${pad(s.score)}`, W - 14, 24);
      }

      ctx.textAlign = "center";
      if (s.status === "ready") {
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.fillStyle = fg;
        ctx.fillText("PRESS SPACE OR TAP TO START", W / 2, 66);
        ctx.font = "bold 9px 'Courier New', monospace";
        ctx.fillText("DOWN / S TO DUCK", W / 2, 84);
      }
      if (s.status === "over") {
        ctx.font = "bold 15px 'Courier New', monospace";
        ctx.fillText("G A M E   O V E R", W / 2, 58);
        ctx.font = "bold 10px 'Courier New', monospace";
        ctx.fillText("PRESS SPACE TO RESTART", W / 2, 80);
      }
    };

    const loop = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;
      update(dt / 16.6667);
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="block w-full cursor-pointer touch-manipulation select-none"
      style={{ aspectRatio: "4 / 1" }}
      aria-label="Chrome Dino game. Press space to jump, down arrow to duck."
    />
  );
}