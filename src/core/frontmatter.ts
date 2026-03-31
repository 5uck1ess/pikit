/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { attrs, body } where attrs is the parsed YAML and body is the rest.
 */
export function parseFrontmatter(raw: string): { attrs: Record<string, unknown>; body: string } {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { attrs: {}, body: raw };
  }

  const end = trimmed.indexOf("---", 3);
  if (end === -1) {
    return { attrs: {}, body: raw };
  }

  const yamlBlock = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 3).trimStart();

  const attrs: Record<string, unknown> = {};
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    attrs[key] = val;
  }

  return { attrs, body };
}
