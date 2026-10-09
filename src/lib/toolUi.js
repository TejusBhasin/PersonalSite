export const inputCls = "w-full bg-card border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors";
export const btnCls = "bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-40";
export const ghostBtnCls = "border border-border/60 bg-card text-foreground px-3 py-2 rounded-lg text-sm font-semibold hover:border-foreground/40 transition-colors disabled:opacity-40";
export const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1";
export const cardCls = "bg-card/80 border border-border/60 rounded-xl p-5";
export const monoCls = "font-mono text-sm";

export function loadLS(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v === null || v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
}

export function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function fmtNum(n) {
  if (!isFinite(n)) return "—";
  if (n !== 0 && (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-9)) return n.toExponential(6);
  return Number(n.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 8 });
}