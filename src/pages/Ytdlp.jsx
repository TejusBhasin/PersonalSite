import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

const TARGET = "https://streamarch.base44.app/";

export default function Ytdlp() {
  const [loaded, setLoaded] = useState(false);

  // Keep this page out of search engines entirely.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background" style={{ height: "100dvh" }}>
      <iframe
        src={TARGET}
        title="StreamArch"
        onLoad={() => setLoaded(true)}
        className="block h-full w-full border-0"
        allow="autoplay; fullscreen; clipboard-write; clipboard-read; encrypted-media; picture-in-picture; downloads"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background">
          <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
          <a
            href={TARGET}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/50 hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open StreamArch
          </a>
        </div>
      )}
    </div>
  );
}