import { Music4 } from "lucide-react";

// Album artwork tile. Falls back to a generated blue glass gradient so a library without
// embedded cover art still looks intentional instead of showing broken images.
export default function Mp3nowArt({ src, name = "", size = "md", className = "", rounded = "rounded-[14px]" }) {
  const dims = size === "lg" ? "h-full w-full" : size === "sm" ? "h-10 w-10" : "h-14 w-14";
  const hue = hashHue(name);

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${dims} ${rounded} ${className}`}
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 92% 62%), hsl(${(hue + 38) % 360} 88% 46%))`,
        boxShadow: "0 6px 16px -12px rgba(10,40,90,0.45)",
      }}
    >
      {src ? (
        <img src={src} alt={name ? `${name} cover art` : ""} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/85">
          <Music4 className={size === "sm" ? "h-4 w-4" : "h-6 w-6"} />
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/25" />
    </div>
  );
}

function hashHue(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 360;
  return 200 + (hash % 45);
}