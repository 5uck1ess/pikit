/**
 * Truncate text to a max character length, appending a marker if truncated.
 * Rough approximation: 1 token ~ 4 chars.
 */
export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[... truncated]";
}
