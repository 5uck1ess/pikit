import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";
import { join } from "node:path";
import * as profiles from "./profiles.js";

export function registerConfigCommands(pi: ExtensionAPI): void {
  pi.registerCommand({
    name: "config",
    description: "Manage model config profiles: apply, unapply, list, aliases",
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      const piDir = ctx.piDir ?? cwd;
      const configsDir = join(piDir, "configs");
      const [sub, ...rest] = (args ?? "").split(/\s+/);

      if (sub === "apply" && rest[0]) {
        return profiles.applyProfile(cwd, configsDir, rest[0]);
      }
      if (sub === "unapply") {
        return profiles.unapplyProfile(cwd);
      }
      if (sub === "list") {
        const available = profiles.listProfiles(configsDir);
        const active = profiles.activeProfile(cwd);
        return available
          .map((p) => `${p === active ? "* " : "  "}${p}`)
          .join("\n") || "No config profiles found.";
      }
      if (sub === "aliases") {
        const aliases = profiles.getAliases(cwd);
        return Object.entries(aliases)
          .map(([name, { current }]) => `${name} = ${current}`)
          .join("\n");
      }

      return [
        "Usage: /config <subcommand>",
        "  apply <name>  — Apply a model config profile",
        "  unapply       — Revert to default aliases",
        "  list          — List available profiles",
        "  aliases       — Show current model alias mappings",
      ].join("\n");
    },
  });
}
