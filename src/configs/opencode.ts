import type { Provider } from "../providers"
import type { HealthResult } from "../health"
import { homedir } from "os"

export interface OpenCodeConfig {
  $schema: string
  provider?: Record<string, {
    npm: string
    name: string
    options: { baseURL: string }
    models: Record<string, { name: string }>
  }>
}

export interface OpenCodeAuth {
  [providerId: string]: {
    type: "api"
    key: string
  }
}

const OPENCODE_BUILTIN_PROVIDER_IDS: Record<string, string> = {
  "anthropic": "anthropic",
  "aws-bedrock": "amazon-bedrock",
  "azure-openai": "azure",
  "deepseek": "deepseek",
  "gcp-vertex": "vertex",
  "github-models": "github",
  "google-gemini": "google",
  "groq": "groq",
  "mistral": "mistral",
  "morph": "morph",
  "ollama": "ollama",
  "openai": "openai",
  "openrouter": "openrouter",
  "vercel-gateway": "vercel",
  "xai": "xai",
}

export function getOpenCodeProviderId(provider: Provider): string {
  const builtinId = OPENCODE_BUILTIN_PROVIDER_IDS[provider.id]
  if (builtinId) return builtinId
  return provider.id.replace(/[^a-zA-Z0-9-]/g, "-")
}

export function isOpenCodeBuiltinProvider(provider: Provider): boolean {
  return provider.id in OPENCODE_BUILTIN_PROVIDER_IDS
}

export function generateOpenCodeConfig(
  providers: Array<{ provider: Provider; health: HealthResult }>,
): OpenCodeConfig {
  const config: OpenCodeConfig = {
    $schema: "https://opencode.ai/config.json",
    provider: {},
  }

  for (const { provider, health } of providers) {
    if (health.status !== "ok") continue
    if (isOpenCodeBuiltinProvider(provider)) continue

    const id = getOpenCodeProviderId(provider)
    const models: Record<string, { name: string }> = {}

    if (health.models && health.models.length > 0) {
      for (const model of health.models) {
        models[model] = { name: model.split("/").pop() ?? model }
      }
    } else {
      models["default"] = { name: provider.name }
    }

    config.provider![id] = {
      npm: provider.apiType === "anthropic" ? "@ai-sdk/anthropic" : "@ai-sdk/openai-compatible",
      name: provider.name,
      options: { baseURL: provider.baseURL },
      models,
    }
  }

  return config
}

export function generateOpenCodeAuth(
  providers: Array<{ provider: Provider; health: HealthResult }>,
  apiKeys: Record<string, string>,
): OpenCodeAuth {
  const auth: OpenCodeAuth = {}

  for (const { provider, health } of providers) {
    if (health.status !== "ok") continue
    const key = apiKeys[provider.id]?.trim()
    if (!key) continue
    auth[getOpenCodeProviderId(provider)] = { type: "api", key }
  }

  return auth
}

export function serializeOpenCodeConfig(config: OpenCodeConfig): string {
  return JSON.stringify(config, null, 2)
}

export function getOpenCodeConfigPath(): string {
  return process.cwd() + "/opencode.json"
}

export function getOpenCodeAuthPath(): string {
  return homedir() + "/.local/share/opencode/auth.json"
}
