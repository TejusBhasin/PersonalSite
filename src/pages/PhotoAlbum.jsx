import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PhotoGrid from "@/components/photos/PhotoGrid";
import RotationViewer from "@/components/photos/RotationViewer";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

export default function PhotoAlbum() {
  const [photos, setPhotos] = useState(null);
  const [rotation, setRotation] = useState(null);
  const [flipped, setFlipped] = useState(false);
  // Whatever order the album comes in, this flips it end to end.
  const ordered = photos ? (flipped ? [...photos].reverse() : photos) : null;

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("listPhotos", {})
      .then((res) => {
        const payload = res?.data ?? res;
        if (active) setPhotos(payload?.photos ?? []);
      })
      .catch(() => {
        if (active) setPhotos([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-foreground/60 hover:text-foreground transition-colors duration-300 mb-10"
        style={MONT}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={MONT}>
              Photo Album
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium tracking-wide uppercase mt-2" style={MONT}>
              Photography &amp; Editing
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFlipped((v) => !v)}
            disabled={!photos || photos.length === 0}
            className="inline-flex items-center justify-center gap-2 border border-border/60 text-foreground px-5 py-3 rounded-md font-semibold text-sm tracking-wide hover:bg-secondary hover:-translate-y-1 transition-all duration-300 shrink-0 w-fit disabled:opacity-40 disabled:hover:translate-y-0"
            style={MONT}
          >
            <ArrowUpDown className="w-4 h-4" />
            Flip Order
          </button>
          <button
            type="button"
            onClick={() => setRotation(0)}
            disabled={!photos || photos.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl shrink-0 w-fit disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            style={MONT}
          >
            <Play className="w-4 h-4" />
            Rotation Mode
          </button>
        </div>

        {photos === null ? (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-sm text-muted-foreground font-medium py-16 text-center" style={MONT}>
            No photos in the album yet.
          </p>
        ) : (
          <PhotoGrid photos={ordered} onOpen={setRotation} />
        )}
      </div>

      {rotation !== null && photos && photos.length > 0 && (
        <RotationViewer photos={ordered} index={rotation} onIndex={setRotation} onClose={() => setRotation(null)} />
      )}
    </main>
  );
}