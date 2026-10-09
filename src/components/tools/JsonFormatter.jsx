import { useMemo, useState } from "react";
import { inputCls, cardCls, btnCls, ghostBtnCls } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const SAMPLE = `{
  "name": "Tejus Bhasin",
  "school": "Horace Mann School",
  "class_of": 2032,
  "interests": ["debate", "programming", "space"],
  "active": true
}`;

function depth(v, d = 1) {
  if (Array.isArray(v)) return v.reduce((m, x) => Math.max(m, depth(x, d + 1)), d);
  if (v && typeof v === "object") return Object.values(v).reduce((m, x) => Math.max(m, depth(x, d + 1)), d);
  return d;
}
function countKeys(v) {
  if (Array.isArray(v)) return v.reduce((a, x) => a + countKeys(x), 0);
  if (v && typeof v === "object") return Object.keys(v).length + Object.values(v).reduce((a, x) => a + countKeys(x), 0);
  return 0;
}

function locate(text, pos) {
  const upTo = text.slice(0, pos);
  const lines = upTo.split("\n");
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

export default function JsonFormatter() {
  const [text, setText] = useState("");
  const [indent, setIndent] = useState(2);

  const analysis = useMemo(() => {
    if (!text.trim()) return { status: "empty" };
    try {
      const obj = JSON.parse(text);
      return {
        status: "valid",
        obj,
        type: Array.isArray(obj) ? "array" : typeof obj,
        keys: countKeys(obj),
        depth: depth(obj),
        size: new Blob([text]).size,
      };
    } catch (err) {
      const m = String(err.message || "").match(/position (\d+)/);
      const pos = m ? parseInt(m[1], 10) : null;
      return { status: "error", message: String(err.message || "Invalid JSON"), pos, loc: pos !== null ? locate(text, pos) : null };
    }
  }, [text]);

  const run = (mode) => {
    try {
      const obj = JSON.parse(text);
      setText(mode === "min" ? JSON.stringify(obj) : JSON.stringify(obj, null, indent));
    } catch {
      /* analysis area shows the error */
    }
  };

  const stats = [
    ["Type", analysis.status === "valid" ? analysis.type : "—"],
    ["Keys", analysis.status === "valid" ? analysis.keys : "—"],
    ["Depth", analysis.status === "valid" ? analysis.depth : "—"],
    ["Size", analysis.status === "valid" ? (analysis.size < 1024 ? `${analysis.size} B` : `${(analysis.size / 1024).toFixed(1)} KB`) : "—"],
  ];

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Paste JSON here..."
        className={inputCls + " min-h-[220px] font-mono resize-y"}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => run("pretty")} className={btnCls}>Format</button>
        <button onClick={() => run("min")} className={ghostBtnCls}>Minify</button>
        <select value={indent} onChange={(e) => setIndent(parseInt(e.target.value, 10))} className={inputCls + " !w-auto"}>
          <option value={2}>2-space indent</option>
          <option value={4}>4-space indent</option>
        </select>
        <button onClick={() => setText(SAMPLE)} className={ghostBtnCls}>Sample</button>
        <button onClick={() => setText("")} className={ghostBtnCls}>Clear</button>
        <div className="flex-1" />
        <CopyButton text={text} label="Copy JSON" />
      </div>

      {analysis.status === "valid" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(([l, v]) => (
            <div key={l} className="bg-card border border-border/60 rounded-xl p-4 text-center">
              <p className="text-sm font-black capitalize">{String(v)}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{l}</p>
            </div>
          ))}
          <div className="md:col-span-4 text-xs font-bold text-green-700">✓ Valid JSON</div>
        </div>
      )}

      {analysis.status === "error" && (
        <div className={cardCls + " border-red-300 bg-red-50"}>
          <p className="text-sm font-bold text-red-700">✗ {analysis.message}</p>
          {analysis.loc && (
            <p className="text-xs text-red-600 mt-1 font-mono">
              Near line {analysis.loc.line}, column {analysis.loc.col}
            </p>
          )}
        </div>
      )}
    </div>
  );
}