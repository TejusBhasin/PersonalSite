import { useMemo, useState } from "react";
import { X } from "lucide-react";

export default function AmmePlayer({ video, instance, onClose }) {
  const [streamError, setStreamError] = useState(false);

  const stream = useMemo(() => {
    const streams = video?.streams || [];
    if (!streams.length) return null;
    return streams.find((s) => s.itag === 22) || streams[streams.length - 1];
  }, [video]);

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
        {stream && !streamError ? (
          <video
            key={stream.url}
            controls
            poster={video.thumbnail}
            src={stream.url}
            className="w-full h-full"
            onError={() => setStreamError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-sm text-neutral-400">
              {stream
                ? "The stream could not be loaded. The instance may be busy, try another video."
                : "No proxy stream is available for this video."}
            </p>
          </div>
        )}
      </div>

      {video.description ? (
        <p className="text-xs text-neutral-500 whitespace-pre-line line-clamp-6">{video.description}</p>
      ) : null}

      {instance && (
        <p className="text-[10px] text-neutral-600">
          Streamed through {instance}. Your browser never contacts YouTube.
        </p>
      )}
    </section>
  );
}