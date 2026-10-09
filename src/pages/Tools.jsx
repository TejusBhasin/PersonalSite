import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Tools() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");
  const needle = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      TOOLS.filter((t) => {
        const inCat = cat === "All" || t.category === cat;
        const inQuery =
          !needle ||
          t.name.toLowerCase().includes(needle) ||
          t.description.toLowerCase().includes(needle) ||
          t.category.toLowerCase().includes(needle);
        return inCat && inQuery;
      }),
    [needle, cat]
  );

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
            Tools
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
            {TOOLS.length} deep utilities — no accounts, no installs, most run fully in your browser
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-card/80 border border-border/60 rounded-full pl-11 pr-5 py-2.5 text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
              style={MONT}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TOOL_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border transition-colors ${
                  cat === c
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
                }`}
                style={MONT}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground font-medium" style={MONT}>
            No tools match "{query}".
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  to={`/tools/${tool.id}`}
                  className="group bg-card/80 border border-border/60 rounded-xl px-5 py-5 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:border-foreground/30 hover:bg-card transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-6 h-6 text-foreground/50 group-hover:text-foreground transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{tool.category}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground/80 group-hover:text-foreground tracking-wide mb-1.5" style={MONT}>
                    {tool.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed flex-1">{tool.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-bold text-foreground/40 group-hover:text-foreground transition-colors">
                    Open
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}