// Watermark overlay laid over every photo. Two shapes:
//   grid — one horizontal line and one vertical line crossing in the middle (a plus)
//   full — the same plus, plus a line across the top and bottom third
// It sits above the image and captures pointer events, so a right click or long
// press lands on the overlay instead of the picture. A MutationObserver watches
// the container, so deleting the element in devtools or hiding it with a style
// change puts it straight back.

import { useEffect, useRef } from "react";

const LABEL = "TEJUSBHASIN.INFO";
const REPEAT = Array.from({ length: 14 }, () => LABEL).join("   ·   ");

const TEXT = {
  fontFamily: "'Montserrat', system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: "0.3em",
  color: "rgba(255,255,255,0.5)",
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
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    const parent = node?.parentElement;
    if (!node || !parent) return;

    let busy = false;
    const guard = () => {
      if (busy) return;
      busy = true;
      try {
        if (!node.isConnected) parent.appendChild(node);
        const cs = window.getComputedStyle(node);
        if (cs.display === "none") node.style.display = "";
        if (cs.visibility === "hidden") node.style.visibility = "";
        if (Number(cs.opacity) < 0.99) node.style.opacity = "";
        if (cs.pointerEvents === "none") node.style.pointerEvents = "auto";
      } finally {
        busy = false;
      }
    };

    const mo = new MutationObserver(guard);
    mo.observe(parent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });
    guard();
    return () => mo.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-watermark="tejusbhasin.info"
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