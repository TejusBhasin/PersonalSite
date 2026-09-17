import { useEffect } from "react";

const BLOCKED_COMBOS = new Set(["c", "x", "v", "p", "s", "u", "a"]);

export default function ContentGuard() {
  useEffect(() => {
    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const onContextMenu = (e) => block(e);
    const onCopyCut = (e) => block(e);
    const onDragStart = (e) => block(e);

    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && BLOCKED_COMBOS.has((e.key || "").toLowerCase())) {
        block(e);
      }
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        // Overwrite the clipboard so the captured shot can't be pasted.
        try { navigator.clipboard?.writeText(""); } catch { /* no clipboard access */ }
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopyCut);
    document.addEventListener("cut", onCopyCut);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopyCut);
      document.removeEventListener("cut", onCopyCut);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}