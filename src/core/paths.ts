import { join } from "node:path";
import { homedir } from "node:os";

/** Local project data directory (git-ignored) */
export const LOCAL_DATA_DIR = ".pikit";

/** Resolve a path relative to the project's local data dir */
export function localDataPath(cwd: string, ...segments: string[]): string {
  return join(cwd, LOCAL_DATA_DIR, ...segments);
}

/** Resolve a path relative to the user's home pikit dir */
export function globalDataPath(...segments: string[]): string {
  return join(homedir(), ".pikit", ...segments);
}
