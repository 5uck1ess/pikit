import { Type } from "@sinclair/typebox";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { search } from "./ddg.js";
import { read } from "./reader.js";

export function registerSearchTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description: "Search the web via DuckDuckGo. Returns titles, URLs, and snippets.",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      count: Type.Optional(Type.Number({ description: "Max results (default 5)" })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const results = await search(params.query, params.count ?? 5);
      if (results.length === 0) {
        return { content: [{ type: "text", text: "No results found." }] };
      }
      const text = results
        .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n");
      return { content: [{ type: "text", text }] };
    },
  });

  pi.registerTool({
    name: "web_read",
    label: "Web Read",
    description: "Fetch a URL and extract readable text content. Converts HTML to clean markdown-style text.",
    parameters: Type.Object({
      url: Type.String({ description: "URL to read" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const text = await read(params.url);
      return { content: [{ type: "text", text }] };
    },
  });
}
