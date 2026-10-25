import { useEffect, useState } from "react";
import { Loader2, Search, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AmmeNotice from "@/components/amme/AmmeNotice";
import AmmeSearchResults from "@/components/amme/AmmeSearchResults";
import AmmePlayer from "@/components/amme/AmmePlayer";
import AmmeShortsFeed from "@/components/amme/AmmeShortsFeed";

const errMsg = (err) =>
  err?.response?.data?.error || err?.data?.error || err?.message || "Something went wrong.";

export default function Amme() {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [instances, setInstances] = useState([]);
  const [error, setError] = useState("");

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

  const runSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError("");
    setVideo(null);
    try {
      const res = await base44.functions.invoke("ammeSearch", { q, mode: "search" });
      const data = res?.data ?? res;
      setResults(data?.results || []);
      setInstances(data?.instances || []);
      if (!data?.results?.length) setError("No results found. Try a different search.");
    } catch (err) {
      setError(errMsg(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const tabCls = (on) =>
    `inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
      on ? "bg-[#ff4d4d] text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
    }`;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-2xl font-black tracking-tight text-[#ff4d4d]">AMME</h1>
        <p className="text-xs text-neutral-500">Video access for restricted networks</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <AmmeNotice />

        <div className="flex gap-2">
          <button onClick={() => setTab("search")} className={tabCls(tab === "search")}>
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={() => setTab("shorts")} className={tabCls(tab === "shorts")}>
            <Zap className="w-4 h-4" /> Shorts
          </button>
        </div>

        {tab === "shorts" ? (
          <AmmeShortsFeed />
        ) : (
          <>
            <form onSubmit={runSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for videos"
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-4 py-2.5 text-sm focus:border-neutral-500 outline-none placeholder:text-neutral-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#ff4d4d] hover:bg-[#ff3838] disabled:opacity-60 text-white font-semibold rounded-md px-5 py-2.5 text-sm inline-flex items-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </form>

            {error && <p className="text-sm text-red-400">{error}</p>}

            {video && (
              <AmmePlayer video={video} instances={instances} onClose={() => setVideo(null)} />
            )}

            {results && !video && (
              <AmmeSearchResults results={results} onPlay={setVideo} />
            )}
          </>
        )}
      </div>
    </div>
  );
}