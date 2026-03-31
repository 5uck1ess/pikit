import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { localDataPath } from "../core/paths.js";

/** In-memory shape of a store file */
interface StoreFile {
  created: string;
  updated: string;
  entries: Record<string, string>;
}

function storeDir(cwd: string): string {
  return localDataPath(cwd, "stores");
}

function storePath(cwd: string, name: string): string {
  return join(storeDir(cwd), `${name}.json`);
}

function loadFile(path: string): StoreFile | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function saveFile(path: string, data: StoreFile): void {
  const dir = join(path, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

/** Create a new store. Returns false if it already exists. */
export function createStore(cwd: string, name: string): boolean {
  const path = storePath(cwd, name);
  if (existsSync(path)) return false;
  const now = new Date().toISOString();
  saveFile(path, { created: now, updated: now, entries: {} });
  return true;
}

/** Delete a store entirely. */
export function deleteStore(cwd: string, name: string): boolean {
  const path = storePath(cwd, name);
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

/** List all store names in the project. */
export function listStores(cwd: string): string[] {
  const dir = storeDir(cwd);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

/** Get a value by key from a store. Returns null if not found. */
export function get(cwd: string, store: string, key: string): string | null {
  const data = loadFile(storePath(cwd, store));
  return data?.entries[key] ?? null;
}

/** Set a value by key in a store. Auto-creates the store if needed. */
export function set(cwd: string, store: string, key: string, value: string): void {
  const path = storePath(cwd, store);
  const now = new Date().toISOString();
  const data = loadFile(path) ?? { created: now, updated: now, entries: {} };
  data.entries[key] = value;
  data.updated = now;
  saveFile(path, data);
}

/** Remove a key from a store. Returns the old value or null. */
export function remove(cwd: string, store: string, key: string): string | null {
  const path = storePath(cwd, store);
  const data = loadFile(path);
  if (!data || !(key in data.entries)) return null;
  const old = data.entries[key];
  delete data.entries[key];
  data.updated = new Date().toISOString();
  saveFile(path, data);
  return old;
}

/** List all keys in a store. */
export function keys(cwd: string, store: string): string[] {
  const data = loadFile(storePath(cwd, store));
  return data ? Object.keys(data.entries) : [];
}

/** Wipe all entries in a store without deleting it. */
export function clear(cwd: string, store: string): boolean {
  const path = storePath(cwd, store);
  const data = loadFile(path);
  if (!data) return false;
  data.entries = {};
  data.updated = new Date().toISOString();
  saveFile(path, data);
  return true;
}
