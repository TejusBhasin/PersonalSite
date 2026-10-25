import { useEffect, useRef, useState } from "react";
import dashjs from "dashjs";
import { Loader2, X } from "lucide-react";

const CACHE_KEY = "amme_instance";

// Finds the first public Invidious instance whose proxied DASH manifest
// this browser can reach, then plays the video through it. The working
// instance is cached in localStorage so later videos start instantly.
export default function AmmePlayer({ video, instances = [], onClose }) {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [workingInstance, setWorkingInstance] = useState("");
  const [trying, setTrying] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTrying(true);
    setFailed(false);
    setStreamUrl(null);
    setWorkingInstance("");

    (async () => {
      let cached = "";
      try {
        cached = localStorage.getItem(CACHE_KEY) || "";
      } catch {
        cached = "";
      }
      const ordered = [...new Set([cached, ...instances].filter(Boolean))];
      for (const base of ordered) {
        const manifest = `${base}/api/manifest/dash/id/${video.videoId}?local=true`;
        try {
          const r = await fetch(manifest, { signal: AbortSignal.timeout(10000) });
          if (!r.ok) continue;
          const xml = await r.text();
          if (!xml.includes("<BaseURL>")) continue;
          if (cancelled) return;
          try {
            localStorage.setItem(CACHE_KEY, base);
          } catch {
            /* private mode, no cache */
          }
          setWorkingInstance(base);
          setStreamUrl(manifest);
          setTrying(false);
          return;
        } catch {
          // Instance unreachable from this network, try the next one.
        }
      }
      if (!cancelled) {
        setTrying(false);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [video?.videoId, instances]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;
    const player = dashjs.MediaPlayer().create();
    player.initialize(videoRef.current, streamUrl, true);
    const onError = () => setFailed(true);
    player.on(dashjs.MediaPlayer.events.ERROR, onError);
    return () => player.reset();
  }, [streamUrl]);

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold line-clamp-2">{video.title}</h2>
          {video.author && <p className="text-xs text-neutral-500 truncate">{video.author}</p>}
        </div>
        <button
          onClick={onClose}
          aria-label="Close player"
          className="w-8 h-8 rounded-md bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {streamUrl && !failed ? (
          <video
            key={streamUrl}
            ref={videoRef}
            controls
            autoPlay
            poster={video.thumbnail}
            className="w-full h-full"
          />
        ) : trying ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Finding a working proxy instance...
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-sm text-neutral-400">
              {failed
                ? "No proxy instance could be reached from your network right now. Try again in a moment or pick another video."
                : "No proxy stream is available for this video."}
            </p>
          </div>
        )}
      </div>

      {video.description ? (
        <p className="text-xs text-neutral-500 whitespace-pre-line line-clamp-6">{video.description}</p>
      ) : null}

      {workingInstance && !failed && (
        <p className="text-[10px] text-neutral-600">
          Streamed through {workingInstance}. Your browser never contacts YouTube.
        </p>
      )}
    </section>
  );
}