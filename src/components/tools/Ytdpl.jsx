import { useState } from "react";
import { AlertTriangle, Loader2, Lock, Unlock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const STORE_KEY = "yt_dpl_unlocked";
const VAULT_URL = "https://stream-arch-vault.base44.app/";

const readUnlocked = () => {
  try {
    return sessionStorage.getItem(STORE_KEY) === "1";
  } catch {
    return false;
  }
};

export default function Ytdpl() {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const unlock = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter the access code");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("verifyVaultCode", { code: trimmed });
      const data = res?.data || {};
      if (data.ok) {
        try {
          sessionStorage.setItem(STORE_KEY, "1");
        } catch {
          /* storage unavailable */
        }
        setUnlocked(true);
        setCode("");
      } else {
        setError(data.error || "That code isn't right");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Could not check that code");
    } finally {
      setBusy(false);
    }
  };

  const lock = () => {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      /* storage unavailable */
    }
    setUnlocked(false);
  };

  if (unlocked) {
    return (
      <section className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-foreground/70" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground" style={MONT}>
              Vault unlocked
            </span>
          </div>
          <button
            type="button"
            onClick={lock}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-foreground transition-colors hover:border-foreground/40"
            style={MONT}
          >
            <Lock className="h-3.5 w-3.5" />
            Lock
          </button>
        </div>
        <iframe
          src={VAULT_URL}
          title="YT-DPL video vault"
          allow="clipboard-write; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          className="block h-[78vh] min-h-[520px] w-full border-0 bg-background"
        />
      </section>
    );
  }

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="p-6 sm:p-8 md:p-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg border border-border/60 bg-background p-2.5">
            <Lock className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground" style={MONT}>
              Locked vault
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground" style={MONT}>
              Access code required
            </p>
          </div>
        </div>

        <form onSubmit={unlock} className="max-w-md space-y-3">
          <input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            placeholder="Access code"
            autoComplete="off"
            className="w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:outline-none"
            style={MONT}
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-60"
            style={MONT}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
            {busy ? "Checking" : "Unlock"}
          </button>
          {error && (
            <p className="flex items-center gap-2 text-xs font-semibold text-destructive" style={MONT}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}