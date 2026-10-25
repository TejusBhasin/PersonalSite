// Shared helper for the /amme page: the ordered list of public Invidious
// instances (https://api.invidious.io/). Instances block datacenter IPs, so
// health is probed live in the visitor's browser (AmmePlayer); the server
// only supplies the candidate order, taken from the directory's health
// sort. Entries without uptime monitoring (Yggdrasil/i2p-only mirrors)
// are skipped since they are unreachable from normal networks.

const DIRECTORY_URL = "https://api.invidious.io/instances.json?sort_by=type,health";
const MAX_CANDIDATES = 15;

export async function fetchCandidates() {
  const res = await fetch(DIRECTORY_URL, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) return [];
  const list = await res.json();
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const entry of list) {
    // The directory is an array of [name, details] pairs.
    const i = Array.isArray(entry) ? entry[1] : entry;
    const name = Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : i && i.name;
    if (!i || typeof i.uri !== "string" || i.type !== "https") continue;
    if (!i.monitor || typeof i.monitor.uptime !== "number") continue;
    const url = i.uri.replace(/\/+$/, "");
    if (!url.startsWith("https://") || seen.has(url)) continue;
    seen.add(url);
    out.push({ name: typeof name === "string" ? name : url, url });
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}