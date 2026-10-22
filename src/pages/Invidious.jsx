import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import useInvidiousPrefs from "@/hooks/useInvidiousPrefs";
import WatchPanel from "@/components/invidious/WatchPanel";
import SearchPanel from "@/components/invidious/SearchPanel";
import ShortsFeed from "@/components/invidious/ShortsFeed";
import HistoryPanel from "@/components/invidious/HistoryPanel";
import InstancesPanel from "@/components/invidious/InstancesPanel";

const TABS = [
  { id: "watch", label: "Watch" },
  { id: "search", label: "Search" },
  { id: "shorts", label: "Shorts" },
  { id: "history", label: "History" },
  { id: "instances", label: "Instances" }
];

export default function Invidious() {
  const [instances, setInstances] = useState(null);
  const [tab, setTab] = useState("watch");
  const [video, setVideo] = useState(null);
  const [instanceIndex, setInstanceIndex] = useState(0);
  const {
    prefs,
    ready,
    user,
    recordWatch,
    toggleLike,
    addTopic,
    addRecentSearch,
    setPreferredInstance,
    clearHistory
  } = useInvidiousPrefs();

  // Keep this page out of search engines.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    base44.entities.InvidiousInstance.filter({}, { sort: "-uptime", limit: 50 })
      .then((page) => setInstances(page.items))
      .catch(() => setInstances([]));
  }, []);

  // Jump to the viewer's preferred instance once both lists are ready.
  useEffect(() => {
    if (!instances || !ready) return;
    const idx = instances.findIndex((i) => i.name === prefs.preferred_instance);
    if (idx >= 0) setInstanceIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances, ready]);

  const lastSync =
    instances && instances.length
      ? new Date(
          Math.max(...instances.map((i) => new Date(i.updated_date).getTime() || 0))
        ).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit"
        })
      : null;

  const watchItem = (item) => {
    setVideo(item);
    recordWatch(item);
    setTab("watch");
  };

  const selectInstance = (idx) => {
    setInstanceIndex(idx);
    if (instances[idx]) setPreferredInstance(instances[idx].name);
  };

  const likedNow = Boolean(video && prefs.liked.some((l) => l.videoId === video.videoId));

  if (!instances || !ready) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-[#ff4d4d] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#ff4d4d]">Invidious</h1>
          <p className="text-xs text-neutral-500">
            {instances.length} public instance{instances.length === 1 ? "" : "s"} synced weekly
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-300 truncate max-w-[180px]">
            {user ? user.email : "Local mode"}
          </p>
          <p className="text-[10px] text-neutral-600">
            {user ? "Synced to your account" : `Saved in this browser${lastSync ? ` · sync ${lastSync}` : ""}`}
          </p>
        </div>
      </header>

      <nav className="px-6 pt-4 flex gap-1 border-b border-neutral-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? "text-white border-[#ff4d4d]"
                : "text-neutral-400 border-transparent hover:text-neutral-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "watch" && (
        <WatchPanel
          instances={instances}
          instanceIndex={instanceIndex}
          onSelectInstance={selectInstance}
          video={video}
          onWatch={watchItem}
          liked={likedNow}
          onToggleLike={() => video && toggleLike(video)}
        />
      )}
      {tab === "search" && (
        <SearchPanel
          onWatch={watchItem}
          recentSearches={prefs.recent_searches}
          onSearchSubmitted={addRecentSearch}
        />
      )}
      {tab === "shorts" && (
        <ShortsFeed
          instances={instances}
          prefs={prefs}
          onToggleLike={toggleLike}
          onAddTopic={addTopic}
        />
      )}
      {tab === "history" && (
        <HistoryPanel prefs={prefs} onWatch={watchItem} onClearHistory={clearHistory} />
      )}
      {tab === "instances" && <InstancesPanel instances={instances} />}
    </div>
  );
}