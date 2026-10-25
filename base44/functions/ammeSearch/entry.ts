import { searchYouTube } from "../../shared/youtubeSearch.ts";
import { fetchCandidates } from "../../shared/ammeInstance.ts";

// Public, bounded video search for the hidden /amme page. Results come from
// a server-side YouTube search (public Invidious instances block datacenter
// IPs); playback is then streamed in the browser through the public
// instances' video proxy, so the visitor's browser never contacts YouTube.

export default async function(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    let q = body?.q ?? null;
    if (typeof q === "number") q = String(q);
    const query = (typeof q === "string" ? q : "").trim();
    if (query.length === 0 || query.length > 100) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    const out = await searchYouTube(query, "videos", null);
    const candidates = await fetchCandidates();
    const thumbBase = candidates.length ? candidates[0].url : "";

    const results = out.results.map((v) => ({
      videoId: v.videoId,
      title: v.title,
      author: v.author,
      lengthSeconds: v.lengthSeconds,
      viewCount: v.viewCount,
      thumbnail: thumbBase ? `${thumbBase}/vi/${v.videoId}/mqdefault.jpg` : ""
    }));

    return Response.json({ results, instances: candidates.map((c) => c.url) });
  } catch (error) {
    if (error && error.status) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}