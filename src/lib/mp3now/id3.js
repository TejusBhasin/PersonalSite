import { parseBlob } from "music-metadata-browser";

// Reads ID3 tags from the decrypted MP3 and shrinks embedded art to a 200x200 JPEG.
export async function readTags(blob) {
  let meta = null;
  try {
    meta = await parseBlob(blob);
  } catch {
    return null;
  }
  const common = meta?.common || {};
  return {
    title: (common.title || "").trim(),
    artist: (common.artist || common.albumartist || "").trim(),
    album: (common.album || "").trim(),
    genre: Array.isArray(common.genre) ? common.genre[0] || "" : common.genre || "",
    duration: Number(meta?.format?.duration) || 0,
    coverArtDataUrl: await coverToDataUrl(common.picture?.[0]),
  };
}

async function coverToDataUrl(picture) {
  if (!picture?.data) return "";
  try {
    const bytes = picture.data instanceof Uint8Array ? picture.data : new Uint8Array(picture.data);
    const source = new Blob([bytes], { type: picture.format || "image/jpeg" });
    const bitmap = await loadImage(URL.createObjectURL(source));
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 200, 200);
    // Stay under ~25KB so the thumbnail fits comfortably in a record field.
    for (const quality of [0.82, 0.62, 0.45]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length < 34000) return dataUrl;
    }
    return canvas.toDataURL("image/jpeg", 0.35);
  } catch {
    return "";
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Cover art could not be decoded."));
    };
    image.src = url;
  });
}