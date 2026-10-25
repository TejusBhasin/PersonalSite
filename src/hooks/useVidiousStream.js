import { useEffect, useRef, useState } from "react";
import dashjs from "dashjs";

// Shared stream setup for the /vidious page: probes the public Invidious
// instances live in this browser (cached instance first, per the
// official /api/manifest/dash/id/{id}?local=true endpoint), then plays
// the proxied DASH stream with dash.js. Used by both the main player
// and the shorts feed.

const CACHE_KEY = "vidious_instance";

export function rememberInstance(url) {
  try { localStorage.setItem(CACHE_KEY, url); } catch { /* private mode */ }
}

export default function useVidiousStream({ videoId, instances = [] }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const instancesKey = (instances || []).filter(Boolean).join("|");
  const [streamUrl, setStreamUrl] = useState(null);
  const [workingInstance, setWorkingInstance] = useState("");
  const [probing, setProbing] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!videoId) {
      setProbing(false);
      setFailed(false);
      setStreamUrl(null);
      setWorkingInstance("");
      return;
    }
    setProbing(true);
    setFailed(false);
    setStreamUrl(null);
    setWorkingInstance("");

    (async () => {
      let cached = "";
      try { cached = localStorage.getItem(CACHE_KEY) || ""; } catch { /* private mode */ }
      const ordered = [...new Set([cached, ...instancesKey.split("|")].filter(Boolean))];
      for (const base of ordered) {
        const manifest = `${base}/api/manifest/dash/id/${videoId}?local=true`;
        try {
          const r = await fetch(manifest, { signal: AbortSignal.timeout(10000) });
          if (!r.ok) continue;
          const xml = await r.text();
          if (!xml.includes("<BaseURL>")) continue;
          if (cancelled) return;
          rememberInstance(base);
          setWorkingInstance(base);
          setStreamUrl(manifest);
          setProbing(false);
          return;
        } catch {
          // Instance unreachable from this network, try the next one.
        }
      }
      if (!cancelled) {
        setProbing(false);
        setFailed(true);
      }
    })();

    return () => { cancelled = true; };
  }, [videoId, instancesKey]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const player = dashjs.MediaPlayer().create();
    playerRef.current = player;
    player.initialize(videoRef.current, streamUrl, true);
    const onError = () => setFailed(true);
    player.on(dashjs.MediaPlayer.events.ERROR, onError);
    return () => {
      player.reset();
      playerRef.current = null;
    };
  }, [streamUrl]);

  return { videoRef, playerRef, streamUrl, workingInstance, probing, failed };
}