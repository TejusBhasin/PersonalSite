import { useEffect, useMemo, useState } from "react";
import { inputCls, labelCls, cardCls, ghostBtnCls } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

function hex2rgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgb2hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hsl2rgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(Math.min(k(n) - 3, 9 - k(n)), 1));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function parse(input) {
  const s = input.trim().toLowerCase();
  let m;
  if ((m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/))) return hex2rgb(s);
  if ((m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/))) return { r: +m[1], g: +m[2], b: +m[3] };
  if ((m = s.match(/hsl\(\s*(\d+)[,\s]+(\d+)%?[,\s]+(\d+)%?/))) return hsl2rgb(+m[1], +m[2], +m[3]);
  if (/^[0-9a-f]{6}$/.test(s.replace("#", ""))) return hex2rgb(s);
  return null;
}

const luminance = ({ r, g, b }) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

export default function ColorStudio() {
  const [input, setInput] = useState("#1a1aff");
  const [fg, setFg] = useState("#ffffff");
  const [bg, setBg] = useState("#0a0a23");

  const rgb = useMemo(() => parse(input), [input]);
  const hsl = useMemo(() => (rgb ? rgb2hsl(rgb.r, rgb.g, rgb.b) : null), [rgb]);

  const harmony = useMemo(() => {
    if (!hsl) return [];
    const mk = (dh) => {
      const c = hsl2rgb((hsl.h + dh + 360) % 360, hsl.s, hsl.l);
      return rgb2hex(c.r, c.g, c.b);
    };
    const tints = [40, 60, 80].map((l) => rgb2hex(...Object.values(hsl2rgb(hsl.h, hsl.s, l))));
    const shades = [25, 15, 8].map((l) => rgb2hex(...Object.values(hsl2rgb(hsl.h, Math.min(100, hsl.s), l))));
    return [
      ["Complementary", [mk(180)]],
      ["Analogous", [mk(-30), mk(30)]],
      ["Triadic", [mk(120), mk(240)]],
      ["Tints", tints],
      ["Shades", shades],
    ];
  }, [hsl]);

  const fgRgb = parse(fg), bgRgb = parse(bg);
  let ratio = null;
  if (fgRgb && bgRgb) {
    const l1 = luminance(fgRgb), l2 = luminance(bgRgb);
    ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  const badge = (label, ok) => (
    <span className={`px-2 py-1 rounded text-[10px] font-bold ${ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );

  const swatch = (hex) => (
    <button
      key={hex}
      onClick={() => setInput(hex)}
      className="flex-1 h-10 rounded-lg border border-border/60 font-mono text-[9px] font-bold text-white mix-blend-difference flex items-end justify-center pb-0.5"
      style={{ backgroundColor: hex }}
      title={`Use ${hex}`}
    >
      {hex}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className={cardCls}>
        <label className={labelCls}>Any color — hex, rgb(), or hsl()</label>
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-lg border border-border/60 shrink-0" style={{ backgroundColor: rgb ? rgb2hex(rgb.r, rgb.g, rgb.b) : "transparent" }} />
          <input value={input} onChange={(e) => setInput(e.target.value)} className={inputCls + " font-mono flex-1"} placeholder="#1a1aff / rgb(26,26,255) / hsl(240,100,55)" />
        </div>
        {rgb && hsl && (
          <div className="mt-4 space-y-2">
            {[
              ["HEX", rgb2hex(rgb.r, rgb.g, rgb.b)],
              ["RGB", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`],
              ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
              ["CMYK", (() => { const k = 1 - Math.max(rgb.r, rgb.g, rgb.b) / 255; const f = (v) => (k === 1 ? 0 : Math.round(((1 - v / 255 - k) / (1 - k)) * 100)); return `cmyk(${f(rgb.r)}, ${f(rgb.g)}, ${f(rgb.b)}, ${Math.round(k * 100)}%)`; })()],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <p className="text-sm font-mono"><span className="text-muted-foreground w-12 inline-block text-xs font-bold">{label}</span>{value}</p>
                <CopyButton text={value} label="" />
              </div>
            ))}
          </div>
        )}
        {!rgb && <p className="text-xs text-red-600 mt-2">Could not parse that color. Try #4f46e5 or rgb(79, 70, 229).</p>}
      </div>

      {hsl && (
        <div className="space-y-3">
          {harmony.map(([label, colors]) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
              <div className="flex gap-2">{colors.map(swatch)}</div>
            </div>
          ))}
        </div>
      )}

      <div className={cardCls}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">WCAG contrast checker</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls}>Text color</label>
            <input value={fg} onChange={(e) => setFg(e.target.value)} className={inputCls + " font-mono"} />
          </div>
          <div>
            <label className={labelCls}>Background</label>
            <input value={bg} onChange={(e) => setBg(e.target.value)} className={inputCls + " font-mono"} />
          </div>
        </div>
        {ratio !== null && (
          <>
            <div
              className="rounded-lg p-6 text-center mb-3"
              style={{ backgroundColor: bgRgb ? rgb2hex(bgRgb.r, bgRgb.g, bgRgb.b) : "#fff", color: fgRgb ? rgb2hex(fgRgb.r, fgRgb.g, fgRgb.b) : "#000" }}
            >
              <span className="text-xl font-black">Aa — The quick brown fox</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-black mr-2">{ratio.toFixed(2)}:1</span>
              {badge("AA normal (4.5)", ratio >= 4.5)}
              {badge("AA large (3.0)", ratio >= 3)}
              {badge("AAA normal (7.0)", ratio >= 7)}
              {badge("AAA large (4.5)", ratio >= 4.5)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}