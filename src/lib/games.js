export const GAME_SLUGS = [
  "2048", "adarkroom", "asciispace", "asteroids", "astray", "backcountry",
  "blackholesquare", "bounceback", "breaklock", "breakout", "captaincallisto",
  "chess", "chromaincident", "chromedino", "connect3", "cookieclicker",
  "edgenotfound", "evilglitch", "factoryballsforever", "flappybird",
  "geometrydash", "hextris", "konnekt", "minecraft", "ninjavsevilcorp",
  "packabunchas", "pacman", "particleclicker", "pushback", "q1k3", "racer",
  "radiusraid", "retrohaunt", "roadblocks", "run3", "shuttledeck",
  "sleepingbeauty", "snake", "spacecompany", "spacegarden", "spacehuggers",
  "tetris", "themazeofspacegoblins", "towermaster", "trimps", "underrun",
  "xx142-b2exe"
];

const NAME_OVERRIDES = {
  "adarkroom": "A Dark Room",
  "chromedino": "Chrome Dino",
  "flappybird": "Flappy Bird",
  "geometrydash": "Geometry Dash",
  "cookieclicker": "Cookie Clicker",
  "pacman": "Pac-Man",
  "run3": "Run 3",
  "themazeofspacegoblins": "The Maze of Space Goblins",
  "xx142-b2exe": "XX142-B2EXE",
  "captaincallisto": "Captain Callisto",
  "ninjavsevilcorp": "Ninja vs Evil Corp",
  "factoryballsforever": "Factory Balls Forever",
  "chromaincident": "Chroma Incident"
};

export const prettify = (slug) =>
  NAME_OVERRIDES[slug] ||
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const GAMES = GAME_SLUGS.map((slug) => ({ slug, name: prettify(slug) }));

// Served through the app's own backend function so the game renders playable on the site.
export const gameEmbedUrl = (slug) => `/functions/serveGame?slug=${slug}`;