import { INFILL_PATTERNS, PRINTER_PRESETS } from "@/lib/scad/slicer";

const NOZZLES = ["0.3", "0.4", "0.5", "0.6", "0.8"];

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="scad-label">{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10px] leading-relaxed text-[color:var(--scad-dim)]">{hint}</span>
      )}
    </label>
  );
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label
      className="flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2"
      style={{ borderColor: "var(--scad-line-2)", background: "var(--scad-panel-2)" }}
    >
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 accent-[color:var(--scad-accent)]"
      />
      <span className="min-w-0">
        <span className="block text-[11.5px] font-semibold">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[10px] leading-relaxed text-[color:var(--scad-dim)]">{hint}</span>
        )}
      </span>
    </label>
  );
}

export default function ScadSliceOptions({ options, onChange, disabled }) {
  const set = (key, value) => onChange({ ...options, [key]: value });

  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="scad-eyebrow">Slicer options</p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-[color:var(--scad-muted)]">
          These map straight onto the slicing engine. Change anything and slice again.
        </p>
      </div>

      <Field label="Printer">
        <select
          value={options.printer}
          disabled={disabled}
          onChange={(event) => set("printer", event.target.value)}
          className="scad-select"
        >
          {PRINTER_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} · {preset.bed[0]}×{preset.bed[1]}×{preset.bed[2]} mm
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Nozzle (mm)">
          <select
            value={options.nozzle}
            disabled={disabled}
            onChange={(event) => set("nozzle", event.target.value)}
            className="scad-select"
          >
            {NOZZLES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Layer height (mm)">
          <input
            type="number"
            min="0.04"
            max="1"
            step="0.02"
            value={options.layerHeight}
            disabled={disabled}
            onChange={(event) => set("layerHeight", event.target.value)}
            className="scad-input"
          />
        </Field>
        <Field label="Walls">
          <input
            type="number"
            min="1"
            max="8"
            step="1"
            value={options.shells}
            disabled={disabled}
            onChange={(event) => set("shells", event.target.value)}
            className="scad-input"
          />
        </Field>
        <Field label="Brim (lines)">
          <input
            type="number"
            min="0"
            max="20"
            step="1"
            value={options.brim}
            disabled={disabled}
            onChange={(event) => set("brim", event.target.value)}
            className="scad-input"
          />
        </Field>
      </div>

      <Field label={`Infill · ${options.infill}%`}>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={options.infill}
          disabled={disabled}
          onChange={(event) => set("infill", Number(event.target.value))}
          className="w-full accent-[color:var(--scad-accent)]"
        />
      </Field>

      <Field label="Infill pattern">
        <select
          value={options.infillPattern}
          disabled={disabled}
          onChange={(event) => set("infillPattern", event.target.value)}
          className="scad-select"
        >
          {INFILL_PATTERNS.map((pattern) => (
            <option key={pattern.id} value={pattern.id}>
              {pattern.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Nozzle °C">
          <input
            type="number"
            min="0"
            max="350"
            step="5"
            value={options.nozzleTemp}
            disabled={disabled}
            onChange={(event) => set("nozzleTemp", event.target.value)}
            className="scad-input"
          />
        </Field>
        <Field label="Bed °C">
          <input
            type="number"
            min="0"
            max="150"
            step="5"
            value={options.bedTemp}
            disabled={disabled}
            onChange={(event) => set("bedTemp", event.target.value)}
            className="scad-input"
          />
        </Field>
        <Field label="Print speed (mm/s)">
          <input
            type="number"
            min="5"
            max="300"
            step="5"
            value={options.speed}
            disabled={disabled}
            onChange={(event) => set("speed", event.target.value)}
            className="scad-input"
          />
        </Field>
        <Field label="Support angle (°)">
          <input
            type="number"
            min="10"
            max="85"
            step="5"
            value={options.supportAngle}
            disabled={disabled}
            onChange={(event) => set("supportAngle", event.target.value)}
            className="scad-input"
          />
        </Field>
      </div>

      <div className="space-y-2">
        <Toggle
          label="Supports"
          checked={options.supports}
          onChange={(value) => set("supports", value)}
          hint="Generated over faces steeper than the support angle."
        />
        <Toggle
          label="Raft"
          checked={options.raft}
          onChange={(value) => set("raft", value)}
          hint="Adds a removable base under the part."
        />
        <Toggle
          label="Part cooling fan"
          checked={options.fan}
          onChange={(value) => set("fan", value)}
          hint="Off helps the first layer on some filaments."
        />
      </div>
    </div>
  );
}