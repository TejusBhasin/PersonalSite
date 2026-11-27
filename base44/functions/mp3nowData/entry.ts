import { chunk, fetchAllPages, requirePass } from "../../shared/mp3nowAuth.ts";

// Library reads and the few writes the player makes, for a device that has entered the
// MP3now passcode. The records stay locked to the owner by row-level security; this
// function is the only way in, and it answers only after the signed pass token checks out.
const PAGE = 500;
const TRACK_FIELDS = ["title", "artist", "album", "genre", "duration", "coverArtDataUrl", "metadataLoaded"];

async function tracksByIds(base44, ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  const found = [];
  for (const group of chunk(unique, 200)) {
    const page = await base44.asServiceRole.entities.Track.filter({ id: { $in: group } }, { limit: 200 });
    found.push(...(Array.isArray(page) ? page : page?.items || []));
  }
  const byId = new Map(found.map((track) => [track.id, track]));
  return unique.map((id) => byId.get(id)).filter(Boolean);
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { error, base44 } = await requirePass(req, body.pass);
    if (error) return error;

    const action = String(body.action || "");

    if (action === "playlists") {
      const items = await fetchAllPages(base44, "Playlist");
      return Response.json({ items });
    }

    if (action === "tracks") {
      const page = await base44.asServiceRole.entities.Track.filter(
        {},
        { limit: PAGE, ...(body.cursor ? { cursor: String(body.cursor) } : {}) }
      );
      const items = Array.isArray(page) ? page : page?.items || [];
      return Response.json({
        items,
        next_cursor: Array.isArray(page) ? null : page?.next_cursor || null,
        has_more: Array.isArray(page) ? false : Boolean(page?.has_more),
      });
    }

    if (action === "playlistTracks") {
      const playlistId = String(body.playlistId || "");
      if (!playlistId) return Response.json({ error: "playlistId is required" }, { status: 400 });
      const links = await fetchAllPages(base44, "PlaylistTrack", { playlistId });
      links.sort((a, b) => (a.position || 0) - (b.position || 0));
      return Response.json({ items: await tracksByIds(base44, links.map((link) => link.trackId)) });
    }

    if (action === "updateTrack") {
      const trackId = String(body.trackId || "");
      const patch = body.patch && typeof body.patch === "object" ? body.patch : {};
      if (!trackId) return Response.json({ error: "trackId is required" }, { status: 400 });
      const safe = {};
      for (const field of TRACK_FIELDS) {
        if (patch[field] !== undefined) safe[field] = patch[field];
      }
      if (Object.keys(safe).length === 0) {
        return Response.json({ error: "Nothing to update" }, { status: 400 });
      }
      await base44.asServiceRole.entities.Track.update(trackId, safe);
      return Response.json({ ok: true });
    }

    if (action === "fillPlaylistArt") {
      const trackId = String(body.trackId || "");
      const cover = String(body.coverArtDataUrl || "");
      if (!trackId || !cover) {
        return Response.json({ error: "trackId and coverArtDataUrl are required" }, { status: 400 });
      }
      const links = await fetchAllPages(base44, "PlaylistTrack", { trackId }, 6, 6);
      for (const link of links) {
        const playlist = await base44.asServiceRole.entities.Playlist.get(link.playlistId).catch((e) =>
          e.status === 404 ? null : Promise.reject(e)
        );
        if (playlist && !playlist.coverArtDataUrl) {
          await base44.asServiceRole.entities.Playlist.update(playlist.id, { coverArtDataUrl: cover });
        }
      }
      return Response.json({ ok: true });
    }

    if (action === "deletePlaylist") {
      const playlistId = String(body.playlistId || "");
      if (!playlistId) return Response.json({ error: "playlistId is required" }, { status: 400 });
      await base44.asServiceRole.entities.PlaylistTrack.deleteMany({ playlistId });
      await base44.asServiceRole.entities.Playlist.delete(playlistId);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}