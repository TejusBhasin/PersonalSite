// SKIPRO360 tuning: difficulty presets, storage keys and small helpers.

export const DIFFICULTIES = [
  { id: "cruise", label: "Cruise", speed: 175, ramp: 0.72, lives: 5, note: "Wide gates · slow slope · 5 lives" },
  { id: "standard", label: "Standard", speed: 205, ramp: 1, lives: 3, note: "The reference run · 3 lives" },
  { id: "pro", label: "Pro", speed: 240, ramp: 1.32, lives: 2, note: "Tighter gates · faster · 2 lives" },
  { id: "extreme", label: "Extreme", speed: 285, ramp: 1.72, lives: 1, note: "One crash ends it · 1 life" },
];

export const getDifficulty = (id) => DIFFICULTIES.find((d) => d.id === id) || DIFFICULTIES[1];

const BEST_KEY = (diff) => `skipro360_best_${diff}`;
const MUTE_KEY = "skipro360_muted";

export const readBest = (diff) => {
  try {
    return Number(localStorage.getItem(BEST_KEY(diff)) || 0) || 0;
  } catch {
    return 0;
  }
};

export const writeBest = (diff, value) => {
  try {
    localStorage.setItem(BEST_KEY(diff), String(value));
  } catch {
    /* storage unavailable */
  }
};

export const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
};

export const writeMuted = (value) => {
  try {
    localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
};

export const WEATHER_LABEL = {
  clear: "Clear",
  snow: "Snowfall",
  blizzard: "Blizzard",
};