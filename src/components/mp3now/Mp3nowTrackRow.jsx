import { Check, Download, Loader2 } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import { usePlayer } from "@/lib/mp3now/player";
import { fmtTime, subtitleFor } from "@/lib/mp3now/format";

export default function Mp3nowTrackRow({ track, list, badge }) {
  const { current, playing, playTrack, offlineIds, downloading, downloadTracks, removeDownload } = usePlayer();
  const active = current?.id === track.id;
  const offline = offlineIds.has(track.id);
  const busy = downloading.has(track.id);

  return (
    <div
      className={`mp3-trackrow ${active ? "playing" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => playTrack(track, list)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") playTrack(track, list);
      }}
    >
      <Mp3nowArt src={track.coverArtDataUrl} name={track.title} size="sm" rounded="rounded-[9px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`truncate text-[13px] font-semibold ${active ? "text-[color:var(--m-blue)]" : "text-[color:var(--m-text)]"}`}
          >
            {track.title}
          </span>
          {badge && <span className="mp3-chip shrink-0">{badge}</span>}
        </div>
        <div className="truncate text-[11px] text-[color:var(--m-muted)]">{subtitleFor(track)}</div>
      </div>
      <span className="shrink-0 text-[11px] tabular-nums text-[color:var(--m-muted)]">
        {active && playing ? "Playing" : fmtTime(track.duration)}
      </span>
      <button
        type="button"
        aria-label={offline ? "Remove download" : "Download for offline"}
        onClick={(event) => {
          event.stopPropagation();
          if (busy) return;
          if (offline) removeDownload(track.id);
          else downloadTracks([track]);
        }}
        className={`mp3-iconbtn ${offline ? "active" : ""}`}
        style={{ width: 30, height: 30 }}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : offline ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}