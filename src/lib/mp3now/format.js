export function fmtTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) return "--:--";
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function fmtBytes(bytes) {
  if (!bytes || !Number.isFinite(bytes)) return "0 MB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function subtitleFor(track) {
  if (!track) return "";
  const artist = track.artist || "Unknown Artist";
  const album = track.album && track.album !== "Unknown Album" ? track.album : "";
  return album ? `${artist} — ${album}` : artist;
}