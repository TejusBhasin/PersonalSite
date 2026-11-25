import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { fetchTrackBlob } from "@/lib/mp3now/mega";
import { readTags } from "@/lib/mp3now/id3";
import { getOfflineBlob, putOfflineTrack, removeOfflineTrack } from "@/lib/mp3now/offline";
import { fillPlaylistArt, getTrackPool } from "@/lib/mp3now/api";
import { loadSettings, saveSettings } from "@/lib/mp3now/settings";

const PlayerContext = createContext(null);

export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("usePlayer must be used inside Mp3nowPlayerProvider");
  return value;
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Mp3nowPlayerProvider({ children }) {
  const audio = useMemo(() => (typeof Audio === "undefined" ? null : new Audio()), []);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState("off");
  const [shuffleOn, setShuffleOn] = useState(false);
  const [settings, setSettings] = useState(() => loadSettings());
  const [offlineIds, setOfflineIds] = useState(() => new Set());
  const [downloading, setDownloading] = useState(() => new Set());

  const blobs = useRef(new Map());
  const urls = useRef(new Map());
  const prefetching = useRef(new Set());
  const queueRef = useRef(queue);
  const indexRef = useRef(index);
  const repeatRef = useRef(repeat);
  const settingsRef = useRef(settings);

  queueRef.current = queue;
  indexRef.current = index;
  repeatRef.current = repeat;
  settingsRef.current = settings;

  const current = index >= 0 ? queue[index]?.track || null : null;
  const currentRef = useRef(current);
  currentRef.current = current;

  const getBlob = useCallback(async (track) => {
    if (blobs.current.has(track.id)) return blobs.current.get(track.id);
    const stored = await getOfflineBlob(track.id).catch(() => null);
    const blob = stored || (await fetchTrackBlob(track.megaNodeId));
    blobs.current.set(track.id, blob);
    return blob;
  }, []);

  const applyTags = useCallback(async (track, blob) => {
    const tags = await readTags(blob);
    if (!tags) return;
    const patch = { metadataLoaded: true };
    if (tags.title) patch.title = tags.title;
    if (tags.artist) patch.artist = tags.artist;
    if (tags.album) patch.album = tags.album;
    if (tags.genre) patch.genre = tags.genre;
    if (tags.duration) patch.duration = tags.duration;
    if (tags.coverArtDataUrl) patch.coverArtDataUrl = tags.coverArtDataUrl;
    await base44.entities.Track.update(track.id, patch);
    setQueue((list) =>
      list.map((item) => (item.track.id === track.id ? { ...item, track: { ...item.track, ...patch } } : item))
    );
    if (patch.coverArtDataUrl) await fillPlaylistArt(track.id, patch.coverArtDataUrl).catch(() => null);
  }, []);

  const setSession = useCallback((track) => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title || "Unknown title",
        artist: track.artist || "Unknown Artist",
        album: track.album && track.album !== "Unknown Album" ? track.album : "",
        artwork: track.coverArtDataUrl
          ? [{ src: track.coverArtDataUrl, sizes: "200x200", type: "image/jpeg" }]
          : [],
      });
    } catch {
      // Older Safari without MediaMetadata still plays normally.
    }
  }, []);

  const startTrack = useCallback(
    async (track) => {
      if (!audio || !track) return;
      setLoading(true);
      setError("");
      try {
        const blob = await getBlob(track);
        let url = urls.current.get(track.id);
        if (!url) {
          url = URL.createObjectURL(blob);
          urls.current.set(track.id, url);
        }
        audio.src = url;
        await audio.play();
        setPlaying(true);
        setSession(track);
        if (!track.metadataLoaded) applyTags(track, blob).catch(() => null);
      } catch (e) {
        setError(e?.message || "This track could not be played.");
        setPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [audio, getBlob, applyTags, setSession]
  );

  const playTrack = useCallback(
    (track, list) => {
      const items = (list && list.length ? list : [track]).map((item) => ({ track: item }));
      const at = Math.max(0, items.findIndex((item) => item.track.id === track.id));
      setQueue(items);
      setIndex(at);
      startTrack(track);
    },
    [startTrack]
  );

  const playQueue = useCallback(
    (tracks, startAt = 0) => {
      if (!tracks.length) return;
      const ordered = shuffleOn ? shuffle(tracks) : tracks;
      const at = Math.min(Math.max(startAt, 0), ordered.length - 1);
      setQueue(ordered.map((track) => ({ track })));
      setIndex(at);
      startTrack(ordered[at]);
    },
    [shuffleOn, startTrack]
  );

  const goTo = useCallback(
    (nextIndex) => {
      const list = queueRef.current;
      if (nextIndex < 0 || nextIndex >= list.length) return;
      setIndex(nextIndex);
      startTrack(list[nextIndex].track);
    },
    [startTrack]
  );

  const next = useCallback(() => {
    const list = queueRef.current;
    if (!list.length) return;
    const at = indexRef.current;
    if (at + 1 < list.length) goTo(at + 1);
    else if (repeatRef.current === "all") goTo(0);
    else audio?.pause();
  }, [audio, goTo]);

  const prev = useCallback(() => {
    if (!audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const at = indexRef.current;
    if (at > 0) goTo(at - 1);
    else audio.currentTime = 0;
  }, [audio, goTo]);

  const toggle = useCallback(() => {
    if (!audio || !currentRef.current) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, [audio]);

  const seek = useCallback(
    (seconds) => {
      if (!audio) return;
      audio.currentTime = Math.max(0, seconds);
      setPosition(audio.currentTime);
    },
    [audio]
  );

  const buildAutoplay = useCallback(async (track, list) => {
    const pool = await getTrackPool();
    const played = new Set(list.map((item) => item.track.id));
    const picked = [];
    const seen = new Set();
    const push = (candidate, badge) => {
      if (!candidate || played.has(candidate.id) || seen.has(candidate.id)) return;
      if (picked.length >= 8) return;
      seen.add(candidate.id);
      picked.push({ track: candidate, badge });
    };
    if (track) {
      pool.filter((t) => t.artist && t.artist === track.artist).forEach((t) => push(t, "Autoplay Next"));
      if (track.genre) pool.filter((t) => t.genre && t.genre === track.genre).forEach((t) => push(t, "Autoplay Next"));
      if (track.folderPath) pool.filter((t) => t.folderPath === track.folderPath).forEach((t) => push(t, "Autoplay Next"));
    }
    shuffle(pool).forEach((t) => push(t, "Autoplay Next"));
    return picked;
  }, []);

  const startRadio = useCallback(async () => {
    const pool = await getTrackPool();
    if (!pool.length) throw new Error("Nothing to play yet. Sync your MEGA folders first.");
    const ordered = shuffle(pool).slice(0, 60);
    setQueue(ordered.map((track) => ({ track, badge: "Radio" })));
    setIndex(0);
    startTrack(ordered[0]);
  }, [startTrack]);

  const downloadTracks = useCallback(
    async (tracks) => {
      const ids = tracks.map((track) => track.id);
      setDownloading((set) => new Set([...set, ...ids]));
      try {
        for (const track of tracks) {
          const blob = await getBlob(track);
          await putOfflineTrack(track.id, blob);
          setOfflineIds((set) => new Set([...set, track.id]));
        }
      } finally {
        setDownloading((set) => {
          const copy = new Set(set);
          ids.forEach((id) => copy.delete(id));
          return copy;
        });
      }
    },
    [getBlob]
  );

  const removeDownload = useCallback(async (trackId) => {
    await removeOfflineTrack(trackId);
    setOfflineIds((set) => {
      const copy = new Set(set);
      copy.delete(trackId);
      return copy;
    });
  }, []);

  const updateSettings = useCallback((patch) => {
    setSettings((current) => saveSettings({ ...current, ...patch }));
  }, []);

  const markOffline = useCallback((ids) => setOfflineIds(new Set(ids)), []);

  // Audio element events
  useEffect(() => {
    if (!audio) return;
    const onTime = () => {
      setPosition(audio.currentTime);
      const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
      if (ratio >= 0.75) {
        const list = queueRef.current;
        const upcoming = list[indexRef.current + 1]?.track;
        if (upcoming && !blobs.current.has(upcoming.id) && !prefetching.current.has(upcoming.id)) {
          prefetching.current.add(upcoming.id);
          getBlob(upcoming)
            .catch(() => null)
            .finally(() => prefetching.current.delete(upcoming.id));
        }
      }
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setError("Playback failed. Try the track again.");
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
    };
  }, [audio, getBlob]);

  // Track end: repeat, then the queue, then continuous autoplay.
  useEffect(() => {
    if (!audio) return;
    const onEnded = async () => {
      const list = queueRef.current;
      const at = indexRef.current;
      if (repeatRef.current === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => null);
        return;
      }
      if (at + 1 < list.length) {
        goTo(at + 1);
        return;
      }
      if (repeatRef.current === "all" && list.length) {
        goTo(0);
        return;
      }
      if (!settingsRef.current.autoplay) {
        setPlaying(false);
        return;
      }
      try {
        const extra = await buildAutoplay(currentRef.current, list);
        if (!extra.length) {
          setPlaying(false);
          return;
        }
        setQueue([...list, ...extra]);
        setIndex(at + 1);
        startTrack(extra[0].track);
      } catch {
        setPlaying(false);
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [audio, goTo, buildAutoplay, startTrack]);

  // Lock screen / Control Center transport controls
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const handlers = {
      play: () => audio?.play().catch(() => null),
      pause: () => audio?.pause(),
      previoustrack: () => prev(),
      nexttrack: () => next(),
      seekto: (details) => {
        if (audio && details.seekTime != null) audio.currentTime = details.seekTime;
      },
    };
    Object.entries(handlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Unsupported actions are fine to skip.
      }
    });
    return () => {
      Object.keys(handlers).forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      });
    };
  }, [audio, next, prev]);

  const value = {
    current,
    queue,
    index,
    playing,
    loading,
    error,
    position,
    duration,
    repeat,
    setRepeat,
    shuffle: shuffleOn,
    setShuffle: setShuffleOn,
    settings,
    updateSettings,
    offlineIds,
    downloading,
    markOffline,
    playTrack,
    playQueue,
    toggle,
    next,
    prev,
    seek,
    startRadio,
    downloadTracks,
    removeDownload,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}