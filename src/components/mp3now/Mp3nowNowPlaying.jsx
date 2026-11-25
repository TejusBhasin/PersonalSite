import { ChevronDown, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Loader2 } from "lucide-react";
import Mp3nowArt from "@/components/mp3now/Mp3nowArt";
import { usePlayer } from "@/lib/mp3now/player";
import { fmtTime, subtitleFor } from "@/lib/mp3now/format";

export default function Mp3nowNowPlaying({ onClose }) {
  const { current, playing, loading, error, position, duration, toggle, next, prev, seek, repeat, setRepeat, shuffle, setShuffle, queue, index } = usePlayer();

  if (!current) return null;

  const cycleRepeat = () => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off");
  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className="mp3-sheet-backdrop" onClick={onClose} role="dialog" aria-label="Now playing">
      <div className="mp3-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={onClose} className="mp3-iconbtn" aria-label="Close player">
            <ChevronDown className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--m-muted)]">
            {queue.length ? `${index + 1} of ${queue.length}` : "Now playing"}
          </span>
          <span className="w-[34px]" />
        </div>

        <div className="relative mx-auto mb-5 w-full max-w-[280px]">
          <div
            className="absolute inset-0 -z-10 blur-3xl"
            style={{ background: "radial-gradient(circle at 50% 60%, var(--m-blue-soft), transparent 70%)" }}
          />
          <div className="aspect-square w-full">
            <Mp3nowArt src={current.coverArtDataUrl} name={current.title} size="lg" rounded="rounded-[24px]" />
          </div>
        </div>

        <h2 className="truncate text-center text-[17px] font-semibold">{current.title}</h2>
        <p className="mt-0.5 truncate text-center text-[12px] text-[color:var(--m-muted)]">{subtitleFor(current)}</p>

        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={duration || current.duration || 1}
            step={1}
            value={Math.min(position, duration || current.duration || 1)}
            onChange={(event) => seek(Number(event.target.value))}
            className="w-full"
            style={{ accentColor: "var(--m-blue)" }}
            aria-label="Seek"
          />
          <div className="mt-1 flex justify-between text-[10.5px] tabular-nums text-[color:var(--m-muted)]">
            <span>{fmtTime(position)}</span>
            <span>{fmtTime(duration || current.duration)}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setShuffle(!shuffle)}
            className={`mp3-iconbtn ${shuffle ? "active" : ""}`}
            aria-label="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button type="button" onClick={prev} className="mp3-iconbtn" aria-label="Previous">
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="flex h-14 w-14 items-center justify-center rounded-full text-white"
            style={{ background: "linear-gradient(180deg, var(--m-blue-2), var(--m-blue))", boxShadow: "0 14px 30px -14px var(--m-blue)" }}
            aria-label={playing ? "Pause" : "Play"}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : playing ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="h-6 w-6 translate-x-[1px] fill-current" />
            )}
          </button>
          <button type="button" onClick={next} className="mp3-iconbtn" aria-label="Next">
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={cycleRepeat}
            className={`mp3-iconbtn ${repeat !== "off" ? "active" : ""}`}
            aria-label="Repeat"
          >
            <RepeatIcon className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mt-3 text-center text-[11.5px] text-[color:var(--m-danger)]">{error}</p>}

        {queue.length > 1 && (
          <div className="mt-5">
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--m-muted)]">
              Up next
            </h3>
            <div className="max-h-[168px] overflow-y-auto">
              {queue.slice(index + 1, index + 25).map((item, offset) => (
                <div key={`${item.track.id}-${offset}`} className="flex items-center gap-2.5 px-1 py-1.5">
                  <span className="w-4 text-[10.5px] tabular-nums text-[color:var(--m-muted)]">{offset + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-semibold">{item.track.title}</span>
                    <span className="block truncate text-[10.5px] text-[color:var(--m-muted)]">{item.track.artist}</span>
                  </span>
                  {item.badge && <span className="mp3-chip shrink-0">{item.badge}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}