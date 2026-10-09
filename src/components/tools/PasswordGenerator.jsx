import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { inputCls, labelCls, cardCls, btnCls } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?";
const SIMILAR = /[il1Lo0O]/g;
const AMBIGUOUS = /[{}[\]()/'"`~,;:.<>]/;

const WORDS = ("able bamboo canyon dolphin eagle falcon granite harbor island jungle kernel lantern meadow nomad orbit panda quartz river summit tundra umbrella velvet willow xenon yak zebra anchor breeze cedar dune ember fossil galaxy hazel ivory jade kelp lion moss nettle opal prairie quail ridge sequoia thistle umber vane walnut yield ash birch clover drift elm fern grove heather iris juniper kiwi larch maple nectar olive pine quiver reed sagebrush timber upland vine wisp alpine basalt cinder delta epoch fjord glacier hollow inlet jasper krypton lunar marble nautical oasis pinnacle quartzite ridge-line solar topaz umbral vernal whisper yellow zenith bright calm brave chain charm chase chief clean clear cliff climb cloud coast craft crane crest crown cubic daily dandy dawn deep delta devout dizzy early ebony echo edge eight elite empty enemy enjoy exist extra fable faint faith fancy feast fern field fiery fifth fifty final flair flame flash fleet flint float flock flora fluid".split(" "));

const rand = (n) => crypto.getRandomValues(new Uint32Array(n));
const pick = (chars, len) => {
  const r = rand(len);
  return Array.from(r, (v) => chars[v % chars.length]).join("");
};

const humanize = (seconds) => {
  if (seconds < 60) return "instantly";
  const units = [["minute", 60], ["hour", 3600], ["day", 86400], ["year", 31557600]];
  let t = seconds;
  for (const [name, s] of units) {
    if (t < s * (name === "year" ? 1e12 : 1000)) {
      const v = t / s;
      if (v < 1000) return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${name}s`;
      t = t;
    }
  }
  const years = seconds / 31557600;
  if (years > 1e9) return `${(years / 1e9).toFixed(0)} billion years`;
  if (years > 1e6) return `${(years / 1e6).toFixed(0)} million years`;
  return `${Math.round(years).toLocaleString()} years`;
};

export default function PasswordGenerator() {
  const [mode, setMode] = useState("password");
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true, noSimilar: true, noAmbiguous: false });
  const [words, setWords] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [list, setList] = useState([]);

  const charsets = useMemo(() => {
    let pool = "";
    if (opts.lower) pool += LOWER;
    if (opts.upper) pool += UPPER;
    if (opts.digits) pool += DIGITS;
    if (opts.symbols) pool += opts.noAmbiguous ? "!@#$%^&*-_+=" : SYMBOLS;
    if (opts.noSimilar) pool = pool.replace(SIMILAR, "");
    return pool;
  }, [opts]);

  const entropy = useMemo(() => {
    if (mode === "password") return charsets ? length * Math.log2(charsets.length) : 0;
    return words * Math.log2(WORDS.length);
  }, [mode, charsets, length, words]);

  const strength =
    entropy >= 100 ? { label: "Fortress", cls: "bg-green-600", pct: 100 }
    : entropy >= 75 ? { label: "Very strong", cls: "bg-green-500", pct: entropy / 128 * 100 }
    : entropy >= 55 ? { label: "Strong", cls: "bg-yellow-500", pct: entropy / 128 * 100 }
    : entropy >= 36 ? { label: "Fair", cls: "bg-orange-500", pct: entropy / 128 * 100 }
    : { label: "Weak", cls: "bg-red-500", pct: entropy / 128 * 100 };

  const generate = () => {
    if (mode === "password") {
      if (!charsets) return;
      setList(Array.from({ length: 5 }, () => pick(charsets, length)));
    } else {
      setList(Array.from({ length: 5 }, () => {
        const r = rand(words);
        return Array.from(r, (v) => WORDS[v % WORDS.length]).join(separator);
      }));
    }
  };

  useEffect(generate, [mode, length, words, separator, charsets]);

  const crackTime = humanize(Math.pow(2, entropy) / 1e11);

  return (
    <div className="space-y-5">
      <div className="flex rounded-lg overflow-hidden border border-border/60 w-fit">
        {[["password", "Random password"], ["passphrase", "Passphrase"]].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-bold transition-colors ${mode === m ? "bg-foreground text-background" : "bg-card text-foreground/70"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <div className={cardCls}>
          <label className={labelCls}>Length: {length}</label>
          <input type="range" min="6" max="64" value={length} onChange={(e) => setLength(parseInt(e.target.value, 10))} className="w-full accent-foreground mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              ["lower", "Lowercase a-z"],
              ["upper", "Uppercase A-Z"],
              ["digits", "Digits 0-9"],
              ["symbols", "Symbols !@#"],
              ["noSimilar", "No look-alikes (i l 1 L o 0 O)"],
              ["noAmbiguous", "No ambiguous symbols"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" checked={opts[key]} onChange={(e) => setOpts({ ...opts, [key]: e.target.checked })} className="accent-foreground" />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className={cardCls}>
          <label className={labelCls}>Words: {words}</label>
          <input type="range" min="3" max="8" value={words} onChange={(e) => setWords(parseInt(e.target.value, 10))} className="w-full accent-foreground mb-4" />
          <div className="max-w-40">
            <label className={labelCls}>Separator</label>
            <select value={separator} onChange={(e) => setSeparator(e.target.value)} className={inputCls}>
              {["-", ".", "_", " ", "+"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className={cardCls}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Entropy: <span className="text-foreground">{entropy.toFixed(0)} bits</span> · <span className="text-foreground">{strength.label}</span>
          </p>
          <button onClick={generate} className="text-xs font-bold inline-flex items-center gap-1.5 text-accent">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </button>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${strength.cls}`} style={{ width: `${Math.min(100, strength.pct)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Estimated offline crack time: <span className="font-bold text-foreground">{crackTime}</span> (at 100 billion guesses/second).</p>
      </div>

      <div className="space-y-2">
        {list.map((pw, i) => (
          <div key={i} className={`flex items-center justify-between gap-3 bg-card border rounded-lg px-4 py-3 ${i === 0 ? "border-foreground/40" : "border-border/60"}`}>
            <p className="font-mono text-sm break-all flex-1">{pw}</p>
            <CopyButton text={pw} label="" />
          </div>
        ))}
      </div>

      {mode === "password" && !charsets && <p className="text-xs text-red-600 font-bold">Select at least one character set.</p>}
      <p className="text-xs text-muted-foreground">Generated in your browser with the cryptographic random generator — nothing is transmitted or stored.</p>
    </div>
  );
}