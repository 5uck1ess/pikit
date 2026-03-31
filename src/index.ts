import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerMemoryTools } from "./memory/tools.js";
import { registerConfigCommands } from "./config/tools.js";
import { registerRtkHook } from "./rtk/hook.js";
import { registerWorkflowCommands } from "./workflows/tools.js";
import { registerTodoTools } from "./todos/tools.js";
import { registerSearchTools } from "./search/provider.js";
import { registerAskUser } from "./ask/tool.js";
import { registerModuleCommands } from "./modules/tools.js";
import { registerHeader } from "./header/inject.js";
import { registerAnswerExtraction } from "./answer/extract.js";
import { registerTestGen } from "./commands/test-gen.js";
import { registerChangelog } from "./commands/changelog.js";

/**
 * Pikit — token-efficient pi-mono coding harness.
 *
 * Registers all tools, commands, and hooks with the pi agent.
 */
export default function pikit(pi: ExtensionAPI): void {
  // Core tools
  registerMemoryTools(pi);
  registerConfigCommands(pi);
  registerTodoTools(pi);
  registerSearchTools(pi);
  registerAskUser(pi);
  registerWorkflowCommands(pi);
  registerTestGen(pi);
  registerChangelog(pi);

  // Modules (pass known module names)
  registerModuleCommands(pi, ["search", "memory", "todos"]);

  // Hooks
  registerRtkHook(pi);
  registerHeader(pi);
  registerAnswerExtraction(pi);
}
