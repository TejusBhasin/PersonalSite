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
    service: "Geometry engine",
    detail: "JSCAD CSG kernel in the browser — real boolean maths on an OpenSCAD language subset",
    status: "connected",
    label: "csg",
  },
  {
    service: "STL export",
    detail: "Binary and ASCII, written from the compiled solids",
    status: "connected",
    label: "working",
  },
  {
    service: "3MF export",
    detail: "Real 3MF package (OPC zip with 3dmodel.model)",
    status: "connected",
    label: "working",
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