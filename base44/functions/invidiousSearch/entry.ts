import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Public, bounded YouTube search proxy. Public Invidious instances have their
// search API endpoints disabled (the api:false flag in the instances list),
// so search results come from YouTube's own results page, fetched server-side,
// and videos then play through Invidious embeds on the page.

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
  if (/^no views$/i.test(text.trim())) return 0;
  const digits = String(text).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function collectVideos(node, out) {
  if (!node || typeof node !== "object" || out.length >= 40) return;
  if (Array.isArray(node)) {
    for (const n of node) collectVideos(n, out);
    return;
  }
  const v = node.videoRenderer;
  if (v && v.videoId) {
    const byline = v.shortBylineText && v.shortBylineText.runs && v.shortBylineText.runs[0];
    out.push({
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
  for (const key of Object.keys(node)) {
    collectVideos(node[key], out);
  }
}

export default async function(req) {
  try {
    let q = null;
    try {
      const body = await req.json();
      q = body?.q ?? null;
    } catch {
      q = null;
    }
    if (typeof q === "number") q = String(q);
    const query = (typeof q === "string" ? q : "").trim();
    if (query.length === 0 || query.length > 100) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

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
    let data;
    try {
      data = JSON.parse(match[1]);
    } catch {
      return Response.json({ error: "Could not parse search results" }, { status: 502 });
    }

    const videos = [];
    collectVideos(data, videos);
    const seen = new Set();
    const results = [];
    for (const v of videos) {
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      results.push(v);
      if (results.length >= 30) break;
    }

    if (results.length === 0) {
      return Response.json({ instance: "youtube", results: [] });
    }
    return Response.json({ instance: "youtube", results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}