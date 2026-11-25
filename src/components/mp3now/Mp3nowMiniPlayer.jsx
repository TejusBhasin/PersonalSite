import { Pause, Play, SkipForward } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";

export default function Mp3nowMiniPlayer({ track, playing, onToggle, onNext, onOpen, progress }) {
  if (!track) return null;

  return (
    <div className="mp3-player-dock">
      <button type="button" onClick={onOpen} className="mp3-glass mp3-player-pill">
        <Mp3nowArt src={track.coverArtDataUrl} name={track.title} size="sm" rounded="rounded-[10px]" />
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[12.5px] font-semibold text-[color:var(--m-text)]">{track.title}</span>
          <span className="block truncate text-[10.5px] text-[color:var(--m-muted)]">
            {track.artist || "Unknown Artist"}
          </span>
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label={playing ? "Pause" : "Play"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onToggle();
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--m-blue)]"
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label="Next track"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onNext();
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--m-muted)]"
        >
          <SkipForward className="h-4 w-4" />
        </span>
        <span className="mp3-player-progress" style={{ width: `${Math.min(100, progress || 0)}%` }} />
      </button>
    </div>
  );
}