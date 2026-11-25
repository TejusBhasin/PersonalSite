import { Pause, Play, SkipForward } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import { usePlayer } from "@/lib/mp3now/player";

export default function Mp3nowMiniPlayer({ onOpen }) {
  const { current, playing, toggle, next, position, duration, loading } = usePlayer();
  if (!current) return null;

  const progress = duration ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div className="mp3-player-dock">
      <div className="mp3-glass mp3-player-pill">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <Mp3nowArt src={current.coverArtDataUrl} name={current.title} size="sm" rounded="rounded-[10px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12.5px] font-semibold text-[color:var(--m-text)]">{current.title}</span>
            <span className="block truncate text-[10.5px] text-[color:var(--m-muted)]">
              {loading ? "Loading…" : current.artist || "Unknown Artist"}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--m-blue)]"
        >
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next track"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--m-muted)]"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <span className="mp3-player-progress" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}