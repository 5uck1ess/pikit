import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PKG = "@mariozechner/pi-coding-agent";
const CACHE_FILE = ".pikit/upstream-check.json";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  latest: string;
  checkedAt: number;
}

function getCachePath(cwd: string): string {
  return join(cwd, CACHE_FILE);
}

function readCache(cwd: string): CacheEntry | null {
  const path = getCachePath(cwd);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8")) as CacheEntry;
    if (Date.now() - data.checkedAt < CACHE_TTL_MS) return data;
    return null; // stale
  } catch {
    return null;
  }
}

function writeCache(cwd: string, latest: string): void {
  const dir = join(cwd, ".pikit");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getCachePath(cwd), JSON.stringify({ latest, checkedAt: Date.now() }));
}

function getInstalled(cwd: string): string | null {
  try {
    const pkgPath = join(cwd, "node_modules", PKG, "package.json");
    if (!existsSync(pkgPath)) return null;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

function fetchLatest(): string | null {
  try {
    return execSync(`npm view ${PKG} version`, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Check for pi-mono updates in the background.
 * Caches results for 24h to avoid repeated network calls.
 * Prints a one-line warning to stderr if behind.
 */
export function checkUpstreamAsync(cwd: string): void {
  // Fire and forget — never blocks startup
  setImmediate(() => {
    try {
      const installed = getInstalled(cwd);
      if (!installed) return;

      // Use cache if fresh
      const cached = readCache(cwd);
      let latest: string | null;
      if (cached) {
        latest = cached.latest;
      } else {
        latest = fetchLatest();
        if (latest) writeCache(cwd, latest);
      }

      if (!latest || latest === installed) return;

      console.error(
        `[pikit] pi-mono update available: ${installed} → ${latest} (run ./scripts/check-upstream.sh)`,
      );
    } catch {
      // Never let this crash startup
    }
  });
}
