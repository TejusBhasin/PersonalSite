const fmtDuration = (s) => {
  const t = Number(s) || 0;
  if (!t) return "";
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  return `${h ? h + ":" : ""}${mm}:${String(sec).padStart(2, "0")}`;
};

export default function VidiousSearchResults({ results, onPlay }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((item) => (
        <button
          key={item.videoId}
          onClick={() => onPlay(item)}
          className="text-left group focus:outline-none"
        >
          <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900">
            <img
              src={item.thumbnail}
              alt=""
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            {item.lengthSeconds > 0 && (
              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-[11px] px-1.5 py-0.5 rounded">
                {fmtDuration(item.lengthSeconds)}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold line-clamp-2 group-hover:text-white">{item.title}</p>
          <p className="text-xs text-neutral-500 truncate">{item.author}</p>
        </button>
      ))}
    </div>
  );
}