import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { inputCls, ghostBtnCls } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const MORSE = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----." };
const MORSE_REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

const b64e = (s) => btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const b64d = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), (c) => c.charCodeAt(0)));
const rot13 = (s) => s.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= c.charCodeAt(0) + 13 ? c.charCodeAt(0) + 13 : c.charCodeAt(0) - 13));

const MODES = {
  Base64: {
    enc: (s) => b64e(s),
    dec: (s) => b64d(s),
    desc: "Full Unicode support, safe for emoji and non-Latin text.",
  },
  URL: {
    enc: (s) => encodeURIComponent(s),
    dec: (s) => decodeURIComponent(s),
    desc: "Percent-encoding used by web addresses and form data.",
  },
  ROT13: {
    enc: rot13,
    dec: rot13,
    desc: "Classic letter rotation — the same operation encodes and decodes.",
  },
  Binary: {
    enc: (s) => Array.from(new TextEncoder().encode(s), (b) => b.toString(2).padStart(8, "0")).join(" "),
    dec: (s) => new TextDecoder().decode(Uint8Array.from(s.trim().split(/\s+/).filter(Boolean), (b) => parseInt(b, 2))),
    desc: "Space-separated 8-bit bytes.",
  },
  Hex: {
    enc: (s) => Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join(" "),
    dec: (s) => new TextDecoder().decode(Uint8Array.from(s.replace(/0x/g, "").trim().split(/\s+/).filter(Boolean), (b) => parseInt(b, 16))),
    desc: "Space-separated hexadecimal byte pairs.",
  },
  Morse: {
    enc: (s) => s.toLowerCase().split("").map((c) => (c === " " ? "/" : MORSE[c] || "")).filter(Boolean).join(" "),
    dec: (s) => s.trim().split(/\s+/).map((t) => (t === "/" ? " " : MORSE_REV[t] ?? "")).join(""),
    desc: "Letters joined with spaces, words separated by /.",
  },
};

export default function EncoderDecoder() {
  const [mode, setMode] = useState("Base64");
  const [input, setInput] = useState("Hello, world!");
  const [flipped, setFlipped] = useState(false);

  const { enc, dec, desc } = MODES[mode];

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null };
    try {
      return { output: flipped ? enc(input) : dec(input), error: null };
    } catch {
      return { output: "", error: `This text is not valid ${flipped ? "plain text" : mode} input.` };
    }
  }, [input, mode, flipped, enc, dec]);

  useEffect(() => setFlipped(false), [mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.keys(MODES).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              mode === m ? "bg-foreground text-background border-foreground" : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{desc} <span className="font-bold">{flipped ? "Encoding" : "Decoding"} — press the swap button to flip direction.</span></p>

      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder={flipped ? "Plain text in..." : `${mode} in...`}
          className={inputCls + " font-mono resize-y"}
        />
        <button
          onClick={() => { setFlipped((f) => !f); setInput(output || input); }}
          className={ghostBtnCls + " self-center px-3"}
          title="Swap direction (and move output into input)"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <textarea
          value={error ? "" : output}
          readOnly
          rows={6}
          placeholder={error || (flipped ? `${mode} out...` : "Plain text out...")}
          className={inputCls + " font-mono resize-y " + (error ? "border-red-400" : "")}
        />
      </div>

      <div className="flex items-center gap-3">
        <CopyButton text={error ? "" : output} label="Copy output" />
        {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
      </div>
    </div>
  );
}