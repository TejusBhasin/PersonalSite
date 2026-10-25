import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AmmeNotice from "@/components/amme/AmmeNotice";
import AmmeSearchResults from "@/components/amme/AmmeSearchResults";
import AmmePlayer from "@/components/amme/AmmePlayer";

const errMsg = (err) =>
  err?.response?.data?.error || err?.data?.error || err?.message || "Something went wrong.";

export default function Amme() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [instance, setInstance] = useState("");
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
      setInstance(data?.instance || "");
      if (!data?.results?.length) setError("No results found. Try a different search.");
    } catch (err) {
      setError(errMsg(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = async (item) => {
    if (videoLoading) return;
    setVideoLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("ammeSearch", { mode: "video", videoId: item.videoId });
      const data = res?.data ?? res;
      setVideo({ ...item, ...(data?.video || {}) });
      if (data?.instance) setInstance(data.instance);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-2xl font-black tracking-tight text-[#ff4d4d]">AMME</h1>
        <p className="text-xs text-neutral-500">Video access for restricted networks</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <AmmeNotice />

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
        {videoLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
          </div>
        )}

        {video && !videoLoading && (
          <AmmePlayer video={video} instance={instance} onClose={() => setVideo(null)} />
        )}

        {results && !video && !videoLoading && (
          <AmmeSearchResults results={results} onPlay={openVideo} />
        )}

        {instance && (
          <p className="text-[10px] text-neutral-600">
            Serving via {instance}
          </p>
        )}
      </div>
    </div>
  );
}