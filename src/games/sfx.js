// Short arcade blips via WebAudio — no audio files, nothing to download.

let ctx;

const NOTES = {
  coin: [880, 0.08, "triangle"],
  gate: [660, 0.09, "sine"],
  miss: [220, 0.12, "sawtooth"],
  ramps: [520, 0.1, "sine"],
  land: [320, 0.08, "triangle"],
  trick: [1180, 0.14, "triangle"],
  crash: [130, 0.25, "sawtooth"],
  ach: [990, 0.16, "sine"],
  shoot: [740, 0.05, "square"],
};

export function playSfx(name, muted) {
  if (muted) return;
  const note = NOTES[name];
  if (!note) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const [freq, dur, type] = note;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable */
  }
}