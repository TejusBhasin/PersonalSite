import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { inputCls, cardCls, btnCls } from "@/lib/toolUi";

const SAMPLES = [
  "This house believes that social media does more harm than good",
  "This house would ban autonomous weapons",
  "This house believes that space exploration should be a global priority",
];

const SCHEMA = {
  type: "object",
  properties: {
    framework: { type: "string" },
    definitions: { type: "array", items: { type: "string" } },
    contentions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          claim: { type: "string" },
          warrants: { type: "string" },
          impacts: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["title", "claim", "warrants", "impacts"],
      },
    },
    rebuttals: { type: "array", items: { type: "string" } },
    crossEx: { type: "array", items: { type: "string" } },
  },
  required: ["framework", "contentions", "rebuttals", "crossEx"],
};

export default function DebatePrep() {
  const [motion, setMotion] = useState("");
  const [side, setSide] = useState("Affirmative");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!motion.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an elite high-school debate coach. For the motion "${motion.trim()}", prepare a complete ${side} case. Give a one-paragraph framework (weighing mechanism and burden), key definitions of terms in the motion, three contentions each with a claim, warrants (reasoning), impacts, and suggested evidence areas, four anticipated opposing arguments with strong rebuttals, and five sharp cross-examination questions.`,
        response_json_schema: SCHEMA,
      });
      const data = typeof res === "string" ? JSON.parse(res) : res;
      setResult(data);
    } catch (err) {
      setError("Could not generate the case. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <textarea
        value={motion}
        onChange={(e) => setMotion(e.target.value)}
        rows={2}
        placeholder="Paste the motion or resolution..."
        className={inputCls + " resize-y"}
      />
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button key={s} onClick={() => setMotion(s)} className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/60 bg-card hover:border-foreground/40 transition-colors">
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-border/60">
          {["Affirmative", "Negative"].map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`px-4 py-2 text-sm font-bold transition-colors ${side === s ? "bg-foreground text-background" : "bg-card text-foreground/70"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={generate} disabled={loading || !motion.trim()} className={btnCls}>
          {loading ? "Building case..." : "Generate case"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

      {result && (
        <div className="space-y-4">
          <section className={cardCls}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Framework</h3>
            <p className="text-sm leading-relaxed">{result.framework}</p>
            {result.definitions?.length > 0 && (
              <>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Definitions</h3>
                <ul className="space-y-1">
                  {result.definitions.map((d, i) => <li key={i} className="text-sm text-muted-foreground">• {d}</li>)}
                </ul>
              </>
            )}
          </section>

          <section className="space-y-3">
            {result.contentions?.map((c, i) => (
              <div key={i} className={cardCls}>
                <h3 className="text-sm font-black mb-2">{i + 1}. {c.title}</h3>
                <p className="text-sm mb-2"><span className="font-bold text-muted-foreground text-xs uppercase tracking-wider mr-1">Claim:</span>{c.claim}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{c.warrants}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.impacts}</p>
                {c.evidence && <p className="text-xs text-accent mt-2">Evidence to find: {c.evidence}</p>}
              </div>
            ))}
          </section>

          <section className={cardCls}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Rebuttals to expect and answer</h3>
            <ul className="space-y-2">
              {result.rebuttals?.map((r, i) => <li key={i} className="text-sm leading-relaxed text-muted-foreground">• {r}</li>)}
            </ul>
          </section>

          <section className={cardCls}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Cross-examination questions</h3>
            <ol className="list-decimal pl-5 space-y-2">
              {result.crossEx?.map((q, i) => <li key={i} className="text-sm leading-relaxed">{q}</li>)}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}