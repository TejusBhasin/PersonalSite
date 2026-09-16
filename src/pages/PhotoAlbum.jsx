import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const FOLDER_ID = "1-IZTBsJM0iz6aLq8JvlHuviEnE-LmqZ6";
const DRIVE_URL = "https://drive.google.com/drive/folders/1-IZTBsJM0iz6aLq8JvlHuviEnE-LmqZ6?usp=sharing";

export default function PhotoAlbum() {
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
          <a
            href={DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-md font-semibold text-sm tracking-wide hover:bg-foreground/80 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl shrink-0 w-fit"
            style={MONT}
          >
            <ExternalLink className="w-4 h-4" />
            Open in Drive
          </a>
        </div>

        <div
          className="rounded-xl overflow-hidden border border-border/60 bg-card"
          style={{ boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)" }}
        >
          <iframe
            src={`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}#grid`}
            title="Photo Album"
            loading="lazy"
            allow="fullscreen"
            className="w-full h-[75vh] min-h-[480px]"
          />
        </div>
      </div>
    </main>
  );
}