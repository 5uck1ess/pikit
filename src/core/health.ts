/** Health check for local model endpoints */

interface HealthResult {
  ok: boolean;
  endpoint: string;
  models: string[];
  error?: string;
  latencyMs: number;
}

/** Ping an OpenAI-compatible /v1/models endpoint and return available model IDs */
export async function checkEndpoint(baseUrl: string, timeoutMs = 3000): Promise<HealthResult> {
  const endpoint = baseUrl.replace(/\/+$/, "");
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${endpoint}/models`, {
      signal: controller.signal,
      headers: { Authorization: "Bearer llamacpp" },
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { ok: false, endpoint, models: [], error: `HTTP ${res.status}`, latencyMs };
    }

    const body = await res.json() as { data?: Array<{ id: string }> };
    const models = (body.data ?? []).map((m) => m.id);

    return { ok: true, endpoint, models, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    const error = message.includes("abort") ? `Timeout after ${timeoutMs}ms` : message;
    return { ok: false, endpoint, models: [], error, latencyMs };
  }
}

/** Format a health result for display */
export function formatHealth(result: HealthResult): string {
  if (!result.ok) {
    return `OFFLINE ${result.endpoint} — ${result.error}`;
  }
  const models = result.models.length > 0
    ? result.models.join(", ")
    : "no models listed";
  return `ONLINE ${result.endpoint} (${result.latencyMs}ms) — ${models}`;
}
