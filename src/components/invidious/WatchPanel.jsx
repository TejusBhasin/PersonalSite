import { useState } from "react";
import { ExternalLink, Heart, Play, RefreshCw } from "lucide-react";

// Accepts full YouTube URLs (watch, youtu.be, embed, shorts, live) or a bare video ID.
const parseVideoId = (input) => {
  const s = (input || "").trim();
  if (!s) return null;
  const patterns = [
    /youtube\.com\/watch\?[^#]*v=([\w-]{6,})/i,
    /youtu\.be\/([\w-]{6,})/i,
    /youtube\.com\/embed\/([\w-]{6,})/i,
    /youtube\.com\/shorts\/([\w-]{6,})/i,
    /youtube\.com\/live\/([\w-]{6,})/i
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m) return m[1];
  }
  return /^[\w-]{6,15}$/.test(s) ? s : null;
};

export default function WatchPanel({ instances, instanceIndex, onSelectInstance, video, onWatch, liked, onToggleLike }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const instance = instances[instanceIndex] || instances[0];
  const videoId = video?.videoId || "";

  const submit = (e) => {
    e.preventDefault();
    const id = parseVideoId(input);
    if (id) {
      onWatch({ videoId: id });
      setError("");
    } else {
      setError("Paste a YouTube link or video ID.");
    }
  };

  if (!instance) {
    return <p className="max-w-5xl mx-auto px-4 py-6 text-sm text-neutral-500">No instances synced yet.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="YouTube link or video ID"
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-4 py-2.5 text-sm focus:border-neutral-500 outline-none placeholder:text-neutral-600"
        />
        <button
          type="submit"
          className="bg-[#ff4d4d] hover:bg-[#ff3838] text-white font-semibold rounded-md px-5 py-2.5 text-sm inline-flex items-center gap-2 transition-colors"
        >
          <Play className="w-4 h-4" /> Watch
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {videoId ? (
        <>
          {video?.title && <p className="text-base font-semibold">{video.title}</p>}
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              key={`${instance.uri}-${videoId}`}
              src={`${instance.uri}/embed/${videoId}?autoplay=1&local=true`}
              title="Video player"
              className="w-full h-full"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-neutral-400">Instance</span>
            <select
              value={instanceIndex}
              onChange={(e) => onSelectInstance(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm outline-none"
            >
              {instances.map((inst, idx) => (
                <option key={inst.id} value={idx}>
                  {inst.flag} {inst.name}{inst.down ? " (down)" : ""} · {Math.round(inst.uptime || 0)}%
                </option>
              ))}
            </select>
            <button
              onClick={() => onSelectInstance((instanceIndex + 1) % instances.length)}
              className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md px-3 py-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try another instance
            </button>
            <button
              onClick={onToggleLike}
              className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md px-3 py-1.5 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#ff4d4d] text-[#ff4d4d]" : ""}`} />
              {liked ? "Liked" : "Like"}
            </button>
            <a
              href={`${instance.uri}/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open on {instance.name}
            </a>
          </div>
          {instance.down && (
            <p className="text-xs text-amber-400">
              This instance is currently reporting downtime, playback may fail. Try another instance.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          Paste a YouTube link above, or find something on the Search or Shorts tabs.
        </p>
      )}
    </div>
  );
}