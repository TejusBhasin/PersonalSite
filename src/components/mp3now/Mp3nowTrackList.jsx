import { useState } from "react";
import Mp3nowTrackRow from "@/components/mp3now/Mp3nowTrackRow";

// Renders long libraries in windows so a 5,000 track list stays smooth.
export default function Mp3nowTrackList({ tracks, emptyHint, window: initialWindow = 80 }) {
  const [limit, setLimit] = useState(initialWindow);

  if (!tracks.length) {
    return (
      <div className="mp3-glass rounded-[18px] p-5 text-center text-[12px] text-[color:var(--m-muted)]">
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {tracks.slice(0, limit).map((track) => (
        <Mp3nowTrackRow key={track.id} track={track} list={tracks} />
      ))}
      {tracks.length > limit && (
        <button type="button" onClick={() => setLimit((n) => n + 200)} className="mp3-btn mp3-btn-ghost mt-2 w-full">
          Load more ({tracks.length - limit} left)
        </button>
      )}
    </div>
  );
}