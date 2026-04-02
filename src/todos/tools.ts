import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as todos from "./manager.js";

export function registerTodoTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "todo_add",
    label: "Todo Add",
    description: "Add a todo item to the current session's todo list.",
    parameters: Type.Object({
      text: Type.String({ description: "The todo item text" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const n = todos.add(ctx.cwd, params.text);
      return {
        content: [{ type: "text", text: `Added todo #${n}: ${params.text}` }],
      };
    },
  });

  pi.registerTool({
    name: "todo_complete",
    label: "Todo Complete",
    description: "Mark a todo item as complete by its number (1-based).",
    parameters: Type.Object({
      number: Type.Number({ description: "Todo item number (1-based)" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const ok = todos.markDone(ctx.cwd, params.number - 1);
      return {
        content: [{ type: "text", text: ok ? `Completed todo #${params.number}` : `Todo #${params.number} not found` }],
      };
    },
  });

  pi.registerTool({
    name: "todo_list",
    label: "Todo List",
    description: "List all todo items and their completion status.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, ctx) {
      return {
        content: [{ type: "text", text: todos.format(ctx.cwd) }],
      };
    },
  });

  pi.registerCommand("todo", {
    description: "Manage todos: add, done, list, clear",
    async handler(args, ctx) {
      const [sub, ...rest] = (args ?? "").split(/\s+/);

      if (sub === "add" && rest.length) {
        const n = todos.add(ctx.cwd, rest.join(" "));
        ctx.ui.notify(`Added todo #${n}`, "info");
        return;
      }
      if (sub === "done" && rest[0]) {
        const ok = todos.markDone(ctx.cwd, parseInt(rest[0], 10) - 1);
        ctx.ui.notify(ok ? `Completed todo #${rest[0]}` : `Todo #${rest[0]} not found`, ok ? "info" : "error");
        return;
      }
      if (sub === "clear") {
        todos.reset(ctx.cwd);
        ctx.ui.notify("Cleared all todos.", "info");
        return;
      }
      if (sub === "list" || !sub) {
        ctx.ui.notify(todos.format(ctx.cwd), "info");
        return;
      }

      ctx.ui.notify("Usage: /todo [add <text> | done <number> | list | clear]", "info");
    },
  });
}
