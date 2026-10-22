import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fmtViews } from "@/lib/invidiousFormat";

const DEFAULT_TOPICS = ["Gaming", "Space", "AI", "Basketball", "History", "Cats", "Cooking", "Coding"];

export default function ShortsFeed({ instances, prefs, onToggleLike, onAddTopic }) {
  const [topicInput, setTopicInput] = useState("");
  const [feed, setFeedState] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const feedRef = useRef(null);
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);

  const setFeed = (next) => {
    feedRef.current = next;
    setFeedState(next);
  };

  const instance =
    instances.find((i) => i.name === prefs.preferred_instance && !i.down) ||
    instances.find((i) => !i.down) ||
    instances[0];

  const runFetch = async (core) => {
    setFeed({ ...core, loadingMore: true, error: "" });
    try {
      const res = await base44.functions.invoke("invidiousSearch", {
        q: core.topic,
        mode: "shorts",
        continuation: core.next
      });
      const data = res?.results ?? res?.data?.results ?? null;
      const next = res?.next ?? res?.data?.next ?? null;
      if (!data) throw new Error(res?.error || res?.data?.error || "Feed failed");
      setFeed({
        ...core,
        items: [...core.items, ...data],
        next: next || null,
        loadingMore: false,
        done: data.length === 0 || !next
      });
    } catch (err) {
      setFeed({ ...core, loadingMore: false, error: err.message || "Feed failed" });
    }
  };

  const start = (t) => {
    const clean = (t || "").trim();
    if (!clean || !instance) return;
    onAddTopic(clean);
    setActiveIdx(0);
    runFetch({ topic: clean, items: [], next: null, done: false, loadingMore: false, error: "" });
  };

  const loadMore = () => {
    const f = feedRef.current;
    if (!f || f.loadingMore || f.done || f.error) return;
    runFetch({ topic: f.topic, items: f.items, next: f.next, done: false, loadingMore: false, error: "" });
  };

  const scrollToIdx = (idx) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== activeIdx) setActiveIdx(idx);
  };

  // Auto-load the next page when the sentinel comes into view.
  useEffect(() => {
    if (!feed || feed.loadingMore || feed.done || feed.error) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: containerRef.current, threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed]);

  const likedIds = new Set((prefs.liked || []).map((l) => l.videoId));

  // Topic picker before a feed starts.
  if (!feed) {
    const chips = [...new Set([...(prefs.shorts_topics || []), ...DEFAULT_TOPICS])].slice(0, 12);
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-1">Shorts</h2>
        <p className="text-sm text-neutral-500 mb-6">Pick a rabbit hole. Keep scrolling, it keeps going.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(topicInput);
          }}
          className="flex gap-2 mb-8"
        >
          <input
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
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
          {chips.map((chip) => (
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
      <div className="flex items-center justify-between px-4 py-2 text-xs text-neutral-500 max-w-3xl mx-auto w-full">
        <span className="truncate">
          Feed: <span className="text-neutral-300 font-medium">{feed.topic}</span> · {feed.items.length} shorts
        </span>
        <button onClick={() => setFeed(null)} className="hover:text-white transition-colors">
          New topic
        </button>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-190px)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
        {feed.items.map((item, idx) => {
          const liked = likedIds.has(item.videoId);
          const isActive = idx === activeIdx;
          return (
            <div key={`${item.videoId}-${idx}`} className="h-full snap-start snap-always flex items-center justify-center px-2">
              <div className="relative h-full max-h-[85vh] aspect-[9/16] rounded-2xl overflow-hidden bg-black">
                {Math.abs(idx - activeIdx) <= 1 ? (
                  <iframe
                    key={`${instance?.uri}-${item.videoId}-${isActive ? "play" : "idle"}`}
                    src={`${instance?.uri}/embed/${item.videoId}${isActive ? "?autoplay=1&local=true" : "?local=true"}`}
                    title={item.title}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                )}

                <div className="absolute inset-x-0 bottom-0 p-4 pb-6 bg-gradient-to-t from-black/85 to-transparent pointer-events-none">
                  <p className="text-sm font-semibold line-clamp-2">{item.title || "Short"}</p>
                  {item.viewCount > 0 && (
                    <p className="text-xs text-neutral-400 mt-1">{fmtViews(item.viewCount)}</p>
                  )}
                </div>

                <div className="absolute right-3 bottom-6 flex flex-col gap-3">
                  <button
                    onClick={() => onToggleLike(item)}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    aria-label={liked ? "Unlike" : "Like"}
                  >
                    <Heart className={`w-5 h-5 ${liked ? "fill-[#ff4d4d] text-[#ff4d4d]" : "text-white"}`} />
                  </button>
                  <button
                    onClick={() => scrollToIdx(idx + 1)}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                    aria-label="Next short"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!feed.done ? (
          <div ref={sentinelRef} className="h-full snap-start flex items-center justify-center">
            {feed.loadingMore ? (
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            ) : (
              <button
                onClick={loadMore}
                className="bg-neutral-800 hover:bg-neutral-700 rounded-full px-5 py-2.5 text-sm transition-colors"
              >
                Load more
              </button>
            )}
          </div>
        ) : (
          <div className="h-full snap-start flex flex-col items-center justify-center gap-3 text-neutral-500 text-sm">
            <p>That&apos;s the whole hole.</p>
            <button
              onClick={() => setFeed(null)}
              className="bg-neutral-800 hover:bg-neutral-700 rounded-full px-5 py-2.5 transition-colors"
            >
              Pick a new topic
            </button>
          </div>
        )}
      </div>
    </div>
  );
}