import { useEffect, useState } from "react";
import { inputCls, cardCls, monoCls } from "@/lib/toolUi";
import CopyButton from "@/components/tools/CopyButton";

const ALGOS = [
  ["SHA-1", "SHA-1"],
  ["SHA-256", "SHA-256"],
  ["SHA-384", "SHA-384"],
  ["SHA-512", "SHA-512"],
];

const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");

export default function HashGenerator() {
  const [text, setText] = useState("");
  const [hashes, setHashes] = useState({});
  const [match, setMatch] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!text) {
      setHashes({});
      setFailed(false);
      return;
    }
    (async () => {
      try {
        const data = new TextEncoder().encode(text);
        const entries = await Promise.all(
          ALGOS.map(async ([label, algo]) => [label, hex(await crypto.subtle.digest(algo, data))])
        );
        if (!cancelled) setHashes(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [text]);

  const matchedAlgo = match.trim() ? ALGOS.map(([l]) => l).find((l) => hashes[l] === match.trim().toLowerCase()) : null;

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Type or paste text to hash..."
        className={inputCls + " font-mono resize-y"}
      />
      {failed && <p className="text-xs text-red-600">Your browser blocked secure hashing. This tool needs an HTTPS connection.</p>}

      <div className="space-y-3">
        {ALGOS.map(([label]) => (
          <div key={label} className={cardCls + (matchedAlgo === label ? " !border-green-500" : "")}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <div className="flex items-center gap-2">
                {matchedAlgo === label && <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">✓ Match</span>}
                <CopyButton text={hashes[label] || ""} />
              </div>
            </div>
            <p className="font-mono text-xs break-all leading-relaxed text-foreground">
              {hashes[label] || "—"}
            </p>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Verify against a known hash</label>
        <input
          value={match}
          onChange={(e) => setMatch(e.target.value)}
          placeholder="Paste a digest to compare..."
          className={inputCls + " font-mono"}
        />
        {match.trim() && (
          <p className={`text-xs mt-2 font-bold ${matchedAlgo ? "text-green-700" : "text-red-600"}`}>
            {matchedAlgo ? `Identical to the ${matchedAlgo} digest above.` : "No match — the text differs from the original."}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Digests are computed with the Web Crypto API entirely on your device — nothing is sent to a server. Hashing is one-way: the same input always produces the same digest, but the digest can never be turned back into the input.
      </p>
    </div>
  );
}