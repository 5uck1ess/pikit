import * as store from "../memory/store.js";

const BUCKET = "todos";

interface Task {
  text: string;
  done: boolean;
  created: string;
}

function readItems(cwd: string): Task[] {
  const raw = store.get(cwd, BUCKET, "items");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeItems(cwd: string, items: Task[]): void {
  store.set(cwd, BUCKET, "items", JSON.stringify(items));
}

export function add(cwd: string, text: string): number {
  const items = readItems(cwd);
  items.push({ text, done: false, created: new Date().toISOString() });
  writeItems(cwd, items);
  return items.length;
}

export function markDone(cwd: string, index: number): boolean {
  const items = readItems(cwd);
  if (index < 0 || index >= items.length) return false;
  items[index].done = true;
  writeItems(cwd, items);
  return true;
}

export function format(cwd: string): string {
  const items = readItems(cwd);
  if (items.length === 0) return "No todos.";
  return items
    .map((t, i) => `${t.done ? "[x]" : "[ ]"} ${i + 1}. ${t.text}`)
    .join("\n");
}

export function isDone(cwd: string): boolean {
  const items = readItems(cwd);
  return items.length > 0 && items.every((t) => t.done);
}

export function reset(cwd: string): void {
  store.remove(cwd, BUCKET, "items");
}

export function remaining(cwd: string): number {
  return readItems(cwd).filter((t) => !t.done).length;
}
