import { X, ExternalLink } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const gameUrl = (slug) =>
  `https://cdn.jsdelivr.net/gh/prateek121/90s-games@main/games/${slug}.html`;

export default function GamePlayer({ game, onClose }) {
  if (!game) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl overflow-hidden w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-bold tracking-wide text-foreground truncate" style={MONT}>
            {game.name}
          </h3>
          <div className="flex items-center gap-4 shrink-0">
            <a
              href={gameUrl(game.slug)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open game in a new tab"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              aria-label="Close game"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <iframe
          src={gameUrl(game.slug)}
          title={game.name}
          className="flex-1 w-full bg-card"
        />
      </div>
    </div>
  );
}