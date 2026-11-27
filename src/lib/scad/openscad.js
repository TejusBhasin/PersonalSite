// Real OpenSCAD compiler in the browser — the same openscad-wasm build the official
// openscad-playground uses (https://github.com/openscad/openscad-playground, GPL2+).
//
// The compiler is a single self-contained module (~14 MB, cached by the browser). It is
// imported lazily the first time a model is compiled and run inside a worker so typing in
// the editor never blocks. Large, intricate models are rendered with the manifold backend
// (the playground's default), and any run that stops without producing geometry is retried
// on a fresh compiler instance instead of failing.
//
//   compileOpenScad(source, { onStatus }) -> { ok, mesh, geoms, diagnostics, stats }

import { geometries } from "@jscad/modeling";

export const ENGINE_ID = "openscad-wasm";
export const ENGINE_LABEL = "OpenSCAD (WASM)";

const COMPILER_URL = "https://cdn.jsdelivr.net/npm/openscad-wasm@0.0.4/openscad.js";

// How many times a run that died without geometry is retried before giving up. Heavy models
// die more often (memory pressure, a slow kernel), so they get one more try than they used to.
const MAX_ATTEMPTS = 4;
// Above this triangle count the jscad solids are skipped: they double the memory for
// nothing, since STL exports are written straight from the compiled bytes.
const GEOM_LIMIT = 200000;

const WORKER_SOURCE = `
let factoryPromise = null;
let apiPromise = null;
let logSink = [];

function loadFactory() {
  if (!factoryPromise) {
    factoryPromise = import("${COMPILER_URL}").then((mod) => mod.createOpenSCAD || mod.default);
  }
  return factoryPromise;
}

// One compiler instance is reused across compiles; a crashed instance is thrown away.
function getApi() {
  if (!apiPromise) {
    apiPromise = loadFactory()
      .then((createOpenSCAD) =>
        createOpenSCAD({
          print: (line) => logSink.push(String(line)),
          printErr: (line) => logSink.push(String(line)),
        })
      )
      .then((module_) => (module_.getInstance ? module_.getInstance() : module_))
      .catch((error) => {
        apiPromise = null;
        throw error;
      });
  }
  return apiPromise;
}

async function compile(source, args) {
  logSink = [];
  const api = await getApi();
  try {
    api.FS.unlink("out.stl");
  } catch (error) {
    // nothing to clear
  }
  api.FS.writeFile("model.scad", source);
  // A throw here (abort / out of memory) is rethrown so the host retries on a fresh instance.
  const exitCode = api.callMain(["model.scad", "-o", "out.stl", ...args]);
  let bytes = null;
  try {
    const raw = api.FS.readFile("out.stl");
    // Copy out of the wasm heap so the buffer can be transferred instead of copied again.
    bytes = new Uint8Array(raw.length);
    bytes.set(raw);
  } catch (error) {
    bytes = null;
  }
  return { exitCode, logs: logSink.slice(), bytes };
}

self.onmessage = async (event) => {
  const { id, source, args } = event.data || {};
  try {
    const result = await compile(String(source || ""), Array.isArray(args) ? args : []);
    const payload = { id, exitCode: result.exitCode, logs: result.logs, bytes: result.bytes };
    self.postMessage(payload, result.bytes ? [result.bytes.buffer] : []);
  } catch (error) {
    apiPromise = null;
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
    resetWorker();
  };
  return instance;
}

function resetWorker() {
  if (worker) worker.terminate();
  worker = null;
  waiting.forEach((entry) => entry.reject(new Error("The compiler restarted.")));
  waiting.clear();
}

function compileInWorker(source, args) {
  return new Promise((resolve, reject) => {
    if (!worker) worker = startWorker();
    const id = ++sequence;
    waiting.set(id, { resolve, reject });
    worker.postMessage({ id, source, args });
  });
}

// Fallback for browsers that block workers created from a blob.
let mainThreadFactory = null;

async function compileOnMainThread(source, args) {
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
  try {
    api.FS.unlink("out.stl");
  } catch (error) {
    // nothing to clear
  }
  api.FS.writeFile("model.scad", source);
  const exitCode = api.callMain(["model.scad", "-o", "out.stl", ...args]);
  let bytes = null;
  try {
    const raw = api.FS.readFile("out.stl");
    bytes = new Uint8Array(raw.length);
    bytes.set(raw);
  } catch (error) {
    bytes = null;
  }
  return { exitCode, logs, bytes };
}

async function runCompiler(source, args) {
  if (!workerUnavailable) {
    try {
      if (!worker) worker = startWorker();
    } catch (error) {
      workerUnavailable = true;
      return compileOnMainThread(source, args);
    }
    try {
      const data = await compileInWorker(source, args);
      if (data.fatal) throw new Error(data.fatal);
      return data;
    } catch (error) {
      resetWorker();
      throw error;
    }
  }
  return compileOnMainThread(source, args);
}

// The manifold backend handles intricate CSG far beyond CGAL's reach. Builds that predate it
// reject the flag, so it is dropped the first time the compiler says it does not know it.
let manifoldEnabled = true;

function compilerArgs() {
  const args = ["--export-format", "binstl"];
  // Manifold is the backend that copes with genuinely intricate CSG; without it the run
  // falls back to the CGAL kernel, which is slower but always present.
  if (manifoldEnabled) args.push("--backend=manifold");
  return args;
}

function backendRejected(logs) {
  return /unknown backend|invalid backend|backend.*(not|un)supported|unrecognized (option|argument)/i.test(
    (logs || []).join("\n")
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
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

function looksOutOfMemory(logs) {
  return /out of memory|OOM|Aborted\(|memory access out of bounds|Cannot enlarge memory|allocation failed/i.test(
    (logs || []).join("\n")
  );
}

function firstError(logs) {
  const line = (logs || []).find((entry) => /^ERROR/i.test(String(entry).trim()));
  return line ? String(line).trim() : "";
}

function meshFromStl(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  const positions = new Float32Array(count * 9);
  const normals = new Float32Array(count * 9);
  let offset = 84;
  let hasNormals = false;
  for (let triangle = 0; triangle < count; triangle++) {
    const nx = view.getFloat32(offset, true);
    const ny = view.getFloat32(offset + 4, true);
    const nz = view.getFloat32(offset + 8, true);
    if (nx || ny || nz) hasNormals = true;
    offset += 12;
    for (let corner = 0; corner < 3; corner++) {
      const base = triangle * 9 + corner * 3;
      positions[base] = view.getFloat32(offset, true);
      positions[base + 1] = view.getFloat32(offset + 4, true);
      positions[base + 2] = view.getFloat32(offset + 8, true);
      normals[base] = nx;
      normals[base + 1] = ny;
      normals[base + 2] = nz;
      offset += 12;
    }
    offset += 2;
  }
  return { positions, normals, hasNormals, triangles: count };
}

function solidFromMesh(mesh) {
  const triangles = [];
  const p = mesh.positions;
  for (let i = 0; i < p.length; i += 9) {
    triangles.push(
      geometries.poly3.create([
        [p[i], p[i + 1], p[i + 2]],
        [p[i + 3], p[i + 4], p[i + 5]],
        [p[i + 6], p[i + 7], p[i + 8]],
      ])
    );
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

/**
 * Compile OpenSCAD source to geometry.
 * Runs that stop without geometry (crash, out of memory, engine hiccup) are retried on a
 * fresh compiler up to MAX_ATTEMPTS times, so a heavy model keeps trying instead of failing.
 */
export async function compileOpenScad(source, options = {}) {
  const onStatus = typeof options.onStatus === "function" ? options.onStatus : null;
  const text = String(source || "");
  const started = now();

  let raw = null;
  let lastError = null;
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt += 1;
    if (onStatus) onStatus({ attempt, maxAttempts: MAX_ATTEMPTS });
    try {
      raw = await runCompiler(text, compilerArgs());
      if (manifoldEnabled && backendRejected(raw.logs)) {
        manifoldEnabled = false;
        raw = await runCompiler(text, compilerArgs());
      }
      lastError = null;
      const produced = raw.bytes && raw.bytes.length > 84;
      if (raw.exitCode === 0 && produced) break;
      // A syntax or modelling error in the source will not change on a retry.
      if (firstError(raw.logs)) break;
      // It ran to the end and simply had nothing to output (an empty model).
      if (raw.exitCode === 0) break;
      throw new Error("The compiler stopped before producing geometry.");
    } catch (error) {
      lastError = error;
      resetWorker();
      if (attempt < MAX_ATTEMPTS) await delay(350 * attempt);
    }
  }

  if (!raw) throw lastError || new Error("The OpenSCAD compiler could not run.");

  const diagnostics = parseLogs(raw.logs, raw.exitCode);
  const bytes = raw.bytes;
  const triangleCount = bytes && bytes.length >= 84
    ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(80, true)
    : 0;
  const durationMs = Math.round(now() - started);

  if (!triangleCount && looksOutOfMemory(raw.logs)) {
    diagnostics.unshift({
      severity: "error",
      line: null,
      message:
        "The model is too heavy for the browser compiler and ran out of memory. Lower $fn or the number of repeated features, then compile again.",
    });
  }

  if (!triangleCount || raw.exitCode !== 0) {
    return {
      engine: ENGINE_ID,
      engineLabel: ENGINE_LABEL,
      ok: false,
      mesh: null,
      geoms: [],
      diagnostics,
      stats: { triangles: 0, solids: 0, sizeMm: null },
      durationMs,
      attempts: attempt,
    };
  }

  // The STL bytes are only a transport: the mesh is what the viewport and the exports use,
  // so the bytes are dropped here instead of being held for the life of the result.
  const mesh = meshFromStl(bytes);
  return {
    engine: ENGINE_ID,
    engineLabel: ENGINE_LABEL,
    ok: true,
    mesh,
    geoms: triangleCount <= GEOM_LIMIT ? [solidFromMesh(mesh)] : [],
    diagnostics,
    stats: { triangles: triangleCount, solids: 1, sizeMm: boundsOf(mesh.positions) },
    durationMs,
    attempts: attempt,
  };
}