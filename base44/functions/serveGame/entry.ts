const GAMES_BASE = "https://rawcdn.githack.com/BinBashBanana/gfiles/master/gfiles/html5/";

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
    // Redirect to the game's own page so it (and its assets) render playable, not as code.
    return new Response(null, {
      status: 302,
      headers: {
        Location: GAMES_BASE + slug + "/index.html",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}