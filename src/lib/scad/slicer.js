// Slicing runs entirely in the browser with Kiri:Moto's engine (MIT licensed,
// https://grid.space), so G-code is produced locally: no server, no API key and
// nothing about the model leaves the machine.
//
// The engine is a live ES module served with permissive CORS. Loading it lazily
// keeps 4 MB out of the app bundle and off every page that never slices.
const ENGINE_URL = "https://grid.space/lib/kiri/run/engine.js";

let enginePromise = null;

export function loadSlicerEngine() {
  if (!enginePromise) {
    enginePromise = import(/* @vite-ignore */ ENGINE_URL)
      .then((mod) => {
        const Engine = mod?.Engine || mod?.newEngine || mod?.default;
        if (typeof Engine !== "function") {
          throw new Error("The slicing engine loaded but did not expose a usable API.");
        }
        return Engine;
      })
      .catch((error) => {
        enginePromise = null;
        throw new Error(
          `The slicing engine could not be loaded (${error?.message || error}). Check the connection and try again.`
        );
      });
  }
  return enginePromise;
}

export const PRINTER_PRESETS = [
  { id: "ender3", label: "Creality Ender 3", bed: [220, 220, 250] },
  { id: "prusa-mk3", label: "Prusa MK3S+", bed: [250, 210, 210] },
  { id: "bambu-a1", label: "Bambu Lab A1", bed: [256, 256, 256] },
  { id: "large", label: "Large format 300 mm", bed: [300, 300, 300] },
];

export const INFILL_PATTERNS = [
  { id: "gyroid", label: "Gyroid" },
  { id: "grid", label: "Grid" },
  { id: "hex", label: "Hex" },
  { id: "linear", label: "Linear" },
  { id: "triangle", label: "Triangle" },
  { id: "vase", label: "Vase (one wall)" },
];

export const DEFAULT_SLICE_OPTIONS = {
  printer: "ender3",
  nozzle: "0.4",
  layerHeight: "0.2",
  shells: "3",
  infill: 15,
  infillPattern: "gyroid",
  supports: false,
  supportAngle: "50",
  brim: "2",
  raft: false,
  nozzleTemp: "210",
  bedTemp: "60",
  speed: "50",
  fan: true,
};

const num = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// Only the option keys this app exposes are carried over from a saved project.
export function mergeSliceOptions(saved) {
  if (!saved || typeof saved !== "object") return DEFAULT_SLICE_OPTIONS;
  const merged = { ...DEFAULT_SLICE_OPTIONS };
  for (const key of Object.keys(DEFAULT_SLICE_OPTIONS)) {
    if (saved[key] !== undefined && saved[key] !== null) merged[key] = saved[key];
  }
  return merged;
}

export function buildProcess(options) {
  const o = { ...DEFAULT_SLICE_OPTIONS, ...options };
  const walls = clamp(Math.round(num(o.shells, 3)), 1, 8);
  return {
    sliceHeight: clamp(num(o.layerHeight, 0.2), 0.04, 1),
    firstSliceHeight: clamp(num(o.layerHeight, 0.2), 0.04, 1),
    sliceShells: walls,
    sliceTopLayers: walls,
    sliceBottomLayers: walls,
    sliceFillType: o.infillPattern,
    sliceFillSparse: clamp(num(o.infill, 15) / 100, 0, 1),
    sliceFillAngle: 45,
    sliceSupportEnable: Boolean(o.supports),
    sliceSupportAngle: clamp(num(o.supportAngle, 50), 10, 85),
    sliceSupportDensity: 0.25,
    outputTemp: Math.round(clamp(num(o.nozzleTemp, 210), 0, 350)),
    outputBedTemp: Math.round(clamp(num(o.bedTemp, 60), 0, 150)),
    outputFeedrate: clamp(num(o.speed, 50), 5, 300),
    outputFinishrate: clamp(num(o.speed, 50), 5, 300),
    firstLayerRate: 20,
    outputBrimCount: Math.round(clamp(num(o.brim, 2), 0, 20)),
    outputRaft: Boolean(o.raft),
    outputFanSpeed: o.fan ? 255 : 0,
  };
}

export function buildDevice(options) {
  const o = { ...DEFAULT_SLICE_OPTIONS, ...options };
  const preset = PRINTER_PRESETS.find((p) => p.id === o.printer) || PRINTER_PRESETS[0];
  const [bedWidth, bedDepth, maxHeight] = preset.bed;
  return {
    mode: "FDM",
    deviceName: preset.label,
    bedWidth,
    bedDepth,
    bedHeight: 2.5,
    maxHeight,
    bedRound: false,
    originCenter: false,
    extrudeAbs: true,
    gcodeSpace: true,
    extruders: [
      {
        extFilament: 1.75,
        extNozzle: clamp(num(o.nozzle, 0.4), 0.1, 1.2),
        extSelect: ["T0"],
        extDeselect: [],
        extOffsetX: 0,
        extOffsetY: 0,
      },
    ],
  };
}

// Mirrors the sequence in Kiri:Moto's own documented engine example:
// parse -> setProcess -> setDevice -> slice -> prepare -> export.
export async function sliceStl({ stl, options, onStage }) {
  onStage?.("engine");
  const Engine = await loadSlicerEngine();
  const engine = new Engine();

  onStage?.("parse");
  await engine.parse(stl);
  engine.setProcess(buildProcess(options));
  engine.setDevice(buildDevice(options));

  onStage?.("slice");
  await engine.slice();
  onStage?.("prepare");
  await engine.prepare();
  onStage?.("export");
  const gcode = await engine.export();

  if (typeof gcode !== "string" || gcode.trim().length === 0) {
    throw new Error("The slicer returned no G-code for this model.");
  }
  return gcode;
}

export function gcodeSummary(gcode) {
  const text = String(gcode || "");
  return {
    bytes: text.length,
    lines: text ? text.split("\n").length : 0,
  };
}