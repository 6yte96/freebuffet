/**
 * ============================================================================
 * FREEBUFFET LANDING PAGE CONFIGURATION
 * Single source of truth for the entire landing page content.
 * ============================================================================
 */

export interface ProjectConfig {
  meta: {
    title: string;
    description: string;
    keywords: string[];
    url: string;
    author: string;
  };
  brand: {
    name: string;
    domainSuffix: string;
    tagline: string;
    handle: string;
  };
  hero: {
    issueBadge: string;
    edition: string;
    titleLines: {
      before: string;
      highlight: string;
      after: string;
    };
    description: string;
    primaryCta: {
      text: string;
      href: string;
    };
    secondaryCta: {
      text: string;
      href: string;
    };
  };
  install: {
    defaultManager: string;
    managers: Record<string, string>;
  };
  telemetry: {
    label: string;
    updatedText: string;
    stats: {
      number: string;
      label: string;
    }[];
  };
  features: {
    id: string;
    bentoClass: string;
    category: string;
    tech: string;
    title: string;
    description: string;
    repoLinkText?: string;
    stamp: {
      label: string;
      value: string;
    };
    meta: string;
    tilt: "tilt-up" | "tilt-down";
  }[];
  codePlayground: {
    title: string;
    filename: string;
    language: string;
    tabs: {
      id: string;
      label: string;
      filename: string;
      code: string;
    }[];
  };
  benchmarks: {
    title: string;
    subtitle: string;
    headers: string[];
    rows: {
      name: string;
      isTarget?: boolean;
      metrics: string[];
      highlight?: boolean;
    }[];
  };
  architecture: {
    title: string;
    subtitle: string;
    layers: {
      name: string;
      role: string;
      spec: string;
    }[];
  };
  changelog: {
    version: string;
    date: string;
    title: string;
    description: string;
    tag: string;
  }[];
  community: {
    title: string;
    description: string;
    contributingText: string;
    dispatches: {
      title: string;
      tag: string;
      component: string;
      href: string;
    }[];
  };
  links: {
    github: string;
    docs: string;
    discord?: string;
    twitter?: string;
    npm?: string;
    crates?: string;
    pypi?: string;
  };
}

export const PROJECT_CONFIG: ProjectConfig = {
  meta: {
    title: "FreeBuffet — All-You-Can-Eat LLM Providers for AI Coding Agents",
    description:
      "One CLI to configure every AI coding agent. Health-check 165 LLM providers, store keys in an encrypted vault, and auto-generate configs for OpenCode, Codex CLI, Claude Code, and Antigravity.",
    keywords: [
      "freebuffet",
      "llm providers",
      "free api",
      "opencode",
      "codex cli",
      "claude code",
      "antigravity",
      "ai coding agent",
      "free tier",
      "openai-compatible",
      "cli",
      "typescript",
      "bun",
    ],
    url: "https://6yte96.github.io/freebuffet/",
    author: "6yte96",
  },
  brand: {
    name: "freebuffet",
    domainSuffix: ".io",
    tagline: "An all-you-can-eat menu of LLM providers — no email required",
    handle: "6yte96",
  },
  hero: {
    issueBadge: "Issue v0.2.0",
    edition: "Menu Edition 2026-A",
    titleLines: {
      before: "All-You-Can-Eat",
      highlight: "LLM Provider",
      after: "Buffet for Agents",
    },
    description:
      "An interactive terminal CLI that health-checks 165 LLM providers, seals your API keys in an AES-256-GCM vault, and auto-generates working configs for OpenCode, Codex CLI, Claude Code, and Antigravity — all from one sitting.",
    primaryCta: {
      text: "Browse the Menu",
      href: "#features",
    },
    secondaryCta: {
      text: "View GitHub Repo",
      href: "https://github.com/6yte96/freebuffet",
    },
  },
  install: {
    defaultManager: "npx",
    managers: {
      npx: "npx freebuffet",
      bunx: "bunx freebuffet",
      npm: "npm install -g freebuffet",
      pnpm: "pnpm dlx freebuffet",
    },
  },
  telemetry: {
    label: "Buffet Counters",
    updatedText: "Verified against src/providers.ts · v0.2.0",
    stats: [
      { number: "165", label: "Providers on the Menu" },
      { number: "99", label: "Permanent Free Tiers" },
      { number: "47", label: "No-Credit-Card Needed" },
      { number: "19", label: "Local Engines ($0)" },
    ],
  },
  features: [
    {
      id: "provider-registry",
      bentoClass: "bento-xl",
      category: "REGISTRY",
      tech: "165 ENTRIES / TYPED",
      title: "The 165-Provider Menu",
      description:
        "A hand-curated registry with baseURLs, env keys, free-tier quotas, and API types. Groq, Cerebras, Gemini, OpenRouter, Ollama — every entry searchable by name or id, filterable by tag.",
      repoLinkText: "src/providers.ts",
      stamp: { label: "Lines of code", value: "1,691" },
      meta: "165 ENTRIES",
      tilt: "tilt-up",
    },
    {
      id: "health-check",
      bentoClass: "bento-tall",
      category: "HEALTH",
      tech: "FETCH / LATENCY / MODELS",
      title: "Zero-Config Health Checks",
      description:
        "Pings /v1/models or /v1/messages per provider, measures latency, and discovers the live model list before a single config is written. Unhealthy providers never make it to your agent.",
      repoLinkText: "src/health.ts",
      stamp: { label: "Lines of code", value: "167" },
      meta: "401/403 AWARE",
      tilt: "tilt-down",
    },
    {
      id: "key-vault",
      bentoClass: "bento-md",
      category: "SECURITY",
      tech: "SCRYPT / AES-256-GCM",
      title: "Encrypted Key Vault",
      description:
        "API keys are sealed in ~/.config/freebuffet/config.enc with a machine-bound scrypt key. No plaintext, no cloud, no telemetry — keys never leave your box.",
      repoLinkText: "src/config.ts",
      stamp: { label: "Lines of code", value: "59" },
      meta: "MACHINE-BOUND",
      tilt: "tilt-up",
    },
    {
      id: "agent-configs",
      bentoClass: "bento-wide",
      category: "AGENTS",
      tech: "JSON / TOML / SHELL",
      title: "Four Agent Targets, One Run",
      description:
        "Generates opencode.json, ~/.codex/config.toml, ~/.claude/settings.json — plus experimental Antigravity support — from a single provider selection. Existing files are backed up, never clobbered.",
      repoLinkText: "src/configs/",
      stamp: { label: "Lines of code", value: "458" },
      meta: "4 TARGETS",
      tilt: "tilt-down",
    },
    {
      id: "local-engines",
      bentoClass: "bento-sm",
      category: "LOCAL",
      tech: "OLLAMA / VLLM / LLAMA.CPP",
      title: "19 Local Engines",
      description:
        "Zero-cost local inference: Ollama, LM Studio, llama.cpp, vLLM, SGLang, and 14 more. Key prompts auto-skipped.",
      repoLinkText: "LOCALHOST / $0",
      stamp: { label: "Local engines", value: "19" },
      meta: "NO KEY NEEDED",
      tilt: "tilt-up",
    },
    {
      id: "welfare-relays",
      bentoClass: "bento-lg",
      category: "WELFARE",
      tech: "10 SITES / LIVE PROBES",
      title: "Free Credit Relay Registry",
      description:
        "A registry of public-welfare relay stations handing out free Claude/GPT credits — $50–$100 signup bonuses, daily check-ins, invite stacking. FreeBuffet probes their live status and calculates your first-day total.",
      repoLinkText: "data/welfare-sites.json",
      stamp: { label: "Relay sites", value: "10" },
      meta: "DAILY CHECK-INS",
      tilt: "tilt-down",
    },
    {
      id: "curated-favorites",
      bentoClass: "bento-md",
      category: "REGISTRY",
      tech: "TAGGED / RANKED",
      title: "25 Curated Free-Coding Favorites",
      description:
        "The editor's picks: capability tags — coding, reasoning, vision, fast, free, no-cc — so you pick a provider in seconds, not settings tabs.",
      repoLinkText: "CURATED_FAVORITES",
      stamp: { label: "Curated picks", value: "25" },
      meta: "6 CAPABILITY TAGS",
      tilt: "tilt-up",
    },
    {
      id: "tui",
      bentoClass: "bento-wide",
      category: "UX",
      tech: "@CLACK / PICOOLORS",
      title: "Searchable Terminal TUI",
      description:
        "Type-to-filter provider checklist, live health-check spinners, config preview before write. Runs on Node 18+ and Bun — one runtime dep (picocolors), zero native modules.",
      repoLinkText: "src/index.ts",
      stamp: { label: "Lines of code", value: "1,693" },
      meta: "1 RUNTIME DEP",
      tilt: "tilt-down",
    },
  ],
  codePlayground: {
    title: "From One Sitting to Four Agents",
    filename: "session.sh",
    language: "shell",
    tabs: [
      {
        id: "session",
        label: "Session",
        filename: "terminal — npx freebuffet",
        code: `$ npx freebuffet

  ┌  FreeBuffet v0.2.0 — 165 providers on the menu
  │
  ├  Step 1 · Select providers
  │    │  ▸ ◯ Groq          free · 30 RPM · no CC
  │    │    ◯ Cerebras      free · 1M tok/day · no CC
  │    │    ◯ Google Gemini free · 1,500 RPD · no CC
  │    │    ◯ Ollama        local · $0 · no key
  │    │  ▸ type to filter 165 entries…
  │    ▼
  ├  Step 2 · Enter API keys
  │    │    GROQ_API_KEY = gsk_•••••••••••••••
  │    │    CEREBRAS_API_KEY = csk-••••••••••••
  │    │    (local engines auto-skipped)
  │    ▼
  ├  Step 3 · Health check
  │    │    ✓ groq        ok · 214ms · 18 models
  │    │    ✓ cerebras    ok · 359ms · 11 models
  │    │    ✓ gemini      ok · 487ms · 42 models
  │    │    ✓ ollama      ok · 3ms   · 4 models
  │    ▼
  ├  Step 4 · Select target agents
  │    │    ✓ OpenCode  ✓ Codex CLI
  │    │    ✓ Claude Code  ◯ Antigravity
  │    ▼
  └  Step 5 · Configs generated
       │    ./opencode.json                    written
       │    ~/.local/share/opencode/auth.json  written
       │    ~/.codex/config.toml               written
       │    ~/.claude/settings.json            written
       │
       └  Keys sealed in ~/.config/freebuffet/config.enc (AES-256-GCM)`,
      },
      {
        id: "opencode",
        label: "OpenCode",
        filename: "opencode.json",
        code: `{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "groq": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Groq",
      "options": { "baseURL": "https://api.groq.com/openai/v1" },
      "models": {
        "llama-3.3-70b-versatile": { "name": "llama-3.3-70b-versatile" },
        "qwen-2.5-coder-32b": { "name": "qwen-2.5-coder-32b" }
      }
    },
    "cerebras": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Cerebras",
      "options": { "baseURL": "https://api.cerebras.ai/v1" },
      "models": {
        "qwen-3-coder": { "name": "qwen-3-coder" }
      }
    },
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama",
      "options": { "baseURL": "http://localhost:11434/v1" },
      "models": { "qwen2.5-coder:7b": { "name": "qwen2.5-coder:7b" } }
    }
  }
}

// keys land in ~/.local/share/opencode/auth.json
// (written by FreeBuffet, never printed to terminal)`,
      },
      {
        id: "codex",
        label: "Codex CLI",
        filename: "~/.codex/config.toml",
        code: `# Generated by FreeBuffet
# https://github.com/6yte96/freebuffet

[model_providers.groq]
name = "Groq"
base_url = "https://api.groq.com/openai/v1"
env_key = "GROQ_API_KEY"
wire_api = "chat"
requires_openai_auth = false
# Available models:
#   - llama-3.3-70b-versatile
#   - qwen-2.5-coder-32b

[model_providers.ollama-custom]
name = "Ollama"
base_url = "http://localhost:11434/v1"
env_key = "OLLAMA_API_KEY"
wire_api = "chat"
stream_idle_timeout_ms = 120000

# API key exports → ~/.codex/freebuffet.env`,
      },
      {
        id: "claude",
        label: "Claude Code",
        filename: "~/.claude/settings.json",
        code: `{
  "env": {
    "ANTHROPIC_BASE_URL": "https://router.huggingface.co",
    "ANTHROPIC_API_KEY": "\${HF_TOKEN}",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "<first model from health check>",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "<first model from health check>",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "<first model from health check>",
    "CLAUDE_CODE_SUBAGENT_MODEL": "<first model from health check>"
  }
}

// generateClaudeSettingsJson() uses your first healthy provider:
//   baseURL minus trailing /v1 → ANTHROPIC_BASE_URL
//   envKey → \${ENV_VAR} reference — never a literal key
//   health.models[0] → fills all four model slots
//
// Plus ~/.claude/env.sh — ready-to-source exports:
#   export HF_TOKEN='hf_••••••••••••••••••'
#   export ANTHROPIC_BASE_URL="https://router.huggingface.co"`,
      },
    ],
  },
  benchmarks: {
    title: "The Free-Tier Ledger",
    subtitle:
      "Verified quotas from the provider registry — no credit card required for entry (Section V of src/providers.ts)",
    headers: ["Provider", "Free Tier", "Rate Limits", "Credit Card", "Latency Class"],
    rows: [
      {
        name: "Groq",
        isTarget: true,
        metrics: [
          "Permanent free",
          "30 RPM · 14,400 RPD",
          "None",
          "LPU — fastest",
        ],
        highlight: true,
      },
      {
        name: "Cerebras",
        metrics: [
          "Permanent free",
          "1M tokens/day",
          "None",
          "Wafer-scale — 2600 tok/s",
        ],
      },
      {
        name: "Google Gemini",
        metrics: [
          "Permanent free",
          "1,500 RPD (Flash)",
          "None",
          "1B-token context",
        ],
      },
      {
        name: "Mistral AI",
        metrics: [
          "Permanent free",
          "1B tokens/month",
          "None",
          "Codestral included",
        ],
      },
      {
        name: "GitHub Models",
        metrics: [
          "Permanent free",
          "50–150 RPD",
          "GitHub account",
          "GPT-4o · Claude · Gemini",
        ],
      },
      {
        name: "Hugging Face",
        metrics: [
          "Permanent free",
          "100K credits/month",
          "None",
          "100K+ OSS models",
        ],
      },
      {
        name: "Ollama (local)",
        metrics: [
          "Unlimited",
          "Your hardware",
          "None",
          "~3ms · offline",
        ],
      },
    ],
  },
  architecture: {
    title: "The Buffet Line, Mapped",
    subtitle: "Section V · Source Layout & Data Flow — 4,985 lines of TypeScript, zero native deps",
    layers: [
      {
        name: "Layer 0: Provider Registry",
        role: "165 typed entries — id, baseURL, envKey, apiType, freeTier, noCc, permanentFree, tags. Query helpers for search, cost-sort, and tag filtering.",
        spec: "src/providers.ts · 1,691 LOC · CURATED_FAVORITES export",
      },
      {
        name: "Layer 1: Health Check",
        role: "Per-provider probes against /v1/models (OpenAI-compatible) or /v1/messages (Anthropic). Returns status, latencyMs, and the discovered model list.",
        spec: "src/health.ts · AbortSignal timeouts · 401/403 classification",
      },
      {
        name: "Layer 2: Encrypted Key Store",
        role: "API keys sealed with AES-256-GCM under a scrypt key derived from homedir + hostname + platform. The vault is bound to your machine.",
        spec: "src/config.ts · ~/.config/freebuffet/config.enc · 12B IV · 16B GCM tag",
      },
      {
        name: "Layer 3: Config Generators",
        role: "Health-gated generators emit OpenCode auth + config, Codex TOML, Claude settings/env, and experimental Antigravity entries. Existing files get timestamped backups.",
        spec: "src/configs/*.ts · 458 LOC · JSON / TOML / shell emitters",
      },
      {
        name: "Layer 4: Welfare Registry",
        role: "Free-credit relay sites with signup/invite/daily credit math, live status probing, snapshot diffing, and Cloudflare-block graceful merge.",
        spec: "src/welfare.ts · 917 LOC · data/welfare-sites.json · 10 stations",
      },
    ],
  },
  changelog: [
    {
      version: "v0.2.0",
      date: "September 2026",
      title: "Free Credit Relay Registry + Live Status Probing",
      description:
        "Added 10 public-welfare relay stations with first-day credit math (signup + invite + daily check-in), live status probes, and snapshot diffing. Bumped provider registry to 165 entries.",
      tag: "WELFARE",
    },
    {
      version: "v0.1.1",
      date: "June 2026",
      title: "OpenCode-Style Searchable Multiselect",
      description:
        "Rebuilt provider selection as a type-to-filter checklist with a cleaner interactive loop. Dual build outputs (tsc lib + bun bundle) and npm publishing pipeline.",
      tag: "UX",
    },
    {
      version: "v0.1.0",
      date: "June 2026",
      title: "First Service: 114 Providers, Encrypted Keys",
      description:
        "Initial release — multi-provider setup CLI with health checks, AES-256-GCM key persistence, and config generation for OpenCode, Codex, and Claude Code.",
      tag: "INAUGURAL",
    },
  ],
  community: {
    title: "Contribute to the Menu",
    description:
      "Add a provider, improve the health check, or wire up a new agent target. The registry is data-driven — every improvement ships from this repository.",
    contributingText:
      "All development happens publicly on GitHub. Adding a provider is one typed object in src/providers.ts; the health check, config generators, and TUI follow the same pattern. Run bun run dev to try changes locally.",
    dispatches: [
      {
        title: "Publish freebuffet@0.2.0 to the npm registry",
        tag: "RELEASE",
        component: "package.json",
        href: "https://www.npmjs.com/package/freebuffet",
      },
      {
        title: "Per-provider model count display during health check",
        tag: "ROADMAP",
        component: "src/health.ts",
        href: "https://github.com/6yte96/freebuffet/blob/main/src/health.ts",
      },
      {
        title: "Add a \"refresh config\" command to re-fetch models",
        tag: "ROADMAP",
        component: "src/configs/",
        href: "https://github.com/6yte96/freebuffet/tree/main/src/configs",
      },
      {
        title: "More providers as new free/cheap services emerge",
        tag: "ROADMAP",
        component: "src/providers.ts",
        href: "https://github.com/6yte96/freebuffet/blob/main/src/providers.ts",
      },
    ],
  },
  links: {
    github: "https://github.com/6yte96/freebuffet",
    docs: "https://github.com/6yte96/freebuffet#readme",
    npm: "https://www.npmjs.com/package/freebuffet",
  },
};
