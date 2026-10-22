import { Trash2 } from "lucide-react";
import { fmtDuration } from "@/lib/invidiousFormat";

const Card = ({ item, onClick }) => (
  <button onClick={onClick} className="text-left group">
    <div className="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden">
      <img
        src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {item.lengthSeconds > 0 && (
        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-xs px-1.5 py-0.5 rounded">
          {fmtDuration(item.lengthSeconds)}
        </span>
      )}
    </div>
    <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-white">
      {item.title || "Watched video"}
    </p>
    {item.author && <p className="text-xs text-neutral-500">{item.author}</p>}
  </button>
);

export default function HistoryPanel({ prefs, onWatch, onClearHistory }) {
  const liked = prefs.liked || [];
  const history = prefs.history || [];

  if (liked.length === 0 && history.length === 0) {
    return (
      <p className="max-w-5xl mx-auto px-4 py-6 text-sm text-neutral-500">
        Nothing here yet. Watch or like something and it shows up.
      </p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
      {liked.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Liked videos</h2>
            <span className="text-xs text-neutral-500">{liked.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liked.map((item) => (
              <Card key={item.videoId} item={item} onClick={() => onWatch(item)} />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Watch history</h2>
            <span className="text-xs text-neutral-500">{history.length}</span>
            <button
              onClick={onClearHistory}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <Card key={item.videoId} item={item} onClick={() => onWatch(item)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}