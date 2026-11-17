// Chrome Dino style blips via WebAudio — no audio files needed.

let ctx;

function audio() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ from, to, dur, type = "square", vol = 0.05 }) {
  const ac = audio();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), ac.currentTime + dur);
  gain.gain.setValueAtTime(vol, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

export const dinoSfx = {
  jump(muted) {
    if (muted) return;
    try {
      tone({ from: 420, to: 900, dur: 0.09, type: "square", vol: 0.045 });
    } catch {
      /* audio unavailable */
    }
  },
  point(muted) {
    if (muted) return;
    try {
      tone({ from: 990, to: 990, dur: 0.07, type: "square", vol: 0.05 });
      setTimeout(() => {
        try {
          tone({ from: 1400, to: 1400, dur: 0.1, type: "square", vol: 0.05 });
        } catch {
          /* audio unavailable */
        }
      }, 85);
    } catch {
      /* audio unavailable */
    }
  },
  die(muted) {
    if (muted) return;
    try {
      tone({ from: 320, to: 80, dur: 0.3, type: "sawtooth", vol: 0.05 });
    } catch {
      /* audio unavailable */
    }
  },
};