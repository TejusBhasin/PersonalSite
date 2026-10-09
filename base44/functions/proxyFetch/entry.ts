const MAX_BYTES = 2000000;

// Private / local addresses must never be fetched through the proxy.
const BLOCKED_HOST = /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i;

function normalizeUrl(raw) {
  let value = (raw || "").trim();
  if (!value) throw new Error("Enter a web address first");
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http and https addresses work");
  if (BLOCKED_HOST.test(url.hostname)) throw new Error("That address is not allowed");
  return url.href;
}

export default async function(req) {
  try {
    const body = await req.json();
    const target = normalizeUrl(body.url);

    const res = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TejusProxy/1.0)",
        "Accept": "text/html,application/xhtml+xml,*/*"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      return Response.json({ error: `That site responded with error ${res.status}` });
    }
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) {
      return Response.json({ error: "That address does not return a web page" });
    }

    let html = await res.text();
    if (html.length > MAX_BYTES) html = html.slice(0, MAX_BYTES);

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

    return Response.json({ html, finalUrl: res.url || target });
  } catch (error) {
    return Response.json({ error: error.message || "Could not reach that site" }, { status: 500 });
  }
}