import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AvgeekArticleCard from "@/components/avgeek/AvgeekArticleCard";
import AvgeekTerminalSide from "@/components/avgeek/AvgeekTerminalSide";

const TOPICS = ["Boeing", "Airbus", "FAA", "NASA", "Military", "Space", "Crash"];
const WATCH_KEY = "avgeek:watchlist";
const REFRESH_MS = 5 * 60 * 1000;

function readWatchlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(WATCH_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((value) => typeof value === "string" && value.trim()) : [];
  } catch {
    return [];
  }
}

export default function AvgeekTerminal() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [watchlist, setWatchlist] = useState(readWatchlist);
  const [draft, setDraft] = useState("");
  const [updated, setUpdated] = useState(null);
  const [feedCount, setFeedCount] = useState(0);

  const load = useCallback(async () => {
    setState((current) => (current === "ready" ? "refreshing" : "loading"));
    setError("");
    try {
      const res = await base44.functions.invoke("avgeekNews", {});
      const data = res?.data ?? res;
      if (data?.error) throw new Error(data.error);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setFeedCount(Number(data?.feeds) || 0);
      setUpdated(new Date());
      setState("ready");
    } catch (err) {
      setError(err?.message || "Could not reach the aviation feeds.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCH_KEY, JSON.stringify(watchlist));
    } catch {
      // Storage blocked: the watchlist just resets next visit.
    }
  }, [watchlist]);

  const addWatch = () => {
    const term = draft.trim();
    if (!term) return;
    setWatchlist((list) =>
      list.some((value) => value.toLowerCase() === term.toLowerCase()) ? list : [...list, term]
    );
    setDraft("");
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle
      ? items.filter((a) => `${a.title} ${a.snippet}`.toLowerCase().includes(needle))
      : items;
    const scored = list.map((a) => {
      const text = `${a.title} ${a.snippet}`.toLowerCase();
      return { ...a, hits: watchlist.filter((term) => text.includes(term.toLowerCase())) };
    });
    const time = (a) => Date.parse(a.published || "") || 0;
    if (sort === "oldest") scored.sort((a, b) => time(a) - time(b));
    else if (sort === "relevance") scored.sort((a, b) => b.hits.length - a.hits.length || time(b) - time(a));
    else scored.sort((a, b) => time(b) - time(a));
    return scored;
  }, [items, query, sort, watchlist]);

  const radar = useMemo(() => {
    const rows = TOPICS.map((topic) => ({
      topic,
      count: visible.filter((a) => `${a.title} ${a.snippet}`.toLowerCase().includes(topic.toLowerCase()))
        .length,
    }));
    return { rows, max: Math.max(1, ...rows.map((row) => row.count)) };
  }, [visible]);

  const statusLine =
    state === "loading"
      ? "Loading aviation feeds…"
      : state === "error"
        ? error
        : `Loaded ${visible.length} article${visible.length === 1 ? "" : "s"}${
            updated ? ` · updated ${updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""
          }`;

  return (
    <section id="news" className="scroll-mt-14">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Aviation Terminal</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--ag-muted)]">
              Live headlines from the aviation newsrooms I follow, refreshed every five minutes. Search
              them, sort them, and keep a watchlist of the names you care about.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={state === "loading" || state === "refreshing"}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--ag-muted)] transition-colors hover:text-[color:var(--ag-accent)] disabled:opacity-50"
            style={{ borderColor: "var(--ag-line)" }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${state === "loading" || state === "refreshing" ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--ag-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search aviation news…"
              aria-label="Search aviation news"
              className="w-full rounded-lg border bg-transparent py-2 pl-8 pr-3 text-[12.5px] outline-none focus:border-[color:var(--ag-accent)]"
              style={{ borderColor: "var(--ag-line)" }}
            />
          </div>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort articles"
            className="rounded-lg border bg-transparent px-2.5 py-2 text-[12px] outline-none focus:border-[color:var(--ag-accent)]"
            style={{ borderColor: "var(--ag-line)" }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="relevance">Relevance</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
          <AvgeekTerminalSide
            stats={{
              count: visible.length,
              feeds: feedCount,
              updated: updated
                ? updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : "…",
            }}
            watchlist={watchlist}
            draft={draft}
            onDraft={setDraft}
            onAdd={addWatch}
            onRemove={(term) => setWatchlist((list) => list.filter((value) => value !== term))}
            radar={radar}
          />

          <div>
            <p
              className="ag-mono mb-3 text-[10px] uppercase tracking-[0.16em]"
              style={{ color: state === "error" ? "#d9534f" : "var(--ag-muted)" }}
            >
              {statusLine}
            </p>

            {state === "loading" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((key) => (
                  <div key={key} className="ag-card h-[132px] animate-pulse" />
                ))}
              </div>
            ) : state === "error" ? (
              <div className="ag-card p-6 text-center">
                <p className="text-[13px] font-semibold">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-3 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
                  style={{ background: "var(--ag-accent)" }}
                >
                  Try again
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="ag-card p-6 text-center text-[13px] text-[color:var(--ag-muted)]">
                No articles match that search.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visible.map((article) => (
                  <AvgeekArticleCard
                    key={article.link}
                    article={article}
                    watched={article.hits}
                    topics={TOPICS.filter((topic) =>
                      article.title.toLowerCase().includes(topic.toLowerCase())
                    ).slice(0, 3)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}