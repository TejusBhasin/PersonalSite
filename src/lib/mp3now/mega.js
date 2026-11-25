import { getStreamCredentials } from "@/lib/mp3now/api";

// The browser talks to MEGA directly: the folder link is fetched once per session, the
// folder tree is indexed by node id, and audio is decrypted client-side into a Blob.
let rootPromise = null;
let indexPromise = null;

async function loadRoot() {
  if (!rootPromise) {
    rootPromise = (async () => {
      const { url } = await getStreamCredentials();
      const { File } = await import("megajs");
      const root = File.fromURL(url);
      await root.loadAttributes();
      return root;
    })().catch((error) => {
      rootPromise = null;
      throw error;
    });
  }
  return rootPromise;
}

// Files inside a shared folder expose an array download id [folderHandle, nodeHandle];
// the node handle is the second entry, matching what the sync stored.
function nodeKey(file) {
  const id = file.downloadId;
  if (Array.isArray(id)) return id[1] ? String(id[1]) : id[0] ? String(id[0]) : "";
  if (typeof id === "string") return id;
  return file.nodeId ? String(file.nodeId) : "";
}

async function buildIndex(root) {
  const nodes = new Map();
  const walk = async (dir) => {
    if (!dir.children) await dir.loadAttributes();
    for (const child of dir.children || []) {
      if (child.directory) {
        await walk(child);
      } else {
        const key = nodeKey(child);
        if (key) nodes.set(key, child);
      }
    }
  };
  await walk(root);
  return nodes;
}

export function resetMegaSession() {
  rootPromise = null;
  indexPromise = null;
}

export async function fetchTrackBlob(nodeId) {
  if (!nodeId) throw new Error("This track has no MEGA node id.");
  const root = await loadRoot();
  if (!indexPromise) {
    indexPromise = buildIndex(root).catch((error) => {
      indexPromise = null;
      throw error;
    });
  }
  const nodes = await indexPromise;
  const file = nodes.get(nodeId);
  if (!file) {
    throw new Error("That file is no longer in the MEGA folder. Run Sync Folders from MEGA again.");
  }
  const buffer = await file.downloadBuffer({});
  return new Blob([buffer], { type: "audio/mpeg" });
}