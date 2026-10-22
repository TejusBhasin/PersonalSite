import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public, bounded YouTube search proxy for the hidden /invidious page.
// Public Invidious instances have their search API endpoints disabled
// (the api:false flag in the instances list), so results come from
// YouTube's own pages fetched server-side; videos then play through
// Invidious embeds in the browser.
// Modes: "videos" (regular results) and "shorts" (vertical shorts feed).
// The `next` cursor lets the client load the following page of results,
// which powers the endless doomscroll feed.

const YOUTUBE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Cookie": "CONSENT=YES+cb"
};

function parseDuration(text) {
  if (!text) return 0;
  const parts = String(text).split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

function parseViews(text) {
  if (!text) return 0;
  const s = String(text).toLowerCase();
  if (s.includes("no view")) return 0;
  const m = s.match(/([\d.,]+)\s*(b|m|k)?/);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (Number.isNaN(num)) return 0;
  const mult = m[2] === "b" ? 1e9 : m[2] === "m" ? 1e6 : m[2] === "k" ? 1e3 : 1;
  return Math.round(num * mult);
}

function scan(node, out) {
  if (!node || typeof node !== "object" || out.count >= 120) return;
  if (Array.isArray(node)) {
    for (const n of node) scan(n, out);
    return;
  }
  const v = node.videoRenderer;
  if (v && v.videoId && out.videos.length < 60) {
    out.count++;
    const byline = v.shortBylineText && v.shortBylineText.runs && v.shortBylineText.runs[0];
    out.videos.push({
      videoId: v.videoId,
      title: (v.title && v.title.runs && v.title.runs[0] && v.title.runs[0].text) || "",
      author: (byline && byline.text) || "",
      authorId:
        (byline && byline.navigationEndpoint && byline.navigationEndpoint.browseEndpoint &&
          byline.navigationEndpoint.browseEndpoint.browseId) || "",
      lengthSeconds: parseDuration(v.lengthText && v.lengthText.simpleText),
      viewCount: parseViews(v.viewCountText && v.viewCountText.simpleText),
      publishedText: (v.publishedTimeText && v.publishedTimeText.simpleText) || ""
    });
  }
  const s = node.shortsLockupViewModel;
  const shortId = extractShortId(s);
  if (s && shortId && out.shorts.length < 60) {
    out.count++;
    const md = s.overlayMetadata || {};
    out.shorts.push({
      videoId: shortId,
      title: (md.primaryText && md.primaryText.content) || "",
      author: "",
      authorId: "",
      lengthSeconds: 0,
      viewCount: parseViews(md.secondaryText && md.secondaryText.content),
      publishedText: ""
    });
  }
  for (const key of Object.keys(node)) {
    scan(node[key], out);
  }
}

// The shorts shelf carries the video id inside entityId or the tap url,
// not a contentId field.
function extractShortId(s) {
  if (!s) return null;
  if (typeof s.entityId === "string") {
    const m = s.entityId.match(/item-([\w-]{6,})$/);
    if (m) return m[1];
  }
  const cmd = s.onTap && s.onTap.innertubeCommand;
  const url = cmd && cmd.commandMetadata && cmd.commandMetadata.webCommandMetadata && cmd.commandMetadata.webCommandMetadata.url;
  if (typeof url === "string") {
    const m = url.match(/shorts\/([\w-]{6,})/);
    if (m) return m[1];
  }
  return null;
}

function findContinuation(node) {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findContinuation(n);
      if (r) return r;
    }
    return null;
  }
  const c = node.continuationItemRenderer;
  if (c && c.continuationEndpoint && c.continuationEndpoint.continuationCommand &&
      c.continuationEndpoint.continuationCommand.token) {
    return c.continuationEndpoint.continuationCommand.token;
  }
  for (const key of Object.keys(node)) {
    const r = findContinuation(node[key]);
    if (r) return r;
  }
  return null;
}

export default async function(req) {
  try {
    let q = null;
    let mode = "videos";
    let continuation = null;
    try {
      const body = await req.json();
      q = body?.q ?? null;
      mode = body?.mode ?? "videos";
      continuation = body?.continuation ?? null;
    } catch {
      q = null;
    }
    if (typeof q === "number") q = String(q);
    const query = (typeof q === "string" ? q : "").trim();
    if (query.length === 0 || query.length > 100) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }
    if (mode !== "videos" && mode !== "shorts") mode = "videos";

    let key = null;
    let ver = null;
    let data = null;

    if (
      continuation && typeof continuation === "object" &&
      typeof continuation.k === "string" && typeof continuation.v === "string" && typeof continuation.t === "string"
    ) {
      let token = continuation.t;
      try {
        token = decodeURIComponent(continuation.t);
      } catch {
        token = continuation.t;
      }
      if (!/^[A-Za-z0-9_-]{20,100}$/.test(continuation.k) ||
          !/^[\w.%=-]{20,4000}$/.test(token) ||
          !/^[\d.]{1,20}$/.test(continuation.v)) {
        return Response.json({ error: "Invalid continuation" }, { status: 400 });
      }
      const res = await fetch(
        `https://www.youtube.com/youtubei/v1/search?key=${continuation.k}&prettyPrint=false`,
        {
          method: "POST",
          headers: { ...YOUTUBE_HEADERS, "Content-Type": "application/json" },
          body: JSON.stringify({
            context: { client: { clientName: "WEB", clientVersion: continuation.v, hl: "en", gl: "US" } },
            continuation: token
          }),
          signal: AbortSignal.timeout(15000)
        }
      );
      if (!res.ok) {
        return Response.json({ error: "Search failed" }, { status: 502 });
      }
      data = await res.json();
      key = continuation.k;
      ver = continuation.v;
    } else {
      const res = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=US`,
        { headers: YOUTUBE_HEADERS, signal: AbortSignal.timeout(15000) }
      );
      if (!res.ok) {
        return Response.json({ error: "Search failed" }, { status: 502 });
      }
      const html = await res.text();
      const match = html.match(/ytInitialData\s*=\s*(\{.+?\});</s);
      if (!match) {
        return Response.json({ error: "Could not parse search results" }, { status: 502 });
      }
      try {
        data = JSON.parse(match[1]);
      } catch {
        return Response.json({ error: "Could not parse search results" }, { status: 502 });
      }
      const keyM = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      const verM = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
      key = keyM ? keyM[1] : null;
      ver = verM ? verM[1] : null;
    }

    const out = { videos: [], shorts: [], count: 0 };
    scan(data, out);

    let results = mode === "shorts" ? out.shorts : out.videos;
    if (mode === "shorts" && results.length === 0) {
      // No native shorts in the results: fall back to very short videos.
      results = out.videos.filter((v) => v.lengthSeconds > 0 && v.lengthSeconds <= 60);
    }

    const seen = new Set();
    const capped = [];
    for (const v of results) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      capped.push(v);
      if (capped.length >= 30) break;
    }

    const token = findContinuation(data);
    const next = token && key && ver ? { k: key, v: ver, t: token } : null;

    return Response.json({ instance: "youtube", mode, results: capped, next });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}