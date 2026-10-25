import { X } from "lucide-react";
import useVidiousStream from "@/hooks/useVidiousStream";
import StreamControls from "@/components/vidious/StreamControls";

// Main video player for the /vidious page: plays the proxied DASH stream
// in-browser with native controls plus captions, playback speed, and
// quality selection.
export default function VidiousPlayer({ video, instances = [], onClose }) {
  const { videoRef, playerRef, streamUrl, workingInstance, probing, failed } = useVidiousStream({
    videoId: video?.videoId,
    instances
  });

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
            playsInline
            poster={video.thumbnail}
            className="w-full h-full"
          />
        ) : probing ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-neutral-400">
            <span className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
            Finding a working proxy instance...
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-sm text-neutral-400">
              No proxy instance could be reached from your network right now. Try again in a moment or pick another video.
            </p>
          </div>
        )}
      </div>

      {streamUrl && !failed && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <StreamControls
            videoRef={videoRef}
            playerRef={playerRef}
            instance={workingInstance}
            videoId={video.videoId}
          />
          <p className="text-[10px] text-neutral-600">
            Streamed through {workingInstance}. Your browser never contacts YouTube.
          </p>
        </div>
      )}

      {video.description ? (
        <p className="text-xs text-neutral-500 whitespace-pre-line line-clamp-6">{video.description}</p>
      ) : null}
    </section>
  );
}