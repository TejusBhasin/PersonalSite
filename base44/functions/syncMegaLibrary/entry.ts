import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { File } from "npm:megajs@1.3.10";
import { secrets } from "base44:runtime";
import { requireAdmin, fetchAllPages, chunk } from "../../shared/mp3nowAuth.ts";

const AUDIO = /\.(mp3|m4a|m4b|aac|flac|wav|ogg|oga|opus)$/i;
const MAX_FILES = 12000;

// Files inside a shared folder carry an array download id [folderHandle, nodeHandle];
// the node handle is the second entry and is what we store.
function nodeKey(file) {
  const id = file.downloadId;
  if (Array.isArray(id)) return id[1] ? String(id[1]) : id[0] ? String(id[0]) : "";
  if (typeof id === "string") return id;
  return file.nodeId ? String(file.nodeId) : "";
}

function parseFileName(fileName) {
  // Leading track numbers ("03 - Title", "03. Title") are not artists.
  const base = String(fileName || "")
    .replace(AUDIO, "")
    .replace(/_/g, " ")
    .replace(/^\s*\d{1,3}\s*[.\-–—)\]]\s+/, "")
    .trim();
  const parts = base.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim() || "Unknown Artist", title: parts.slice(1).join(" - ").trim() };
  }
  return { artist: "Unknown Artist", title: base };
}

// Metadata-only walk of the shared folder. Audio bytes are never downloaded here.
async function walk(node, path, out) {
  if (node.directory && !node.children) await node.loadAttributes();
  for (const child of node.children || []) {
    if (out.length >= MAX_FILES) return;
    if (child.directory) {
      await walk(child, [...path, child.name || "Untitled folder"], out);
    } else if (AUDIO.test(child.name || "")) {
      out.push({
        nodeId: nodeKey(child),
        fileName: child.name,
        size: child.size || 0,
        path,
      });
    }
  }
}

export default async function (req) {
  try {
    const { error, base44 } = await requireAdmin(req);
    if (error) return error;

    const folderUrl = secrets.get("MEGA_FOLDER_URL");
    if (!folderUrl) {
      return Response.json({ error: "MEGA_FOLDER_URL is not set for this app." }, { status: 400 });
    }

    const root = File.fromURL(folderUrl);
    await root.loadAttributes();
    if (!root.directory) {
      return Response.json({ error: "MEGA_FOLDER_URL must point at a folder link." }, { status: 400 });
    }

    const files = [];
    await walk(root, [], files);
    const truncated = files.length >= MAX_FILES;

    // Group files into playlists by folder path; loose root files go to "Unsorted".
    const groups = new Map();
    for (const file of files) {
      const path = file.path.join(" / ");
      const key = path || "Unsorted";
      if (!groups.has(key)) groups.set(key, { name: key, path, files: [] });
      groups.get(key).files.push(file);
    }

    const [existingTracks, existingPlaylists] = await Promise.all([
      fetchAllPages(base44, "Track"),
      fetchAllPages(base44, "Playlist"),
    ]);
    const trackByNode = new Map(existingTracks.map((t) => [t.megaNodeId, t]));
    const playlistByPath = new Map(
      existingPlaylists.filter((p) => p.isMegaSynced !== false).map((p) => [p.megaFolderPath || "Unsorted", p])
    );

    const toCreate = [];
    const toUpdate = [];
    const seenNodes = new Set();
    const playlistPlans = [];

    for (const group of groups.values()) {
      const playlist =
        playlistByPath.get(group.name) ||
        existingPlaylists.find((p) => p.isMegaSynced !== false && p.name === group.name);
      playlistPlans.push({ group, playlist, trackIds: [], firstCover: "" });
      for (const file of group.files) {
        if (!file.nodeId || seenNodes.has(file.nodeId)) continue;
        seenNodes.add(file.nodeId);
        const parsed = parseFileName(file.fileName);
        const plan = playlistPlans[playlistPlans.length - 1];
        const existing = trackByNode.get(file.nodeId);
        if (existing) {
          plan.trackIds.push(existing.id);
          if (existing.coverArtDataUrl && !plan.firstCover) plan.firstCover = existing.coverArtDataUrl;
          // Only refine names while the real ID3 tags have not been read yet.
          if (!existing.metadataLoaded && (existing.title !== parsed.title || existing.artist !== parsed.artist)) {
            toUpdate.push({ id: existing.id, title: parsed.title, artist: parsed.artist, folderPath: group.name });
          }
        } else {
          toCreate.push({
            megaNodeId: file.nodeId,
            title: parsed.title,
            artist: parsed.artist,
            album: "Unknown Album",
            fileSize: file.size,
            folderPath: group.name,
            metadataLoaded: false,
          });
        }
      }
    }

    let createdTracks = [];
    for (const batch of chunk(toCreate, 200)) {
      createdTracks = createdTracks.concat(await base44.asServiceRole.entities.Track.bulkCreate(batch));
    }
    for (const batch of chunk(toUpdate, 200)) {
      await base44.asServiceRole.entities.Track.bulkUpdate(batch);
    }

    const createdByNode = new Map(createdTracks.map((t) => [t.megaNodeId, t]));

    // Rebuild the playlist rows for every synced folder.
    const savedPlaylists = [];
    for (const plan of playlistPlans) {
      const ids = [
        ...new Set(
          plan.trackIds.concat(plan.group.files.map((f) => createdByNode.get(f.nodeId)?.id).filter(Boolean))
        ),
      ];
      if (!ids.length) continue;
      let playlist = plan.playlist;
      const patch = { trackCount: ids.length };
      if (!playlist?.coverArtDataUrl && plan.firstCover) patch.coverArtDataUrl = plan.firstCover;
      if (playlist) {
        playlist = await base44.asServiceRole.entities.Playlist.update(playlist.id, patch);
      } else {
        playlist = await base44.asServiceRole.entities.Playlist.create({
          name: plan.group.name,
          megaFolderPath: plan.group.path,
          isMegaSynced: true,
          isAiGenerated: false,
          ...patch,
        });
      }
      await base44.asServiceRole.entities.PlaylistTrack.deleteMany({ playlistId: playlist.id });
      const rows = ids.map((trackId, position) => ({ playlistId: playlist.id, trackId, position }));
      for (const batch of chunk(rows, 500)) {
        await base44.asServiceRole.entities.PlaylistTrack.bulkCreate(batch);
      }
      savedPlaylists.push(playlist);
    }

    // Remove files and folders that no longer exist in MEGA.
    const removedTracks = existingTracks.filter((t) => t.megaNodeId && !seenNodes.has(t.megaNodeId));
    for (const batch of chunk(removedTracks, 200)) {
      const ids = batch.map((t) => t.id);
      await base44.asServiceRole.entities.PlaylistTrack.deleteMany({ trackId: { $in: ids } });
      await base44.asServiceRole.entities.Track.deleteMany({ id: { $in: ids } });
    }

    const liveNames = new Set(playlistPlans.filter((p) => p.trackIds.length).map((p) => p.group.name));
    const stalePlaylists = existingPlaylists.filter(
      (p) => p.isMegaSynced !== false && !liveNames.has(p.megaFolderPath || "Unsorted") && !savedPlaylists.some((s) => s.id === p.id)
    );
    for (const playlist of stalePlaylists) {
      await base44.asServiceRole.entities.PlaylistTrack.deleteMany({ playlistId: playlist.id });
      await base44.asServiceRole.entities.Playlist.delete(playlist.id);
    }

    return Response.json({
      ok: true,
      playlists: savedPlaylists.length,
      tracks: seenNodes.size,
      added: createdTracks.length,
      renamed: toUpdate.length,
      removed: removedTracks.length,
      truncated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}