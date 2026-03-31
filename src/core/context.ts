/**
 * Extract the current working directory from a pi extension context.
 * Falls back to process.cwd() if not available.
 */
export function getCwd(ctx: { cwd?: string }): string {
  return ctx.cwd ?? process.cwd();
}
