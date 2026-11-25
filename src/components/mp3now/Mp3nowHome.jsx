import { Play, Sparkles, ChevronRight, Disc3 } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";

export default function Mp3nowHome({
  playlists,
  showAutoplay,
  onStartListening,
  onOpenPlaylist,
  onAiPlaylist,
  syncing,
  loading,
}) {
  return (
    <div className="mp3-scroll flex-1 overflow-y-auto px-4 pb-40 pt-3 sm:px-7">
      <header className="flex items-center justify-between gap-3 pb-5">
        <div>
          <h1 className="mp3-wordmark">MP3now</h1>
          <p className="mt-1 text-[12.5px] text-[color:var(--m-muted)]">Your private cloud library</p>
        </div>
        <div className="mp3-glass flex h-10 w-10 items-center justify-center rounded-full">
          <Disc3 className={`h-4 w-4 text-[color:var(--m-blue)] ${syncing ? "animate-spin" : ""}`} />
        </div>
      </header>

      {showAutoplay && (
        <button type="button" onClick={onStartListening} className="mp3-hero group mb-4 w-full text-left">
          <span className="mp3-hero-glow" aria-hidden="true" />
          <span className="relative flex items-center gap-4">
            <span className="mp3-hero-play">
              <Play className="h-5 w-5 translate-x-[1px] fill-current" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/70">
                Autoplay radio
              </span>
              <span className="mt-0.5 block text-[17px] font-semibold leading-tight text-white">
                Start Listening
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-white/75">
                Smart shuffle across everything you own
              </span>
            </span>
          </span>
        </button>
      )}

      <button type="button" onClick={onAiPlaylist} className="mp3-glass mp3-row mb-6 w-full">
        <span className="mp3-ai-badge">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[13.5px] font-semibold text-[color:var(--m-text)]">AI Playlist</span>
          <span className="block text-[11.5px] text-[color:var(--m-muted)]">Describe a mood, get a mix</span>
        </span>
        <ChevronRight className="h-4 w-4 text-[color:var(--m-muted)]" />
      </button>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--m-text)]">Playlists</h2>
        <span className="text-[11px] text-[color:var(--m-muted)]">
          {playlists.length} folder{playlists.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mp3-glass h-[168px] animate-pulse rounded-[20px]" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="mp3-glass rounded-[20px] p-6 text-center">
          <p className="text-[13px] font-semibold text-[color:var(--m-text)]">No playlists yet</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--m-muted)]">
            Run Sync Folders from MEGA in Settings to import your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              onClick={() => onOpenPlaylist(playlist)}
              className="mp3-glass mp3-card group text-left"
            >
              <Mp3nowArt src={playlist.coverArtDataUrl} name={playlist.name} size="lg" rounded="rounded-[16px]" />
              <span className="mt-2.5 block truncate text-[13px] font-semibold text-[color:var(--m-text)]">
                {playlist.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-[color:var(--m-muted)]">
                {playlist.trackCount ?? 0} song{playlist.trackCount === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}