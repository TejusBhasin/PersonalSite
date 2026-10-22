import { useState } from "react";
import { ExternalLink, Heart, Play } from "lucide-react";

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

export default function WatchPanel({ video, onWatch, liked, onToggleLike }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

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
              key={videoId}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
              title="Video player"
              className="w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              onClick={onToggleLike}
              className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md px-3 py-1.5 transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-[#ff4d4d] text-[#ff4d4d]" : ""}`} />
              {liked ? "Liked" : "Like"}
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open on YouTube
            </a>
          </div>
        </>
      ) : (
        <p className="text-sm text-neutral-500">
          Paste a YouTube link above, or find something on the Search or Shorts tabs.
        </p>
      )}
    </div>
  );
}