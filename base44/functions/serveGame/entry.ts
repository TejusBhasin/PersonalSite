const RAW_BASE = "https://raw.githubusercontent.com/prateek121/90s-games/main/games/";

export default async function(req) {
  try {
    let slug = new URL(req.url).searchParams.get("slug");
    if (!slug) {
      try {
        const body = await req.json();
        slug = body?.slug ?? null;
      } catch {
        slug = null;
      }
    }
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return Response.json({ error: "Invalid game slug" }, { status: 400 });
    }
    const upstream = await fetch(RAW_BASE + slug + ".html");
    if (!upstream.ok) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }
    const html = await upstream.text();
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}