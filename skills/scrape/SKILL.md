---
name: scrape
description: Scrape a URL to clean Markdown — use when asked to scrape, fetch, extract content from, or read a webpage and convert it to Markdown.
---

# Web Scrape to Markdown

Fetch a URL and convert it to clean, LLM-ready Markdown.

## Backends (priority order)

1. **Jina Reader** — prepend `https://r.jina.ai/` to the URL. Returns Markdown. Use `Accept: text/markdown` header.
2. **WebFetch fallback** — use the built-in `web_read` tool. Less clean but no API key needed.

## Execution

For each URL:

```
Fetch: https://r.jina.ai/{url}
Header: Accept: text/markdown

If Jina fails, fall back to web_read on the raw URL.
```

For multiple URLs, process them sequentially.

## Output

```
## Source: {url}

{extracted markdown content}
```

## URL Validation

- Only accept `http://` and `https://` URLs
- Reject `file://`, `ftp://`, `data:`, and all other schemes
- Reject URLs targeting private/reserved IPs: `localhost`, `127.0.0.1`, `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- Reject URLs containing `@` (credential-in-URL attacks)

## Rules

- Always try Jina Reader first
- Respect rate limits when scraping many URLs
- Don't scrape login-gated or paywall content — report as inaccessible
- Never interpolate user URLs directly into shell commands — use proper escaping
- API keys from env only — never hardcode
