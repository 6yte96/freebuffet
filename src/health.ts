import type { Provider } from "./providers"

export interface HealthResult {
  provider: Provider
  status: "ok" | "error" | "timeout"
  latencyMs: number
  models?: string[]
  error?: string
}

export interface HealthSummary {
  total: number
  healthy: number
  unhealthy: number
  results: HealthResult[]
}

async function checkOpenAICompatible(
  provider: Provider,
  apiKey: string,
  signal: AbortSignal,
): Promise<HealthResult> {
  const start = performance.now()

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "freebuffet/0.2.0",
    }
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`

    const resp = await fetch(`${provider.baseURL}/models`, { headers, signal })
    const latencyMs = Math.round(performance.now() - start)

    if (resp.ok) {
      const data = await resp.json() as { data?: Array<{ id: string }> }
      const models = data?.data?.map(m => m.id) ?? []

      return {
        provider,
        status: "ok",
        latencyMs,
        models,
      }
    }

    if (resp.status === 401 || resp.status === 403) {
      return {
        provider,
        status: "error",
        latencyMs,
        error: "Invalid API key or insufficient permissions",
      }
    }

    return {
      provider,
      status: "error",
      latencyMs,
      error: `HTTP ${resp.status}: ${resp.statusText}`,
    }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start)
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        provider,
        status: "timeout",
        latencyMs,
        error: "Request timed out",
      }
    }
    return {
      provider,
      status: "error",
      latencyMs,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function checkAnthropicCompatible(
  provider: Provider,
  apiKey: string,
  signal: AbortSignal,
): Promise<HealthResult> {
  const start = performance.now()

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "freebuffet/0.2.0",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }

    const resp = await fetch(`${provider.baseURL}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
      signal,
    })
    const latencyMs = Math.round(performance.now() - start)

    if (resp.ok) {
      return { provider, status: "ok", latencyMs, models: ["claude-sonnet-4-20250514"] }
    }

    if (resp.status === 401 || resp.status === 403) {
      return { provider, status: "error", latencyMs, error: "Invalid API key" }
    }

    return { provider, status: "error", latencyMs, error: `HTTP ${resp.status}` }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start)
    if (err instanceof DOMException && err.name === "AbortError") {
      return { provider, status: "timeout", latencyMs, error: "Request timed out" }
    }
    return { provider, status: "error", latencyMs, error: err instanceof Error ? err.message : String(err) }
  }
}

export async function checkProviderHealth(
  provider: Provider,
  apiKey: string,
  timeoutMs = 10_000,
): Promise<HealthResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    if (provider.apiType === "anthropic") {
      return await checkAnthropicCompatible(provider, apiKey, controller.signal)
    }
    return await checkOpenAICompatible(provider, apiKey, controller.signal)
  } finally {
    clearTimeout(timer)
  }
}

export async function checkAllProviders(
  providers: Provider[],
  apiKeys: Record<string, string>,
): Promise<HealthSummary> {
  const results = await Promise.all(
    providers
      .filter(p => apiKeys[p.id])
      .map(p => checkProviderHealth(p, apiKeys[p.id])),
  )

  return {
    total: results.length,
    healthy: results.filter(r => r.status === "ok").length,
    unhealthy: results.filter(r => r.status !== "ok").length,
    results,
  }
}

export function formatHealthResult(result: HealthResult): string {
  const icon = result.status === "ok" ? "OK" : result.status === "timeout" ? "TIMEOUT" : "ERR"
  const modelCount = result.models ? ` (${result.models.length} models)` : ""
  const error = result.error ? ` - ${result.error}` : ""
  return `${icon} ${result.provider.name}: ${result.latencyMs}ms${modelCount}${error}`
}
