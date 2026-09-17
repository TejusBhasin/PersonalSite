import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { GAMES, gameEmbedUrl } from "@/lib/games";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function PlayGame() {
  const { slug } = useParams();
  const game = GAMES.find((g) => g.slug === slug);

  if (!game) {
    return (
      <div className="h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 px-6">
        <h1 className="text-2xl font-bold" style={MONT}>
          Game not found
        </h1>
        <Link
          to="/games"
          className="text-xs font-bold tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors"
          style={MONT}
        >
          Back to Games
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-border shrink-0">
        <Link
          to="/games"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300"
          style={MONT}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Games</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <h1 className="text-sm sm:text-base font-black tracking-wide truncate" style={MONT}>
          {game.name}
        </h1>
        <a
          href={gameEmbedUrl(game.slug)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open game in a new tab"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      <iframe
        src={gameEmbedUrl(game.slug)}
        title={game.name}
        className="flex-1 w-full"
      />
    </div>
  );
}