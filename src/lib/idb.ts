import { openDB, type IDBPDatabase } from "idb";
import type { CanvasProject } from "@/types/domain";

const DB_NAME = "atleti-xi-studio";
const DB_VERSION = 1;

export interface StoredBackground {
  id: string;
  name: string;
  blob: Blob;
  createdAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("backgrounds")) {
          db.createObjectStore("backgrounds", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("app-meta")) {
          db.createObjectStore("app-meta", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProject(project: CanvasProject): Promise<void> {
  const db = await getDb();
  await db.put("projects", project);
  await db.put("app-meta", { key: "last-active-project-id", value: project.id });
}

export async function loadLastActiveProject(): Promise<CanvasProject | null> {
  const db = await getDb();
  const meta = await db.get("app-meta", "last-active-project-id");
  if (meta?.value) {
    const project = await db.get("projects", meta.value);
    if (project) return project as CanvasProject;
  }
  // Fallback to the first project if available
  const allProjects = await db.getAll("projects");
  if (allProjects.length > 0) {
    return allProjects[0] as CanvasProject;
  }
  return null;
}

export async function saveBackground(id: string, name: string, blob: Blob): Promise<StoredBackground> {
  const db = await getDb();
  const item: StoredBackground = {
    id,
    name,
    blob,
    createdAt: new Date().toISOString(),
  };
  await db.put("backgrounds", item);
  return item;
}

export async function getAllBackgrounds(): Promise<StoredBackground[]> {
  const db = await getDb();
  return (await db.getAll("backgrounds")) as StoredBackground[];
}

export async function getBackground(id: string): Promise<StoredBackground | null> {
  const db = await getDb();
  const item = await db.get("backgrounds", id);
  return item ? (item as StoredBackground) : null;
}

export async function deleteBackground(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("backgrounds", id);
}
