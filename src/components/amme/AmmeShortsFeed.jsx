import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AmmeShortCard from "@/components/amme/AmmeShortCard";
import { buildQueue } from "@/lib/ammeAlgorithm";

const TOPICS = ["Gaming", "Space", "AI", "Basketball", "History", "Cats", "Cooking", "Coding", "Science", "Football"];

// The AMME shorts doomscroll: pick a topic, and the feed keeps serving
// engagement-ranked shorts (see lib/ammeAlgorithm.js), auto-loading the
// next page as you near the end. Likes are kept in browser storage.

export default function AmmeShortsFeed() {
  const [topic, setTopic] = useState("");
  const [input, setInput] = useState("");
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [instances, setInstances] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [likedIds, setLikedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("amme_likes") || "[]")); } catch { return new Set(); }
  });
  const seen = useRef(new Set());
  const scrollRef = useRef(null);

  const fetchPage = useCallback(async (t, cont) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("ammeSearch", { q: t, mode: "shorts", continuation: cont });
      const d = res?.data ?? res;
      setInstances(d?.instances || []);
      const fresh = buildQueue(d?.results || [], seen.current);
      for (const s of fresh) seen.current.add(s.videoId);
      if (!fresh.length) {
        setNext(null);
        if (!cont) setError("No shorts found for that. Try another topic.");
      } else {
        setNext(d?.next || null);
      }
      setQueue((q) => [...q, ...fresh]);
    } catch (err) {
      setNext(null);
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Feed failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const start = (t) => {
    const clean = (t || "").trim();
    if (!clean) return;
    setTopic(clean);
    setQueue([]);
    setIdx(0);
    setNext(null);
    seen.current = new Set();
    fetchPage(clean, null);
  };

  const goNext = useCallback(() => {
    setIdx((i) => i + 1);
  }, []);

  // Keep the doomscroll infinite: fetch the next page before it runs dry.
  useEffect(() => {
    if (topic && next && !loading && queue.length - idx <= 3) {
      fetchPage(topic, next);
    }
  }, [topic, next, loading, queue.length, idx, fetchPage]);

  const toggleLike = (short) => {
    setLikedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(short.videoId)) updated.delete(short.videoId);
      else updated.add(short.videoId);
      try { localStorage.setItem("amme_likes", JSON.stringify([...updated])); } catch { /* private mode */ }
      return updated;
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== idx && i >= 0) setIdx(i);
  };

  if (!topic) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-1">Shorts</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Pick a rabbit hole. The feed ranks what it serves and never runs out.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); start(input); }}
          className="flex gap-2 mb-8 max-w-xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you want to doomscroll?"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-4 py-2.5 text-sm focus:border-neutral-500 outline-none placeholder:text-neutral-600"
          />
          <button
            type="submit"
            className="bg-[#ff4d4d] hover:bg-[#ff3838] text-white font-semibold rounded-md px-5 py-2.5 text-sm inline-flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" /> Start
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((chip) => (
            <button
              key={chip}
              onClick={() => start(chip)}
              className="bg-neutral-800 hover:bg-neutral-700 rounded-full px-4 py-2 text-sm transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-2 text-xs text-neutral-500 max-w-3xl mx-auto w-full">
        <span className="truncate flex items-center gap-2">
          Feed: <span className="text-neutral-300 font-medium">{topic}</span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        </span>
        <button onClick={() => { setTopic(""); setQueue([]); }} className="hover:text-white transition-colors">
          New topic
        </button>
      </div>

      {error && queue.length === 0 && (
        <div className="max-w-3xl mx-auto px-4 py-10 text-center text-sm text-red-400">{error}</div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-230px)] min-h-[480px] overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
        {queue.map((short, i) => (
          <AmmeShortCard
            key={`${short.videoId}-${i}`}
            short={short}
            active={i === idx}
            instances={instances}
            onNext={goNext}
            liked={likedIds.has(short.videoId)}
            onToggleLike={() => toggleLike(short)}
          />
        ))}

        {!next && !loading && queue.length > 0 && idx >= queue.length - 1 ? (
          <div className="h-full snap-start flex flex-col items-center justify-center gap-3 text-neutral-500 text-sm">
            <p>That&apos;s the whole hole.</p>
            <button
              onClick={() => { setTopic(""); setQueue([]); }}
              className="bg-neutral-800 hover:bg-neutral-700 rounded-full px-5 py-2.5 transition-colors"
            >
              Pick a new topic
            </button>
          </div>
        ) : (
          <div className="h-full snap-start flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        )}
      </div>
    </div>
  );
}