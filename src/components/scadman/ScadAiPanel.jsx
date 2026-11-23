import { useEffect, useRef, useState } from "react";
import { Check, CornerDownLeft, RotateCcw, Sparkles, X } from "lucide-react";

const SUGGESTIONS = [
  "Desk organizer with three compartments and a phone slot",
  "Wall hook that holds 5 kg, 40 mm wide",
  "Box with a sliding lid, 120 × 80 × 45 mm",
  "Add mounting holes to the base",
];

export default function ScadAiPanel({
  messages,
  pending,
  busy,
  error,
  knowledge,
  onSend,
  onApply,
  onReject,
  onRetry,
}) {
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending, busy]);

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
        {messages.length === 0 && !pending && (
          <div>
            <p className="text-[11.5px] leading-relaxed text-[color:var(--scad-muted)]">
              Describe the part you need. You get complete OpenSCAD source, the parameters behind it,
              and the assumptions made. Nothing is applied until you accept it.
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

        {busy && (
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-3 animate-spin rounded-full border border-[#2e3846] border-t-[#e9b14c]" />
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-[color:var(--scad-dim)]">
              generating
            </span>
          </div>
        )}

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

        {pending && (
          <div className="scad-panel p-2.5" style={{ borderColor: "var(--scad-accent)" }}>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--scad-accent)" }}>
              proposed change
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-[11.5px] leading-relaxed text-[color:var(--scad-text)]">
              {pending.reply}
            </p>

            {pending.assumptions?.length > 0 && (
              <div className="mt-2">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[color:var(--scad-dim)]">
                  assumptions
                </p>
                <ul className="mt-1 space-y-1">
                  {pending.assumptions.map((line) => (
                    <li key={line} className="text-[10.5px] leading-relaxed text-[color:var(--scad-muted)]">
                      · {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pending.warnings?.length > 0 && (
              <div className="mt-2">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "#ecc178" }}>
                  warnings
                </p>
                <ul className="mt-1 space-y-1">
                  {pending.warnings.map((line) => (
                    <li key={line} className="text-[10.5px] leading-relaxed" style={{ color: "#ecc178" }}>
                      · {line}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-2.5 flex items-center gap-1.5">
              <button type="button" onClick={onApply} className="scad-btn scad-btn-primary scad-btn-sm flex-1">
                <Check className="h-3.5 w-3.5" />
                Apply
              </button>
              <button type="button" onClick={onReject} className="scad-btn scad-btn-sm">
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
              <button type="button" onClick={onRetry} className="scad-btn scad-btn-sm" title="Generate again">
                <RotateCcw className="h-3.5 w-3.5" />
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