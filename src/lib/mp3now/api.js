import { base44 } from "@/api/base44Client";

async function invoke(name, payload = {}) {
  const res = await base44.functions.invoke(name, payload);
  const data = res?.data ?? res;
  if (!data) throw new Error("The service returned an empty response.");
  if (data.error) throw new Error(data.error);
  return data;
}

export const syncLibrary = () => invoke("syncMegaLibrary", {});
export const getStreamCredentials = () => invoke("getStreamCredentials", {});
export const createAiPlaylist = (prompt, count) => invoke("generateAiPlaylist", { prompt, count });
export const verifyPasscode = (code) => invoke("mp3nowUnlock", { code });

// Walks every page so libraries above the 5,000 record query cap load completely.
export async function fetchAllRows(entityName, query = {}, pageSize = 500) {
  const rows = [];
  let cursor;
  for (let guard = 0; guard < 200; guard += 1) {
    const page = await base44.entities[entityName].filter(query, {
      limit: pageSize,
      ...(cursor ? { cursor } : {}),
    });
    const items = Array.isArray(page) ? page : page?.items || [];
    rows.push(...items);
    if (Array.isArray(page) || !page?.has_more || !page?.next_cursor || items.length === 0) break;
    cursor = page.next_cursor;
  }
  return rows;
}

export async function listPlaylists() {
  const rows = await fetchAllRows("Playlist");
  return rows.sort((a, b) => {
    if (Boolean(a.isAiGenerated) !== Boolean(b.isAiGenerated)) return a.isAiGenerated ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });
}

let pool = null;
let poolPromise = null;

export function invalidateLibrary() {
  pool = null;
  poolPromise = null;
}

export function getTrackPool() {
  if (pool) return Promise.resolve(pool);
  if (!poolPromise) {
    poolPromise = (async () => {
      const rows = await fetchAllRows("Track");
      pool = rows.filter((row) => row.megaNodeId).sort((a, b) => String(a.title).localeCompare(String(b.title)));
      return pool;
    })().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

export async function tracksByIds(ids) {
  const found = [];
  for (let i = 0; i < ids.length; i += 200) {
    const page = await base44.entities.Track.filter({ id: { $in: ids.slice(i, i + 200) } }, { limit: 200 });
    found.push(...(Array.isArray(page) ? page : page?.items || []));
  }
  const byId = new Map(found.map((track) => [track.id, track]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function playlistTracks(playlistId) {
  const links = await fetchAllRows("PlaylistTrack", { playlistId });
  links.sort((a, b) => (a.position || 0) - (b.position || 0));
  return tracksByIds(links.map((link) => link.trackId));
}

export async function fillPlaylistArt(trackId, coverArtDataUrl) {
  if (!coverArtDataUrl) return;
  const res = await base44.entities.PlaylistTrack.filter({ trackId }, { limit: 6 });
  const links = Array.isArray(res) ? res : res?.items || [];
  for (const link of links) {
    const playlist = await base44.entities.Playlist.get(link.playlistId).catch(() => null);
    if (playlist && !playlist.coverArtDataUrl) {
      await base44.entities.Playlist.update(playlist.id, { coverArtDataUrl }).catch(() => null);
    }
  }
}

export function deletePlaylist(playlistId) {
  return base44.entities.PlaylistTrack.deleteMany({ playlistId }).then(() =>
    base44.entities.Playlist.delete(playlistId)
  );
}