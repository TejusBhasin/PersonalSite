import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Gamepad2, Play } from "lucide-react";
import GamePlayer from "@/components/games/GamePlayer";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const GAME_SLUGS = [
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

const prettify = (slug) =>
  slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const GAMES = GAME_SLUGS.map((slug) => ({ slug, name: prettify(slug) }));

export default function Games() {
  const [selected, setSelected] = useState(null);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
            Games
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            {GAMES.length} playable retro games — click one to play
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {GAMES.map((game) => (
            <button
              key={game.slug}
              onClick={() => setSelected(game)}
              className="group bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl px-5 py-4 flex items-center justify-between gap-3 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/30 hover:bg-card transition-all duration-300 text-left"
            >
              <Gamepad2 className="w-5 h-5 shrink-0 text-foreground/50 group-hover:text-foreground transition-colors" />
              <span
                className="flex-1 truncate text-xs sm:text-sm font-bold text-foreground/80 group-hover:text-foreground tracking-wide"
                style={MONT}
              >
                {game.name}
              </span>
              <Play className="w-4 h-4 shrink-0 text-foreground/30 opacity-0 group-hover:opacity-100 group-hover:text-foreground transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>

      <GamePlayer game={selected} onClose={() => setSelected(null)} />
    </main>
  );
}