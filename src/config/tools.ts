import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { join } from "node:path";
import * as profiles from "./profiles.js";

export function registerConfigCommands(pi: ExtensionAPI): void {
  pi.registerCommand("config", {
    description: "Manage model config profiles: apply, unapply, list, aliases",
    async handler(args, ctx) {
      const cwd = ctx.cwd;
      const configsDir = join(cwd, ".pi", "configs");
      const [sub, ...rest] = (args ?? "").split(/\s+/);

      if (sub === "apply" && rest[0]) {
        ctx.ui.notify(profiles.applyProfile(cwd, configsDir, rest[0]), "info");
        return;
      }
      if (sub === "unapply") {
        ctx.ui.notify(profiles.unapplyProfile(cwd), "info");
        return;
      }
      if (sub === "list") {
        const available = profiles.listProfiles(configsDir);
        const active = profiles.activeProfile(cwd);
        const text = available
          .map((p) => `${p === active ? "* " : "  "}${p}`)
          .join("\n") || "No config profiles found.";
        ctx.ui.notify(text, "info");
        return;
      }
      if (sub === "aliases") {
        const aliases = profiles.getAliases(cwd);
        const text = Object.entries(aliases)
          .map(([name, { current }]) => `${name} = ${current}`)
          .join("\n");
        ctx.ui.notify(text, "info");
        return;
      }

      ctx.ui.notify([
        "Usage: /config <subcommand>",
        "  apply <name>  — Apply a model config profile",
        "  unapply       — Revert to default aliases",
        "  list          — List available profiles",
        "  aliases       — Show current model alias mappings",
      ].join("\n"), "info");
    },
  });
}
