const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };
const MARK = "PROOF TEJUSBHASIN.INFO   ";

export default function ProofCard({ item }) {
  return (
    <figure className="bg-card border border-border/60 rounded-xl overflow-hidden select-none">
      <div className="relative bg-muted/40 aspect-[4/3] overflow-hidden">
        {item.file_url ? (
          <img
            src={item.file_url}
            alt={item.title}
            draggable={false}
            loading="lazy"
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold uppercase tracking-widest text-muted-foreground/60" style={MONT}>
            No image
          </div>
        )}

        {/* Watermark */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className="absolute left-[-60%] right-[-60%] whitespace-nowrap text-[10px] font-black uppercase tracking-[0.4em] text-white/30"
              style={{
                top: `${6 + row * 21}%`,
                transform: "rotate(-22deg)",
                textShadow: "0 0 4px rgba(0,0,0,0.45)",
              }}
            >
              {MARK.repeat(10)}
            </div>
          ))}
        </div>
      </div>

      <figcaption className="px-5 py-4 border-t border-border/60">
        <p className="text-sm font-bold tracking-wide text-foreground" style={MONT}>
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1" style={MONT}>
            {item.subtitle}
          </p>
        )}
      </figcaption>
    </figure>
  );
}