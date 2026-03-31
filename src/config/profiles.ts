import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import * as store from "../memory/store.js";

const CONFIG_STORE = "pikit-config";

interface ConfigProfile {
  name: string;
  description: string;
  models: Record<string, string>;
}

/** Default model mappings when no profile is applied */
const DEFAULTS: Record<string, string> = {
  smart: "claude-opus-4-6",
  general: "claude-sonnet-4-6",
  fast: "claude-haiku-4-5",
};

/** Load a config profile from a YAML file */
export function loadProfile(filePath: string): ConfigProfile {
  const raw = readFileSync(filePath, "utf-8");
  const doc = parseYaml(raw);
  const models: Record<string, string> = {};
  for (const entry of doc.configs ?? []) {
    models[entry.name] = entry.value;
  }
  return { name: doc.name, description: doc.description ?? "", models };
}

/** List available profile names by scanning the configs directory */
export function listProfiles(configsDir: string): string[] {
  try {
    return readdirSync(configsDir)
      .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
      .map((f) => f.replace(/\.ya?ml$/, ""));
  } catch {
    return [];
  }
}

/** Apply a profile — writes model aliases to the config store */
export function applyProfile(cwd: string, configsDir: string, profileName: string): string {
  const file = resolve(configsDir, `${profileName}.yml`);
  const profile = loadProfile(file);
  for (const [alias, modelId] of Object.entries(profile.models)) {
    store.set(cwd, CONFIG_STORE, alias, modelId);
  }
  store.set(cwd, CONFIG_STORE, "_active_profile", profileName);
  return `Applied "${profile.name}" — ${Object.entries(profile.models).map(([k, v]) => `${k}=${v}`).join(", ")}`;
}

/** Unapply — revert to defaults */
export function unapplyProfile(cwd: string): string {
  for (const alias of Object.keys(DEFAULTS)) {
    store.remove(cwd, CONFIG_STORE, alias);
  }
  store.remove(cwd, CONFIG_STORE, "_active_profile");
  return "Reverted to default model aliases.";
}

/** Resolve a model alias to its actual model ID */
export function resolveAlias(cwd: string, alias: string): string {
  if (!(alias in DEFAULTS)) return alias;
  return store.get(cwd, CONFIG_STORE, alias) ?? DEFAULTS[alias];
}

/** Get all aliases and their current mappings */
export function getAliases(cwd: string): Record<string, { default: string; current: string }> {
  const result: Record<string, { default: string; current: string }> = {};
  for (const [alias, def] of Object.entries(DEFAULTS)) {
    result[alias] = { default: def, current: resolveAlias(cwd, alias) };
  }
  return result;
}

/** Get the currently active profile name, or null */
export function activeProfile(cwd: string): string | null {
  return store.get(cwd, CONFIG_STORE, "_active_profile");
}
