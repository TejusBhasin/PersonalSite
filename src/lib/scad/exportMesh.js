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

function trim(value) {
  return Math.abs(value) < 1e-9 ? "0" : String(Math.round(value * 1e6) / 1e6);
}

// Binary STL written straight from the mesh: 84-byte header, then 50 bytes per facet.
function binaryStl(mesh) {
  const p = mesh.positions;
  const n = mesh.normals;
  const triangles = Math.floor(p.length / 9);
  const buffer = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangles, true);
  let offset = 84;
  for (let i = 0; i < p.length; i += 9) {
    view.setFloat32(offset, n[i] || 0, true);
    view.setFloat32(offset + 4, n[i + 1] || 0, true);
    view.setFloat32(offset + 8, n[i + 2] || 0, true);
    offset += 12;
    for (let corner = 0; corner < 9; corner += 3) {
      view.setFloat32(offset, p[i + corner], true);
      view.setFloat32(offset + 4, p[i + corner + 1], true);
      view.setFloat32(offset + 8, p[i + corner + 2], true);
      offset += 12;
    }
    offset += 2;
  }
  return new Uint8Array(buffer);
}

// ASCII STL written in chunks so a million-triangle model never builds one huge string.
function asciiStlChunks(mesh) {
  const p = mesh.positions;
  const n = mesh.normals;
  const chunks = ["solid model\n"];
  let lines = [];
  for (let i = 0; i < p.length; i += 9) {
    lines.push(
      `facet normal ${trim(n[i])} ${trim(n[i + 1])} ${trim(n[i + 2])}\n  outer loop\n`,
      `    vertex ${trim(p[i])} ${trim(p[i + 1])} ${trim(p[i + 2])}\n`,
      `    vertex ${trim(p[i + 3])} ${trim(p[i + 4])} ${trim(p[i + 5])}\n`,
      `    vertex ${trim(p[i + 6])} ${trim(p[i + 7])} ${trim(p[i + 8])}\n`,
      "  endloop\nendfacet\n"
    );
    if (lines.length >= 4000) {
      chunks.push(lines.join(""));
      lines = [];
    }
  }
  chunks.push(lines.join(""), "endsolid model\n");
  return chunks;
}

/**
 * Build a real file from a compile result (or a list of jscad solids).
 * STL is written straight from the mesh, so arbitrarily large models export without
 * needing the jscad solids at all.
 */
export function buildExport(input, format, projectTitle) {
  const result = Array.isArray(input) ? { geoms: input } : input || {};
  const geoms = (result.geoms || []).filter(Boolean);
  const mesh = result.mesh;
  const chosen = EXPORT_FORMATS.find((f) => f.id === format) || EXPORT_FORMATS[0];

  let blob;
  if (chosen.id === "stl-binary" && mesh?.positions?.length) {
    blob = new Blob([binaryStl(mesh)], { type: chosen.mime });
  } else if (chosen.id === "stl-ascii" && mesh?.positions?.length) {
    blob = new Blob(asciiStlChunks(mesh), { type: chosen.mime });
  } else {
    if (geoms.length === 0) {
      throw new Error(
        mesh?.positions?.length
          ? "3MF needs the solid model, which is too large for this one. Export STL instead."
          : "Nothing has been compiled yet."
      );
    }
    const parts = chosen.id === "stl-binary"
      ? stl.serialize({ binary: true }, ...geoms)
      : chosen.id === "stl-ascii"
        ? stl.serialize({ binary: false }, ...geoms)
        : mf.serialize({}, ...geoms);
    blob = new Blob(normaliseParts(parts), { type: chosen.mime });
  }

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