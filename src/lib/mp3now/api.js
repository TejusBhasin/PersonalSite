import { base44 } from "@/api/base44Client";

// Every MP3now call carries the signed token the unlock function handed this device.
// When the server rejects it the token is dropped and the app asks for the passcode again.
const PASS_KEY = "mp3now:pass";

export function readPass() {
  try {
    return window.localStorage.getItem(PASS_KEY) || "";
  } catch {
    return "";
  }
}

export function savePass(token) {
  try {
    window.localStorage.setItem(PASS_KEY, token);
  } catch {
    // Storage blocked: the passcode is simply asked again next visit.
  }
}

export function clearPass() {
  try {
    window.localStorage.removeItem(PASS_KEY);
  } catch {
    // ignore
  }
}

export function isUnlocked() {
  return Boolean(readPass());
}

function lockNow() {
  clearPass();
  window.dispatchEvent(new Event("mp3now:locked"));
}

async function invoke(name, payload = {}) {
  try {
    const res = await base44.functions.invoke(name, { ...payload, pass: readPass() || undefined });
    const data = res?.data ?? res;
    if (!data) throw new Error("The service returned an empty response.");
    if (data.code === "locked") lockNow();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    if (error?.response?.status === 401) lockNow();
    throw error;
  }
}

const data = (action, payload = {}) => invoke("mp3nowData", { action, ...payload });

export const syncLibrary = () => invoke("syncMegaLibrary", {});
export const getStreamCredentials = () => invoke("getStreamCredentials", {});
export const createAiPlaylist = (prompt, count) => invoke("generateAiPlaylist", { prompt, count });
export const verifyPasscode = (code) => invoke("mp3nowUnlock", { code });

let pool = null;
let poolPromise = null;

export function invalidateLibrary() {
  pool = null;
  poolPromise = null;
}

export async function listPlaylists() {
  const { items } = await data("playlists");
  return [...items].sort((a, b) => {
    if (Boolean(a.isAiGenerated) !== Boolean(b.isAiGenerated)) return a.isAiGenerated ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });
}

// Walks the whole track table page by page, so libraries above the query cap still load.
export async function getTrackPool() {
  if (pool) return Promise.resolve(pool);
  if (!poolPromise) {
    poolPromise = (async () => {
      const rows = [];
      let cursor;
      for (let guard = 0; guard < 200; guard += 1) {
        const page = await data("tracks", { cursor, limit: 500 });
        const items = page.items || [];
        rows.push(...items);
        if (!page.has_more || !page.next_cursor || items.length === 0) break;
        cursor = page.next_cursor;
      }
      pool = rows.filter((row) => row.megaNodeId).sort((a, b) => String(a.title).localeCompare(String(b.title)));
      return pool;
    })().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

export async function playlistTracks(playlistId) {
  const { items } = await data("playlistTracks", { playlistId });
  return items;
}

export async function fillPlaylistArt(trackId, coverArtDataUrl) {
  if (!coverArtDataUrl) return;
  await data("fillPlaylistArt", { trackId, coverArtDataUrl });
}

export async function updateTrackMeta(trackId, patch) {
  await data("updateTrack", { trackId, patch });
}

export function deletePlaylist(playlistId) {
  return data("deletePlaylist", { playlistId });
}