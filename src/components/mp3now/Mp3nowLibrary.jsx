import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, User, Disc3, CloudDownload } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import Mp3nowTrackList from "@/components/mp3now/Mp3nowTrackList";
import { getTrackPool } from "@/lib/mp3now/api";
import { usePlayer } from "@/lib/mp3now/player";

const SEGMENTS = [
  { id: "songs", label: "All Songs" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "offline", label: "Offline Only" },
];

export default function Mp3nowLibrary() {
  const { offlineIds } = usePlayer();
  const [segment, setSegment] = useState("songs");
  const [pool, setPool] = useState([]);
  const [state, setState] = useState("loading");
  const [browse, setBrowse] = useState(null);

  useEffect(() => {
    let alive = true;
    getTrackPool()
      .then((rows) => {
        if (alive) {
          setPool(rows);
          setState("ready");
        }
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, []);

  const artists = useMemo(() => groupCount(pool, "artist"), [pool]);
  const albums = useMemo(() => groupCount(pool, "album"), [pool]);
  const offlineTracks = useMemo(() => pool.filter((track) => offlineIds.has(track.id)), [pool, offlineIds]);

  if (browse) {
    const tracks = pool.filter((track) => track[browse.field] === browse.value);
    return (
      <div className="mp3-scroll mp3-page flex-1 overflow-y-auto">
        <button type="button" onClick={() => setBrowse(null)} className="mp3-btn mp3-btn-ghost mb-3">
          <ChevronLeft className="h-4 w-4" />
          Library
        </button>
        <h2 className="mb-1 text-[19px] font-semibold">{browse.value}</h2>
        <p className="mb-3 text-[11.5px] text-[color:var(--m-muted)]">{tracks.length} songs</p>
        <Mp3nowTrackList tracks={tracks} emptyHint="Nothing here." />
      </div>
    );
  }

  return (
    <div className="mp3-scroll mp3-page flex-1 overflow-y-auto">
      <h1 className="mb-5 text-[24px] font-semibold tracking-[-0.02em]">Library</h1>

      <div className="mp3-scroll -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {SEGMENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSegment(item.id)}
            className={`mp3-pill ${segment === item.id ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {state === "loading" && <div className="mp3-surface h-40 animate-pulse" />}
      {state === "error" && (
        <p className="mp3-surface px-4 py-3.5 text-[12px] text-[color:var(--m-danger)]">
          The library could not be loaded.
        </p>
      )}

      {state === "ready" && segment === "songs" && (
        <>
          <p className="mb-2 px-1 text-[11.5px] text-[color:var(--m-muted)]">{pool.length} songs</p>
          <Mp3nowTrackList tracks={pool} emptyHint="No songs yet. Sync your MEGA folders in Settings." />
        </>
      )}

      {state === "ready" && segment === "artists" && (
        <GroupList
          entries={artists}
          icon={User}
          onSelect={(value) => setBrowse({ field: "artist", value })}
          emptyHint="No artists yet."
        />
      )}

      {state === "ready" && segment === "albums" && (
        <GroupList
          entries={albums}
          icon={Disc3}
          onSelect={(value) => setBrowse({ field: "album", value })}
          emptyHint="No albums yet."
        />
      )}

      {state === "ready" && segment === "offline" && (
        <>
          <div className="mp3-surface mb-4 flex items-center gap-3 px-4 py-3.5">
            <span className="mp3-ai-badge">
              <CloudDownload className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-semibold">{offlineTracks.length} songs on this device</p>
              <p className="text-[11px] text-[color:var(--m-muted)]">Plays without a connection.</p>
            </div>
          </div>
          <Mp3nowTrackList tracks={offlineTracks} emptyHint="Nothing downloaded yet. Use the download icon on any song." />
        </>
      )}
    </div>
  );
}

function GroupList({ entries, icon: Icon, onSelect, emptyHint }) {
  if (!entries.length) {
    return (
      <div className="mp3-surface px-5 py-6 text-center text-[12.5px] text-[color:var(--m-muted)]">{emptyHint}</div>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <button key={entry.value} type="button" onClick={() => onSelect(entry.value)} className="mp3-surface mp3-row w-full">
          <Mp3nowArt src={entry.cover} name={entry.value} size="sm" rounded="rounded-[10px]" />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-semibold">{entry.value}</span>
            <span className="block text-[11px] text-[color:var(--m-muted)]">
              {entry.count} song{entry.count === 1 ? "" : "s"}
            </span>
          </span>
          <Icon className="h-4 w-4 text-[color:var(--m-muted)]" />
        </button>
      ))}
    </div>
  );
}

function groupCount(tracks, field) {
  const map = new Map();
  for (const track of tracks) {
    const value = track[field];
    if (!value || value === "Unknown Album" || value === "Unknown Artist") continue;
    const entry = map.get(value) || { value, count: 0, cover: "" };
    entry.count += 1;
    if (!entry.cover && track.coverArtDataUrl) entry.cover = track.coverArtDataUrl;
    map.set(value, entry);
  }
  return [...map.values()].sort((a, b) => a.value.localeCompare(b.value));
}