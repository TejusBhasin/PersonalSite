// Watermark overlay laid over every photo. Two shapes:
//   grid — one horizontal line and one vertical line crossing in the middle (a plus)
//   full — the same plus, plus a line across the top and bottom third
// It sits above the image and captures pointer events, so a right click or long
// press lands on the overlay instead of the picture.

const LABEL = "TEJUSBHASIN.INFO";
const REPEAT = Array.from({ length: 14 }, () => LABEL).join("   ·   ");

const TEXT = {
  fontFamily: "'Montserrat', system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: "0.3em",
  color: "rgba(255,255,255,0.92)",
  textShadow: "0 1px 4px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.95)",
  whiteSpace: "nowrap",
  userSelect: "none",
};

function HLine({ top }) {
  return (
    <div
      className="absolute inset-x-0 flex justify-center overflow-hidden"
      style={{ top, transform: "translateY(-50%)" }}
    >
      <span style={TEXT}>{REPEAT}</span>
    </div>
  );
}

function VLine() {
  return (
    <div className="absolute inset-y-0 left-1/2 overflow-hidden" style={{ transform: "translateX(-50%)" }}>
      <span style={{ ...TEXT, writingMode: "vertical-rl" }}>{REPEAT}</span>
    </div>
  );
}

export default function Watermark({ variant = "grid" }) {
  return (
    <div
      aria-hidden="true"
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 z-10 pointer-events-auto select-none"
    >
      <VLine />
      {variant === "full" ? (
        <>
          <HLine top="33.33%" />
          <HLine top="50%" />
          <HLine top="66.66%" />
        </>
      ) : (
        <HLine top="50%" />
      )}
    </div>
  );
}