const GAMES_BASE = "https://rawcdn.githack.com/BinBashBanana/gfiles/master/gfiles/html5/";

// Games that live on their own host instead of the shared mirror. Every entry is
// pinned to a specific repo/path whose licence allows free use.
const HOSTED = {
  "duckhunt": "https://rawcdn.githack.com/MattSurabian/DuckHunt-JS/master/dist/index.html",
  "floppybird": "https://nebez.github.io/floppybird/",
  "hexgl": "https://hexgl.bkcore.com/play/",
  "pacman": "https://passer-by.com/pacman/",
  "skifree": "https://rawcdn.githack.com/basicallydan/skifree.js/master/index.html",
  "snakes": "https://rawcdn.githack.com/jakesgordon/javascript-snakes/master/index.html",
  "tetris": "https://rawcdn.githack.com/jakesgordon/javascript-tetris/master/index.html"
};

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
        Location: HOSTED[slug] || GAMES_BASE + slug + "/index.html",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}