// Tiled watermark laid over every photo. It sits above the image and captures
// pointer events, so a right click or long press lands on the overlay instead of
// the picture.

const tile = (label) => {
  const safe = label.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180'><g transform='rotate(-28 150 90)'><text x='150' y='96' text-anchor='middle' font-family='Montserrat, Arial, sans-serif' font-size='15' font-weight='700' letter-spacing='3' fill='rgba(255,255,255,0.62)' stroke='rgba(0,0,0,0.3)' stroke-width='1.2' paint-order='stroke'>${safe}</text></g></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
};

export default function Watermark({ label = "TEJUSBHASIN.INFO" }) {
  return (
    <div
      aria-hidden="true"
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 z-10 pointer-events-auto select-none"
      style={{ backgroundImage: tile(label), backgroundRepeat: "repeat" }}
    />
  );
}