import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Gamepad2, Search, Play } from "lucide-react";
import { GAMES } from "@/lib/games";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Games() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? GAMES.filter((g) => g.name.toLowerCase().includes(needle) || g.slug.includes(needle))
    : GAMES;

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
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
            Games
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            {GAMES.length} playable retro games — search or scroll, then click to play
          </p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full bg-card/80 backdrop-blur-sm border border-border/60 rounded-full pl-11 pr-5 py-3 text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
            style={MONT}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground font-medium" style={MONT}>
            No games match "{query}".
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((game) => (
              <Link
                key={game.slug}
                to={`/gamesthatonlytejushas/${game.slug}`}
                className="group bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl px-5 py-4 flex items-center justify-between gap-3 hover:-translate-y-1 hover:shadow-lg hover:border-foreground/30 hover:bg-card transition-all duration-300"
              >
                <Gamepad2 className="w-5 h-5 shrink-0 text-foreground/50 group-hover:text-foreground transition-colors" />
                <span
                  className="flex-1 truncate text-xs sm:text-sm font-bold text-foreground/80 group-hover:text-foreground tracking-wide"
                  style={MONT}
                >
                  {game.name}
                </span>
                <Play className="w-4 h-4 shrink-0 text-foreground/30 opacity-0 group-hover:opacity-100 group-hover:text-foreground transition-all duration-300" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}