import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text, label = "Copy", className = "" }) {
  const [ok, setOk] = useState(false);
  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 border border-border/60 bg-card text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:border-foreground/40 transition-colors ${className}`}
    >
      {ok ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {ok ? "Copied" : label}
    </button>
  );
}