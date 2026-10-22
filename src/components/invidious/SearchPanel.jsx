import { useState } from "react";
import { Search, Loader2, Eye, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmtDuration = (s) => {
  const total = Number(s) || 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(sec).padStart(2, "0")}`;
};

const fmtViews = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B views`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M views`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K views`;
  return v ? `${v} views` : "";
};

export default function SearchPanel({ onWatch }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [usedInstance, setUsedInstance] = useState("");

  const search = async (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("invidiousSearch", { q: query });
      const data = res?.results ?? res?.data?.results ?? null;
      if (!data) throw new Error(res?.error || res?.data?.error || "Search failed");
      setResults(data);
      setUsedInstance(res?.instance || res?.data?.instance || "");
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search YouTube"
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-4 py-2.5 text-sm focus:border-neutral-500 outline-none placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-white font-semibold rounded-md px-5 py-2.5 text-sm inline-flex items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {usedInstance && !error && <p className="text-xs text-neutral-500">Results via {usedInstance}</p>}
      {results && results.length === 0 && <p className="text-sm text-neutral-500">No videos found.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(results || []).map((r) => (
          <button key={r.videoId} onClick={() => onWatch(r.videoId)} className="text-left group">
            <div className="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden">
              <img
                src={`https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`}
                alt={r.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-xs px-1.5 py-0.5 rounded">
                {fmtDuration(r.lengthSeconds)}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-white">{r.title}</p>
            <p className="text-xs text-neutral-500">{r.author}</p>
            <p className="text-xs text-neutral-600 flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3" />{fmtViews(r.viewCount)}
              </span>
              {r.publishedText && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />{r.publishedText}
                </span>
              )}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}