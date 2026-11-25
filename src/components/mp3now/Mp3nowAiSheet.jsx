import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { createAiPlaylist } from "@/lib/mp3now/api";

const IDEAS = ["Late night drive", "Focus deep work", "Sunrise run", "Slow Sunday"];

export default function Mp3nowAiSheet({ onClose, onCreated }) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(20);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await createAiPlaylist(prompt.trim(), count);
      await onCreated(result.playlist);
      onClose();
    } catch (e) {
      setError(e.message || "The playlist could not be created.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mp3-sheet-backdrop" onClick={onClose} role="dialog" aria-label="AI playlist">
      <div className="mp3-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <span className="mp3-chip mb-1.5 inline-flex">
              <Sparkles className="h-2.5 w-2.5" /> AI Playlist
            </span>
            <h2 className="text-[17px] font-semibold">Describe the vibe</h2>
          </div>
          <button type="button" onClick={onClose} className="mp3-iconbtn" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Warm guitars for a rainy afternoon, nothing too fast"
          className="mp3-input mp3-textarea"
          rows={3}
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {IDEAS.map((idea) => (
            <button key={idea} type="button" onClick={() => setPrompt(idea)} className="mp3-pill">
              {idea}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="mp3-label">Songs</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              style={{ accentColor: "var(--m-blue)" }}
              aria-label="Song count"
            />
            <span className="w-6 text-right text-[12px] font-semibold tabular-nums">{count}</span>
          </div>
        </div>

        {error && <p className="mt-3 text-[11.5px] text-[color:var(--m-danger)]">{error}</p>}

        <button type="button" onClick={generate} disabled={busy || !prompt.trim()} className="mp3-btn mt-4 w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? "Building your mix…" : "Create playlist"}
        </button>
      </div>
    </div>
  );
}