import { useCallback, useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import DinoCanvas from "@/components/games/dino/DinoCanvas";
import DinoLogin from "@/components/games/dino/DinoLogin";
import DinoLeaderboard from "@/components/games/dino/DinoLeaderboard";
import { clearSession, dinoCall, loadSession, readLocalHi, saveSession, writeLocalHi } from "@/lib/dinoApi";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function DinoGame() {
  const [player, setPlayer] = useState(loadSession);
  const [rows, setRows] = useState(null);
  const [muted, setMuted] = useState(false);
  const [hi, setHi] = useState(() => Math.max(loadSession()?.best || 0, readLocalHi()));
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    dinoCall({ action: "leaderboard" })
      .then((data) => {
        if (!cancelled) setRows(data.leaderboard || []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuth = (data, creds) => {
    const next = {
      username: data.player?.username || creds.username,
      password: creds.password,
      best: data.player?.best_score || 0,
    };
    setPlayer(next);
    saveSession(next);
    setRows(data.leaderboard || []);
    setHi(Math.max(next.best, readLocalHi()));
    setMessage(`Welcome back, ${next.username}. Best score ${next.best}.`);
  };

  const signOut = () => {
    clearSession();
    setPlayer(null);
    setHi(readLocalHi());
    setMessage("Signed out. Playing as a guest.");
  };

  const handleGameOver = useCallback(
    async (score) => {
      if (score <= 0) {
        setMessage("Run over — try again.");
        return;
      }
      const localBest = writeLocalHi(score);
      if (!player) {
        setHi(localBest);
        setMessage("Sign in to save your high score and join the leaderboard.");
        return;
      }
      try {
        const data = await dinoCall({
          action: "submit",
          username: player.username,
          password: player.password,
          score,
        });
        const next = { ...player, best: data.best_score || 0 };
        setPlayer(next);
        saveSession(next);
        setRows(data.leaderboard || []);
        setHi(Math.max(localBest, next.best));
        setMessage(
          data.personal_best
            ? `New personal best: ${score}.`
            : `Run saved: ${score}. Your best is ${next.best}.`
        );
      } catch (err) {
        setHi(localBest);
        setMessage(err.message || "Could not save that score.");
      }
    },
    [player]
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground" style={MONT}>
              Chrome Dino
            </h1>
            <p
              className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground"
              style={MONT}
            >
              Space or tap to jump · Down to duck · {player ? `Playing as ${player.username}` : "Playing as a guest"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            className="shrink-0 border border-border p-2 rounded-md text-foreground/70 hover:text-foreground hover:border-foreground transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          <DinoCanvas hi={hi} muted={muted} onGameOver={handleGameOver} />
        </div>

        <div className="min-h-[18px]">
          {message && (
            <p
              className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70"
              style={MONT}
            >
              {message}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DinoLogin player={player} onAuth={handleAuth} onSignOut={signOut} />
          <DinoLeaderboard rows={rows} playerName={player?.username} />
        </div>
      </div>
    </div>
  );
}