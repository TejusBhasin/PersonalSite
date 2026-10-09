import { useMemo, useState } from "react";
import { inputCls, cardCls } from "@/lib/toolUi";

const CHEATS = [
  ["Email", "[\\w.+-]+@[\\w-]+\\.[\\w.]+", "Simple email pattern"],
  ["URL", "https?:\\/\\/[^\\s<>\"']+\\.[^\\s<>\"']+", "http(s) links"],
  ["IPv4", "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", "Four 0-255-ish groups"],
  ["Date", "\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])", "YYYY-MM-DD"],
  ["Hex color", "#(?:[0-9a-fA-F]{3}){1,2}\\b", "#fff or #ff0044"],
  ["Phone", "\\(\\d{3}\\) \\d{3}-\\d{4}", "(555) 123-4567"],
];

export default function RegexTester() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState({ g: true, i: true, m: false, s: false });
  const [test, setTest] = useState("Contact me at tejus@example.com or dev.site@school.org — or call (555) 123-4567 today (2026-10-09).");

  const flagStr = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join("");

  const result = useMemo(() => {
    if (!pattern) return { error: null, matches: [], segments: [{ text: test, match: false }] };
    let re;
    try {
      re = new RegExp(pattern, flagStr);
    } catch (err) {
      return { error: String(err.message), matches: [], segments: [{ text: test, match: false }] };
    }
    const matches = [];
    const segments = [];
    let last = 0;
    if (flags.g) {
      let m;
      let guard = 0;
      while ((m = re.exec(test)) && guard++ < 2000) {
        if (m.index > last) segments.push({ text: test.slice(last, m.index), match: false });
        segments.push({ text: m[0], match: true });
        matches.push({ index: m.index, text: m[0], groups: m.slice(1) });
        last = m.index + m[0].length;
        if (m[0].length === 0) re.lastIndex++;
      }
    } else {
      const m = re.exec(test);
      if (m) {
        if (m.index > 0) segments.push({ text: test.slice(0, m.index), match: false });
        segments.push({ text: m[0], match: true });
        matches.push({ index: m.index, text: m[0], groups: m.slice(1) });
        last = m.index + m[0].length;
      }
    }
    if (last < test.length) segments.push({ text: test.slice(last), match: false });
    return { error: null, matches, segments };
  }, [pattern, flagStr, test, flags.g]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Regular expression..."
            className={inputCls + " font-mono " + (result.error ? "border-red-400" : "")}
          />
          {result.error && <p className="text-xs text-red-600 mt-1 font-mono">{result.error}</p>}
        </div>
        <div className="flex gap-1.5">
          {["g", "i", "m", "s"].map((f) => (
            <button
              key={f}
              onClick={() => setFlags((s) => ({ ...s, [f]: !s[f] }))}
              className={`w-9 h-9 rounded-lg font-mono text-xs font-bold border transition-colors ${
                flags[f] ? "bg-foreground text-background border-foreground" : "bg-card border-border/60 hover:border-foreground/40"
              }`}
              title={{ g: "Global", i: "Case-insensitive", m: "Multi-line", s: "Dot matches newline" }[f]}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={test}
        onChange={(e) => setTest(e.target.value)}
        rows={4}
        placeholder="Test text..."
        className={inputCls + " resize-y"}
      />

      <div className={cardCls}>
        <div className="text-sm leading-7 font-mono whitespace-pre-wrap break-words">
          {result.segments.map((seg, i) =>
            seg.match ? (
              <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5 font-bold">{seg.text}</mark>
            ) : (
              <span key={i} className="text-muted-foreground">{seg.text}</span>
            )
          )}
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Matches ({result.matches.length})
        </p>
        {result.matches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No matches yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-auto">
            {result.matches.map((m, i) => (
              <div key={i} className="text-xs font-mono bg-background/50 border border-border/40 rounded-lg px-3 py-2">
                <span className="text-muted-foreground mr-2">#{m.index}</span>
                <span className="font-bold">{m.text || "(empty)"}</span>
                {m.groups.some((g) => g !== undefined) && (
                  <span className="text-accent ml-2">groups: {m.groups.map((g, gi) => g ?? "∅").join(" | ")}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {CHEATS.map(([name, pat, desc]) => (
          <button
            key={name}
            title={desc}
            onClick={() => setPattern(pat)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/60 bg-card hover:border-foreground/40 transition-colors"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}