import * as stlModule from "@jscad/stl-serializer";
import * as mfModule from "@jscad/3mf-serializer";

const stl = stlModule.serialize ? stlModule : stlModule.default;
const mf = mfModule.serialize ? mfModule : mfModule.default;

export const EXPORT_FORMATS = [
  { id: "stl-binary", label: "STL (binary)", ext: "stl", mime: "model/stl" },
  { id: "stl-ascii", label: "STL (ASCII)", ext: "stl", mime: "model/stl" },
  { id: "3mf", label: "3MF", ext: "3mf", mime: "model/3mf" },
];

function normaliseParts(parts) {
  return (Array.isArray(parts) ? parts : [parts]).map((part) => {
    if (part instanceof Blob) return part;
    if (part instanceof ArrayBuffer) return new Uint8Array(part);
    if (ArrayBuffer.isView(part)) return part;
    return String(part);
  });
}

function safeName(text) {
  const base = String(text || "model")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "model";
}

// Produces a real file from the compiled CSG solids: STL from the STL serializer, and a proper
// 3MF package (OPC zip with 3D/3dmodel.model) from the 3MF serializer. No renaming tricks.
export function buildExport(geoms, format, projectTitle) {
  const list = (Array.isArray(geoms) ? geoms : [geoms]).filter(Boolean);
  if (list.length === 0) throw new Error("Nothing has been compiled yet.");

  const chosen = EXPORT_FORMATS.find((f) => f.id === format) || EXPORT_FORMATS[0];
  let parts;
  if (chosen.id === "stl-binary") parts = stl.serialize({ binary: true }, ...list);
  else if (chosen.id === "stl-ascii") parts = stl.serialize({ binary: false }, ...list);
  else parts = mf.serialize({}, ...list);

  const blob = new Blob(normaliseParts(parts), { type: chosen.mime });
  if (!blob.size) throw new Error("The serializer returned an empty file.");
  return { blob, filename: `${safeName(projectTitle)}.${chosen.ext}`, format: chosen };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}