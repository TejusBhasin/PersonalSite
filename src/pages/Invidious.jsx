import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import WatchPanel from "@/components/invidious/WatchPanel";
import SearchPanel from "@/components/invidious/SearchPanel";
import InstancesPanel from "@/components/invidious/InstancesPanel";

const TABS = [
  { id: "watch", label: "Watch" },
  { id: "search", label: "Search" },
  { id: "instances", label: "Instances" }
];

export default function Invidious() {
  const [instances, setInstances] = useState(null);
  const [tab, setTab] = useState("watch");
  const [videoId, setVideoId] = useState("");
  const [instanceIndex, setInstanceIndex] = useState(0);

  // Keep this page out of search engines.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    base44.entities.InvidiousInstance.filter({}, { sort: "-uptime", limit: 50 })
      .then((page) => setInstances(page.items))
      .catch(() => setInstances([]));
  }, []);

  const lastSync = instances && instances.length
    ? new Date(Math.max(...instances.map((i) => new Date(i.updated_date).getTime() || 0)))
      .toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  const watchFromSearch = (id) => {
    setVideoId(id);
    setTab("watch");
  };

  if (!instances) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-[#ff4d4d] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#ff4d4d]">Invidious</h1>
          <p className="text-xs text-neutral-500">
            {instances.length} public instance{instances.length === 1 ? "" : "s"} synced weekly
          </p>
        </div>
        {lastSync && <p className="text-xs text-neutral-500 hidden sm:block">Last sync: {lastSync}</p>}
      </header>

      <nav className="px-6 pt-4 flex gap-1 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md border-b-2 transition-colors ${
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
          setInstanceIndex={setInstanceIndex}
          videoId={videoId}
          setVideoId={setVideoId}
        />
      )}
      {tab === "search" && <SearchPanel onWatch={watchFromSearch} />}
      {tab === "instances" && <InstancesPanel instances={instances} />}
    </div>
  );
}