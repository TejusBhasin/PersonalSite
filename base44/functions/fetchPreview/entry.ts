// Server-side image fetch for project preview cards. The screenshot and
// GitHub image hosts can be blocked on the visitor's network (the site
// itself still loads, since it is served from this app's domain), so the
// browser falls back to this proxy: it fetches the image server-side and
// hands it back as a data URI. Bounded: https only, image content types
// only, 3 MB cap, 10s timeout.

export default async function(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!/^https:\/\/[\w.-]+/i.test(url) || url.length > 500) {
      return Response.json({ error: "Invalid url" }, { status: 400 });
    }

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      return Response.json({ error: "Fetch failed" }, { status: 502 });
    }
    const contentType = (res.headers.get("content-type") || "").split(";")[0];
    if (!/^image\//.test(contentType)) {
      return Response.json({ error: "Not an image" }, { status: 422 });
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 3000000) {
      return Response.json({ error: "Image too large" }, { status: 413 });
    }

    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return Response.json({ dataUri: `data:${contentType};base64,${btoa(bin)}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}