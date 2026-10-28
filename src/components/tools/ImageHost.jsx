import { useRef, useState } from "react";
import { Upload, Loader2, ExternalLink, Trash2, ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CopyButton from "@/components/tools/CopyButton";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const STORE_KEY = "other_image_host_links";

function readLinks() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export default function ImageHost() {
  const [links, setLinks] = useState(readLinks);
  const [uploading, setUploading] = useState(0);
  const [failed, setFailed] = useState([]);
  const inputRef = useRef(null);

  const save = (updater) => {
    setLinks((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  const upload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setFailed([]);
    const added = [];
    const errors = [];

    for (const file of list) {
      setUploading((n) => n + 1);
      try {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        added.push({ url: file_url, name: file.name, size: file.size, at: Date.now() });
      } catch {
        errors.push(file.name);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }

    if (added.length) save((prev) => [...added, ...prev]);
    if (errors.length) setFailed(errors);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <section className="border border-border/60 bg-card/60 rounded-xl p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground" style={MONT}>
            Image Host
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1" style={MONT}>
            Free unlimited hosting — jpg, png, webp, gif, heic and more
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-foreground/85 transition-colors"
          style={MONT}
        >
          {uploading > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading > 0 ? `Uploading ${uploading}` : "Choose images"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={(e) => upload(e.target.files)}
          className="hidden"
        />
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        className="border border-dashed border-border/70 rounded-lg px-5 py-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-6"
        style={MONT}
      >
        Drop images here to host them
      </div>

      {failed.length > 0 && (
        <p className="text-xs font-semibold text-destructive mb-5" style={MONT}>
          Couldn't upload: {failed.join(", ")}
        </p>
      )}

      {links.length === 0 ? (
        <p className="text-xs font-medium text-muted-foreground" style={MONT}>
          Nothing hosted yet. Your uploads and their permanent links appear here.
        </p>
      ) : (
        <div className="grid gap-3">
          {links.map((item) => (
            <div
              key={item.url}
              className="flex items-center gap-4 border border-border/60 bg-background rounded-lg p-3"
            >
              <div className="w-14 h-14 shrink-0 rounded-md bg-muted/50 overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <ImageIcon className="w-5 h-5 text-muted-foreground/50 -ml-14" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate" style={MONT}>
                  {item.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{item.url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CopyButton text={item.url} label="Copy link" />
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border border-border/60 bg-card p-2 rounded-lg hover:border-foreground/40 transition-colors"
                  aria-label="Open image"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => save((prev) => prev.filter((l) => l.url !== item.url))}
                  className="inline-flex items-center justify-center border border-border/60 bg-card p-2 rounded-lg hover:border-destructive/60 hover:text-destructive transition-colors"
                  aria-label="Remove from list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}