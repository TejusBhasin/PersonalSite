const MAX_BYTES = 2000000;

// Private / local addresses must never be fetched through the proxy.
const BLOCKED_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i;

// Free public Invidious instances (open YouTube API, no key needed).
const INVIDIOUS = ["https://invidious.f5.si", "https://yewtu.be"];

function normalizeUrl(raw) {
  let value = (raw || "").trim();
  if (!value) throw new Error("Enter a web address first");
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https addresses work");
  if (BLOCKED_HOST.test(url.hostname)) throw new Error("That address is not allowed");
  return url;
}

// YouTube is a JavaScript app, so no HTML proxy can render it. Instead we
// route it to YouTube's official embed players and a public search API.
function parseYouTube(url) {
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  if (host !== "youtube.com" && host !== "youtu.be" && host !== "youtube-nocookie.com") return null;
  const q = url.searchParams;
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    if (id) return { kind: "youtube-video", videoId: id };
  }
  if (q.get("v")) return { kind: "youtube-video", videoId: q.get("v") };
  const m = url.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]+)/);
  if (m) return { kind: "youtube-video", videoId: m[2] };
  if (q.get("list")) return { kind: "youtube-playlist", listId: q.get("list") };
  const search = q.get("search_query");
  if (url.pathname.startsWith("/results") && search) return { kind: "youtube-search", query: search };
  return { kind: "youtube-home" };
}

async function searchYouTube(query) {
  for (const base of INVIDIOUS) {
    try {
      const res = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) continue;
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        return list.slice(0, 20)
          .filter((v) => v.videoId)
          .map((v) => ({ videoId: v.videoId, title: v.title || "", author: v.author || "", duration: v.lengthSeconds || 0 }));
      }
    } catch {
      // try the next instance
    }
  }
  return null;
}

export default async function(req) {
  try {
    const body = await req.json();
    const target = normalizeUrl(body.url);

    const yt = parseYouTube(new URL(target));
    if (yt) {
      if (yt.kind === "youtube-search") {
        const results = await searchYouTube(yt.query);
        if (!results) {
          return Response.json({ error: "YouTube search is busy right now, try again in a moment" });
        }
        return Response.json({ kind: "youtube-search", query: yt.query, results });
      }
      return Response.json(yt);
    }

    // Fast direct fetch first; fall back to the free public relay allorigins.win
    // for sites that block our requests.
    let res = null;
    let via = "direct";
    try {
      res = await fetch(target, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,*/*"
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000)
      });
    } catch {
      res = null;
    }
    if (!res || !res.ok) {
      via = "relay";
      try {
        res = await fetch(`https://api.allorigins.win/raw?charset=UTF-8&url=${encodeURIComponent(target)}`, {
          signal: AbortSignal.timeout(20000)
        });
      } catch {
        res = null;
      }
    }
    if (!res || !res.ok) {
      const code = res ? res.status : 0;
      return Response.json({ error: code ? `That site responded with error ${code}` : "Could not reach that site" });
    }

    const type = res.headers.get("content-type") || "";
    let html = await res.text();
    if (html.length > MAX_BYTES) html = html.slice(0, MAX_BYTES);
    if (!type.includes("html") && !/<html|<body|<!doctype/i.test(html.slice(0, 400))) {
      return Response.json({ error: "That address does not return a web page" });
    }

    // The page loads its images, styles and scripts straight from the real site.
    html = html.replace(/<base\b[^>]*>/gi, "");
    html = html.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, "");

    const inject =
      `<base href="${target}">` +
      `<script>(function(){document.addEventListener("click",function(e){var t=e.target;var a=t&&t.closest?t.closest("a"):null;if(!a)return;var h=a.getAttribute("href");if(!h||h.charAt(0)==="#")return;e.preventDefault();e.stopPropagation();try{parent.postMessage({__proxyNav:new URL(h,document.baseURI).href},"*");}catch(err){}},true);})();</script>`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, (m, attrs) => `<head${attrs}>${inject}`);
    } else {
      html = inject + html;
    }

    return Response.json({ html, finalUrl: via === "direct" && res.url ? res.url : target });
  } catch (error) {
    return Response.json({ error: error.message || "Could not reach that site" }, { status: 500 });
  }
}