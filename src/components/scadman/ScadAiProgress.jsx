import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Reading your source",
  "Searching the OpenSCAD reference",
  "Writing the model",
  "Compiling geometry",
];

export default function ScadAiProgress({ stage = 0, elapsed = 0 }) {
  const active = Math.max(0, Math.min(STEPS.length - 1, stage));

  return (
    <div
      className="rounded-md border px-2.5 py-2"
      style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel-2)" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--scad-accent)" }}
        >
          working
        </span>
        <span className="scad-mono text-[10px] text-[color:var(--scad-dim)]">
          {Number(elapsed || 0).toFixed(1)}s
        </span>
      </div>
      <ul className="mt-1.5 space-y-1">
        {STEPS.map((label, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <li
              key={label}
              className="flex items-center gap-1.5 text-[10.5px]"
              style={{
                color: done ? "var(--scad-muted)" : current ? "var(--scad-text)" : "var(--scad-dim)",
              }}
            >
              {done ? (
                <Check className="h-3 w-3 shrink-0" style={{ color: "var(--scad-ok)" }} />
              ) : current ? (
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" style={{ color: "var(--scad-accent)" }} />
              ) : (
                <span
                  className="ml-[5px] mr-[5px] h-1 w-1 shrink-0 rounded-full"
                  style={{ background: "var(--scad-line-2)" }}
                />
              )}
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}