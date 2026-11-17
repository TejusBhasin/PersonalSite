import { useState } from "react";
import { LogIn, UserPlus, LogOut } from "lucide-react";
import { dinoCall } from "@/lib/dinoApi";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function DinoLogin({ player, onAuth, onSignOut }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (player) {
    return (
      <div className="border border-border/60 rounded-xl p-4">
        <p
          className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground"
          style={MONT}
        >
          Signed in
        </p>
        <p className="mt-2 text-lg font-black tracking-tight text-foreground" style={MONT}>
          {player.username}
        </p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground" style={MONT}>
          Best score {player.best ?? 0}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 inline-flex items-center gap-2 border border-border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70 hover:border-foreground hover:text-foreground transition-colors rounded-md"
          style={MONT}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const creds = { username: username.trim(), password };
      const data = await dinoCall({
        action: mode === "login" ? "login" : "register",
        ...creds,
      });
      setUsername("");
      setPassword("");
      onAuth(data, creds);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-border/60 rounded-xl p-4">
      <div className="flex items-center gap-2">
        {["login", "register"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-md transition-colors ${
              mode === m
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:text-foreground border border-border"
            }`}
            style={MONT}
          >
            {m === "login" ? "Log in" : "Create"}
          </button>
        ))}
      </div>

      <form className="mt-4 space-y-2" onSubmit={submit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={16}
          placeholder="Username"
          autoComplete="username"
          className="w-full border border-border/60 bg-background px-3 py-2 text-xs font-bold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none rounded-md"
          style={MONT}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          maxLength={40}
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full border border-border/60 bg-background px-3 py-2 text-xs font-bold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none rounded-md"
          style={MONT}
        />
        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full inline-flex items-center justify-center gap-2 bg-foreground px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-background hover:bg-foreground/85 transition-colors disabled:opacity-50 rounded-md"
          style={MONT}
        >
          {mode === "login" ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          {busy ? "Working" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-destructive" style={MONT}>
          {error}
        </p>
      )}
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground" style={MONT}>
        Log in to save your high score and appear on the leaderboard.
      </p>
    </div>
  );
}