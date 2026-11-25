import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, X, ChevronLeft, User, Disc3 } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import Mp3nowTrackList from "@/components/mp3now/Mp3nowTrackList";
import { getTrackPool } from "@/lib/mp3now/api";

const PILLS = [
  { id: "all", label: "All" },
  { id: "songs", label: "Songs" },
  { id: "artists", label: "Artists" },
  { id: "albums", label: "Albums" },
  { id: "playlists", label: "Playlists" },
];

export default function Mp3nowSearch({ playlists, onOpenPlaylist }) {
  const [term, setTerm] = useState("");
  const [pill, setPill] = useState("all");
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

  const query = term.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) return { songs: [], artists: [], albums: [], playlists: [] };
    const songs = pool.filter((track) =>
      [track.title, track.artist, track.album, track.genre, track.folderPath]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
    const artists = groupBy(songs, "artist");
    const albums = groupBy(songs, "album");
    const lists = playlists.filter((playlist) => String(playlist.name).toLowerCase().includes(query));
    return { songs, artists, albums, playlists: lists };
  }, [query, pool, playlists]);

  if (browse) {
    const tracks =
      browse.kind === "artist"
        ? pool.filter((track) => track.artist === browse.value)
        : pool.filter((track) => track.album === browse.value);
    return (
      <div className="mp3-scroll flex-1 overflow-y-auto px-4 pb-40 pt-3 sm:px-7">
        <button type="button" onClick={() => setBrowse(null)} className="mp3-btn mp3-btn-ghost mb-3">
          <ChevronLeft className="h-4 w-4" />
          Search
        </button>
        <h2 className="mb-1 text-[19px] font-semibold">{browse.value}</h2>
        <p className="mb-3 text-[11.5px] text-[color:var(--m-muted)]">
          {tracks.length} song{tracks.length === 1 ? "" : "s"}
        </p>
        <Mp3nowTrackList tracks={tracks} emptyHint="Nothing here." />
      </div>
    );
  }

  return (
    <div className="mp3-scroll flex-1 overflow-y-auto px-4 pb-40 pt-3 sm:px-7">
      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--m-muted)]" />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Songs, artists, albums, playlists"
          className="mp3-input pl-10 pr-10"
          aria-label="Search library"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--m-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mp3-scroll -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {PILLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPill(item.id)}
            className={`mp3-pill ${pill === item.id ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {state === "error" && (
        <p className="mp3-glass rounded-[18px] p-4 text-[12px] text-[color:var(--m-danger)]">
          The library could not be loaded.
        </p>
      )}

      {!query ? (
        <p className="px-1 text-[12px] text-[color:var(--m-muted)]">
          Search your whole library instantly. Try an artist, a folder or a mood.
        </p>
      ) : (
        <div className="space-y-5">
          {(pill === "all" || pill === "songs") && results.songs.length > 0 && (
            <Section title="Songs">
              <Mp3nowTrackList tracks={results.songs.slice(0, 60)} emptyHint="" window={40} />
            </Section>
          )}

          {(pill === "all" || pill === "artists") && results.artists.length > 0 && (
            <Section title="Artists">
              {results.artists.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setBrowse({ kind: "artist", value: entry.value })}
                  className="mp3-glass mp3-row mb-1.5 w-full"
                >
                  <span className="mp3-ai-badge">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13px] font-semibold">{entry.value}</span>
                    <span className="block text-[11px] text-[color:var(--m-muted)]">{entry.items.length} songs</span>
                  </span>
                </button>
              ))}
            </Section>
          )}

          {(pill === "all" || pill === "albums") && results.albums.length > 0 && (
            <Section title="Albums">
              {results.albums.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setBrowse({ kind: "album", value: entry.value })}
                  className="mp3-glass mp3-row mb-1.5 w-full"
                >
                  <Mp3nowArt src={entry.items.find((t) => t.coverArtDataUrl)?.coverArtDataUrl} name={entry.value} size="sm" rounded="rounded-[10px]" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13px] font-semibold">{entry.value}</span>
                    <span className="block text-[11px] text-[color:var(--m-muted)]">{entry.items.length} songs</span>
                  </span>
                </button>
              ))}
            </Section>
          )}

          {(pill === "all" || pill === "playlists") && results.playlists.length > 0 && (
            <Section title="Playlists">
              {results.playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => onOpenPlaylist(playlist)}
                  className="mp3-glass mp3-row mb-1.5 w-full"
                >
                  <Mp3nowArt src={playlist.coverArtDataUrl} name={playlist.name} size="sm" rounded="rounded-[10px]" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13px] font-semibold">{playlist.name}</span>
                    <span className="block text-[11px] text-[color:var(--m-muted)]">
                      {playlist.trackCount || 0} songs
                    </span>
                  </span>
                  <Disc3 className="h-4 w-4 text-[color:var(--m-muted)]" />
                </button>
              ))}
            </Section>
          )}

          {results.songs.length === 0 && results.playlists.length === 0 && (
            <p className="px-1 text-[12px] text-[color:var(--m-muted)]">No matches for “{term}”.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--m-muted)]">{title}</h2>
      {children}
    </section>
  );
}

function groupBy(tracks, field) {
  const map = new Map();
  for (const track of tracks) {
    const value = track[field];
    if (!value || value === "Unknown Album" || value === "Unknown Artist") continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(track);
  }
  return [...map.entries()].map(([value, items]) => ({ value, items })).sort((a, b) => a.value.localeCompare(b.value));
}