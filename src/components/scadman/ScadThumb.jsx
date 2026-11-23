const PALETTES = [
  ["#e9b14c", "#8d97a5"],
  ["#6fd6c4", "#8d97a5"],
  ["#8ec9ff", "#8d97a5"],
  ["#d7a6ff", "#8d97a5"],
];

function hash(text) {
  let h = 0;
  for (let i = 0; i < String(text).length; i++) h = (h * 31 + String(text).charCodeAt(i)) % 100000;
  return h;
}

// Deterministic wireframe cover — no stock imagery, no fake render. Every card gets a distinct
// abstract form derived from its own identity.
export default function ScadThumb({ seed, label, className = "" }) {
  const h = hash(seed || label || "scadman");
  const variant = h % 4;
  const [accent] = PALETTES[h % PALETTES.length];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "linear-gradient(160deg, #141922 0%, #0c1016 100%)" }}
    >
      <svg viewBox="0 0 160 110" className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern id={`grid-${variant}-${h}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10 0 L0 0 0 10" fill="none" stroke="#202934" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="160" height="110" fill={`url(#grid-${variant}-${h})`} opacity="0.55" />
        {variant === 0 && (
          <g stroke={accent} strokeWidth="1.3" fill="none" strokeLinejoin="round">
            <path d="M52 34 L100 22 L128 40 L80 53 Z" />
            <path d="M52 34 L52 74 L80 92 L80 53" />
            <path d="M80 53 L128 40 L128 78 L80 92" />
            <path d="M62 44 L62 68 L72 74" stroke="#8d97a5" strokeWidth="0.9" />
          </g>
        )}
        {variant === 1 && (
          <g stroke={accent} strokeWidth="1.3" fill="none">
            <ellipse cx="80" cy="30" rx="34" ry="13" />
            <ellipse cx="80" cy="52" rx="34" ry="13" stroke="#8d97a5" strokeWidth="0.9" />
            <ellipse cx="80" cy="74" rx="34" ry="13" />
            <path d="M46 30 L46 74 M114 30 L114 74" />
            <ellipse cx="80" cy="52" rx="14" ry="5.5" stroke="#8d97a5" strokeWidth="0.9" />
          </g>
        )}
        {variant === 2 && (
          <g stroke={accent} strokeWidth="1.3" fill="none" strokeLinejoin="round">
            <path d="M36 40 L124 40 L124 82 L36 82 Z" />
            <path d="M36 40 L48 28 L136 28 L124 40" />
            <path d="M124 82 L136 70 L136 28" />
            <path d="M36 52 L124 52" stroke="#8d97a5" strokeWidth="0.9" />
            <path d="M36 66 L124 66" stroke="#8d97a5" strokeWidth="0.9" />
          </g>
        )}
        {variant === 3 && (
          <g stroke={accent} strokeWidth="1.3" fill="none" strokeLinejoin="round">
            <circle cx="80" cy="58" r="26" />
            <circle cx="80" cy="58" r="9" stroke="#8d97a5" strokeWidth="0.9" />
            <path d="M80 32 L80 49 M80 67 L80 84 M54 58 L71 58 M89 58 L106 58" />
            <path d="M62 40 L70 48 M98 76 L90 68 M98 40 L90 48 M62 76 L70 68" stroke="#8d97a5" strokeWidth="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
}