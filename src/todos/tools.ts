import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getCwd } from "../core/context.js";
import * as todos from "./manager.js";

export function registerTodoTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "todo_add",
    description: "Add a todo item to the current session's todo list.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "The todo item text" },
      },
      required: ["text"],
    },
    async execute(args, ctx) {
      const n = todos.addTodo(getCwd(ctx), args.text);
      return `Added todo #${n}: ${args.text}`;
    },
  });

  pi.registerTool({
    name: "todo_complete",
    description: "Mark a todo item as complete by its number (1-based).",
    parameters: {
      type: "object",
      properties: {
        number: { type: "number", description: "Todo item number (1-based)" },
      },
      required: ["number"],
    },
    async execute(args, ctx) {
      const ok = todos.completeTodo(getCwd(ctx), args.number - 1);
      return ok ? `Completed todo #${args.number}` : `Todo #${args.number} not found`;
    },
  });

  pi.registerTool({
    name: "todo_list",
    description: "List all todo items and their completion status.",
    parameters: { type: "object", properties: {} },
    async execute(_args, ctx) {
      return todos.listTodos(getCwd(ctx));
    },
  });

  pi.registerCommand({
    name: "todo",
    description: "Manage todos: add, complete, list, clear",
    async execute(args, ctx) {
      const cwd = getCwd(ctx);
      const [sub, ...rest] = (args ?? "").split(/\s+/);

      if (sub === "add" && rest.length) {
        const n = todos.addTodo(cwd, rest.join(" "));
        return `Added todo #${n}`;
      }
      if (sub === "done" && rest[0]) {
        const ok = todos.completeTodo(cwd, parseInt(rest[0], 10) - 1);
        return ok ? `Completed todo #${rest[0]}` : `Todo #${rest[0]} not found`;
      }
      if (sub === "clear") {
        todos.clearTodos(cwd);
        return "Cleared all todos.";
      }
      if (sub === "list" || !sub) {
        return todos.listTodos(cwd);
      }

      return "Usage: /todo [add <text> | done <number> | list | clear]";
    },
  });
}
