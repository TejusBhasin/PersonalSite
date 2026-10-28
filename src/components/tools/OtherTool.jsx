import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageHost from "@/components/tools/ImageHost";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const UNLOCK_KEY = "other_tool_unlocked";

export default function OtherTool() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (checking || !code.trim()) return;
    setChecking(true);
    setError("");
    try {
      const res = await base44.functions.invoke("verifyOtherCode", { code: code.trim() });
      const ok = Boolean(res?.ok ?? res?.data?.ok);
      if (ok) {
        try {
          sessionStorage.setItem(UNLOCK_KEY, "1");
        } catch {
          /* storage unavailable */
        }
        setUnlocked(true);
        setOpen(false);
        setCode("");
      } else {
        setError("That code is not correct.");
      }
    } catch {
      setError("Couldn't verify the code. Try again.");
    }
    setChecking(false);
  };

  if (unlocked) return <ImageHost />;

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(true)}
        className="w-full group border border-dashed border-border/70 bg-card/40 rounded-xl px-5 py-5 flex items-center justify-between hover:-translate-y-1 hover:border-foreground/30 hover:bg-card transition-all duration-300"
      >
        <div className="flex items-center gap-4 text-left">
          <Lock className="w-6 h-6 text-foreground/40 group-hover:text-foreground transition-colors" />
          <div>
            <p className="text-sm font-bold tracking-wide text-foreground/70 group-hover:text-foreground" style={MONT}>
              Other
            </p>
            <p className="text-xs text-muted-foreground font-medium">Restricted tool — access code required</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-bold text-foreground/40 group-hover:text-foreground transition-colors" style={MONT}>
          Unlock
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={MONT}>Enter access code</DialogTitle>
            <DialogDescription style={MONT}>
              This tool is private. Enter the code to unlock it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-3 mt-2">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              autoFocus
              className="w-full bg-card border border-border/60 rounded-lg px-4 py-3 text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-foreground/40 transition-colors"
              style={MONT}
            />
            {error && (
              <p className="text-xs font-semibold text-destructive" style={MONT}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={checking || !code.trim()}
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-foreground/85 transition-colors"
              style={MONT}
            >
              {checking ? "Checking..." : "Unlock"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}