import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function CreditsBox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Credit.filter({ visible: true }, { sort: "sort_order", limit: 100 })
      .then((page) => setItems(page.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-12">
      <div className="border border-emerald-500/35 bg-neutral-950 p-5 text-emerald-300 sm:p-6">
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-500/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          root@tejusbhasin:~$ cat credits.txt
        </div>

        <h2 className="font-mono text-base font-bold tracking-[0.3em] text-emerald-400">
          CREDITS<span className="animate-pulse">_</span>
        </h2>
        <p className="mt-2 max-w-md font-mono text-[11px] leading-relaxed text-emerald-500/80">
          People who wanted to be on my website, so I just put their names here.
        </p>

        {loading ? (
          <p className="mt-5 font-mono text-[11px] text-emerald-500/60">&gt; reading disk...</p>
        ) : items.length === 0 ? (
          <p className="mt-5 font-mono text-[11px] text-emerald-500/60">&gt; no entries yet_</p>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {items.map((c, i) => (
              <div
                key={c.id}
                className="border border-emerald-500/25 bg-emerald-500/[0.04] px-3 py-2.5 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/10"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] text-emerald-600">
                    [{String(i + 1).padStart(2, "0")}]
                  </span>
                  <span className="truncate font-mono text-sm font-bold uppercase tracking-wide text-emerald-300">
                    {c.name}
                  </span>
                </div>
                {c.subtitle && (
                  <p className="mt-1 pl-7 font-mono text-[11px] leading-snug text-emerald-500/70">
                    {c.subtitle}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-600">
          &gt; end of file
        </p>
      </div>
    </section>
  );
}