import { Sliders } from "lucide-react";
import { paramNumber } from "@/lib/scad/format";

function control(param, value, onChange) {
  const common = {
    className: "scad-input",
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
  };

  if (param.type === "boolean") {
    const on = String(value).toLowerCase() === "true";
    return (
      <button
        type="button"
        onClick={() => onChange(on ? "false" : "true")}
        className="scad-btn w-full justify-between"
      >
        <span className="text-[11px] uppercase tracking-[0.1em]">{on ? "on" : "off"}</span>
        <span
          className="h-3.5 w-7 rounded-full"
          style={{ background: on ? "var(--scad-accent)" : "var(--scad-panel-3)" }}
        />
      </button>
    );
  }

  if (param.type === "select" && Array.isArray(param.options) && param.options.length) {
    return (
      <select {...common} className="scad-select">
        {param.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (param.type === "color") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#e9b14c"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded border"
          style={{ borderColor: "var(--scad-line-2)", background: "var(--scad-panel-2)" }}
        />
        <span className="scad-mono text-[11px] text-[color:var(--scad-muted)]">{value || "#e9b14c"}</span>
      </div>
    );
  }

  if (param.type === "text") return <input type="text" {...common} />;

  const numeric = paramNumber({ default_value: value });
  const min = typeof param.min_value === "number" ? param.min_value : 0;
  const max = typeof param.max_value === "number" ? param.max_value : Math.max(min + 1, numeric * 3 || 100);
  const step = param.type === "integer" ? 1 : 0.1;
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numeric}
        onChange={(e) => onChange(e.target.value)}
        className="h-1 flex-1 cursor-pointer appearance-none rounded"
        style={{ background: "var(--scad-panel-3)", accentColor: "#e9b14c" }}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="scad-input w-[74px] text-right"
      />
    </div>
  );
}

export default function ScadParamPanel({ params, onChange, emptyHint }) {
  if (!params || params.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <Sliders className="mx-auto h-4 w-4 text-[color:var(--scad-dim)]" />
        <p className="mt-2 text-[11.5px] leading-relaxed text-[color:var(--scad-dim)]">
          {emptyHint || "No parameters yet. Ask the assistant for a model, or assign numeric variables at the top of the source."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3">
      {params.map((param) => (
        <div key={param.id || param.name}>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label className="scad-label mb-0">{param.label || param.name}</label>
            <span className="scad-mono text-[9.5px] text-[color:var(--scad-dim)]">
              {param.name}
              {param.unit ? ` · ${param.unit}` : ""}
            </span>
          </div>
          {control(param, param.default_value, (value) => onChange(param, value))}
        </div>
      ))}
    </div>
  );
}