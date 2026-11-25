const DB_NAME = "mp3now";
const STORE = "audio";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "trackId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, run) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let result;
      try {
        result = run(store);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(result?.result ?? result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export function putOfflineTrack(trackId, blob) {
  return withStore("readwrite", (store) => store.put({ trackId, blob, size: blob.size, savedAt: Date.now() }));
}

export async function getOfflineBlob(trackId) {
  const row = await withStore("readonly", (store) => store.get(trackId));
  return row?.blob || null;
}

export function removeOfflineTrack(trackId) {
  return withStore("readwrite", (store) => store.delete(trackId));
}

export function clearOfflineCache() {
  return withStore("readwrite", (store) => store.clear());
}

export async function listOfflineIds() {
  const keys = await withStore("readonly", (store) => store.getAllKeys());
  return new Set(keys || []);
}

export async function offlineUsage() {
  const rows = await withStore("readonly", (store) => store.getAll());
  const list = rows || [];
  const bytes = list.reduce((sum, row) => sum + (row?.size || 0), 0);
  return { bytes, count: list.length };
}