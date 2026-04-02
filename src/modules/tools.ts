import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as modules from "./manager.js";

export function registerModuleCommands(pi: ExtensionAPI, knownModules: string[]): void {
  pi.registerCommand("module", {
    description: "Show or hide tool/skill groups to manage system prompt size",
    getArgumentCompletions(prefix) {
      const subs = ["show", "hide", "list"];
      const all = [...subs, ...subs.filter((s) => s !== "list").flatMap((s) => knownModules.map((m) => `${s} ${m}`))];
      const filtered = all
        .filter((n) => n.startsWith(prefix))
        .map((n) => ({ value: n, label: n }));
      return filtered.length > 0 ? filtered : null;
    },
    async handler(args, ctx) {
      const cwd = ctx.cwd;
      const [sub, name] = (args ?? "").split(/\s+/);

      if (sub === "show" && name) {
        const ok = modules.showModule(cwd, name);
        ctx.ui.notify(ok ? `Showing module "${name}"` : `Module "${name}" is already visible`, "info");
        return;
      }
      if (sub === "hide" && name) {
        const ok = modules.hideModule(cwd, name);
        ctx.ui.notify(ok ? `Hidden module "${name}"` : `Module "${name}" is already hidden`, "info");
        return;
      }
      if (sub === "list" || !sub) {
        const visible = modules.loadVisibility(cwd);
        const text = knownModules
          .map((m) => `${visible.includes(m) ? "[on] " : "[off]"} ${m}`)
          .join("\n") || "No modules registered.";
        ctx.ui.notify(text, "info");
        return;
      }

      ctx.ui.notify("Usage: /module [show <name> | hide <name> | list]", "info");
    },
  });
}
