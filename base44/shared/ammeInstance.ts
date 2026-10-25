// Shared helpers for the /amme page: picking and persisting a healthy
// public Invidious instance (https://api.invidious.io/) whose API and
// video proxy both work, so playback stays off YouTube domains.

const DIRECTORY_URL = "https://api.invidious.io/instances.json?sort_by=type,health";
const MAX_CANDIDATES = 15;
const BATCH_SIZE = 6;

export async function fetchCandidates() {
  const res = await fetch(DIRECTORY_URL, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) return [];
  const list = await res.json();
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const i of list) {
    if (!i || typeof i.uri !== "string" || i.type !== "https" || i.api === false) continue;
    const url = i.uri.replace(/\/+$/, "");
    if (!url.startsWith("https://") || seen.has(url)) continue;
    seen.add(url);
    out.push({ name: typeof i.name === "string" ? i.name : url, url });
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

// An instance passes when its search API answers AND a real video returns
// proxy-stream URLs (not direct googlevideo links), which proves the
// video proxy is enabled.
export async function probeInstance(baseUrl) {
  try {
    const searchRes = await fetch(`${baseUrl}/api/v1/search?q=music&type=video`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!searchRes.ok) return false;
    const results = await searchRes.json();
    const first = Array.isArray(results) && results.find((v) => v && typeof v.videoId === "string");
    if (!first) return false;
    const vidRes = await fetch(`${baseUrl}/api/v1/videos/${first.videoId}?local=true`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!vidRes.ok) return false;
    const vid = await vidRes.json();
    const streams = Array.isArray(vid && vid.formatStreams) ? vid.formatStreams : [];
    return streams.some((s) => s && typeof s.url === "string" && !s.url.includes("googlevideo.com"));
  } catch {
    return false;
  }
}

export async function selectHealthyInstance(excludeUrl) {
  const candidates = (await fetchCandidates()).filter((c) => c.url !== excludeUrl);
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((c) => probeInstance(c.url).then((ok) => (ok ? c : null)))
    );
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) return s.value;
    }
  }
  return null;
}

export async function readActiveInstance(svc) {
  const page = await svc.entities.AmmeInstance.filter({ key: "active" }, { limit: 1 });
  const rec = page && page.items && page.items[0];
  return rec ? { id: rec.id, baseUrl: rec.base_url, name: rec.instance_name } : null;
}

export async function persistInstance(svc, picked) {
  const now = new Date().toISOString();
  const current = await readActiveInstance(svc);
  if (current) {
    await svc.entities.AmmeInstance.update(current.id, {
      base_url: picked.url,
      instance_name: picked.name,
      healthy: true,
      checked_date: now
    });
  } else {
    await svc.entities.AmmeInstance.create({
      key: "active",
      base_url: picked.url,
      instance_name: picked.name,
      healthy: true,
      checked_date: now
    });
  }
  return { baseUrl: picked.url, name: picked.name };
}