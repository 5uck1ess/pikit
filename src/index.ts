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
import { registerCommitCommands } from "./commands/commit.js";
import { registerPrCommands } from "./commands/pr-ready.js";
import { registerReviewPr } from "./commands/review-pr.js";
import { registerDecompose } from "./commands/decompose.js";
import { registerRepoMap } from "./commands/repo-map.js";
import { registerStatus } from "./commands/status.js";
import { registerStatusline } from "./statusline/git.js";
import { checkUpstreamAsync } from "./core/upstream.js";
import { registerSafetyCheck } from "./hooks/safety-check.js";
import { registerSecurityPatterns } from "./hooks/security-patterns.js";
import { registerSlopDetect } from "./hooks/slop-detect.js";
import { registerLangReview } from "./hooks/lang-review.js";
import { registerOutputCompress } from "./hooks/output-compress.js";
import { registerContextPrune } from "./hooks/context-prune.js";

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
  registerCommitCommands(pi);
  registerPrCommands(pi);
  registerReviewPr(pi);
  registerDecompose(pi);
  registerRepoMap(pi);
  registerStatus(pi);

  // Modules (pass known module names)
  registerModuleCommands(pi, ["search", "memory", "todos"]);

  // Hooks
  registerRtkHook(pi);
  registerHeader(pi);
  registerAnswerExtraction(pi);
  registerStatusline(pi);
  registerSafetyCheck(pi);
  registerSecurityPatterns(pi);
  registerSlopDetect(pi);
  registerLangReview(pi);
  registerOutputCompress(pi);
  registerContextPrune(pi);

  // Background upstream version check (daily, non-blocking)
  checkUpstreamAsync(process.cwd());
}
