import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { search } from "./ddg.js";
import { read } from "./reader.js";

export function registerSearchTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "web_search",
    description: "Search the web via DuckDuckGo. Returns titles, URLs, and snippets.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        count: { type: "number", description: "Max results (default 5)" },
      },
      required: ["query"],
    },
    async execute(args) {
      const results = await search(args.query, args.count ?? 5);
      if (results.length === 0) return "No results found.";
      return results
        .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n");
    },
  });

  pi.registerTool({
    name: "web_read",
    description: "Fetch a URL and extract readable text content. Converts HTML to clean markdown-style text.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to read" },
      },
      required: ["url"],
    },
    async execute(args) {
      return await read(args.url);
    },
  });
}
