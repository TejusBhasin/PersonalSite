import { fetchTrackBlob } from "@/lib/mp3now/mega";
import { getOfflineBlob } from "@/lib/mp3now/offline";

const clean = (value) =>
  String(value || "")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function deviceFileName(track, extension) {
  const artist = clean(track.artist);
  const title = clean(track.title) || "Untitled";
  const base = artist && artist !== "Unknown Artist" ? `${artist} - ${title}` : title;
  return `${base.slice(0, 120)}.${extension}`;
}

// The library can hold m4a, flac and ogg as well as mp3, so the saved file keeps the
// container it actually is instead of being labelled an MP3 and refusing to open.
async function extensionOf(blob) {
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const at = (index, letter) => head[index] === letter.charCodeAt(0);
  if (head.length >= 4 && at(0, "f") && at(1, "L") && at(2, "a") && at(3, "C")) return "flac";
  if (head.length >= 4 && at(0, "O") && at(1, "g") && at(2, "g") && at(3, "S")) return "ogg";
  if (head.length >= 8 && at(4, "f") && at(5, "t") && at(6, "y") && at(7, "p")) return "m4a";
  if (head.length >= 4 && at(0, "R") && at(1, "I") && at(2, "F") && at(3, "F")) return "wav";
  return "mp3";
}

function saveToDevice(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// Saves every track as its own file on the device. One at a time on purpose: a folder is
// hundreds of megabytes and each save has to be handed to the browser separately.
export async function downloadToDevice(tracks, { onProgress, shouldStop } = {}) {
  let saved = 0;
  const failed = [];

  for (let i = 0; i < tracks.length; i += 1) {
    if (shouldStop?.()) break;
    const track = tracks[i];
    onProgress?.({ done: i, total: tracks.length, track });
    try {
      const blob =
        (await getOfflineBlob(track.id).catch(() => null)) || (await fetchTrackBlob(track.megaNodeId));
      saveToDevice(blob, deviceFileName(track, await extensionOf(blob)));
      saved += 1;
    } catch {
      failed.push(track.title || "Untitled");
    }
    // A short gap keeps the browser from dropping saves it thinks are accidental.
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  onProgress?.({ done: tracks.length, total: tracks.length, track: null });
  return { saved, failed };
}