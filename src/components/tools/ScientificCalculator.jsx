import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { loadLS, saveLS, cardCls } from "@/lib/toolUi";

const DEG_FNS = {
  SIN: (x) => Math.sin((x * Math.PI) / 180),
  COS: (x) => Math.cos((x * Math.PI) / 180),
  TAN: (x) => Math.tan((x * Math.PI) / 180),
  ASIN: (x) => (Math.asin(x) * 180) / Math.PI,
  ACOS: (x) => (Math.acos(x) * 180) / Math.PI,
  ATAN: (x) => (Math.atan(x) * 180) / Math.PI,
};

function makeScope(deg) {
  const base = {
    LN: Math.log,
    LOG: Math.log10,
    SQRT: Math.sqrt,
    ABS: Math.abs,
    EXP: Math.exp,
    PI: Math.PI,
    E: Math.E,
  };
  if (deg) return { ...DEG_FNS, ...base };
  return {
    SIN: Math.sin,
    COS: Math.cos,
    TAN: Math.tan,
    ASIN: Math.asin,
    ACOS: Math.acos,
    ATAN: Math.atan,
    ...base,
  };
}

function evaluate(raw, deg) {
  let e = raw
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/\^/g, "**")
    .replace(/%/g, "/100")
    .replace(/\b(sin|cos|tan|asin|acos|atan|ln|log|sqrt|abs|exp)\b/g, (m) => m.toUpperCase())
    .replace(/π/g, "PI")
    .replace(/\be\b/g, "E");
  if (!/^[\d\s+\-*/().A-Z]+$/.test(e)) throw new Error("Invalid characters");
  const scope = makeScope(deg);
  const fn = new Function(...Object.keys(scope), `"use strict"; return (${e});`);
  const val = fn(...Object.values(scope));
  if (typeof val !== "number" || !isFinite(val)) throw new Error("Math error");
  return parseFloat(val.toPrecision(12));
}

export default function ScientificCalculator() {
  const [expr, setExpr] = useState("");
  const [deg, setDeg] = useState(true);
  const [history, setHistory] = useState(() => loadLS("calc-history", []));

  const push = (t) => setExpr((e) => e + t);
  const clear = () => setExpr("");

  const calc = useCallback(() => {
    if (!expr.trim()) return;
    try {
      const val = evaluate(expr, deg);
      setExpr(String(val));
      setHistory((h) => {
        const next = [{ q: expr, r: val }, ...h].slice(0, 12);
        saveLS("calc-history", next);
        return next;
      });
    } catch {
      setExpr("Error");
    }
  }, [expr, deg]);

  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (/^[0-9+\-*/().%^]$/.test(e.key)) setExpr((s) => s + e.key);
      else if (e.key === "Enter") calc();
      else if (e.key === "Backspace") setExpr((s) => (s === "Error" ? "" : s.slice(0, -1)));
      else if (e.key === "Escape") clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [calc]);

  const live = (() => {
    if (!expr.trim() || expr === "Error") return "";
    try {
      return String(evaluate(expr, deg));
    } catch {
      return "";
    }
  })();

  const SCI = [
    ["sin(", "cos(", "tan(", "ln(", "log("],
    ["asin(", "acos(", "atan(", "sqrt(", "^"],
    ["π", "e", "(", ")", "%"],
  ];
  const MAIN = [
    ["7", "8", "9", "÷"],
    ["4", "5", "6", "×"],
    ["1", "2", "3", "−"],
    ["0", ".", "⌫", "+"],
  ];
  const keyCls = "h-12 rounded-lg text-base font-bold bg-card border border-border/60 hover:border-foreground/40 active:bg-muted transition-colors";

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      <div className="space-y-4">
        <div className={cardCls + " !p-4"}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{live ? `= ${live}` : "\u00A0"}</span>
            <button
              onClick={() => setDeg((d) => !d)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-border/60 bg-card hover:border-foreground/40 transition-colors"
            >
              {deg ? "DEG" : "RAD"}
            </button>
          </div>
          <div className="text-right text-2xl font-mono font-bold break-all min-h-[2.5rem]">{expr || "0"}</div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {SCI.flat().map((k) => (
            <button key={k} onClick={() => push(k)} className={keyCls + " !text-sm text-foreground/80"}>
              {k.replace("(", "") === "sqrt" ? "√" : k.replace("(", "")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={clear} className={keyCls + " text-red-600 !text-sm tracking-wider"}>C</button>
          {MAIN.flat().map((k) => (
            <button key={k} onClick={() => (k === "⌫" ? setExpr((s) => (s === "Error" ? "" : s.slice(0, -1))) : push(k))} className={keyCls}>
              {k}
            </button>
          ))}
        </div>

        <button onClick={calc} className="w-full h-12 rounded-lg text-base font-black bg-foreground text-background hover:opacity-80 transition-opacity">
          =
        </button>
      </div>

      <div className={cardCls}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          <History className="w-3.5 h-3.5" /> History
        </p>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">Solved calculations appear here.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => setExpr(h.q)}
                className="w-full text-left text-xs font-mono bg-background/50 border border-border/40 rounded-lg px-3 py-2 hover:border-foreground/30 transition-colors"
              >
                <span className="block text-muted-foreground truncate">{h.q}</span>
                <span className="block font-bold">= {h.r}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}