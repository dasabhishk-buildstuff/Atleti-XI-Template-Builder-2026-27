import {
  deleteBackground as idbDeleteBackground,
  getAllBackgrounds as idbGetAllBackgrounds,
  saveBackground as idbSaveBackground,
} from "./idb";

export interface CachedBackground {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

const urlCache = new Map<string, string>();
const listeners = new Set<(backgrounds: CachedBackground[]) => void>();
let cachedList: CachedBackground[] = [];
let isInitialized = false;

function notify() {
  listeners.forEach((listener) => listener([...cachedList]));
}

export async function initBackgrounds(): Promise<CachedBackground[]> {
  if (isInitialized) return cachedList;
  try {
    const stored = await idbGetAllBackgrounds();
    cachedList = stored.map((item) => {
      let url = urlCache.get(item.id);
      if (!url) {
        url = URL.createObjectURL(item.blob);
        urlCache.set(item.id, url);
      }
      return {
        id: item.id,
        name: item.name,
        url,
        createdAt: item.createdAt,
      };
    });
    isInitialized = true;
    notify();
  } catch (err) {
    console.error("Failed to initialize backgrounds from IndexedDB:", err);
  }
  return cachedList;
}

export function getBackgroundUrl(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return urlCache.get(id);
}

export async function uploadBackground(file: File): Promise<CachedBackground> {
  const id = crypto.randomUUID();
  const stored = await idbSaveBackground(id, file.name, file);
  const url = URL.createObjectURL(file);
  urlCache.set(id, url);

  const item: CachedBackground = {
    id: stored.id,
    name: stored.name,
    url,
    createdAt: stored.createdAt,
  };
  cachedList = [item, ...cachedList];
  notify();
  return item;
}

export async function removeBackground(id: string): Promise<void> {
  await idbDeleteBackground(id);
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
  cachedList = cachedList.filter((b) => b.id !== id);
  notify();
}

export function subscribeBackgrounds(listener: (backgrounds: CachedBackground[]) => void): () => void {
  listeners.add(listener);
  listener([...cachedList]);
  return () => {
    listeners.delete(listener);
  };
}
