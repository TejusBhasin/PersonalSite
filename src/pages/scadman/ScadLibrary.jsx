import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { listPublicProjects } from "@/lib/scad/api";
import ScadProjectCard from "@/components/scadman/ScadProjectCard";
import { CATEGORIES } from "@/lib/scad/format";

const SORTS = [
  { id: "recent", label: "Newest" },
  { id: "popular", label: "Most popular" },
  { id: "favorited", label: "Most favourited" },
  { id: "az", label: "A–Z" },
];

export default function ScadLibrary() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listPublicProjects(60);
        if (alive) setProjects(rows);
      } catch (e) {
        if (alive) setError(e.message || "Could not load the library.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let rows = projects.filter((project) => {
      if (category !== "all" && project.category !== category) return false;
      if (!needle) return true;
      const haystack = [
        project.title,
        project.description,
        project.creator_name,
        ...(project.tags || []),
        project.category,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    rows = [...rows];
    if (sort === "popular") rows.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    else if (sort === "favorited") rows.sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
    else if (sort === "az") rows.sort((a, b) => a.title.localeCompare(b.title));
    else rows.sort((a, b) => new Date(b.published_at || b.created_date) - new Date(a.published_at || a.created_date));
    return rows;
  }, [projects, query, category, sort]);

  const featured = useMemo(
    () => [...projects].sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0)).slice(0, 3),
    [projects]
  );

  return (
    <div className="scad-wrap">
      <p className="scad-eyebrow">Community library</p>
      <h1 className="scad-h1 mt-2 text-[26px]">Models with their source attached</h1>
      <p className="scad-body mt-2 max-w-[70ch]">
        Every entry keeps its OpenSCAD source, its exposed parameters and its licence. Open a model to
        customise it in the viewport, or remix it into your own project with attribution kept.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--scad-dim)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, description, creator or tag…"
            className="scad-input pl-9"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="scad-select sm:w-[170px]">
          {SORTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={`scad-btn scad-btn-sm${category === "all" ? " scad-btn-primary" : ""}`}
        >
          All
        </button>
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={`scad-btn scad-btn-sm${category === item.id ? " scad-btn-primary" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-[11.5px]" style={{ color: "var(--scad-err)" }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2e3846] border-t-[#e9b14c]" />
        </div>
      ) : (
        <>
          {featured.length > 0 && !query && category === "all" && (
            <section className="mt-8">
              <h2 className="scad-h2">Most favourited</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {featured.map((project) => (
                  <ScadProjectCard key={project.id} project={project} showOwner />
                ))}
              </div>
            </section>
          )}

          <section className="mt-8">
            <div className="flex items-end justify-between">
              <h2 className="scad-h2">{query || category !== "all" ? "Results" : "All models"}</h2>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-[color:var(--scad-dim)]">
                {filtered.length} model{filtered.length === 1 ? "" : "s"}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="scad-panel mt-3 p-10 text-center">
                <p className="text-[12px] font-semibold">No models match that</p>
                <p className="scad-body mx-auto mt-1.5 max-w-[44ch] text-[11.5px]">
                  Try a different search term or category. Sample community content is marked
                  “sample” on each card.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((project) => (
                  <ScadProjectCard key={project.id} project={project} showOwner />
                ))}
              </div>
            )}
          </section>

          <p className="mt-10 text-[10.5px] leading-relaxed text-[color:var(--scad-dim)]">
            Sample models are seeded community content for demonstration. Real published models appear
            here with their creator's name and licence.
          </p>
        </>
      )}
    </div>
  );
}