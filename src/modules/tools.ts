import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";
import * as modules from "./manager.js";

export function registerModuleCommands(pi: ExtensionAPI, knownModules: string[]): void {
  pi.registerCommand({
    name: "module",
    description: "Show or hide tool/skill groups to manage system prompt size",
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      const [sub, name] = (args ?? "").split(/\s+/);

      if (sub === "show" && name) {
        const ok = modules.showModule(cwd, name);
        return ok ? `Showing module "${name}"` : `Module "${name}" is already visible`;
      }
      if (sub === "hide" && name) {
        const ok = modules.hideModule(cwd, name);
        return ok ? `Hidden module "${name}"` : `Module "${name}" is already hidden`;
      }
      if (sub === "list" || !sub) {
        const visible = modules.loadVisibility(cwd);
        return knownModules
          .map((m) => `${visible.includes(m) ? "[on] " : "[off]"} ${m}`)
          .join("\n") || "No modules registered.";
      }

      return "Usage: /module [show <name> | hide <name> | list]";
    },
  });
}
