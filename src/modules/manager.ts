import * as store from "../memory/store.js";

const STORE_NAME = "pikit-modules";
const STATE_KEY = "visibility";

interface ModuleVisibility {
  visible: string[];
}

/** Load which modules are currently visible */
export function loadVisibility(cwd: string): string[] {
  const raw = store.get(cwd, STORE_NAME, STATE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ModuleVisibility;
    return parsed.visible ?? [];
  } catch {
    return [];
  }
}

/** Save module visibility state */
export function saveVisibility(cwd: string, visible: string[]): void {
  store.set(cwd, STORE_NAME, STATE_KEY, JSON.stringify({ visible }));
}

/** Show a module (make its tools/skills active) */
export function showModule(cwd: string, name: string): boolean {
  const visible = loadVisibility(cwd);
  if (visible.includes(name)) return false;
  visible.push(name);
  saveVisibility(cwd, visible);
  return true;
}

/** Hide a module (remove its tools/skills from prompt) */
export function hideModule(cwd: string, name: string): boolean {
  const visible = loadVisibility(cwd);
  const idx = visible.indexOf(name);
  if (idx === -1) return false;
  visible.splice(idx, 1);
  saveVisibility(cwd, visible);
  return true;
}

/**
 * Given all known tool names and a mapping of module -> tool names,
 * return only the tools that should be active.
 * Tools not assigned to any module are always active.
 */
export function filterActiveTools(
  allTools: string[],
  moduleTools: Map<string, string[]>,
  visible: string[],
): string[] {
  const hidden = new Set<string>();
  for (const [mod, tools] of moduleTools) {
    if (!visible.includes(mod)) {
      for (const t of tools) hidden.add(t);
    }
  }
  return allTools.filter((t) => !hidden.has(t));
}
