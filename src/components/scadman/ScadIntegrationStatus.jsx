const STATUS_STYLE = {
  connected: "scad-chip-ok",
  partial: "scad-chip-warn",
  pending: "scad-chip-err",
};

const ROWS = [
  {
    service: "AI generation",
    detail: "Base44 server-side model, OpenSCAD system prompt + curated reference",
    status: "connected",
    label: "connected",
  },
  {
    service: "OpenSCAD engine",
    detail: "Built-in subset interpreter — approximate geometry, booleans shown as outlines",
    status: "partial",
    label: "subset",
  },
  {
    service: "STL export",
    detail: "Requires an OpenSCAD CLI render service",
    status: "pending",
    label: "not connected",
  },
  {
    service: "3MF export",
    detail: "Requires a real 3MF conversion pipeline",
    status: "pending",
    label: "not connected",
  },
  {
    service: "Slicer / G-code",
    detail: "Print profiles and recommendations are live; slicing needs a slicer service",
    status: "pending",
    label: "not connected",
  },
  {
    service: "Knowledge retrieval",
    detail: "Curated OpenSCAD reference bundled with the app",
    status: "connected",
    label: "curated",
  },
];

export default function ScadIntegrationStatus() {
  return (
    <table className="scad-table">
      <thead>
        <tr>
          <th>Service</th>
          <th className="hidden sm:table-cell">Implementation</th>
          <th className="text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => (
          <tr key={row.service}>
            <td className="font-semibold text-[color:var(--scad-text)]">{row.service}</td>
            <td className="hidden sm:table-cell">{row.detail}</td>
            <td className="text-right">
              <span className={`scad-chip ${STATUS_STYLE[row.status]}`}>{row.label}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}