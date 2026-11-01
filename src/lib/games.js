// Only games whose upstream license allows use without giving credit are kept:
// MIT (2048, Asteroids, Breaklock, Breakout, Particle Clicker, Q1K3, Racer,
// Space Company, Tower Master, Underrun), BSD-3 (Chrome Dino),
// Unlicense (Astray) and MPL-2.0 (A Dark Room).
export const GAME_SLUGS = [
  "2048", "adarkroom", "asteroids", "astray", "breaklock", "breakout",
  "chromedino", "particleclicker", "q1k3", "racer", "spacecompany",
  "towermaster", "underrun",
  "skipro360"
];

const NAME_OVERRIDES = {
  "adarkroom": "A Dark Room",
  "chromedino": "Chrome Dino",
  "particleclicker": "Particle Clicker",
  "q1k3": "Q1K3",
  "spacecompany": "Space Company",
  "towermaster": "Tower Master",
  "skipro360": "SKIPRO360"
};

export const prettify = (slug) =>
  NAME_OVERRIDES[slug] ||
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const GAMES = GAME_SLUGS.map((slug) => ({ slug, name: prettify(slug) }));

// Served through the app's own backend function so the game renders playable on the site.
export const gameEmbedUrl = (slug) => `/functions/serveGame?slug=${slug}`;

// Built-in games ship with the site itself and run as React components,
// so they work on networks that block external game hosts.
const BUILTIN_GAMES = ["skipro360"];
export const isBuiltinGame = (slug) => BUILTIN_GAMES.includes(slug);