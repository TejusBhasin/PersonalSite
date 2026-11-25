const KEY = "mp3now.settings.v1";

export const DEFAULT_SETTINGS = {
  autoplay: true,
  startListening: true,
  theme: "auto",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing can block storage; the session still works with defaults.
  }
  return next;
}

// "auto" follows the device; light/dark are explicit overrides.
export function resolveTheme(theme) {
  if (theme === "light" || theme === "dark") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}