export const CATEGORIES = [
  { id: "desk-accessories", label: "Desk accessories" },
  { id: "organization", label: "Organization" },
  { id: "electronics", label: "Electronics" },
  { id: "mechanical", label: "Mechanical parts" },
  { id: "household", label: "Household" },
  { id: "tools", label: "Tools & workshop" },
  { id: "toys", label: "Toys & games" },
  { id: "art", label: "Art & decorative" },
  { id: "storage", label: "Storage" },
  { id: "education", label: "Educational" },
  { id: "other", label: "Other" },
];

export const LICENSES = [
  { id: "CC0-1.0", label: "CC0 1.0 — public domain" },
  { id: "CC-BY-4.0", label: "CC BY 4.0 — attribution" },
  { id: "CC-BY-SA-4.0", label: "CC BY-SA 4.0 — share alike" },
  { id: "CC-BY-NC-4.0", label: "CC BY-NC 4.0 — non commercial" },
  { id: "CC-BY-NC-SA-4.0", label: "CC BY-NC-SA 4.0" },
  { id: "All-Rights-Reserved", label: "All rights reserved — no remixing" },
];

export const LICENSE_SHORT = {
  "CC0-1.0": "CC0",
  "CC-BY-4.0": "CC BY",
  "CC-BY-SA-4.0": "CC BY-SA",
  "CC-BY-NC-4.0": "CC BY-NC",
  "CC-BY-NC-SA-4.0": "CC BY-NC-SA",
  "All-Rights-Reserved": "All rights reserved",
};

export const VISIBILITY_LABEL = {
  private: "Private",
  unlisted: "Unlisted",
  public: "Public",
};

export const VISIBILITY_HINT = {
  private: "Only you can open this project.",
  unlisted: "Anyone with the direct link can view it. It never appears in search or the library.",
  public: "Listed in the community library and searchable by anyone.",
};

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || "Other";
}

export function canRemix(license) {
  return license !== "All-Rights-Reserved";
}

export function slugify(title) {
  const base = String(title || "model")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "model"}-${Math.random().toString(36).slice(2, 8)}`;
}

export function timeAgo(value) {
  if (!value) return "never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "never";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeRe(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Update one variable's value in the source. Anchored to a whole-line assignment of that exact
// identifier, so a comment or a substring can never be rewritten by accident.
export function applyParamToSource(code, name, value) {
  const re = new RegExp(`^(\\s*)(${escapeRe(name)})(\\s*=\\s*)([^;\\n]*?)(\\s*;\\s*(?:\\/\\/[^\\n]*)?)$`, "m");
  if (!re.test(code)) return code;
  return code.replace(re, (match, ws, id, eq, oldValue, tail) => {
    let next = String(value);
    const trimmedOld = String(oldValue).trim();
    if (/^".*"$/.test(trimmedOld) && !/^".*"$/.test(next)) next = `"${next}"`;
    return `${ws}${id}${eq}${next}${tail}`;
  });
}

// Best-effort extraction of top-level numeric variables, used when a project has no parameter
// records yet (for example a project written by hand).
export function extractVariables(code) {
  const out = [];
  const seen = new Set();
  const re = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(-?\d+(?:\.\d+)?)\s*;\s*(?:\/\*\s*(.*?)\s*\*\/|\/\/(.*))?$/gm;
  let match;
  while ((match = re.exec(code || "")) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    const value = Number(match[2]);
    const comment = (match[3] || match[4] || "").trim();
    out.push({
      name,
      label: comment || name.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
      type: Number.isInteger(value) ? "integer" : "number",
      default_value: String(value),
      min_value: Math.max(0, Math.round(value * 0.2 * 100) / 100),
      max_value: Math.round(value * 3 * 100) / 100,
      unit: "mm",
    });
  }
  return out.slice(0, 24);
}

export function paramNumber(param) {
  const n = Number(param.default_value);
  return Number.isFinite(n) ? n : 0;
}

export function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}