import * as store from "../memory/store.js";

const STORE_NAME = "todos";

interface TodoItem {
  text: string;
  done: boolean;
  created: string;
}

function loadTodos(cwd: string): TodoItem[] {
  const raw = store.get(cwd, STORE_NAME, "items");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTodos(cwd: string, todos: TodoItem[]): void {
  store.set(cwd, STORE_NAME, "items", JSON.stringify(todos));
}

export function addTodo(cwd: string, text: string): number {
  const todos = loadTodos(cwd);
  todos.push({ text, done: false, created: new Date().toISOString() });
  saveTodos(cwd, todos);
  return todos.length;
}

export function completeTodo(cwd: string, index: number): boolean {
  const todos = loadTodos(cwd);
  if (index < 0 || index >= todos.length) return false;
  todos[index].done = true;
  saveTodos(cwd, todos);
  return true;
}

export function listTodos(cwd: string): string {
  const todos = loadTodos(cwd);
  if (todos.length === 0) return "No todos.";
  return todos
    .map((t, i) => `${t.done ? "[x]" : "[ ]"} ${i + 1}. ${t.text}`)
    .join("\n");
}

export function allComplete(cwd: string): boolean {
  const todos = loadTodos(cwd);
  return todos.length > 0 && todos.every((t) => t.done);
}

export function clearTodos(cwd: string): void {
  store.remove(cwd, STORE_NAME, "items");
}

export function pendingCount(cwd: string): number {
  return loadTodos(cwd).filter((t) => !t.done).length;
}
