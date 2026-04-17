import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { checkEndpoint, formatHealth } from "../core/health.js";

/** Known local endpoints to check */
const LOCAL_ENDPOINTS: Record<string, string> = {
  "llama.cpp / llama-swap": "http://localhost:8080/v1",
  "Ollama": "http://localhost:11434/v1",
  "LM Studio": "http://localhost:1234/v1",
  "vLLM": "http://localhost:8000/v1",
};

export function registerHealth(pi: ExtensionAPI): void {
  pi.registerCommand("health", {
    description: "Check local model endpoint availability",
    async handler(args, ctx) {
      const lines: string[] = ["Local endpoint health check:", ""];

      const results = await Promise.all(
        Object.entries(LOCAL_ENDPOINTS).map(async ([name, url]) => {
          const result = await checkEndpoint(url);
          return `${name}: ${formatHealth(result)}`;
        }),
      );

      lines.push(...results);
      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
