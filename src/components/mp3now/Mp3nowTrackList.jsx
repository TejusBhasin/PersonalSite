import { useState } from "react";
import Mp3nowTrackRow from "@/components/mp3now/Mp3nowTrackRow";

// Renders long libraries in windows so a 5,000 track list stays smooth.
export default function Mp3nowTrackList({ tracks, emptyHint, window: initialWindow = 80 }) {
  const [limit, setLimit] = useState(initialWindow);

  if (!tracks.length) {
    return (
      <div className="mp3-surface px-5 py-6 text-center text-[12.5px] text-[color:var(--m-muted)]">
        {emptyHint}
      </div>
    );
  }

  return (
    <div>
      <div className="mp3-surface overflow-hidden">
        {tracks.slice(0, limit).map((track) => (
          <Mp3nowTrackRow key={track.id} track={track} list={tracks} />
        ))}
      </div>
      {tracks.length > limit && (
        <button type="button" onClick={() => setLimit((n) => n + 200)} className="mp3-btn mp3-btn-ghost mt-3 w-full">
          Load more ({tracks.length - limit} left)
        </button>
      )}
    </div>
  );
}