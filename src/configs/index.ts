import {
  generateOpenCodeConfig as genOpenCode,
  serializeOpenCodeConfig as serializeOpenCode,
  getOpenCodeConfigPath as getOpenCodePath,
} from "./opencode.js"
import {
  generateCodexConfig as genCodex,
  generateCodexEnvVars as genCodexEnv,
  getCodexConfigPath as getCodexPath,
} from "./codex.js"
import {
  generateClaudeEnvVars as genClaudeEnv,
  generateClaudeSettingsJson as genClaudeSettings,
  getClaudeConfigPaths as getClaudePaths,
} from "./claude.js"
import {
  generateAntigravityConfig as genAntigravity,
  getAntigravityConfigPath as getAntigravityPath,
} from "./antigravity.js"

export const generateOpenCodeConfig = genOpenCode
export const serializeOpenCodeConfig = serializeOpenCode
export const getOpenCodeConfigPath = getOpenCodePath
export const generateCodexConfig = genCodex
export const generateCodexEnvVars = genCodexEnv
export const getCodexConfigPath = getCodexPath
export const generateClaudeEnvVars = genClaudeEnv
export const generateClaudeSettingsJson = genClaudeSettings
export const getClaudeConfigPaths = getClaudePaths
export const generateAntigravityConfig = genAntigravity
export const getAntigravityConfigPath = getAntigravityPath

import type { Provider } from "../providers"
import type { HealthResult } from "../health"

export type SupportedAgent = "opencode" | "codex" | "claude" | "antigravity" | "all"

export const AGENT_LABELS: Record<SupportedAgent, string> = {
  opencode: "OpenCode",
  codex: "Codex CLI",
  claude: "Claude Code",
  antigravity: "Antigravity CLI",
  all: "All supported",
}

export function generateAllConfigs(
  providers: Array<{ provider: Provider; health: HealthResult }>,
  agents: SupportedAgent[],
): Record<string, { path: string; content: string }> {
  const result: Record<string, { path: string; content: string }> = {}

  const targets = agents.includes("all")
    ? (["opencode", "codex", "claude"] as SupportedAgent[])
    : agents

  for (const agent of targets) {
    switch (agent) {
      case "opencode": {
        const config = genOpenCode(providers)
        result["opencode"] = {
          path: getOpenCodePath(),
          content: serializeOpenCode(config),
        }
        break
      }
      case "codex": {
        result["codex"] = {
          path: getCodexPath(),
          content: genCodex(providers),
        }
        break
      }
      case "claude": {
        result["claude-env"] = {
          path: "(add to ~/.zshrc or ~/.bashrc)",
          content: genClaudeEnv(providers),
        }
        result["claude-settings"] = {
          path: getClaudePaths()[0],
          content: JSON.stringify(genClaudeSettings(providers), null, 2),
        }
        break
      }
      case "antigravity": {
        result["antigravity"] = {
          path: getAntigravityPath(),
          content: genAntigravity(providers),
        }
        break
      }
    }
  }

  return result
}
