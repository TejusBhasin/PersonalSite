import { useRef, useState } from "react";
import { UploadCloud, Loader2, ExternalLink, Trash2, Images } from "lucide-react";
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

  const openPicker = () => inputRef.current?.click();

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="p-6 sm:p-8 md:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-7">
          <div className="min-w-0">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground" style={MONT}>
              Image Host
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-2" style={MONT}>
              Free unlimited hosting — jpg, png, webp, gif, heic and more
            </p>
          </div>
          <button
            onClick={openPicker}
            disabled={uploading > 0}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-foreground/85 disabled:opacity-60"
            style={MONT}
          >
            {uploading > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
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

        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files);
          }}
          className="mb-7 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center transition-colors hover:border-foreground/40 hover:bg-background/60"
        >
          <Images className="w-6 h-6 text-muted-foreground/60" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground" style={MONT}>
            Drop images here to host them
          </span>
        </button>

        {failed.length > 0 && (
          <p className="mb-5 text-xs font-semibold text-destructive" style={MONT}>
            Couldn't upload: {failed.join(", ")}
          </p>
        )}

        {links.length === 0 ? (
          <p className="text-xs font-medium text-muted-foreground" style={MONT}>
            Nothing hosted yet. Your uploads and their permanent links appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((item) => (
              <div
                key={item.url}
                className="flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-background p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-muted/50">
                    <Images className="w-5 h-5 text-muted-foreground/40" />
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.remove();
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground" style={MONT}>
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">{item.url}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CopyButton text={item.url} label="Copy link" />
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open image"
                    className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card p-2 transition-colors hover:border-foreground/40"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => save((prev) => prev.filter((l) => l.url !== item.url))}
                    aria-label="Remove from list"
                    className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card p-2 transition-colors hover:border-destructive/60 hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}