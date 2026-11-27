import { Plus, X } from "lucide-react";

export default function AvgeekTerminalSide({ stats, watchlist, draft, onDraft, onAdd, onRemove, radar }) {
  const fieldClass =
    "w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-[12px] outline-none focus:border-[color:var(--ag-accent)]";

  return (
    <div className="space-y-3">
      <div className="ag-card p-4">
        <p className="ag-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-[color:var(--ag-muted)]">
          Stats
        </p>
        <dl className="mt-3 space-y-1.5 text-[12px]">
          <div className="flex justify-between gap-2">
            <dt className="text-[color:var(--ag-muted)]">Articles</dt>
            <dd className="font-bold">{stats.count}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[color:var(--ag-muted)]">Feeds</dt>
            <dd className="font-bold">{stats.feeds}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[color:var(--ag-muted)]">Updated</dt>
            <dd className="font-bold">{stats.updated}</dd>
          </div>
        </dl>
      </div>

      <div className="ag-card p-4">
        <p className="ag-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-[color:var(--ag-muted)]">
          Watchlist
        </p>
        <div className="mt-2 flex gap-1.5">
          <input
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAdd();
            }}
            placeholder="Boeing, FAA…"
            aria-label="Add a watchlist term"
            className={fieldClass}
            style={{ borderColor: "var(--ag-line)" }}
          />
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add term"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: "var(--ag-accent)" }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {watchlist.length === 0 ? (
          <p className="mt-2 text-[11px] text-[color:var(--ag-muted)]">Nothing watched yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {watchlist.map((term) => (
              <li
                key={term}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[11.5px]"
                style={{ background: "var(--ag-accent-soft)" }}
              >
                <span className="truncate">{term}</span>
                <button
                  type="button"
                  onClick={() => onRemove(term)}
                  aria-label={`Remove ${term}`}
                  className="shrink-0 text-[color:var(--ag-muted)] hover:text-[color:var(--ag-accent)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ag-card p-4">
        <p className="ag-mono text-[9.5px] font-bold uppercase tracking-[0.2em] text-[color:var(--ag-muted)]">
          Radar
        </p>
        <div className="mt-3 space-y-2">
          {radar.rows.map((row) => (
            <div key={row.topic}>
              <div className="flex justify-between text-[11px]">
                <span>{row.topic}</span>
                <span className="ag-mono text-[color:var(--ag-muted)]">{row.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--ag-line)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(row.count / radar.max) * 100}%`, background: "var(--ag-accent)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}