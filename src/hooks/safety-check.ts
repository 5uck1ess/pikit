import { type ExtensionAPI, isToolCallEventType } from "@mariozechner/pi-coding-agent";

/**
 * Safety check hook — blocks destructive commands, prompts on risky ones.
 *
 * Ported from devkit's safety-check.sh.
 */

const BLOCKED_BASH_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // Catastrophic filesystem destruction
  [/(^|[;&|]\s*)rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+|--force\s+)?(\/\s*$|\/\s+|~\s|~\/|\$HOME\b)/, "destructive rm targeting root or home directory"],
  // rm -rf .
  [/rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+\.\s*$/, "rm -rf . would wipe the current directory"],
  // DROP TABLE / DROP DATABASE
  [/DROP\s+(TABLE|DATABASE)\b/i, "SQL DROP statement"],
  // dd to disk device
  [/\bdd\b.*\bof=\/dev\/(sd|hd|nvme|vd|xvd)/, "dd to raw disk device"],
  // mkfs on a device
  [/\bmkfs\b.*\/dev\//, "mkfs on a device"],
] as const;

const RISKY_BASH_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // Force push to main/master
  [/git\s+push\s+.*--force.*\s+(main|master)\b|git\s+push\s+.*\s+(main|master)\s+.*--force/, "force push to main/master"],
  // git reset --hard
  [/git\s+reset\s+--hard/, "git reset --hard discards uncommitted work"],
  // chmod 777
  [/chmod\s+777/, "chmod 777 is world-writable"],
  // curl | sh
  [/curl\s.*\|\s*(ba)?sh/, "piping curl to shell"],
] as const;

const BLOCKED_WRITE_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, "private key in file content"],
] as const;

export function registerSafetyCheck(pi: ExtensionAPI): void {
  pi.on("tool_call", async (event, ctx) => {
    // Bash safety
    if (isToolCallEventType("bash", event)) {
      const command = event.input.command ?? "";

      for (const [pattern, message] of BLOCKED_BASH_PATTERNS) {
        if (pattern.test(command)) {
          return { block: true, reason: `BLOCKED: ${message}` };
        }
      }

      for (const [pattern, message] of RISKY_BASH_PATTERNS) {
        if (pattern.test(command)) {
          const ok = await ctx.ui.confirm("Risky operation", `${message}\n\nAllow?`);
          if (!ok) return { block: true, reason: `Blocked by user: ${message}` };
        }
      }
    }

    // Write/Edit safety — block private keys
    if (isToolCallEventType("write", event)) {
      const content = event.input.content ?? "";
      for (const [pattern, message] of BLOCKED_WRITE_PATTERNS) {
        if (pattern.test(content)) {
          return { block: true, reason: `BLOCKED: ${message}` };
        }
      }
    }

    if (isToolCallEventType("edit", event)) {
      for (const edit of event.input.edits) {
        for (const [pattern, message] of BLOCKED_WRITE_PATTERNS) {
          if (pattern.test(edit.newText)) {
            return { block: true, reason: `BLOCKED: ${message}` };
          }
        }
      }
    }
  });
}
