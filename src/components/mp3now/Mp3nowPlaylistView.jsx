import { ChevronLeft, Play, Shuffle, Loader2, Download, Sparkles } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import Mp3nowTrackList from "@/components/mp3now/Mp3nowTrackList";
import { usePlayer } from "@/lib/mp3now/player";

export default function Mp3nowPlaylistView({ playlist, tracks, state, onBack }) {
  const { playQueue, downloadTracks, downloading } = usePlayer();
  const busy = tracks.some((track) => downloading.has(track.id));

  return (
    <div className="mp3-scroll flex-1 overflow-y-auto px-4 pb-40 pt-3 sm:px-7">
      <button type="button" onClick={onBack} className="mp3-btn mp3-btn-ghost mb-4">
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-4 flex items-end gap-4">
        <div className="h-[104px] w-[104px] shrink-0">
          <Mp3nowArt src={playlist.coverArtDataUrl} name={playlist.name} size="lg" rounded="rounded-[20px]" />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          {playlist.isAiGenerated && (
            <span className="mp3-chip mb-1.5 inline-flex">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </span>
          )}
          <h1 className="truncate text-[21px] font-semibold tracking-[-0.02em]">{playlist.name}</h1>
          <p className="mt-0.5 text-[11.5px] text-[color:var(--m-muted)]">
            {state === "loading" ? "Loading…" : `${tracks.length} song${tracks.length === 1 ? "" : "s"}`}
            {playlist.megaFolderPath ? ` · ${playlist.megaFolderPath}` : ""}
          </p>
        </div>
      </div>

      {playlist.description && (
        <p className="mb-3 text-[12px] leading-relaxed text-[color:var(--m-muted)]">{playlist.description}</p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => playQueue(tracks, 0)}
          disabled={!tracks.length}
          className="mp3-btn flex-1"
        >
          <Play className="h-4 w-4 fill-current" />
          Play
        </button>
        <button
          type="button"
          onClick={() => playQueue(tracks, Math.floor(Math.random() * tracks.length))}
          disabled={!tracks.length}
          className="mp3-btn mp3-btn-ghost flex-1"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => downloadTracks(tracks)}
          disabled={!tracks.length || busy}
          className="mp3-btn mp3-btn-ghost"
          title="Download playlist offline"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
      </div>

      {state === "loading" ? (
        <div className="mp3-glass h-40 animate-pulse rounded-[20px]" />
      ) : (
        <Mp3nowTrackList tracks={tracks} emptyHint="This playlist has no playable files yet." />
      )}
    </div>
  );
}