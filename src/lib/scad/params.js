// Parameter auto-detection.
//
// Reads the OpenSCAD Customizer conventions straight out of the source, so controls appear
// for every top-level variable without asking the AI to describe them:
//
//   /* [Size] */            <- optional section heading
//   width = 40;             // [10:200] width in mm
//   mode  = 0;              // 0 = round, 1 = square
//   label = "left";         // [left, right]
//   hollow = true;
//
// Variables declared inside modules, functions or blocks are ignored, as are the special
// $ variables. Only names that really exist at the top level ever become controls.

const SECTION_RE = /^\s*\/\*\s*\[([^\]]*)\]\s*\*\/\s*$/;
const ASSIGN_RE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*;\s*(?:\/\/(.*))?$/;
const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;
const RANGE_RE = /^(-?\d+(?:\.\d+)?)\s*:\s*(?:(-?\d+(?:\.\d+)?)\s*:\s*)?(-?\d+(?:\.\d+)?)$/;

function prettify(name) {
  const words = name.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function cleanLabel(comment) {
  return (comment || "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/^[\s:=,-]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function describe(name, rawValue, comment, section) {
  const hintMatch = comment.match(/\[([^\]]+)\]/);
  const hint = hintMatch ? hintMatch[1].trim() : "";
  const label = cleanLabel(comment) || prettify(name);
  const base = {
    name,
    label,
    section: section || "",
    unit: /\bmm\b/i.test(comment) ? "mm" : "",
    options: [],
  };

  if (/^(true|false)$/i.test(rawValue)) {
    return { ...base, type: "boolean", default_value: rawValue.toLowerCase() };
  }

  if (/^".*"$/.test(rawValue)) {
    const text = rawValue.slice(1, -1);
    const options = hint && !hint.includes(":") ? hint.split(",").map((s) => s.trim()).filter(Boolean) : [];
    return { ...base, type: options.length ? "select" : "text", default_value: text, options };
  }

  if (NUMBER_RE.test(rawValue)) {
    const value = Number(rawValue);
    const range = hint.match(RANGE_RE);
    return {
      ...base,
      type: Number.isInteger(value) ? "integer" : "number",
      default_value: String(value),
      min_value: range ? Number(range[1]) : Math.max(0, round(value * 0.25)),
      max_value: range ? Number(range[3]) : round(Math.max(value * 3, value + 10)),
    };
  }

  return null;
}

export function detectParameters(source, limit = 30) {
  const lines = String(source || "").split(/\r?\n/);
  const found = [];
  const seen = new Set();
  let section = "";
  let hidden = false;
  let depth = 0;

  for (const line of lines) {
    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      const name = sectionMatch[1].trim();
      hidden = /^hidden$/i.test(name);
      section = hidden ? "" : name;
      continue;
    }

    const depthBefore = depth;
    depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    if (hidden || depthBefore !== 0 || depth !== 0) continue;

    const match = line.match(ASSIGN_RE);
    if (!match) continue;
    const [, name, rawValue, comment] = match;
    if (name.startsWith("$") || seen.has(name)) continue;

    const param = describe(name, rawValue.trim(), (comment || "").trim(), section);
    if (!param) continue;
    seen.add(name);
    found.push({ ...param, sort_order: found.length });
    if (found.length >= limit) break;
  }

  return found;
}

// Detected values always win for name/type/default (the source is the truth). Labels, units
// and ranges come from the first hint list that has them, so hand-written or AI-written
// descriptions survive a rescan.
export function mergeParameters(detected, ...hintSources) {
  const hints = new Map();
  for (const source of hintSources) {
    for (const hint of source || []) {
      if (hint && hint.name && !hints.has(hint.name)) hints.set(hint.name, hint);
    }
  }

  return (detected || []).map((param, index) => {
    const hint = hints.get(param.name);
    if (!hint) return { ...param, sort_order: index };
    return {
      ...param,
      id: hint.id,
      label: hint.label && hint.label !== hint.name ? hint.label : param.label,
      unit: hint.unit || param.unit,
      min_value: param.min_value ?? hint.min_value,
      max_value: param.max_value ?? hint.max_value,
      options: param.options && param.options.length ? param.options : hint.options || [],
      is_exposed: hint.is_exposed !== false,
      public: hint.public === true,
      sort_order: index,
    };
  });
}

export function parametersSignature(params) {
  return (params || []).map((p) => `${p.name}:${p.default_value}`).join("|");
}