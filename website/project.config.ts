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
    repoHref?: string;
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
      tag: string;
      role: string;
    }[];
  };
  community: {
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
    title: "FreeBuffet: All-You-Can-Eat LLM Providers for AI Coding Agents",
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
    tagline: "An all-you-can-eat menu of LLM providers, no email required",
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
      "An interactive terminal CLI that health-checks 165 LLM providers, seals your API keys in an AES-256-GCM vault, and auto-generates working configs for OpenCode, Codex CLI, Claude Code, and Antigravity in one sitting.",
    primaryCta: {
      text: "See a Session",
      href: "#session",
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
    updatedText: "Verified against src/providers.ts, v0.2.0",
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
        "A hand-curated registry with baseURLs, env keys, free-tier quotas, and API types. Groq, Cerebras, Gemini, OpenRouter, Ollama. Every entry searchable by name or id, filterable by tag.",
      repoLinkText: "src/providers.ts",
      repoHref: "https://github.com/6yte96/freebuffet/blob/main/src/providers.ts",
      stamp: { label: "ON THE MENU", value: "165" },
      meta: "cost-sorted, tag-filtered",
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
      repoHref: "https://github.com/6yte96/freebuffet/blob/main/src/health.ts",
      stamp: { label: "SIGNALS", value: "3" },
      meta: "status, latency, model list",
      tilt: "tilt-down",
    },
    {
      id: "key-vault",
      bentoClass: "bento-md",
      category: "SECURITY",
      tech: "SCRYPT / AES-256-GCM",
      title: "Encrypted Key Vault",
      description:
        "API keys are sealed in ~/.config/freebuffet/config.enc with a machine-bound scrypt key. No plaintext, no cloud, no telemetry. Keys never leave your box.",
      repoLinkText: "src/config.ts",
      repoHref: "https://github.com/6yte96/freebuffet/blob/main/src/config.ts",
      stamp: { label: "KEY LENGTH", value: "256-BIT" },
      meta: "12-byte IV, 16-byte GCM tag",
      tilt: "tilt-up",
    },
    {
      id: "agent-configs",
      bentoClass: "bento-wide",
      category: "AGENTS",
      tech: "JSON / TOML / SHELL",
      title: "Four Agent Targets, One Run",
      description:
        "Generates opencode.json, ~/.codex/config.toml, and ~/.claude/settings.json, plus experimental Antigravity support, from a single provider selection. Existing files are backed up, never clobbered.",
      repoLinkText: "src/configs/",
      repoHref: "https://github.com/6yte96/freebuffet/tree/main/src/configs",
      stamp: { label: "AGENT TARGETS", value: "4" },
      meta: "health-gated, backup-first",
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
      repoLinkText: "README § Local & Self-Hosted",
      repoHref: "https://github.com/6yte96/freebuffet#local--self-hosted-18",
      stamp: { label: "PRICE", value: "$0" },
      meta: "no env key required",
      tilt: "tilt-up",
    },
    {
      id: "welfare-relays",
      bentoClass: "bento-lg",
      category: "WELFARE",
      tech: "10 SITES / LIVE PROBES",
      title: "Free Credit Relay Registry",
      description:
        "A registry of public-welfare relay stations handing out free Claude and GPT credits. Think $50 to $100 signup bonuses, daily check-ins, and invite stacking. FreeBuffet probes their live status and calculates your first-day total.",
      repoLinkText: "data/welfare-sites.json",
      repoHref: "https://github.com/6yte96/freebuffet/blob/main/data/welfare-sites.json",
      stamp: { label: "RELAY STATIONS", value: "10" },
      meta: "signup + invite + daily math",
      tilt: "tilt-down",
    },
    {
      id: "curated-favorites",
      bentoClass: "bento-md",
      category: "REGISTRY",
      tech: "TAGGED / RANKED",
      title: "25 Curated Free-Coding Favorites",
      description:
        "The editor's picks with capability tags for coding, reasoning, vision, fast, free, and no-cc, so you pick a provider in seconds instead of settings tabs.",
      repoLinkText: "CURATED_FAVORITES",
      repoHref: "https://github.com/6yte96/freebuffet/blob/main/src/providers.ts",
      stamp: { label: "OF 165 PICKED", value: "25" },
      meta: "coding, reasoning, vision, free, fast, no-cc",
      tilt: "tilt-up",
    },
    {
      id: "tui",
      bentoClass: "bento-wide",
      category: "UX",
      tech: "@CLACK / PICOOLORS",
      title: "Searchable Terminal TUI",
      description:
        "Type-to-filter provider checklist, live health-check spinners, config preview before write. Runs on Node 18+ and Bun with one runtime dep (picocolors) and zero native modules.",
      repoLinkText: "src/index.ts",
      repoHref: "https://github.com/6yte96/freebuffet/blob/main/src/index.ts",
      stamp: { label: "RUNTIME DEPS", value: "1" },
      meta: "node 18+, bun 1.0+",
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
        filename: "terminal, npx freebuffet",
        code: `$ npx freebuffet

  ┌  FreeBuffet v0.2.0, 165 providers on the menu
  │
  ├  Step 1   Select providers
  │    │  ▸ ◯ Groq          free, 30 RPM, no CC
  │    │    ◯ Cerebras      free, 1M tok/day, no CC
  │    │    ◯ Google Gemini free, 1,500 RPD, no CC
  │    │    ◯ Ollama        local, $0, no key
  │    │  ▸ type to filter 165 entries…
  │    ▼
  ├  Step 2   Enter API keys
  │    │    GROQ_API_KEY = gsk_•••••••••••••••
  │    │    CEREBRAS_API_KEY = csk-••••••••••••
  │    │    (local engines auto-skipped)
  │    ▼
  ├  Step 3   Health check
  │    │    ✓ groq        ok, 214ms, 18 models
  │    │    ✓ cerebras    ok, 359ms, 11 models
  │    │    ✓ gemini      ok, 487ms, 42 models
  │    │    ✓ ollama      ok, 3ms, 4 models
  │    ▼
  ├  Step 4   Select target agents
  │    │    ✓ OpenCode  ✓ Codex CLI
  │    │    ✓ Claude Code  ◯ Antigravity
  │    ▼
  └  Step 5   Configs generated
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
//   baseURL minus trailing /v1 goes into ANTHROPIC_BASE_URL
//   envKey becomes a \${ENV_VAR} reference, never a literal key
//   health.models[0] fills all four model slots
//
// Plus ~/.claude/env.sh with ready-to-source exports:
#   export HF_TOKEN='hf_••••••••••••••••••'
#   export ANTHROPIC_BASE_URL="https://router.huggingface.co"`,
      },
    ],
  },
  benchmarks: {
    title: "The Free-Tier Ledger",
    subtitle:
      "Quotas transcribed from the freeTier field of src/providers.ts. No credit card needed for any of these.",
    headers: ["Provider", "Free Tier", "Rate Limits", "Credit Card", "Notes"],
    rows: [
      {
        name: "Groq",
        isTarget: true,
        metrics: [
          "Permanent free",
          "30 RPM, 14,400 RPD",
          "None",
          "LPU, fastest",
        ],
        highlight: true,
      },
      {
        name: "Cerebras",
        metrics: [
          "Permanent free",
          "1M tokens/day",
          "None",
          "2600 tok/s",
        ],
      },
      {
        name: "Google Gemini",
        metrics: [
          "Permanent free",
          "1,500 RPD (Flash)",
          "None",
          "1M-token context",
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
          "50 to 150 RPD",
          "GitHub account",
          "GPT-4o, Claude, Gemini",
        ],
      },
      {
        name: "Hugging Face",
        metrics: [
          "Permanent free",
          "100K credits/month",
          "None",
          "100K+ open models",
        ],
      },
      {
        name: "Ollama (local)",
        metrics: [
          "Unlimited",
          "Your hardware",
          "None",
          "about 3ms, offline",
        ],
      },
    ],
  },
  architecture: {
    title: "Under the Hood",
    subtitle:
      "Where the code lives. About 5,000 lines of TypeScript, no native deps, and a clear pattern for adding providers.",
    layers: [
      {
        name: "Provider Registry",
        tag: "LAYER 0",
        role: "165 typed entries in src/providers.ts, each with an id, baseURL, env key, API type, free tier, and tags. Query helpers handle search, cost sorting, and tag filtering.",
      },
      {
        name: "Health Check",
        tag: "LAYER 1",
        role: "src/health.ts probes each provider at /v1/models or /v1/messages and returns the status, the latency in milliseconds, and the list of models it found. Bad keys are separated from bad providers.",
      },
      {
        name: "Encrypted Key Store",
        tag: "LAYER 2",
        role: "src/config.ts seals your keys with AES-256-GCM under a scrypt key derived from your home directory, hostname, and platform. The vault at ~/.config/freebuffet/config.enc only opens on the machine that wrote it.",
      },
      {
        name: "Config Generators",
        tag: "LAYER 3",
        role: "src/configs/ turns healthy providers into real files: opencode.json and auth.json for OpenCode, config.toml for Codex, settings.json and env.sh for Claude Code, plus experimental Antigravity entries. Anything that exists already gets a timestamped backup first.",
      },
      {
        name: "Welfare Registry",
        tag: "LAYER 4",
        role: "src/welfare.ts tracks ten free-credit relay stations from data/welfare-sites.json. It adds up signup, invite, and daily check-in credits into a first-day total, probes live status, and merges snapshots when a site is behind Cloudflare.",
      },
    ],
  },
  community: {
    contributingText:
      "All development happens publicly on GitHub. Adding a provider is one typed object in src/providers.ts, and the health check, config generators, and TUI all follow the same pattern. Run bun run dev to try your changes locally.",
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
