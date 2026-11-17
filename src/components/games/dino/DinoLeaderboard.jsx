import { Trophy } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function DinoLeaderboard({ rows, playerName }) {
  return (
    <div className="border border-border/60 rounded-xl p-4">
      <p
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground"
        style={MONT}
      >
        <Trophy className="w-3.5 h-3.5" />
        Leaderboard
      </p>

      {rows === null ? (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground" style={MONT}>
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground" style={MONT}>
          No scores yet — set the first one.
        </p>
      ) : (
        <ol className="mt-3 space-y-1">
          {rows.map((row) => {
            const mine =
              playerName && row.username?.toLowerCase() === playerName.toLowerCase();
            return (
              <li
                key={row.username}
                className={`flex items-center gap-3 px-2 py-1 text-xs rounded-md ${
                  mine ? "bg-muted" : ""
                }`}
                style={MONT}
              >
                <span className="w-4 shrink-0 font-black text-muted-foreground">{row.rank}</span>
                <span className="flex-1 truncate font-bold tracking-wide text-foreground/90">
                  {row.username}
                </span>
                <span className="shrink-0 font-black text-foreground">{row.score}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}