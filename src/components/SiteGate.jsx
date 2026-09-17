import { useState } from "react";
import { Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function SiteGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("site_unlocked") === "yes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("checkSitePassword", { password });
      if (res?.ok || res?.data?.ok) {
        localStorage.setItem("site_unlocked", "yes");
        setUnlocked(true);
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  if (unlocked) return children;

  return (
    <div className="fixed inset-0 z-[9998] bg-background flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border border-border/60 rounded-xl bg-card/80 backdrop-blur-sm p-8 shadow-2xl"
      >
        <Lock className="w-10 h-10 text-foreground/60 mx-auto mb-6" />
        <h1 className="text-xl font-black tracking-wide text-foreground text-center mb-2" style={MONT}>
          This Site Is Password Protected
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-8 tracking-widest uppercase" style={MONT}>
          Enter the password to continue
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="Password"
          className="w-full border border-input bg-background px-4 py-3 rounded-md text-sm text-foreground mb-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && (
          <p className="text-xs text-destructive font-semibold mb-2" style={MONT}>{error}</p>
        )}
        <button
          type="submit"
          disabled={checking || !password}
          className="w-full bg-foreground text-background px-6 py-3 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 transition-all duration-300 disabled:opacity-50"
          style={MONT}
        >
          {checking ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}