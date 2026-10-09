import { useEffect, useMemo, useState } from "react";
import { inputCls, cardCls, btnCls, ghostBtnCls, loadLS, saveLS } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const GRADE_POINTS = { A: 4.0, "A-": 3.7, "B+": 3.3, B: 3.0, "B-": 2.7, "C+": 2.3, C: 2.0, "C-": 1.7, "D+": 1.3, D: 1.0, F: 0 };
const LEVELS = { "College Prep": 0, Honors: 0.5, "AP / IB / Dual": 1 };

export default function GpaCalculator() {
  const [rows, setRows] = useState(() => loadLS("gpa-courses", [{ id: 1, name: "", credits: 1, level: "College Prep", grade: "A" }]));

  useEffect(() => saveLS("gpa-courses", rows), [rows]);

  const update = (id, field, value) =>
    setRows((r) =>
      r.map((row) => (row.id === id ? { ...row, [field]: field === "credits" ? Math.max(0, parseFloat(value) || 0) : value } : row))
    );

  const { weighted, unweighted, credits, count } = useMemo(() => {
    let w = 0, u = 0, c = 0, n = 0;
    rows.forEach((r) => {
      const cr = r.credits || 0;
      if (!r.grade || cr <= 0) return;
      const pts = GRADE_POINTS[r.grade] ?? 0;
      w += (pts + (LEVELS[r.level] ?? 0)) * cr;
      u += pts * cr;
      c += cr;
      n++;
    });
    return { weighted: c ? w / c : 0, unweighted: c ? u / c : 0, credits: c, count: n };
  }, [rows]);

  const resetRow = { id: Date.now(), name: "", credits: 1, level: "College Prep", grade: "A" };

  const stat = (label, value) => (
    <div key={label} className="bg-card border border-border/60 rounded-xl p-4 text-center">
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stat("Weighted GPA", weighted.toFixed(2))}
        {stat("Unweighted GPA", unweighted.toFixed(2))}
        {stat("Total Credits", credits)}
        {stat("Courses", count)}
      </div>

      <div className={cardCls + " !p-0 overflow-hidden"}>
        <div className="hidden md:grid grid-cols-[1fr_90px_170px_120px_40px] gap-3 px-5 py-3 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Course</span><span>Credits</span><span>Level</span><span>Grade</span><span />
        </div>
        {rows.map((row) => (
          <div key={row.id} className="grid md:grid-cols-[1fr_90px_170px_120px_40px] grid-cols-2 gap-3 px-5 py-3 border-b border-border/40 last:border-0">
            <input type="text" value={row.name} onChange={(e) => update(row.id, "name", e.target.value)} placeholder="Course name" className={inputCls} />
            <input type="number" min="0" step="0.5" value={row.credits} onChange={(e) => update(row.id, "credits", e.target.value)} className={inputCls} />
            <select value={row.level} onChange={(e) => update(row.id, "level", e.target.value)} className={inputCls}>
              {Object.keys(LEVELS).map((l) => <option key={l}>{l}</option>)}
            </select>
            <select value={row.grade} onChange={(e) => update(row.id, "grade", e.target.value)} className={inputCls}>
              {Object.keys(GRADE_POINTS).map((g) => <option key={g}>{g}</option>)}
            </select>
            <button
              onClick={() => setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== row.id) : r))}
              className="text-foreground/40 hover:text-red-600 transition-colors text-lg font-bold self-center justify-self-center"
              title="Remove course"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setRows((r) => [...r, { ...resetRow }])} className={btnCls}>+ Add Course</button>
        <button onClick={() => setRows([resetRow])} className={ghostBtnCls}>Reset</button>
        <CopyButton
          className="!px-4"
          text={[
            ...rows.filter((r) => r.name).map((r) => `${r.name} — ${r.grade} (${r.level}, ${r.credits} cr)`),
            `Weighted GPA: ${weighted.toFixed(2)} | Unweighted: ${unweighted.toFixed(2)}`,
          ].join("\n")}
          label="Copy courses"
        />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Weighted GPA adds +0.5 for honors and +1.0 for AP, IB or dual-enrollment courses. Everything is saved on this device automatically.
      </p>
    </div>
  );
}