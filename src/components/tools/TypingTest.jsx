import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cardCls, btnCls, loadLS, saveLS } from "@/lib/toolUi";

const QUOTES = [
  "The best way to predict the future is to invent it.",
  "Science is the great antidote to the poison of enthusiasm and superstition.",
  "Somewhere, something incredible is waiting to be known.",
  "We are made of star stuff, and we are a way for the universe to know itself.",
  "The important thing is not to stop questioning; curiosity has its own reason for existing.",
  "Anyone who has never made a mistake has never tried anything new.",
  "What we know is a drop, what we do not know is an ocean.",
  "If you want to find the secrets of the universe, think in terms of energy, frequency and vibration.",
  "Difficulties strengthen the mind, as labor does the body.",
  "Success is not final, and failure is not fatal; what matters is the courage to continue.",
  "The pen is mightier than the sword, and the keyboard mightier still.",
  "Talk is cheap because supply exceeds demand.",
];

export default function TypingTest() {
  const [duration, setDuration] = useState(30);
  const [quote, setQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [typed, setTyped] = useState("");
  const [startAt, setStartAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);
  const [bests, setBests] = useState(() => loadLS("typing-bests", {}));

  const running = startAt !== null && !finished;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      const e = (Date.now() - startAt) / 1000;
      setElapsed(e);
      if (e >= duration || typed.length >= quote.length) finish();
    }, 100);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, startAt, typed, duration, quote]);

  const stats = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === quote[i]) correct++;
    const minutes = Math.max(elapsed, 1) / 60;
    const wpm = elapsed > 0 ? Math.round(correct / 5 / (elapsed / 60)) : 0;
    const accuracy = typed.length ? Math.round((correct / typed.length) * 100) : 100;
    return { correct, wpm, accuracy };
  }, [typed, quote, elapsed]);

  function finish() {
    setFinished(true);
    const mins = duration / 60;
    const wpm = Math.round(stats.correct / 5 / mins);
    if (wpm > (bests[duration] || 0)) {
      const next = { ...bests, [duration]: wpm };
      setBests(next);
      saveLS("typing-bests", next);
    }
  }

  const restart = () => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    setTyped("");
    setStartAt(null);
    setElapsed(0);
    setFinished(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKey = (e) => {
    if (finished) return;
    if (startAt === null && (e.key.length === 1 || e.key === "Backspace")) setStartAt(Date.now());
    if (e.key.length === 1) {
      setTyped((t) => (t + e.key).slice(0, quote.length));
      e.preventDefault();
    } else if (e.key === "Backspace") {
      setTyped((t) => t.slice(0, -1));
      e.preventDefault();
    }
  };

  const remaining = Math.max(0, duration - elapsed);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {[15, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => { setDuration(d); restart(); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              duration === d ? "bg-foreground text-background border-foreground" : "bg-card text-foreground/70 border-border/60 hover:border-foreground/40"
            }`}
          >
            {d}s
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex gap-5 font-black tabular-nums">
          <span className="text-sm">{running || finished ? `${finished ? duration : remaining.toFixed(1)}s` : `${duration}s`}</span>
          <span className="text-sm">{stats.wpm} WPM</span>
          <span className="text-sm">{stats.accuracy}%</span>
        </div>
      </div>

      <div className={cardCls + " relative"} onClick={() => inputRef.current?.focus()}>
        <p className="text-lg leading-9 font-mono break-words cursor-pointer">
          {quote.split("").map((ch, i) => {
            let cls = "text-muted-foreground/50";
            if (i < typed.length) cls = typed[i] === ch ? "text-foreground" : "text-red-500 bg-red-500/10 rounded";
            else if (i === typed.length && running) cls = "text-muted-foreground bg-foreground/20 rounded";
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            );
          })}
        </p>
        <input
          ref={inputRef}
          onKeyDown={onKey}
          value=""
          onChange={() => {}}
          autoComplete="off"
          aria-label="Typing input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      {finished ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["WPM", stats.wpm],
              ["Accuracy", `${stats.accuracy}%`],
              ["Best", `${bests[duration] || stats.wpm} WPM`],
            ].map(([l, v]) => (
              <div key={l} className="bg-card border border-border/60 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{v}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{l}</p>
              </div>
            ))}
          </div>
          <button onClick={restart} className={btnCls + " inline-flex items-center gap-2"}>
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {running ? "Keep going!" : "Click the text and start typing — the clock starts with your first keystroke."}
        </p>
      )}
    </div>
  );
}