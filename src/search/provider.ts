import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Web search using SearXNG — a free, self-hostable meta-search engine.
 * Falls back to a public instance if no SEARXNG_URL is set.
 *
 * Set SEARXNG_URL env var to use your own instance.
 */
async function searxngSearch(query: string, count: number = 5): Promise<SearchResult[]> {
  const baseUrl = process.env.SEARXNG_URL ?? "https://search.ononoki.org";
  const params = new URLSearchParams({
    q: query,
    format: "json",
    categories: "general",
  });

  const response = await fetch(`${baseUrl}/search?${params}`);
  if (!response.ok) {
    throw new Error(`Search failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { results: Array<{ title: string; url: string; content: string }> };
  return (data.results ?? []).slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

/**
 * Fetch a URL and extract readable text content.
 * Uses a simple HTML-to-text approach.
 */
async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; pikit/1.0)" },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}): ${url}`);
  }

  const html = await response.text();
  // Strip tags for a rough readable extraction
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50_000);
}

export function registerSearchTools(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "web_search",
    description: "Search the web for information. Returns titles, URLs, and snippets.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        count: { type: "number", description: "Number of results (default 5)" },
      },
      required: ["query"],
    },
    async execute(args) {
      const results = await searxngSearch(args.query, args.count ?? 5);
      if (results.length === 0) return "No results found.";
      return results
        .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.snippet}`)
        .join("\n\n");
    },
  });

  pi.registerTool({
    name: "web_fetch",
    description: "Fetch a URL and extract its text content.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to fetch" },
      },
      required: ["url"],
    },
    async execute(args) {
      return await fetchPage(args.url);
    },
  });
}
