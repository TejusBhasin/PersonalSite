import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

// Lazy playback embed. Shows the video's own thumbnail until the visitor
// starts it, and if the embedded player cannot load (a browser extension or
// network blocking YouTube), it says so instead of leaving a black frame.

export default function Player({ videoId, title = "Video player", autoplay = false }) {
  const [started, setStarted] = useState(Boolean(autoplay));
  const [blocked, setBlocked] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setBlocked(false);
    setStarted(Boolean(autoplay));
  }, [videoId, autoplay]);

  useEffect(() => {
    if (!started) return undefined;
    const timer = setTimeout(() => {
      if (!loadedRef.current) setBlocked(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [started, videoId]);

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1${autoplay ? "&autoplay=1&mute=1" : ""}`;

  if (!started) {
    return (
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="absolute inset-0 w-full h-full group"
        aria-label={`Play ${title}`}
      >
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <span className="w-14 h-14 rounded-full bg-[#ff4d4d] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <>
      <iframe
        key={videoId}
        src={src}
        title={title}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => {
          loadedRef.current = true;
        }}
      />
      {blocked && (
        <div className="absolute inset-0 bg-[#0f0f0f]/95 flex flex-col items-center justify-center gap-3 px-6 text-center z-10">
          <p className="text-sm text-neutral-300">
            The player can&apos;t load here. A browser extension or your network may be blocking YouTube.
          </p>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#ff4d4d] hover:bg-[#ff3838] text-white text-sm font-semibold rounded-md px-4 py-2 transition-colors"
          >
            Open on YouTube
          </a>
        </div>
      )}
    </>
  );
}