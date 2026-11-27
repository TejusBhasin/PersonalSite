import { useMemo, useRef, useState } from "react";
import { ChevronLeft, Play, Shuffle, Loader2, Download, FolderDown, FolderTree, Square } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import Mp3nowTrackList from "@/components/mp3now/Mp3nowTrackList";
import { usePlayer } from "@/lib/mp3now/player";
import { playlistTracks } from "@/lib/mp3now/api";
import { downloadToDevice } from "@/lib/mp3now/deviceDownload";

export default function Mp3nowPlaylistView({ playlist, tracks, state, onBack, playlists = [] }) {
  const { playQueue, downloadTracks, downloading } = usePlayer();
  const [device, setDevice] = useState(null);
  const [saved, setSaved] = useState("");
  const stopRef = useRef(false);
  const busy = tracks.some((track) => downloading.has(track.id));

  // Every MEGA folder is its own playlist, so a "sub folder" is a playlist whose path sits
  // directly under this one.
  const subfolders = useMemo(() => {
    const base = playlist.megaFolderPath;
    if (!base) return [];
    const prefix = `${base} / `;
    return playlists.filter(
      (row) => row.id !== playlist.id && typeof row.megaFolderPath === "string" && row.megaFolderPath.startsWith(prefix)
    );
  }, [playlists, playlist]);

  const subfolderCount = subfolders.reduce((total, row) => total + (row.trackCount || 0), 0);

  const runDownload = async (label, collect) => {
    if (device) return;
    stopRef.current = false;
    setSaved("");
    setDevice({ label, done: 0, total: 0 });
    try {
      const list = await collect();
      if (!list.length) {
        setSaved("Nothing to save in that folder yet.");
        return;
      }
      const result = await downloadToDevice(list, {
        onProgress: ({ done, total }) => setDevice({ label, done, total }),
        shouldStop: () => stopRef.current,
      });
      setSaved(
        result.saved === 0
          ? "No files could be saved."
          : `Saved ${result.saved} file${result.saved === 1 ? "" : "s"} to this device${
              result.failed.length ? ` · ${result.failed.length} could not be fetched` : ""
            }`
      );
    } finally {
      setDevice(null);
    }
  };

  const saveFolder = () => runDownload("folder", async () => tracks);

  const saveSubfolders = () =>
    runDownload("subfolders", async () => {
      const groups = await Promise.all(subfolders.map((child) => playlistTracks(child.id).catch(() => [])));
      return groups.flat();
    });

  return (
    <div className="mp3-scroll mp3-page flex-1 overflow-y-auto">
      <button type="button" onClick={onBack} className="mp3-btn mp3-btn-ghost mb-6">
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-6 flex items-end gap-5">
        <div className="h-[112px] w-[112px] shrink-0">
          <Mp3nowArt src={playlist.coverArtDataUrl} name={playlist.name} size="lg" rounded="rounded-[18px]" />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <h1 className="truncate text-[24px] font-semibold tracking-[-0.02em]">{playlist.name}</h1>
          <p className="mt-1 text-[12.5px] text-[color:var(--m-muted)]">
            {state === "loading" ? "Loading…" : `${tracks.length} song${tracks.length === 1 ? "" : "s"}`}
            {playlist.megaFolderPath ? ` · ${playlist.megaFolderPath}` : ""}
          </p>
        </div>
      </div>

      {playlist.description && (
        <p className="mb-5 text-[12.5px] leading-relaxed text-[color:var(--m-muted)]">{playlist.description}</p>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => playQueue(tracks, 0)}
          disabled={!tracks.length}
          className="mp3-btn min-w-[120px] flex-1"
        >
          <Play className="h-4 w-4 fill-current" />
          Play
        </button>
        <button
          type="button"
          onClick={() => playQueue(tracks, Math.floor(Math.random() * tracks.length))}
          disabled={!tracks.length}
          className="mp3-btn mp3-btn-ghost min-w-[120px] flex-1"
        >
          <Shuffle className="h-4 w-4" />
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => downloadTracks(tracks)}
          disabled={!tracks.length || busy}
          className="mp3-btn mp3-btn-ghost"
          title="Keep these songs available offline inside MP3now"
          aria-label="Keep offline inside MP3now"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveFolder}
          disabled={!tracks.length || !!device}
          className="mp3-btn mp3-btn-ghost"
          title="Save every song in this folder to this device"
        >
          <FolderDown className="h-4 w-4" />
          Save folder to device{tracks.length ? ` (${tracks.length})` : ""}
        </button>
        {subfolders.length > 0 && (
          <button
            type="button"
            onClick={saveSubfolders}
            disabled={!!device}
            className="mp3-btn mp3-btn-ghost"
            title="Save every song inside this folder's sub folders"
          >
            <FolderTree className="h-4 w-4" />
            Save sub folders ({subfolders.length}{subfolderCount ? ` · ${subfolderCount} songs` : ""})
          </button>
        )}
      </div>

      {device && (
        <div className="mp3-surface mb-4 flex items-center gap-3 px-4 py-3">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[color:var(--m-blue)]" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold">
              Saving {device.label === "subfolders" ? "sub folders" : "folder"} · {device.done}
              {device.total ? ` of ${device.total}` : ""}
            </p>
            <div className="mp3-meter mt-1.5">
              <span style={{ width: `${device.total ? (device.done / device.total) * 100 : 6}%` }} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopRef.current = true;
            }}
            className="mp3-btn mp3-btn-ghost h-8 px-3 text-[12px]"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop
          </button>
        </div>
      )}

      {(device || saved) && (
        <p className="mb-4 text-[11.5px] leading-relaxed text-[color:var(--m-muted)]">
          {device ? "Your browser may ask once to allow multiple downloads. Files save as MP3." : saved}
        </p>
      )}

      {state === "loading" ? (
        <div className="mp3-surface h-40 animate-pulse" />
      ) : (
        <Mp3nowTrackList tracks={tracks} emptyHint="This playlist has no playable files yet." />
      )}
    </div>
  );
}