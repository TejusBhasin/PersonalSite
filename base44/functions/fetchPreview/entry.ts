// Server-side image fetch for project preview cards. The screenshot and
// GitHub image hosts can be blocked on the visitor's network (the site
// itself still loads, since it is served from this app's domain), so the
// browser falls back to this proxy: it fetches the image server-side and
// hands it back as a data URI. Bounded: https only, public hosts only,
// image content types only, 3 MB cap, 10s timeout, redirects re-checked.

const BLOCKED_HOST =
  /(^|\.)(localhost|local|localdomain|internal|intranet|lan|home\.arpa|in-addr\.arpa|ip6\.arpa|metadata\.google\.internal)$/i;

// Accepts only https URLs on a public hostname: no credentials, no IP literals
// (so link-local metadata and internal ranges can never be reached), default port.
function safeUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  const host = url.hostname.toLowerCase();
  if (!host || host.length > 253) return null;
  if (host.startsWith("[") || /^[\d.]+$/.test(host)) return null;
  if (!host.includes(".")) return null;
  if (BLOCKED_HOST.test(host)) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  return url;
}

export default async function(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const raw = typeof body?.url === "string" ? body.url.trim() : "";
    if (!raw || raw.length > 500) {
      return Response.json({ error: "Invalid url" }, { status: 400 });
    }

    let target = safeUrl(raw);
    if (!target) {
      return Response.json({ error: "Invalid url" }, { status: 400 });
    }

    let res = null;
    for (let hop = 0; hop < 4; hop += 1) {
      res = await fetch(target.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
        }
      });
      if (res.status < 300 || res.status >= 400) break;
      const location = res.headers.get("location");
      if (!location) break;
      // Every hop is validated again, so a redirect cannot land on an internal address.
      target = safeUrl(new URL(location, target).toString());
      if (!target) {
        return Response.json({ error: "Invalid url" }, { status: 400 });
      }
    }

    if (!res || !res.ok) {
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