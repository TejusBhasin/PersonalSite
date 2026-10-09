import { useMemo, useState } from "react";
import { inputCls, labelCls, cardCls, ghostBtnCls } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const STOP = new Set("the a an and or but in on at to for of with is are was were be been it its this that these those as by from not".split(" "));
const syllables = (w) => {
  const s = w.toLowerCase().replace(/e$/, "");
  const m = s.match(/[aeiouy]+/g);
  return Math.max(1, m ? m.length : 1);
};

const CASES = [
  ["UPPERCASE", (t) => t.toUpperCase()],
  ["lowercase", (t) => t.toLowerCase()],
  ["Title Case", (t) => t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())],
  ["Sentence case", (t) => t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())],
  ["camelCase", (t) => t.toLowerCase().replace(/[^a-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))],
  ["snake_case", (t) => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")],
  ["kebab-case", (t) => t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")],
  ["CONSTANT_CASE", (t) => t.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")],
];

export default function TextAnalyzer() {
  const [text, setText] = useState("");
  const [converted, setConverted] = useState("");

  const s = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];
    const sentences = trimmed ? (trimmed.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [trimmed]).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
    const chars = text.length;
    const noSpaces = text.replace(/\s/g, "").length;
    const syl = words.reduce((a, w) => a + syllables(w), 0);
    const flesch = words.length && sentences ? 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syl / words.length) : 0;
    const freq = {};
    words.forEach((w) => {
      const k = w.toLowerCase().replace(/[^a-z0-9']/g, "");
      if (k.length > 2 && !STOP.has(k)) freq[k] = (freq[k] || 0) + 1;
    });
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      words: words.length, chars, noSpaces, sentences, paragraphs, syl,
      avgWord: words.length ? noSpaces / words.length : 0,
      readMin: words.length / 200, speakMin: words.length / 130,
      flesch: Math.max(0, Math.min(100, flesch)),
      top,
    };
  }, [text]);

  const grade = s.flesch >= 90 ? "Very easy" : s.flesch >= 70 ? "Easy" : s.flesch >= 60 ? "Standard" : s.flesch >= 50 ? "Fairly difficult" : s.flesch >= 30 ? "Difficult" : "Very difficult";

  const stat = (label, value) => (
    <div className="bg-card border border-border/60 rounded-xl p-4">
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );

  const fmtMin = (m) => (m < 1 ? `${Math.max(1, Math.round(m * 60))} sec` : `${m.toFixed(1)} min`);

  return (
    <div className="space-y-5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Paste or type text to analyze..."
        className={inputCls + " min-h-[140px] resize-y"}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat("Words", s.words)}
        {stat("Characters", s.chars)}
        {stat("No spaces", s.noSpaces)}
        {stat("Sentences", s.sentences)}
        {stat("Paragraphs", s.paragraphs)}
        {stat("Avg word length", s.words ? s.avgWord.toFixed(1) : "0")}
        {stat("Reading time", s.words ? fmtMin(s.readMin) : "0 sec")}
        {stat("Speaking time", s.words ? fmtMin(s.speakMin) : "0 sec")}
      </div>

      {s.words > 0 && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Flesch reading ease</p>
            <p className="text-sm font-black">
              {s.flesch.toFixed(1)} — <span className="text-accent">{grade}</span>
            </p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-500" style={{ width: `${s.flesch}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">100 = easiest to read, 0 = extremely dense. Based on sentence length and syllable count.</p>
        </div>
      )}

      {s.top.length > 0 && (
        <div className={cardCls}>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Top words</p>
          <div className="space-y-1.5">
            {s.top.map(([w, n]) => (
              <div key={w} className="flex items-center gap-3">
                <span className="text-xs font-mono w-28 truncate text-right">{w}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-foreground/70 rounded-full" style={{ width: `${(n / s.top[0][1]) * 100}%` }} />
                </div>
                <span className="text-xs font-bold tabular-nums w-6">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cardCls}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Case converters</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {CASES.map(([name, fn]) => (
            <button key={name} onClick={() => setConverted(fn(text))} className={ghostBtnCls}>{name}</button>
          ))}
        </div>
        {converted && (
          <div className="flex items-start gap-2">
            <div className="flex-1 bg-background/50 border border-border/40 rounded-lg p-3 text-sm font-mono break-words whitespace-pre-wrap max-h-48 overflow-auto">
              {converted}
            </div>
            <CopyButton text={converted} />
          </div>
        )}
      </div>
    </div>
  );
}