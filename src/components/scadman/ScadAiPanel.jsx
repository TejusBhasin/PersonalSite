import { useEffect, useRef, useState } from "react";
import { Check, CornerDownLeft, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import ScadAiProgress from "@/components/scadman/ScadAiProgress";

const SUGGESTIONS = [
  "Desk organizer with three compartments and a phone slot",
  "Wall hook that holds 5 kg, 40 mm wide",
  "Box with a sliding lid, 120 × 80 × 45 mm",
  "Add mounting holes to the base",
];

export default function ScadAiPanel({
  messages,
  applied,
  busy,
  stage,
  elapsed,
  error,
  knowledge,
  onSend,
  onRevert,
  onRetry,
}) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, applied, busy]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    onSend(value);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="flex items-center gap-2 border-b px-3 py-2.5"
        style={{ borderColor: "var(--scad-line)" }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--scad-accent)" }} />
        <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Assistant</span>
        <div className="flex-1" />
        <span className="scad-chip">OpenSCAD</span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !applied && (
          <div>
            <p className="text-[11.5px] leading-relaxed text-[color:var(--scad-muted)]">
              Describe the part you need and the assistant writes it straight into the editor, with
              the parameters behind it and the assumptions it made. It works on any source,
              including code you wrote by hand.
            </p>
            <div className="mt-3 space-y-1.5">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setText(suggestion)}
                  className="w-full rounded-md border px-2.5 py-2 text-left text-[11px] leading-snug text-[color:var(--scad-muted)] transition-colors hover:text-[color:var(--scad-text)]"
                  style={{ borderColor: "var(--scad-line)", background: "var(--scad-panel-2)" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--scad-dim)]">
              {message.role === "user" ? "You" : "SCADman"}
            </p>
            <div
              className="rounded-md border px-2.5 py-2 text-[11.5px] leading-relaxed"
              style={{
                borderColor: message.role === "user" ? "var(--scad-line-2)" : "var(--scad-line)",
                background: message.role === "user" ? "var(--scad-panel-3)" : "var(--scad-panel-2)",
                color: message.role === "user" ? "var(--scad-text)" : "var(--scad-muted)",
              }}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" && message.generated_code && (
                <span className="scad-chip mt-2">code attached</span>
              )}
            </div>
          </div>
        ))}

        {busy && <ScadAiProgress stage={stage} elapsed={elapsed} />}

        {error && (
          <div
            className="rounded-md border px-2.5 py-2"
            style={{ borderColor: "#4a2626", background: "#1a1113" }}
          >
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "#f19a9a" }}>
              assistant error
            </p>
            <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "#f0b3b3" }}>
              {error}
            </p>
            <button type="button" onClick={onRetry} className="scad-btn scad-btn-sm mt-2 w-full">
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {applied && (
          <div className="scad-panel p-2.5" style={{ borderColor: "var(--scad-line-2)" }}>
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3" style={{ color: "var(--scad-ok)" }} />
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--scad-ok)" }}>
                {applied.unchanged ? "source already matches" : "written into the editor"}
              </p>
            </div>

            {applied.assumptions?.length > 0 && (
              <div className="mt-2">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[color:var(--scad-dim)]">
                  assumptions
                </p>
                <ul className="mt-1 space-y-1">
                  {applied.assumptions.map((line) => (
                    <li key={line} className="text-[10.5px] leading-relaxed text-[color:var(--scad-muted)]">
                      · {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {applied.warnings?.length > 0 && (
              <div className="mt-2">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "#ecc178" }}>
                  warnings
                </p>
                <ul className="mt-1 space-y-1">
                  {applied.warnings.map((line) => (
                    <li key={line} className="text-[10.5px] leading-relaxed" style={{ color: "#ecc178" }}>
                      · {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-1.5">
              {!applied.unchanged && (
                <button type="button" onClick={onRevert} className="scad-btn scad-btn-sm flex-1">
                  <Undo2 className="h-3.5 w-3.5" />
                  Revert
                </button>
              )}
              <button type="button" onClick={onRetry} className="scad-btn scad-btn-sm" title="Run the last prompt again">
                <RotateCcw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {knowledge && (
        <div className="border-t px-3 py-1.5" style={{ borderColor: "var(--scad-line)" }}>
          <p className="truncate text-[9.5px] uppercase tracking-[0.1em] text-[color:var(--scad-dim)]">
            reference: {knowledge.used?.join(" · ") || "curated set"}
          </p>
        </div>
      )}

      <div className="border-t p-2.5" style={{ borderColor: "var(--scad-line)" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          placeholder="Describe the model or the change…"
          className="scad-textarea text-[11.5px]"
        />
        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={submit}
            disabled={busy || !text.trim()}
            className="scad-btn scad-btn-primary flex-1"
          >
            <CornerDownLeft className="h-3.5 w-3.5" />
            {busy ? "Working" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}