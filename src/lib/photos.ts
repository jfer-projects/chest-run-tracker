'use client';

// Progress photos stay on this device only (IndexedDB). They are never uploaded or synced.

export interface ProgressPhoto {
  id: string;
  date: string; // ISO
  blob: Blob;
}

const DB = 'chest-run-photos';
const STORE = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listPhotos(): Promise<ProgressPhoto[]> {
  const all = await tx<ProgressPhoto[]>('readonly', (s) => s.getAll());
  return all.sort((a, b) => b.date.localeCompare(a.date));
}

export async function deletePhoto(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}

/** Downscales to 1280px JPEG before storing so photos don't eat device storage. */
export async function addPhoto(file: File): Promise<void> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process photo'))), 'image/jpeg', 0.85),
  );
  const photo: ProgressPhoto = { id: crypto.randomUUID(), date: new Date().toISOString(), blob };
  await tx('readwrite', (s) => s.put(photo));
}
