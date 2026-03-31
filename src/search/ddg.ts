/**
 * DuckDuckGo search via HTML scraping.
 *
 * Fetches DDG's HTML results page and extracts titles, URLs, and snippets.
 * No API key required.
 */

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

/** Scrape DuckDuckGo HTML search results */
export async function search(query: string, maxResults: number = 5): Promise<WebResult[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`DDG search failed (${response.status})`);
  }

  const html = await response.text();
  return parseResults(html, maxResults);
}

/** Extract result entries from DDG HTML */
function parseResults(html: string, max: number): WebResult[] {
  const results: WebResult[] = [];
  // DDG wraps each result in a div with class "result"
  // Links are in <a class="result__a"> and snippets in <a class="result__snippet">
  const resultBlocks = html.split(/class="result\s/g).slice(1);

  for (const block of resultBlocks) {
    if (results.length >= max) break;

    const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)<\/a>/);
    const urlMatch = block.match(/class="result__a"\s+href="([^"]+)"/);
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|span)/);

    if (!titleMatch || !urlMatch) continue;

    // DDG proxies URLs through a redirect — extract the real URL
    let url = urlMatch[1];
    const uddgMatch = url.match(/uddg=([^&]+)/);
    if (uddgMatch) {
      url = decodeURIComponent(uddgMatch[1]);
    }

    const snippet = snippetMatch
      ? snippetMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";

    results.push({
      title: titleMatch[1].trim(),
      url,
      snippet,
    });
  }

  return results;
}
