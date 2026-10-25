import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { readActiveInstance, persistInstance, selectHealthyInstance } from "../../shared/ammeInstance.ts";

// Public, bounded video search and playback helper for the hidden /amme
// page. Searches and streams through the currently selected public
// Invidious instance (persisted in the AmmeInstance entity by the daily
// check workflow). If the stored instance fails mid-request, a healthy
// replacement is picked, saved, and the request retried once.
// Modes: "search" (results list) and "video" (details + proxy stream URLs).

const MAX_RESULTS = 30;

function videoThumb(baseUrl, id) {
  return `${baseUrl}/vi/${id}/mqdefault.jpg`;
}

async function searchOn(baseUrl, query) {
  const res = await fetch(
    `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    { signal: AbortSignal.timeout(12000) }
  );
  if (!res.ok) throw new Error("Instance search failed");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Instance search failed");
  const seen = new Set();
  const out = [];
  for (const v of data) {
    if (!v || typeof v.videoId !== "string" || seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    out.push({
      videoId: v.videoId,
      title: v.title || "",
      author: v.author || "",
      lengthSeconds: Number(v.lengthSeconds) || 0,
      viewCount: Number(v.viewCount) || 0,
      thumbnail: videoThumb(baseUrl, v.videoId)
    });
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

async function videoOn(baseUrl, videoId) {
  const res = await fetch(`${baseUrl}/api/v1/videos/${videoId}?local=true`, {
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error("Instance video fetch failed");
  const d = await res.json();
  if (!d || typeof d.title !== "string") throw new Error("Instance video fetch failed");
  const streams = (Array.isArray(d.formatStreams) ? d.formatStreams : [])
    .filter((s) => s && typeof s.url === "string" && !s.url.includes("googlevideo.com"))
    .map((s) => ({
      itag: s.itag || 0,
      url: s.url,
      qualityLabel: s.qualityLabel || "",
      mimeType: s.mimeType || ""
    }));
  if (streams.length === 0) throw new Error("Instance has no proxy stream for this video");
  const description = typeof d.description === "string" ? d.description.slice(0, 4000) : "";
  return {
    videoId,
    title: d.title,
    author: d.author || "",
    lengthSeconds: Number(d.lengthSeconds) || 0,
    description,
    thumbnail: videoThumb(baseUrl, videoId),
    streams
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const mode = body && body.mode === "video" ? "video" : "search";
    const stored = await readActiveInstance(svc);

    if (mode === "search") {
      const q = String((body && body.q) ?? "").trim();
      if (q.length === 0 || q.length > 100) {
        return Response.json({ error: "Invalid query" }, { status: 400 });
      }
      if (stored) {
        try {
          const results = await searchOn(stored.baseUrl, q);
          return Response.json({ instance: stored.baseUrl, results });
        } catch {
          // fall through and switch instances
        }
      }
      const picked = await selectHealthyInstance(stored ? stored.baseUrl : null);
      if (!picked) {
        return Response.json({ error: "No working instance available right now" }, { status: 502 });
      }
      await persistInstance(svc, picked);
      const results = await searchOn(picked.url, q);
      return Response.json({ instance: picked.url, results });
    }

    const videoId = String((body && body.videoId) ?? "");
    if (!/^[\w-]{6,15}$/.test(videoId)) {
      return Response.json({ error: "Invalid video ID" }, { status: 400 });
    }
    if (stored) {
      try {
        const video = await videoOn(stored.baseUrl, videoId);
        return Response.json({ instance: stored.baseUrl, video });
      } catch {
        // fall through and switch instances
      }
    }
    const picked = await selectHealthyInstance(stored ? stored.baseUrl : null);
    if (!picked) {
      return Response.json({ error: "No working instance available right now" }, { status: 502 });
    }
    await persistInstance(svc, picked);
    const video = await videoOn(picked.url, videoId);
    return Response.json({ instance: picked.url, video });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}