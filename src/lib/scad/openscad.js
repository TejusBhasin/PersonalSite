// Real OpenSCAD compiler in the browser — the same openscad-wasm build the official
// openscad-playground uses (https://github.com/openscad/openscad-playground, GPL2+).
//
// The compiler is a single self-contained module (~14 MB, cached by the browser). It is
// imported lazily the first time a model is compiled and run inside a worker so typing in
// the editor never blocks. The public shape matches the old engine exactly:
//   compileOpenScad(source) -> { ok, mesh, geoms, diagnostics, stats, engine, engineLabel }

import { geometries } from "@jscad/modeling";

export const ENGINE_ID = "openscad-wasm";
export const ENGINE_LABEL = "OpenSCAD 2021 (WASM)";

const COMPILER_URL = "https://cdn.jsdelivr.net/npm/openscad-wasm@0.0.4/openscad.js";

const WORKER_SOURCE = `
let factoryPromise = null;

function loadFactory() {
  if (!factoryPromise) {
    factoryPromise = import("${COMPILER_URL}").then((mod) => mod.createOpenSCAD || mod.default);
  }
  return factoryPromise;
}

async function compile(source) {
  const createOpenSCAD = await loadFactory();
  const logs = [];
  const module_ = await createOpenSCAD({
    print: (line) => logs.push(String(line)),
    printErr: (line) => logs.push(String(line)),
  });
  const api = module_.getInstance ? module_.getInstance() : module_;
  api.FS.writeFile("model.scad", source);
  let exitCode = 0;
  try {
    exitCode = api.callMain(["model.scad", "--export-format", "binstl", "-o", "out.stl"]);
  } catch (error) {
    exitCode = -1;
    logs.push("ERROR: " + (typeof error === "number" ? "the compiler stopped (" + error + ")" : String(error)));
  }
  let bytes = null;
  try {
    bytes = api.FS.readFile("out.stl");
  } catch (error) {
    bytes = null;
  }
  return { exitCode, logs, bytes };
}

self.onmessage = async (event) => {
  const { id, source } = event.data || {};
  try {
    const result = await compile(String(source || ""));
    self.postMessage({ id, exitCode: result.exitCode, logs: result.logs, bytes: result.bytes });
  } catch (error) {
    self.postMessage({ id, fatal: String((error && error.message) || error) });
  }
};
`;

let worker = null;
let workerUnavailable = false;
let sequence = 0;
const waiting = new Map();

function startWorker() {
  const blob = new Blob([WORKER_SOURCE], { type: "text/javascript" });
  const instance = new Worker(URL.createObjectURL(blob), { type: "module" });
  instance.onmessage = (event) => {
    const data = event.data || {};
    const entry = waiting.get(data.id);
    if (!entry) return;
    waiting.delete(data.id);
    entry.resolve(data);
  };
  instance.onerror = (event) => {
    const error = new Error(event?.message || "The OpenSCAD compiler could not start.");
    waiting.forEach((entry) => entry.reject(error));
    waiting.clear();
    workerUnavailable = true;
    worker?.terminate();
    worker = null;
  };
  return instance;
}

function compileInWorker(source) {
  return new Promise((resolve, reject) => {
    if (!worker) worker = startWorker();
    const id = ++sequence;
    waiting.set(id, { resolve, reject });
    worker.postMessage({ id, source });
  });
}

// Fallback for browsers that block workers created from a blob.
let mainThreadFactory = null;

async function compileOnMainThread(source) {
  if (!mainThreadFactory) {
    mainThreadFactory = import(/* @vite-ignore */ COMPILER_URL).then(
      (mod) => mod.createOpenSCAD || mod.default
    );
  }
  const createOpenSCAD = await mainThreadFactory;
  const logs = [];
  const module_ = await createOpenSCAD({
    print: (line) => logs.push(String(line)),
    printErr: (line) => logs.push(String(line)),
  });
  const api = module_.getInstance ? module_.getInstance() : module_;
  api.FS.writeFile("model.scad", source);
  let exitCode = 0;
  try {
    exitCode = api.callMain(["model.scad", "--export-format", "binstl", "-o", "out.stl"]);
  } catch (error) {
    exitCode = -1;
    logs.push("ERROR: " + (typeof error === "number" ? "the compiler stopped (" + error + ")" : String(error)));
  }
  let bytes = null;
  try {
    bytes = api.FS.readFile("out.stl");
  } catch (error) {
    bytes = null;
  }
  return { exitCode, logs, bytes };
}

async function runCompiler(source) {
  if (!workerUnavailable) {
    try {
      const data = await compileInWorker(source);
      if (data.fatal) throw new Error(data.fatal);
      return data;
    } catch (error) {
      workerUnavailable = true;
      worker?.terminate();
      worker = null;
    }
  }
  return compileOnMainThread(source);
}

function parseLogs(logs, exitCode) {
  const out = [];
  const seen = new Set();
  for (const entry of logs || []) {
    const text = String(entry).trim();
    const severity = /^ERROR/i.test(text) ? "error" : /^WARNING/i.test(text) ? "warning" : null;
    if (!severity) continue;
    const message = text
      .replace(/^(ERROR|WARNING):\s*/i, "")
      .replace(/\s*in file \/[^,]*,\s*/i, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!message || seen.has(message)) continue;
    seen.add(message);
    const line = text.match(/line (\d+)/i);
    out.push({ severity, line: line ? Number(line[1]) : null, message });
  }
  if (exitCode !== 0 && !out.some((d) => d.severity === "error")) {
    out.unshift({ severity: "error", line: null, message: "OpenSCAD could not render this source." });
  }
  return out;
}

function meshFromStl(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  const positions = new Float32Array(count * 9);
  const indices = new Uint32Array(count * 3);
  let offset = 84;
  for (let triangle = 0; triangle < count; triangle++) {
    offset += 12;
    for (let corner = 0; corner < 3; corner++) {
      const base = triangle * 9 + corner * 3;
      positions[base] = view.getFloat32(offset, true);
      positions[base + 1] = view.getFloat32(offset + 4, true);
      positions[base + 2] = view.getFloat32(offset + 8, true);
      indices[triangle * 3 + corner] = triangle * 3 + corner;
      offset += 12;
    }
    offset += 2;
  }
  return { positions, indices };
}

function solidFromMesh(mesh) {
  const triangles = [];
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const corners = [];
    for (let corner = 0; corner < 3; corner++) {
      const base = mesh.indices[i + corner] * 3;
      corners.push([
        mesh.positions[base],
        mesh.positions[base + 1],
        mesh.positions[base + 2],
      ]);
    }
    triangles.push(geometries.poly3.create(corners));
  }
  return geometries.geom3.create(triangles);
}

function boundsOf(positions) {
  if (!positions || positions.length === 0) return null;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i], y = positions[i + 1], z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  return [maxX - minX, maxY - minY, maxZ - minZ].map((n) => Math.round(n * 100) / 100);
}

export async function compileOpenScad(source) {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const text = String(source || "");
  const raw = await runCompiler(text);
  const diagnostics = parseLogs(raw.logs, raw.exitCode);
  const bytes = raw.bytes;
  const triangles = bytes && bytes.length >= 84
    ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true)
    : 0;

  const durationMs = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started);

  if (!triangles || raw.exitCode !== 0) {
    return {
      engine: ENGINE_ID,
      engineLabel: ENGINE_LABEL,
      ok: false,
      mesh: null,
      geoms: [],
      diagnostics,
      stats: { triangles: 0, solids: 0, sizeMm: null },
      durationMs,
    };
  }

  const mesh = meshFromStl(bytes);
  return {
    engine: ENGINE_ID,
    engineLabel: ENGINE_LABEL,
    ok: true,
    mesh,
    geoms: [solidFromMesh(mesh)],
    diagnostics,
    stats: { triangles, solids: 1, sizeMm: boundsOf(mesh.positions) },
    durationMs,
  };
}