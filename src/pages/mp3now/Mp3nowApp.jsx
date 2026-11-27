import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Mp3nowShell from "@/components/mp3now/Mp3nowShell";
import Mp3nowHome from "@/components/mp3now/Mp3nowHome";
import Mp3nowSearch from "@/components/mp3now/Mp3nowSearch";
import Mp3nowLibrary from "@/components/mp3now/Mp3nowLibrary";
import Mp3nowSettings from "@/components/mp3now/Mp3nowSettings";
import Mp3nowPlaylistView from "@/components/mp3now/Mp3nowPlaylistView";
import Mp3nowNowPlaying from "@/components/mp3now/Mp3nowNowPlaying";
import Mp3nowAiSheet from "@/components/mp3now/Mp3nowAiSheet";
import Mp3nowMiniPlayer from "@/components/mp3now/Mp3nowMiniPlayer";
import Mp3nowUnlock from "@/components/mp3now/Mp3nowUnlock";
import { Mp3nowPlayerProvider, usePlayer } from "@/lib/mp3now/player";
import { invalidateLibrary, isUnlocked, listPlaylists, playlistTracks, savePass, syncLibrary } from "@/lib/mp3now/api";
import { listOfflineIds } from "@/lib/mp3now/offline";
import { resolveTheme } from "@/lib/mp3now/settings";

// The passcode is the only door into MP3now. It is asked once per device, and the signed
// token it returns is what the library calls travel with.
export default function Mp3nowApp() {
  const [unlocked, setUnlocked] = useState(isUnlocked);

  usePwaHead();

  useEffect(() => {
    const lock = () => setUnlocked(false);
    window.addEventListener("mp3now:locked", lock);
    return () => window.removeEventListener("mp3now:locked", lock);
  }, []);

  if (!unlocked) {
    return (
      <Mp3nowUnlock
        onUnlock={(token) => {
          savePass(token);
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <Mp3nowPlayerProvider>
      <Experience />
    </Mp3nowPlayerProvider>
  );
}

function Experience() {
  const { settings, markOffline, startRadio } = usePlayer();
  const [theme, setTheme] = useState(() => resolveTheme(settings.theme));
  const [tab, setTab] = useState("home");
  const [playlists, setPlaylists] = useState([]);
  const [listState, setListState] = useState("loading");
  const [detail, setDetail] = useState(null);
  const [detailTracks, setDetailTracks] = useState([]);
  const [detailState, setDetailState] = useState("idle");
  const [nowOpen, setNowOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [syncState, setSyncState] = useState({ busy: false, message: "", error: "" });
  const autoSyncStarted = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(resolveTheme(settings.theme));
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [settings.theme]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = tag("meta", { name: "theme-color" });
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", theme === "dark" ? "#070D19" : "#F0F7FF");
  }, [theme]);

  const refresh = async () => {
    try {
      const rows = await listPlaylists();
      setPlaylists(rows);
      setListState("ready");
    } catch {
      setListState("error");
    }
  };

  useEffect(() => {
    refresh();
    listOfflineIds()
      .then(markOffline)
      .catch(() => null);
  }, [markOffline]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  const openPlaylist = async (playlist) => {
    setDetail(playlist);
    setDetailState("loading");
    setDetailTracks([]);
    try {
      const tracks = await playlistTracks(playlist.id);
      setDetailTracks(tracks);
      setDetailState("ready");
    } catch {
      setDetailState("error");
    }
  };

  const runSync = async () => {
    setSyncState({ busy: true, message: "", error: "" });
    try {
      const result = await syncLibrary();
      invalidateLibrary();
      await refresh();
      setSyncState({
        busy: false,
        message: `${result.tracks} songs in ${result.playlists} playlists · ${result.added} new, ${result.removed} removed${
          result.truncated ? " (first 12,000 files)" : ""
        }`,
        error: "",
      });
    } catch (error) {
      setSyncState({ busy: false, message: "", error: error.message || "The MEGA sync failed." });
    }
  };

  // Every passcode login re-reads the MEGA folders, so files added there show up without
  // pressing sync. Cached playlists render first; the list refreshes when the pull finishes.
  useEffect(() => {
    if (autoSyncStarted.current) return;
    autoSyncStarted.current = true;
    runSync();
  }, []);

  const onStartListening = async () => {
    try {
      await startRadio();
      setNowOpen(true);
    } catch (error) {
      flash(error.message || "Nothing to play yet.");
    }
  };

  const goTab = (next) => {
    setDetail(null);
    setTab(next);
  };

  const renderView = () => {
    if (detail) {
      return (
        <Mp3nowPlaylistView
          playlist={detail}
          tracks={detailTracks}
          state={detailState}
          playlists={playlists}
          onBack={() => setDetail(null)}
        />
      );
    }
    if (tab === "search") return <Mp3nowSearch playlists={playlists} onOpenPlaylist={openPlaylist} />;
    if (tab === "library") return <Mp3nowLibrary />;
    if (tab === "settings") {
      return <Mp3nowSettings onSync={runSync} syncState={syncState} />;
    }
    return (
      <Mp3nowHome
        playlists={playlists}
        loading={listState === "loading"}
        showAutoplay={settings.startListening}
        syncing={syncState.busy}
        onStartListening={onStartListening}
        onOpenPlaylist={openPlaylist}
        onAiPlaylist={() => setAiOpen(true)}
      />
    );
  };

  return (
    <div className="mp3now" data-theme={theme}>
      <Mp3nowShell tab={tab} onTab={goTab} hasPlayer>
        {renderView()}
        <Mp3nowMiniPlayer onOpen={() => setNowOpen(true)} />
      </Mp3nowShell>
      {notice && (
        <div className="mp3-glass fixed left-1/2 top-4 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-[11.5px] font-semibold">
          {notice}
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {nowOpen && <Mp3nowNowPlaying onClose={() => setNowOpen(false)} />}
      {aiOpen && (
        <Mp3nowAiSheet
          onClose={() => setAiOpen(false)}
          onCreated={async (playlist) => {
            await refresh();
            openPlaylist(playlist);
          }}
        />
      )}
    </div>
  );
}

// PWA + no-index tags live only while MP3now is on screen, so the portfolio keeps its own head.
function usePwaHead() {
  useEffect(() => {
    const tags = [
      tag("meta", { name: "robots", content: "noindex, nofollow" }),
      tag("link", { rel: "manifest", href: "/mp3now-manifest.json" }),
      tag("meta", { name: "theme-color", content: "#F0F7FF" }),
      tag("meta", { name: "apple-mobile-web-app-capable", content: "yes" }),
      tag("meta", { name: "mobile-web-app-capable", content: "yes" }),
      tag("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }),
      tag("meta", { name: "apple-mobile-web-app-title", content: "MP3now" }),
      tag("link", { rel: "apple-touch-icon", sizes: "180x180", href: "/mp3now-icon-180.png" }),
    ];
    tags.forEach((node) => document.head.appendChild(node));
    return () => tags.forEach((node) => node.remove());
  }, []);
}

function tag(name, attrs) {
  const node = document.createElement(name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
}