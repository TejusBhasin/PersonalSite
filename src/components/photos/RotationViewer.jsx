import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Watermark from "@/components/photos/Watermark";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const block = (e) => e.preventDefault();

export default function RotationViewer({ photos, index, onIndex, onClose }) {
  const total = photos.length;
  const photo = photos[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % total);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, total, onIndex, onClose]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-foreground flex flex-col" onContextMenu={block}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 text-background">
        <span className="text-xs font-bold tracking-[0.25em] uppercase" style={MONT}>
          Rotation Mode · {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full border border-background/30 px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase hover:bg-background/10 transition-colors"
          style={MONT}
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-6 px-2 sm:px-6 pb-4 min-h-0">
        <button
          type="button"
          onClick={() => onIndex((index - 1 + total) % total)}
          aria-label="Previous photo"
          className="shrink-0 rounded-full border border-background/30 p-3 text-background hover:bg-background/10 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="relative flex-1 h-full min-h-0 flex items-center justify-center">
          <div className="relative max-h-full max-w-full">
            <img
              key={photo.id}
              src={photo.full}
              alt={photo.name}
              draggable={false}
              onDragStart={block}
              onContextMenu={block}
              className="max-h-[72vh] max-w-full select-none object-contain"
            />
            <Watermark />
          </div>
        </div>

        <button
          type="button"
          onClick={() => onIndex((index + 1) % total)}
          aria-label="Next photo"
          className="shrink-0 rounded-full border border-background/30 p-3 text-background hover:bg-background/10 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      <p className="pb-4 text-center text-[10px] font-medium tracking-[0.2em] uppercase text-background/50" style={MONT}>
        Use the arrows or ← → keys
      </p>
    </div>
  );
}