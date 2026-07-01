/**
 * IndexedDB store for persisting uploaded media blobs across page reloads.
 * Blob URLs (blob:...) are ephemeral — they die when the page closes.
 * This store keeps the actual binary data so project files can be re-imported.
 */

const DB_NAME = "procut-media-v1";
const STORE   = "blobs";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Store a Blob under a stable key (UUID). */
export async function storeMedia(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx  = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(blob, key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
  db.close();
}

/** Retrieve a Blob by key. Returns null if not found. */
export async function getMedia(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror   = () => { db.close(); reject(req.error); };
  });
}

/** Reconstruct a blob:// URL from a stored media key. Returns null if not cached. */
export async function restoreUrl(key: string): Promise<string | null> {
  const blob = await getMedia(key);
  return blob ? URL.createObjectURL(blob) : null;
}
