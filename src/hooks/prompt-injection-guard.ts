import { type ExtensionAPI, isToolCallEventType } from "@mariozechner/pi-coding-agent";

/**
 * Prompt injection guard — scans file writes for injection patterns.
 *
 * Defense-in-depth: catches injected instructions before they can enter
 * agent context via planning files, configs, or markdown docs.
 *
 * Advisory only — warns but does not block, to avoid false-positive deadlocks.
 * Inspired by GSD's prompt-guard hook.
 */

const INJECTION_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/ignore\s+(all\s+)?previous\s+instructions/i, "ignore previous instructions"],
  [/ignore\s+(all\s+)?above\s+instructions/i, "ignore above instructions"],
  [/disregard\s+(all\s+)?previous/i, "disregard previous"],
  [/forget\s+(all\s+)?(your\s+)?instructions/i, "forget instructions"],
  [/override\s+(system|previous)\s+(prompt|instructions)/i, "override prompt"],
  [/you\s+are\s+now\s+(?:a|an|the)\s+/i, "role reassignment"],
  [/pretend\s+(?:you(?:'re| are)\s+|to\s+be\s+)/i, "role pretend"],
  [/from\s+now\s+on,?\s+you\s+(?:are|will|should|must)/i, "behavioral override"],
  [/(?:print|output|reveal|show|display|repeat)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)/i, "prompt extraction"],
  [/<\/?(?:system|assistant|human)>/i, "raw role tags"],
  [/\[SYSTEM\]/i, "system tag injection"],
  [/\[INST\]/i, "instruction tag injection"],
  [/<<\s*SYS\s*>>/i, "system delimiter injection"],
] as const;

/** File extensions where injection patterns are meaningful */
const SCANNABLE_EXTENSIONS = new Set([".md", ".txt", ".yml", ".yaml", ".json", ".toml", ".cfg", ".ini", ".prompt"]);

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot >= 0 ? filePath.slice(dot) : "";
}

export function scanForInjection(content: string): string | undefined {
  for (const [pattern, label] of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      return label;
    }
  }
  return undefined;
}

export function registerPromptInjectionGuard(pi: ExtensionAPI): void {
  pi.on("tool_call", (event, _ctx) => {
    if (isToolCallEventType("write", event)) {
      const ext = getExtension(event.input.path);
      if (!SCANNABLE_EXTENSIONS.has(ext)) return;

      const found = scanForInjection(event.input.content);
      if (found) {
        return {
          additionalContext: `[prompt-injection-guard] Suspicious pattern detected in ${event.input.path}: "${found}". Review this content before proceeding.`,
        };
      }
    }

    if (isToolCallEventType("edit", event)) {
      const ext = getExtension(event.input.path);
      if (!SCANNABLE_EXTENSIONS.has(ext)) return;

      const hits: string[] = [];
      for (const edit of event.input.edits) {
        const found = scanForInjection(edit.newText);
        if (found && !hits.includes(found)) hits.push(found);
      }
      if (hits.length > 0) {
        return {
          additionalContext: `[prompt-injection-guard] Suspicious patterns in ${event.input.path}: ${hits.map((h) => `"${h}"`).join(", ")}. Review before proceeding.`,
        };
      }
    }
  });
}
