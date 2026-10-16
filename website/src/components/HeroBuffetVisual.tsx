"use client";

import { useState } from "react";
import { PROJECT_CONFIG } from "@/config";

interface ProviderSample {
  id: string;
  name: string;
  category: "Fast Cloud" | "High Quota" | "Local $0" | "Router";
  freeTier: string;
  latencyMs: number;
  modelsFound: number;
  topModel: string;
  baseURL: string;
  envKey: string;
  configs: {
    opencode: string;
    codex: string;
    claude: string;
    antigravity: string;
  };
}

const BUFFET_SAMPLES: ProviderSample[] = [
  {
    id: "groq",
    name: "Groq",
    category: "Fast Cloud",
    freeTier: "30 RPM, 14,400 RPD",
    latencyMs: 42,
    modelsFound: 18,
    topModel: "llama-3.3-70b-versatile",
    baseURL: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    configs: {
      opencode: `"provider": {
  "groq": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "Groq",
    "options": {
      "baseURL": "https://api.groq.com/openai/v1"
    }
  }
}`,
      codex: `[model_providers.groq]
name = "Groq"
base_url = "https://api.groq.com/openai/v1"
wire_specification = "openai"
env_key = "GROQ_API_KEY"`,
      claude: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.groq.com/openai/v1",
    "ANTHROPIC_API_KEY": "\${GROQ_API_KEY}"
  }
}`,
      antigravity: `[[providers]]
name = "groq"
base_url = "https://api.groq.com/openai/v1"
model = "llama-3.3-70b-versatile"`,
    },
  },
  {
    id: "cerebras",
    name: "Cerebras",
    category: "Fast Cloud",
    freeTier: "1,000,000 tokens/day",
    latencyMs: 24,
    modelsFound: 4,
    topModel: "llama-3.3-70b",
    baseURL: "https://api.cerebras.ai/v1",
    envKey: "CEREBRAS_API_KEY",
    configs: {
      opencode: `"provider": {
  "cerebras": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "Cerebras",
    "options": {
      "baseURL": "https://api.cerebras.ai/v1"
    }
  }
}`,
      codex: `[model_providers.cerebras]
name = "Cerebras"
base_url = "https://api.cerebras.ai/v1"
wire_specification = "openai"
env_key = "CEREBRAS_API_KEY"`,
      claude: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.cerebras.ai/v1"
  }
}`,
      antigravity: `[[providers]]
name = "cerebras"
base_url = "https://api.cerebras.ai/v1"
model = "llama-3.3-70b"`,
    },
  },
  {
    id: "gemini",
    name: "Google Gemini",
    category: "High Quota",
    freeTier: "1,500 RPD (Flash)",
    latencyMs: 86,
    modelsFound: 12,
    topModel: "gemini-2.0-flash",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    envKey: "GEMINI_API_KEY",
    configs: {
      opencode: `"provider": {
  "google": {
    "npm": "@ai-sdk/google",
    "name": "Google Gemini"
  }
}`,
      codex: `[model_providers.gemini]
name = "Google Gemini"
base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
wire_specification = "openai"`,
      claude: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com/v1beta/openai"
  }
}`,
      antigravity: `[[providers]]
name = "gemini"
base_url = "https://generativelanguage.googleapis.com/v1beta/openai"
model = "gemini-2.0-flash"`,
    },
  },
  {
    id: "ollama",
    name: "Ollama Local",
    category: "Local $0",
    freeTier: "Always Free (0 cost, no key)",
    latencyMs: 6,
    modelsFound: 8,
    topModel: "qwen2.5-coder:14b",
    baseURL: "http://localhost:11434/v1",
    envKey: "NONE",
    configs: {
      opencode: `"provider": {
  "ollama": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "Ollama Local",
    "options": {
      "baseURL": "http://localhost:11434/v1"
    }
  }
}`,
      codex: `[model_providers.ollama]
name = "Ollama Local"
base_url = "http://localhost:11434/v1"
wire_specification = "openai"`,
      claude: `{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:11434/v1"
  }
}`,
      antigravity: `[[providers]]
name = "ollama"
base_url = "http://localhost:11434/v1"
model = "qwen2.5-coder:14b"`,
    },
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    category: "Router",
    freeTier: "20+ Free Models (:free)",
    latencyMs: 78,
    modelsFound: 24,
    topModel: "deepseek/deepseek-r1:free",
    baseURL: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    configs: {
      opencode: `"provider": {
  "openrouter": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "OpenRouter",
    "options": {
      "baseURL": "https://openrouter.ai/api/v1"
    }
  }
}`,
      codex: `[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
wire_specification = "openai"`,
      claude: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1"
  }
}`,
      antigravity: `[[providers]]
name = "openrouter"
base_url = "https://openrouter.ai/api/v1"
model = "deepseek/deepseek-r1:free"`,
    },
  },
];

type TargetAgent = "opencode" | "codex" | "claude" | "antigravity";

const AGENT_TABS: { id: TargetAgent; label: string; file: string }[] = [
  { id: "opencode", label: "OpenCode", file: "opencode.json" },
  { id: "codex", label: "Codex CLI", file: "config.toml" },
  { id: "claude", label: "Claude Code", file: "settings.json" },
  { id: "antigravity", label: "Antigravity", file: "config.toml" },
];

export function HeroBuffetVisual() {
  const { telemetry, links } = PROJECT_CONFIG;
  const [selectedProviderId, setSelectedProviderId] = useState<string>("groq");
  const [selectedAgent, setSelectedAgent] = useState<TargetAgent>("opencode");

  const currentProvider =
    BUFFET_SAMPLES.find((p) => p.id === selectedProviderId) || BUFFET_SAMPLES[0];
  const currentAgentTab =
    AGENT_TABS.find((a) => a.id === selectedAgent) || AGENT_TABS[0];

  return (
    <div
      className="hero-buffet-console"
      role="region"
      aria-label="Interactive FreeBuffet Provider Matrix"
    >
      {/* Console Window Header */}
      <div className="buffet-console-header">
        <div className="buffet-window-dots">
          <span className="dot dot-close" />
          <span className="dot dot-min" />
          <span className="dot dot-expand" />
        </div>
        <div className="buffet-console-title font-mono">
          <span className="live-indicator">
            <span className="live-dot" />
            165 PROVIDERS MENU
          </span>
          <span className="buffet-header-tag">health-check &bull; AES-256 vault</span>
        </div>
        <div className="buffet-mode-chip font-mono">
          <span>AUTO-CONFIG</span>
        </div>
      </div>

      {/* Provider Selector Shelf */}
      <div className="buffet-provider-shelf">
        <div className="shelf-label font-mono">SELECT TASTING DISH:</div>
        <div className="shelf-buttons">
          {BUFFET_SAMPLES.map((prov) => (
            <button
              key={prov.id}
              type="button"
              onClick={() => setSelectedProviderId(prov.id)}
              className={`shelf-btn font-mono ${
                selectedProviderId === prov.id ? "active" : ""
              }`}
            >
              <span className="shelf-prov-name">{prov.name}</span>
              <span className="shelf-prov-lat">{prov.latencyMs}ms</span>
            </button>
          ))}
        </div>
      </div>

      {/* Provider Live Telemetry Probe */}
      <div className="buffet-probe-card">
        <div className="probe-top-line font-mono">
          <div className="probe-name-row">
            <span className="probe-provider-name">{currentProvider.name}</span>
            <span className="probe-category-tag">{currentProvider.category}</span>
          </div>
          <div className="probe-health-badge">
            <span className="probe-dot" />
            <span>200 OK &bull; {currentProvider.latencyMs}ms</span>
          </div>
        </div>

        <div className="probe-quota-line font-mono">
          <span className="quota-label">FREE TIER:</span>
          <span className="quota-val">{currentProvider.freeTier}</span>
        </div>

        <div className="probe-details-grid font-mono">
          <div className="probe-detail-item">
            <span className="detail-key">ENDPOINT</span>
            <span className="detail-val" title={currentProvider.baseURL}>
              {currentProvider.baseURL.replace(/^https?:\/\//, "")}
            </span>
          </div>
          <div className="probe-detail-item">
            <span className="detail-key">MODELS FOUND</span>
            <span className="detail-val">+{currentProvider.modelsFound} models</span>
          </div>
          <div className="probe-detail-item">
            <span className="detail-key">TOP CODING MODEL</span>
            <span className="detail-val">{currentProvider.topModel}</span>
          </div>
        </div>
      </div>

      {/* Multi-Agent Config Generator Preview */}
      <div className="buffet-config-preview">
        <div className="config-target-tabs">
          <span className="target-label font-mono">TARGET AGENT:</span>
          {AGENT_TABS.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgent(agent.id)}
              className={`config-target-tab font-mono ${
                selectedAgent === agent.id ? "active" : ""
              }`}
            >
              <span>{agent.label}</span>
            </button>
          ))}
        </div>

        <div className="config-code-box font-mono">
          <div className="config-file-header">
            <span>
              <i className="fas fa-file-code" /> {currentAgentTab.file} (auto-generated)
            </span>
            <span className="vault-tag">
              <i className="fas fa-lock" /> AES-256 Vault Encrypted
            </span>
          </div>
          <pre className="config-code-pre">
            <code>{currentProvider.configs[selectedAgent]}</code>
          </pre>
        </div>
      </div>

      {/* Buffet Counters Meter Row */}
      <div className="buffet-telemetry-row">
        {telemetry.stats.map((stat, idx) => (
          <div key={idx} className="buffet-telemetry-card">
            <span className="buffet-telemetry-number font-mono">{stat.number}</span>
            <span className="buffet-telemetry-label font-mono">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Footer Caption & Links */}
      <div className="buffet-footer-caption font-mono">
        <span>{telemetry.updatedText}</span>
        {links.github && (
          <div className="buffet-inline-support" role="group" aria-label="Support repository">
            <a
              href={links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-support-icon"
              title="Star on GitHub"
            >
              <i className="far fa-star" />
            </a>
            <a
              href={`${links.github}/sponsorships`}
              target="_blank"
              rel="noopener noreferrer"
              className="hero-support-icon"
              title="Sponsor"
            >
              <i className="fas fa-heart" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
