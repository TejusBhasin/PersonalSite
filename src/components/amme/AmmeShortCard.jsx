import { useEffect, useState } from "react";
import { ChevronDown, Heart, Loader2, Volume2, VolumeX } from "lucide-react";
import useAmmeStream from "@/hooks/useAmmeStream";
import StreamControls from "@/components/amme/StreamControls";
import { fmtViews } from "@/lib/invidiousFormat";

// One slot in the AMME shorts feed. The active slot streams through the
// browser-side proxy (muted autoplay, tap to unmute); inactive slots
// show the thumbnail. Ends or errors hand control back to the feed.
export default function AmmeShortCard({ short, active, instances, onNext, liked, onToggleLike }) {
  const { videoRef, playerRef, streamUrl, workingInstance, probing, failed } = useAmmeStream({
    videoId: active ? short.videoId : null,
    instances
  });
  const [muted, setMuted] = useState(true);

  // If this short cannot load at all, skip ahead shortly.
  useEffect(() => {
    if (!active || !failed) return;
    const t = setTimeout(onNext, 1500);
    return () => clearTimeout(t);
  }, [active, failed, onNext]);

  const railBtn = "w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors";

  return (
    <div className="h-full snap-start snap-always flex items-center justify-center px-2">
      <div className="relative h-full max-h-[85vh] aspect-[9/16] rounded-2xl overflow-hidden bg-black">
        {active && streamUrl && !failed ? (
          <video
            key={streamUrl}
            ref={videoRef}
            autoPlay
            muted={muted}
            playsInline
            onEnded={onNext}
            className="w-full h-full object-cover"
          />
        ) : (
          short.thumbnail && (
            <img
              src={short.thumbnail}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )
        )}

        {active && probing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="w-6 h-6 animate-spin text-white/70" />
          </div>
        )}

        {active && failed && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center bg-black/60">
            <p className="text-xs text-white/70">This one couldn&apos;t load. Skipping ahead...</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 pb-6 bg-gradient-to-t from-black/85 to-transparent pointer-events-none">
          <p className="text-sm font-semibold line-clamp-2">{short.title || "Short"}</p>
          {short.viewCount > 0 && <p className="text-xs text-neutral-400 mt-1">{fmtViews(short.viewCount)}</p>}
        </div>

        {active && streamUrl && !failed && (
          <div className="absolute left-3 bottom-20">
            <StreamControls
              videoRef={videoRef}
              playerRef={playerRef}
              instance={workingInstance}
              videoId={short.videoId}
              compact
            />
          </div>
        )}

        <div className="absolute right-3 bottom-6 flex flex-col gap-3">
          <button onClick={() => setMuted((m) => !m)} className={railBtn} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          <button onClick={onToggleLike} className={railBtn} aria-label={liked ? "Unlike" : "Like"}>
            <Heart className={`w-5 h-5 ${liked ? "fill-[#ff4d4d] text-[#ff4d4d]" : "text-white"}`} />
          </button>
          <button onClick={onNext} className={railBtn} aria-label="Next short">
            <ChevronDown className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}