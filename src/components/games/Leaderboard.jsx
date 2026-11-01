import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function Leaderboard({ game, score = 0, difficulty, stats }) {
  const [rows, setRows] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const page = await base44.entities.GameScore.filter({ game }, { sort: "-score", limit: 8 });
      setRows(page?.items ?? []);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    load();
  }, [game]);

  const submit = async (e) => {
    e.preventDefault();
    const tag = name.trim().toUpperCase().slice(0, 12);
    if (tag.length < 2) {
      setError("Use at least 2 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await base44.entities.GameScore.create({
        game,
        name: tag,
        score: Math.round(score),
        difficulty,
        stats: JSON.stringify(stats || {}),
      });
      setSent(true);
      await load();
    } catch {
      setError("Couldn't save that score — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-border/60 bg-background/70 p-4 text-left">
      <p
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground"
        style={MONT}
      >
        <Trophy className="h-3.5 w-3.5" />
        Leaderboard
      </p>

      {rows === null ? (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground" style={MONT}>
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground" style={MONT}>
          No runs yet — set the first mark.
        </p>
      ) : (
        <ol className="mt-3 space-y-1">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 text-xs" style={MONT}>
              <span className="w-4 shrink-0 font-black text-muted-foreground">{i + 1}</span>
              <span className="flex-1 truncate font-bold uppercase tracking-wide text-foreground/85">{r.name}</span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {r.difficulty || "—"}
              </span>
              <span className="w-14 shrink-0 text-right font-black text-foreground">{r.score}</span>
            </li>
          ))}
        </ol>
      )}

      {score > 0 && !sent && (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={12}
            placeholder="Your tag"
            className="min-w-0 flex-1 border border-border/60 bg-card px-3 py-2 text-xs font-bold uppercase tracking-[0.15em] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
            style={MONT}
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 bg-foreground px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85 disabled:opacity-50"
            style={MONT}
          >
            {busy ? "Saving" : `Submit ${Math.round(score)}`}
          </button>
        </form>
      )}

      {sent && (
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground" style={MONT}>
          Score saved.
        </p>
      )}
      {error && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-destructive" style={MONT}>
          {error}
        </p>
      )}
    </div>
  );
}