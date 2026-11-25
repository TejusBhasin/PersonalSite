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

async function buildIndex(root) {
  const nodes = new Map();
  const walk = async (dir) => {
    if (!dir.children) await dir.loadAttributes();
    for (const child of dir.children || []) {
      if (child.directory) await walk(child);
      else if (child.downloadId) nodes.set(child.downloadId, child);
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