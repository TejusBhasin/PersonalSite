import { Link } from "react-router-dom";
import { Printer } from "lucide-react";

function recommendations(profile, sizeMm) {
  const nozzle = Number(profile?.nozzle_diameter) || 0.4;
  const wall = nozzle * 3;
  const list = [
    `Walls: 3 perimeters ≈ ${wall.toFixed(1)} mm for ${nozzle} mm nozzle.`,
    `Layer height: ${Number(profile?.layer_height) || 0.2} mm, infill ${Number(profile?.infill_percent) || 15}%.`,
  ];
  if (sizeMm) {
    const [x, y, z] = sizeMm;
    if (Math.max(x, y) > 220) list.push("Footprint exceeds a 220 mm bed: rotate or split the model.");
    if (Math.min(x, y, z) < 0.8) list.push("A dimension is under 0.8 mm and will print as a single weak line.");
    if (z > 200) list.push("Tall model: consider a brim, and check it fits your Z height.");
  }
  if (profile?.filament_type === "PETG") list.push("PETG: 240 °C nozzle, 80 °C bed, first layer at 20 mm/s.");
  if (profile?.supports) list.push("Supports enabled: expect marks on downward faces.");
  return list;
}

export default function ScadPrintPanel({ profile, sizeMm, overrides, onEditProjectSettings, projectId }) {
  const rows = [
    ["Printer", profile?.printer || "not set"],
    ["Nozzle", `${Number(profile?.nozzle_diameter) || 0.4} mm`],
    ["Filament", profile?.filament_type || "PLA"],
    ["Slicer", profile?.slicer || "not set"],
    ["Supports", profile?.supports ? "on" : "off"],
  ];

  return (
    <div className="space-y-4 p-3">
      <div>
        <p className="scad-label">Print profile</p>
        <div className="scad-panel divide-y" style={{ borderColor: "var(--scad-line)" }}>
          {rows.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between px-2.5 py-1.5">
              <span className="text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--scad-dim)]">{key}</span>
              <span className="text-[11.5px] font-semibold">{value}</span>
            </div>
          ))}
        </div>
        <Link to="/scadman/settings" className="scad-btn scad-btn-sm mt-2 w-full">
          Edit defaults
        </Link>
      </div>

      <div>
        <p className="scad-label">Recommendations</p>
        <ul className="space-y-1.5">
          {recommendations(profile, sizeMm).map((line) => (
            <li key={line} className="flex gap-2 text-[11px] leading-relaxed text-[color:var(--scad-muted)]">
              <span style={{ color: "var(--scad-accent)" }}>·</span>
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] leading-relaxed text-[color:var(--scad-dim)]">
          Heuristic guidance from your profile and the model bounds. Not a slicer result.
        </p>
      </div>

      {overrides && (
        <div>
          <p className="scad-label">Project overrides</p>
          <pre className="scad-code text-[10px]">{overrides}</pre>
          {onEditProjectSettings && (
            <button type="button" onClick={onEditProjectSettings} className="scad-btn scad-btn-sm mt-2 w-full">
              Edit project overrides
            </button>
          )}
        </div>
      )}

      <div
        className="rounded-md border p-2.5"
        style={{ borderColor: "var(--scad-line-2)", background: "var(--scad-panel-2)" }}
      >
        <div className="flex items-center gap-1.5">
          <Printer className="h-3.5 w-3.5" style={{ color: "var(--scad-accent)" }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Slice in the browser</span>
        </div>
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-[color:var(--scad-muted)]">
          Layer height, walls, infill, supports and temperatures, sliced to G-code on your own machine.
        </p>
        {projectId ? (
          <Link to={`/scadman/slice/${projectId}`} className="scad-btn scad-btn-primary scad-btn-sm mt-2 w-full">
            <Printer className="h-3.5 w-3.5" />
            Slice to G-code
          </Link>
        ) : (
          <p className="mt-2 text-[10px] text-[color:var(--scad-dim)]">Save the project, then slice it.</p>
        )}
      </div>
    </div>
  );
}