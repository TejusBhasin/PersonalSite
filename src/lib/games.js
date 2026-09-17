export const GAME_SLUGS = [
  "2048", "8bit-quest", "agar", "apex-predator", "arcade-classic", "arcade-fever",
  "asteroids", "aurora-burst", "aurora-dance", "binary-blast", "block-squad",
  "bounce-palace", "breakout", "brick-blaster", "bullet-hell", "cartridge-dash",
  "cassette-quest", "chain-reaction", "chip-tune-battle", "chrono-jump",
  "cipher-crack", "code-runner", "color-match", "combo-master", "crystal-dash",
  "crystal-fusion", "cyber-breach", "cyber-rush", "data-surge", "digital-maze",
  "earth-digger", "earthquake-survival", "echo-sync", "eclipse-runner",
  "fast-reflex", "flappy-fall", "flappy", "flow-state", "forest-guardian",
  "frogger", "frost-maze", "gravity-ball", "hanoi", "hexagon-defense",
  "inferno-dash", "infinity-burst", "jump-quest", "laser-defender", "laser-grid",
  "lightning-strike", "logic-gate", "marble-run", "math-marathon",
  "matrix-trace", "memory", "meteor-strike", "minesweeper", "minimalist-zen",
  "nature-collector", "nebula-collector", "neon-portal", "neon-surge",
  "nexus-blocks", "nexus-painter", "nova-strike", "ocean-explorer",
  "orbit-defender", "pacman", "phantom-path", "ping-pong-2p", "pixel-blast",
  "pixel-painter", "pixel-perfect", "plasma-collector", "pong", "prism-match",
  "pulse-beat", "pulse-runner", "puzzle-match", "quake-runner", "quantum-sync",
  "quick-tap", "resonance-grid", "retro-racer", "rhythm-master", "rhythm-tap",
  "riddle-realm", "rotator", "sequence-solver", "shadow-dash", "simon",
  "sky-flyer", "snake", "sokoban", "solar-flare", "space-invaders",
  "space-maze", "spectrum-runner", "surge-defender", "synth-wave",
  "tempest-surge", "tetris", "tidal-wave", "time-racer", "titan-clash",
  "tornado-vortex", "tsunami-escape", "vaporwave-escape", "velocity-zero",
  "void-collector", "void-escape", "void-jumper", "volcanic-eruption",
  "whack-a-mole"
];

export const prettify = (slug) =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const GAMES = GAME_SLUGS.map((slug) => ({ slug, name: prettify(slug) }));

// Served through the app's own backend function so the HTML renders as a page, not code.
export const gameEmbedUrl = (slug) => `/functions/serveGame?slug=${slug}`;