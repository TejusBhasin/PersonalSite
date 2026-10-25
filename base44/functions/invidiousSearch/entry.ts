import { searchYouTube } from "../../shared/youtubeSearch.ts";

// Public, bounded YouTube search proxy for the hidden /invidious page.
// Public Invidious instances have their search API endpoints disabled or
// block datacenter IPs, so results come from YouTube's own pages fetched
// server-side; videos then play through YouTube-nocookie embeds in the
// browser. Modes: "videos" (regular results) and "shorts" (vertical feed).
// The `next` cursor lets the client load the following page of results.

export default async function(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    let q = body?.q ?? null;
    const mode = body?.mode === "shorts" ? "shorts" : "videos";
    const continuation = body?.continuation ?? null;
    if (typeof q === "number") q = String(q);
    const query = (typeof q === "string" ? q : "").trim();
    if (query.length === 0 || query.length > 100) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }
    const out = await searchYouTube(query, mode, continuation);
    return Response.json(out);
  } catch (error) {
    if (error && error.status) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}