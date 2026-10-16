"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PROJECT_CONFIG } from "@/config";

export type NodeCategory =
  | "vault"
  | "fast"
  | "frontier"
  | "free"
  | "local"
  | "agent";

export interface GlobeNodeDef {
  id: string;
  name: string;
  badge: string;
  glyph: string;
  category: NodeCategory;
  isHub: boolean;
  radius: number;
  lat: number;
  lng: number;
  latencyMs: number;
  freeTier: string;
  topModel: string;
  endpoint: string;
  envKey: string;
  description: string;
  log: string;
  configs: {
    opencode: string;
    codex: string;
    claude: string;
    antigravity: string;
  };
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  type: "keys" | "probes" | "routes" | "exports" | "syncs";
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedNode {
  def: GlobeNodeDef;
  unit: Vec3;
  rot: Vec3;
  sx: number;
  sy: number;
  zNorm: number;
  drawRadius: number;
  alpha: number;
  scale: number;
}

export type TargetAgent = "opencode" | "codex" | "claude" | "antigravity";

const AGENT_CONFIG_TABS: { id: TargetAgent; label: string; file: string }[] = [
  { id: "opencode", label: "OpenCode", file: "opencode.json" },
  { id: "codex", label: "Codex CLI", file: "config.toml" },
  { id: "claude", label: "Claude Code", file: "settings.json" },
  { id: "antigravity", label: "Antigravity", file: "config.toml" },
];

const RAW_NODES: GlobeNodeDef[] = [
  // Center Vault
  {
    id: "vault",
    name: "FreeBuffet Vault",
    badge: "Core Keystore",
    glyph: "◈",
    category: "vault",
    isHub: true,
    radius: 16,
    lat: 10,
    lng: 0,
    latencyMs: 1,
    freeTier: "Local AES-256-GCM Vault",
    topModel: "165 Providers Cataloged",
    endpoint: "~/.config/freebuffet/config.enc",
    envKey: "SCENE_KEY (scrypt)",
    description: "Encrypted local keystore bound to machine. Stores 165+ LLM provider credentials with zero cloud telemetry.",
    log: "FreeBuffet AES-256-GCM vault unlocked · 165 providers ready for instant health checks",
    configs: {
      opencode: `"provider": { "freebuffet": { "npm": "@ai-sdk/openai-compatible" } }`,
      codex: `[model_providers.freebuffet]\nname = "FreeBuffet Vault"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:11434/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "freebuffet"\nbase_url = "http://localhost:11434/v1"`,
    },
  },

  // Cluster 1: Fast Cloud (Groq, Cerebras, SambaNova, Together, DeepInfra)
  {
    id: "groq",
    name: "Groq LPU",
    badge: "Fast Cloud",
    glyph: "⚡",
    category: "fast",
    isHub: true,
    radius: 13,
    lat: 28,
    lng: -28,
    latencyMs: 42,
    freeTier: "30 RPM, 14,400 RPD",
    topModel: "llama-3.3-70b-versatile",
    endpoint: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    description: "LPU Inference Engine delivering 300+ tokens/sec on Llama 3.3. Free tier with generous daily allowances.",
    log: "Groq health probe 200 OK · 42ms latency · 18 models discovered",
    configs: {
      opencode: `"provider": {\n  "groq": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "Groq",\n    "options": {\n      "baseURL": "https://api.groq.com/openai/v1"\n    }\n  }\n}`,
      codex: `[model_providers.groq]\nname = "Groq"\nbase_url = "https://api.groq.com/openai/v1"\nwire_specification = "openai"\nenv_key = "GROQ_API_KEY"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.groq.com/openai/v1",\n    "ANTHROPIC_API_KEY": "\${GROQ_API_KEY}"\n  }\n}`,
      antigravity: `[[providers]]\nname = "groq"\nbase_url = "https://api.groq.com/openai/v1"\nmodel = "llama-3.3-70b-versatile"`,
    },
  },
  {
    id: "cerebras",
    name: "Cerebras CS-3",
    badge: "Fast Cloud",
    glyph: "⚡",
    category: "fast",
    isHub: false,
    radius: 11,
    lat: 44,
    lng: -12,
    latencyMs: 24,
    freeTier: "1,000,000 tokens/day",
    topModel: "llama-3.3-70b",
    endpoint: "https://api.cerebras.ai/v1",
    envKey: "CEREBRAS_API_KEY",
    description: "Wafer-scale engine with world-record latency (24ms ping, 1800+ tok/s). 1M tokens free every day.",
    log: "Cerebras CS-3 health probe 200 OK · 24ms latency · 1M daily tokens free",
    configs: {
      opencode: `"provider": {\n  "cerebras": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "Cerebras",\n    "options": {\n      "baseURL": "https://api.cerebras.ai/v1"\n    }\n  }\n}`,
      codex: `[model_providers.cerebras]\nname = "Cerebras"\nbase_url = "https://api.cerebras.ai/v1"\nwire_specification = "openai"\nenv_key = "CEREBRAS_API_KEY"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.cerebras.ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "cerebras"\nbase_url = "https://api.cerebras.ai/v1"\nmodel = "llama-3.3-70b"`,
    },
  },
  {
    id: "sambanova",
    name: "SambaNova",
    badge: "Fast Cloud",
    glyph: "⚡",
    category: "fast",
    isHub: false,
    radius: 9,
    lat: 22,
    lng: -52,
    latencyMs: 35,
    freeTier: "10 RPM, DeepSeek V3",
    topModel: "DeepSeek-V3",
    endpoint: "https://api.sambanova.ai/v1",
    envKey: "SAMBANOVA_API_KEY",
    description: "Reconfigurable Dataflow Unit running DeepSeek V3 and Llama 3.1 405B at wire speeds for free.",
    log: "SambaNova SN40L health probe 200 OK · 35ms latency · DeepSeek-V3 served",
    configs: {
      opencode: `"provider": {\n  "sambanova": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "SambaNova",\n    "options": {\n      "baseURL": "https://api.sambanova.ai/v1"\n    }\n  }\n}`,
      codex: `[model_providers.sambanova]\nname = "SambaNova"\nbase_url = "https://api.sambanova.ai/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.sambanova.ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "sambanova"\nbase_url = "https://api.sambanova.ai/v1"\nmodel = "DeepSeek-V3"`,
    },
  },
  {
    id: "together",
    name: "Together AI",
    badge: "Fast Cloud",
    glyph: "⚡",
    category: "fast",
    isHub: false,
    radius: 8,
    lat: 40,
    lng: -44,
    latencyMs: 68,
    freeTier: "$5.00 Free Trial Credit",
    topModel: "Qwen/Qwen2.5-Coder-32B",
    endpoint: "https://api.together.xyz/v1",
    envKey: "TOGETHER_API_KEY",
    description: "High performance cloud cluster with full catalog of open coding models and spec decoding.",
    log: "Together AI health probe 200 OK · 68ms latency · 85 models accessible",
    configs: {
      opencode: `"provider": {\n  "together": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api.together.xyz/v1" }\n  }\n}`,
      codex: `[model_providers.together]\nname = "Together AI"\nbase_url = "https://api.together.xyz/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.together.xyz/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "together"\nbase_url = "https://api.together.xyz/v1"\nmodel = "Qwen/Qwen2.5-Coder-32B"`,
    },
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    badge: "Fast Cloud",
    glyph: "⚡",
    category: "fast",
    isHub: false,
    radius: 8,
    lat: 12,
    lng: -60,
    latencyMs: 52,
    freeTier: "$1.80 Free Onboard Credit",
    topModel: "Qwen/Qwen2.5-72B-Instruct",
    endpoint: "https://api.deepinfra.com/v1/openai",
    envKey: "DEEPINFRA_TOKEN",
    description: "Serverless pay-per-token inference with ultra-low cold start times and native OpenAI compatibility.",
    log: "DeepInfra health probe 200 OK · 52ms latency · Serverless endpoints verified",
    configs: {
      opencode: `"provider": {\n  "deepinfra": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api.deepinfra.com/v1/openai" }\n  }\n}`,
      codex: `[model_providers.deepinfra]\nname = "DeepInfra"\nbase_url = "https://api.deepinfra.com/v1/openai"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.deepinfra.com/v1/openai"\n  }\n}`,
      antigravity: `[[providers]]\nname = "deepinfra"\nbase_url = "https://api.deepinfra.com/v1/openai"`,
    },
  },

  // Cluster 2: Frontier Labs (Gemini, Claude, OpenAI, DeepSeek, Mistral)
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Frontier",
    glyph: "✧",
    category: "frontier",
    isHub: true,
    radius: 14,
    lat: -14,
    lng: -26,
    latencyMs: 86,
    freeTier: "1,500 RPD (Flash)",
    topModel: "gemini-2.0-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    envKey: "GEMINI_API_KEY",
    description: "Google DeepMind's flagship multimodality and 1M token context. 1,500 daily requests completely free.",
    log: "Gemini 2.0 Flash health probe 200 OK · 86ms latency · 1,500 RPD free tier active",
    configs: {
      opencode: `"provider": {\n  "google": {\n    "npm": "@ai-sdk/google",\n    "name": "Google Gemini"\n  }\n}`,
      codex: `[model_providers.gemini]\nname = "Google Gemini"\nbase_url = "https://generativelanguage.googleapis.com/v1beta/openai"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com/v1beta/openai"\n  }\n}`,
      antigravity: `[[providers]]\nname = "gemini"\nbase_url = "https://generativelanguage.googleapis.com/v1beta/openai"\nmodel = "gemini-2.0-flash"`,
    },
  },
  {
    id: "deepseek",
    name: "DeepSeek Official",
    badge: "Frontier",
    glyph: "✧",
    category: "frontier",
    isHub: false,
    radius: 11,
    lat: -34,
    lng: -14,
    latencyMs: 64,
    freeTier: "5M tokens trial credit",
    topModel: "deepseek-coder",
    endpoint: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    description: "State-of-the-art open weights coding and reasoning architecture with native OpenAI API drop-in.",
    log: "DeepSeek V3 / R1 health probe 200 OK · 64ms latency · Speculative decoding enabled",
    configs: {
      opencode: `"provider": {\n  "deepseek": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api.deepseek.com/v1" }\n  }\n}`,
      codex: `[model_providers.deepseek]\nname = "DeepSeek"\nbase_url = "https://api.deepseek.com/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "deepseek"\nbase_url = "https://api.deepseek.com/v1"\nmodel = "deepseek-coder"`,
    },
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    badge: "Frontier",
    glyph: "✧",
    category: "frontier",
    isHub: false,
    radius: 11,
    lat: -28,
    lng: -48,
    latencyMs: 112,
    freeTier: "Console Free Credits",
    topModel: "claude-3-5-sonnet",
    endpoint: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    description: "Industry benchmark for software engineering, tool use, and complex refactor planning.",
    log: "Claude 3.5 Sonnet health probe 200 OK · 112ms latency · Native tool protocol verified",
    configs: {
      opencode: `"provider": {\n  "anthropic": {\n    "npm": "@ai-sdk/anthropic"\n  }\n}`,
      codex: `[model_providers.anthropic]\nname = "Anthropic"\nbase_url = "https://api.anthropic.com/v1"\nwire_specification = "anthropic"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_API_KEY": "\${ANTHROPIC_API_KEY}"\n  }\n}`,
      antigravity: `[[providers]]\nname = "anthropic"\nbase_url = "https://api.anthropic.com/v1"\nmodel = "claude-3-5-sonnet-20241022"`,
    },
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    badge: "Frontier",
    glyph: "✧",
    category: "frontier",
    isHub: false,
    radius: 10,
    lat: -46,
    lng: -32,
    latencyMs: 94,
    freeTier: "$5 Platform Trial",
    topModel: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    description: "Original OpenAI specification and GPT-4o-mini lightweight high-speed agent backend.",
    log: "OpenAI GPT-4o health probe 200 OK · 94ms latency · Standard wire format intact",
    configs: {
      opencode: `"provider": {\n  "openai": {\n    "npm": "@ai-sdk/openai"\n  }\n}`,
      codex: `[model_providers.openai]\nname = "OpenAI"\nbase_url = "https://api.openai.com/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.openai.com/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "openai"\nbase_url = "https://api.openai.com/v1"\nmodel = "gpt-4o-mini"`,
    },
  },
  {
    id: "mistral",
    name: "Mistral Codestral",
    badge: "Frontier",
    glyph: "✧",
    category: "frontier",
    isHub: false,
    radius: 9,
    lat: -8,
    lng: -54,
    latencyMs: 70,
    freeTier: "La Plateforme Free Tier",
    topModel: "codestral-latest",
    endpoint: "https://api.mistral.ai/v1",
    envKey: "MISTRAL_API_KEY",
    description: "Specialized 80+ language coding model with 256k fill-in-the-middle context and FIM support.",
    log: "Mistral Codestral health probe 200 OK · 70ms latency · FIM completion ready",
    configs: {
      opencode: `"provider": {\n  "mistral": {\n    "npm": "@ai-sdk/mistral"\n  }\n}`,
      codex: `[model_providers.mistral]\nname = "Mistral"\nbase_url = "https://api.mistral.ai/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.mistral.ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "mistral"\nbase_url = "https://api.mistral.ai/v1"\nmodel = "codestral-latest"`,
    },
  },

  // Cluster 3: Always Free / No Credit Card (OpenRouter, GitHub Models, Cloudflare, ModelScope, HuggingFace)
  {
    id: "openrouter",
    name: "OpenRouter Free",
    badge: "No Credit Card",
    glyph: "◎",
    category: "free",
    isHub: true,
    radius: 14,
    lat: 18,
    lng: 42,
    latencyMs: 78,
    freeTier: "20+ Permanent Free Models (:free)",
    topModel: "deepseek/deepseek-r1:free",
    endpoint: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    description: "Universal router exposing 20+ models flagged with :free tag, including DeepSeek R1 and Llama 3.3.",
    log: "OpenRouter :free health probe 200 OK · 78ms latency · 24 free endpoints live",
    configs: {
      opencode: `"provider": {\n  "openrouter": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "OpenRouter",\n    "options": {\n      "baseURL": "https://openrouter.ai/api/v1"\n    }\n  }\n}`,
      codex: `[model_providers.openrouter]\nname = "OpenRouter"\nbase_url = "https://openrouter.ai/api/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "openrouter"\nbase_url = "https://openrouter.ai/api/v1"\nmodel = "deepseek/deepseek-r1:free"`,
    },
  },
  {
    id: "github",
    name: "GitHub Models",
    badge: "No Credit Card",
    glyph: "◎",
    category: "free",
    isHub: false,
    radius: 11,
    lat: 34,
    lng: 26,
    latencyMs: 55,
    freeTier: "Free for all GitHub Accounts",
    topModel: "gpt-4o / llama-3.3-70b",
    endpoint: "https://models.inference.ai.azure.com",
    envKey: "GITHUB_TOKEN",
    description: "Free developer inference for any GitHub user. Authenticates with your standard GitHub personal access token.",
    log: "GitHub Models health probe 200 OK · 55ms latency · Verified with GITHUB_TOKEN",
    configs: {
      opencode: `"provider": {\n  "github": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://models.inference.ai.azure.com" }\n  }\n}`,
      codex: `[model_providers.github]\nname = "GitHub Models"\nbase_url = "https://models.inference.ai.azure.com"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://models.inference.ai.azure.com"\n  }\n}`,
      antigravity: `[[providers]]\nname = "github"\nbase_url = "https://models.inference.ai.azure.com"\nmodel = "gpt-4o"`,
    },
  },
  {
    id: "cloudflare",
    name: "Cloudflare AI",
    badge: "No Credit Card",
    glyph: "◎",
    category: "free",
    isHub: false,
    radius: 10,
    lat: 38,
    lng: 58,
    latencyMs: 48,
    freeTier: "10,000 neurons/day free",
    topModel: "@cf/meta/llama-3.1-8b-instruct",
    endpoint: "https://api.cloudflare.com/client/v4/accounts/{account}/ai/v1",
    envKey: "CLOUDFLARE_API_TOKEN",
    description: "Edge serverless inference distributed across Cloudflare's 330+ data centers. Generous daily free neurons.",
    log: "Cloudflare Workers AI health probe 200 OK · 48ms latency · Edge routing optimal",
    configs: {
      opencode: `"provider": {\n  "cloudflare": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1" }\n  }\n}`,
      codex: `[model_providers.cloudflare]\nname = "Cloudflare AI"\nbase_url = "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "cloudflare"\nbase_url = "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1"`,
    },
  },
  {
    id: "modelscope",
    name: "ModelScope",
    badge: "No Credit Card",
    glyph: "◎",
    category: "free",
    isHub: false,
    radius: 9,
    lat: 8,
    lng: 66,
    latencyMs: 82,
    freeTier: "Public Models (No Auth Needed)",
    topModel: "Qwen/Qwen2.5-Coder-7B-Instruct",
    endpoint: "https://api-inference.modelscope.cn/v1",
    envKey: "OPTIONAL_KEY",
    description: "Open community model hub returning public models without requiring authentication headers.",
    log: "ModelScope health probe 200 OK · 82ms latency · Zero-auth public catalog accessible",
    configs: {
      opencode: `"provider": {\n  "modelscope": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api-inference.modelscope.cn/v1" }\n  }\n}`,
      codex: `[model_providers.modelscope]\nname = "ModelScope"\nbase_url = "https://api-inference.modelscope.cn/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api-inference.modelscope.cn/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "modelscope"\nbase_url = "https://api-inference.modelscope.cn/v1"`,
    },
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    badge: "No Credit Card",
    glyph: "◎",
    category: "free",
    isHub: false,
    radius: 9,
    lat: 20,
    lng: 82,
    latencyMs: 92,
    freeTier: "Serverless Inference API",
    topModel: "meta-llama/Llama-3.2-3B-Instruct",
    endpoint: "https://api-inference.huggingface.co/v1",
    envKey: "HF_TOKEN",
    description: "Over 100,000 community models runnable via serverless inference API with free user accounts.",
    log: "HuggingFace Serverless probe 200 OK · 92ms latency · Free inference tier confirmed",
    configs: {
      opencode: `"provider": {\n  "huggingface": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api-inference.huggingface.co/v1" }\n  }\n}`,
      codex: `[model_providers.huggingface]\nname = "Hugging Face"\nbase_url = "https://api-inference.huggingface.co/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api-inference.huggingface.co/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "huggingface"\nbase_url = "https://api-inference.huggingface.co/v1"`,
    },
  },

  // Cluster 4: Local $0 Engines (Ollama, LM Studio, vLLM, llama.cpp)
  {
    id: "ollama",
    name: "Ollama Local",
    badge: "Local $0",
    glyph: "⌂",
    category: "local",
    isHub: true,
    radius: 14,
    lat: -16,
    lng: 36,
    latencyMs: 6,
    freeTier: "100% Free (0 Cost, No Keys)",
    topModel: "qwen2.5-coder:14b",
    endpoint: "http://localhost:11434/v1",
    envKey: "NONE",
    description: "Local daemon running GGUF models directly on CPU / GPU / Apple Silicon. Zero network calls, 100% private.",
    log: "Ollama local socket 200 OK · 6ms response · 8 local models loaded in VRAM",
    configs: {
      opencode: `"provider": {\n  "ollama": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "Ollama Local",\n    "options": {\n      "baseURL": "http://localhost:11434/v1"\n    }\n  }\n}`,
      codex: `[model_providers.ollama]\nname = "Ollama Local"\nbase_url = "http://localhost:11434/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:11434/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "ollama"\nbase_url = "http://localhost:11434/v1"\nmodel = "qwen2.5-coder:14b"`,
    },
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    badge: "Local $0",
    glyph: "⌂",
    category: "local",
    isHub: false,
    radius: 10,
    lat: -34,
    lng: 24,
    latencyMs: 8,
    freeTier: "100% Free Desktop App",
    topModel: "deepseek-r1-distill-qwen-14b",
    endpoint: "http://localhost:1234/v1",
    envKey: "NONE",
    description: "Native GUI app running HuggingFace GGUF models with built-in OpenAI compatible local server.",
    log: "LM Studio local daemon 200 OK · 8ms response · OpenAI format listening on :1234",
    configs: {
      opencode: `"provider": {\n  "lmstudio": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "http://localhost:1234/v1" }\n  }\n}`,
      codex: `[model_providers.lmstudio]\nname = "LM Studio"\nbase_url = "http://localhost:1234/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:1234/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "lmstudio"\nbase_url = "http://localhost:1234/v1"`,
    },
  },
  {
    id: "vllm",
    name: "vLLM Engine",
    badge: "Local $0",
    glyph: "⌂",
    category: "local",
    isHub: false,
    radius: 9,
    lat: -32,
    lng: 54,
    latencyMs: 5,
    freeTier: "Open Source PagedAttention",
    topModel: "mistralai/Mistral-7B-Instruct",
    endpoint: "http://localhost:8000/v1",
    envKey: "NONE",
    description: "High-throughput serving engine with PagedAttention and continuous batching for self-hosted GPUs.",
    log: "vLLM server 200 OK · 5ms latency · PagedAttention batching active",
    configs: {
      opencode: `"provider": {\n  "vllm": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "http://localhost:8000/v1" }\n  }\n}`,
      codex: `[model_providers.vllm]\nname = "vLLM"\nbase_url = "http://localhost:8000/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:8000/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "vllm"\nbase_url = "http://localhost:8000/v1"`,
    },
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    badge: "Local $0",
    glyph: "⌂",
    category: "local",
    isHub: false,
    radius: 8,
    lat: -12,
    lng: 72,
    latencyMs: 10,
    freeTier: "Pure C/C++ Inference",
    topModel: "llama-3.2-3b-gguf",
    endpoint: "http://localhost:8080/v1",
    envKey: "NONE",
    description: "Ultra-portable C/C++ inference engine with zero external dependencies and Metal/CUDA acceleration.",
    log: "llama.cpp server 200 OK · 10ms latency · GGUF inference ready",
    configs: {
      opencode: `"provider": {\n  "llamacpp": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "http://localhost:8080/v1" }\n  }\n}`,
      codex: `[model_providers.llamacpp]\nname = "llama.cpp"\nbase_url = "http://localhost:8080/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:8080/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "llamacpp"\nbase_url = "http://localhost:8080/v1"`,
    },
  },

  // Cluster 5: Target Agent Satellites (OpenCode, Codex, Claude Code, Antigravity, Zed, Hermes, Pi)
  {
    id: "agent_opencode",
    name: "OpenCode CLI",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: true,
    radius: 12,
    lat: 56,
    lng: -110,
    latencyMs: 2,
    freeTier: "opencode.json Auto-Sync",
    topModel: "@ai-sdk/openai-compatible",
    endpoint: "~/.config/opencode/opencode.json",
    envKey: "auth.json",
    description: "Autonomous CLI agent using Vercel AI SDK provider adapters. Generates opencode.json in one command.",
    log: "FreeBuffet generated opencode.json provider entries with verified models",
    configs: {
      opencode: `"provider": {\n  "freebuffet": {\n    "npm": "@ai-sdk/openai-compatible"\n  }\n}`,
      codex: `[model_providers.opencode]\nname = "OpenCode Bridge"`,
      claude: `{\n  "env": { "AGENT": "opencode" }\n}`,
      antigravity: `[[providers]]\nname = "opencode"`,
    },
  },
  {
    id: "agent_codex",
    name: "Codex CLI",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: true,
    radius: 12,
    lat: 38,
    lng: -136,
    latencyMs: 2,
    freeTier: "config.toml Auto-Sync",
    topModel: "model_providers tables",
    endpoint: "~/.codex/config.toml",
    envKey: "CONFIG_FILE",
    description: "Terminal coding assistant. FreeBuffet writes model_providers TOML blocks with verified endpoint URLs.",
    log: "FreeBuffet synced TOML provider blocks to ~/.codex/config.toml",
    configs: {
      opencode: `// Codex config target`,
      codex: `[model_providers.active]\nwire_specification = "openai"\nbase_url = "https://api.groq.com/openai/v1"`,
      claude: `{\n  "env": { "AGENT": "codex" }\n}`,
      antigravity: `[[providers]]\nname = "codex"`,
    },
  },
  {
    id: "agent_claude",
    name: "Claude Code",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: true,
    radius: 12,
    lat: 14,
    lng: -124,
    latencyMs: 2,
    freeTier: "settings.json + ENV",
    topModel: "ANTHROPIC_BASE_URL",
    endpoint: "~/.claude/settings.json",
    envKey: "ANTHROPIC_API_KEY",
    description: "Anthropic's terminal agent. FreeBuffet redirects ANTHROPIC_BASE_URL to any free or local provider.",
    log: "FreeBuffet injected ANTHROPIC_BASE_URL into ~/.claude/settings.json",
    configs: {
      opencode: `// Claude Code target`,
      codex: `// Claude Code target`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.cerebras.ai/v1",\n    "ANTHROPIC_API_KEY": "\${CEREBRAS_API_KEY}"\n  }\n}`,
      antigravity: `[[providers]]\nname = "claude_code"`,
    },
  },
  {
    id: "agent_antigravity",
    name: "Antigravity CLI",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: true,
    radius: 12,
    lat: -12,
    lng: -138,
    latencyMs: 2,
    freeTier: "config.toml Providers",
    topModel: "Multi-Provider Array",
    endpoint: "~/.config/antigravity/config.toml",
    envKey: "CONFIG_FILE",
    description: "DeepMind advanced agentic CLI with multi-provider routing and specialized subagent trees.",
    log: "FreeBuffet synced provider configurations to ~/.config/antigravity/config.toml",
    configs: {
      opencode: `// Antigravity target`,
      codex: `// Antigravity target`,
      claude: `// Antigravity target`,
      antigravity: `[[providers]]\nname = "groq"\nbase_url = "https://api.groq.com/openai/v1"\nmodel = "llama-3.3-70b-versatile"`,
    },
  },
  {
    id: "agent_zed",
    name: "Zed CLI (zed2cli)",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: false,
    radius: 9,
    lat: -34,
    lng: -118,
    latencyMs: 3,
    freeTier: "~/.zed_jwt_token Validated",
    topModel: "Zed AI Stream Events",
    endpoint: "~/.zed_jwt_token",
    envKey: "JWT_TOKEN",
    description: "Scans Zed editor tokens and parses token usage streams via agent-stats CLI.",
    log: "agent-stats detected valid Zed editor token at ~/.zed_jwt_token",
    configs: {
      opencode: `// Zed token bridge`,
      codex: `// Zed token bridge`,
      claude: `// Zed token bridge`,
      antigravity: `// Zed token bridge`,
    },
  },
  {
    id: "agent_hermes",
    name: "Hermes Agent",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: false,
    radius: 8,
    lat: -52,
    lng: -140,
    latencyMs: 2,
    freeTier: "config.yaml Auto-Sync",
    topModel: "Nous Hermes 3",
    endpoint: "~/.hermes/config.yaml",
    envKey: "CONFIG_FILE",
    description: "Self-improving autonomous coding agent configured with local or free model endpoints.",
    log: "Hermes agent configuration parsed and verified",
    configs: {
      opencode: `// Hermes agent target`,
      codex: `// Hermes agent target`,
      claude: `// Hermes agent target`,
      antigravity: `// Hermes agent target`,
    },
  },
  {
    id: "agent_pi",
    name: "Pi Agent",
    badge: "Agent Target",
    glyph: "◈",
    category: "agent",
    isHub: false,
    radius: 8,
    lat: 52,
    lng: -148,
    latencyMs: 2,
    freeTier: "history.jsonl Usage Logs",
    topModel: "Lightweight Runner",
    endpoint: "~/.pi/logs",
    envKey: "LOCAL",
    description: "Minimalist coding companion with streak tracking and prompt token telemetry.",
    log: "Pi usage logs scanned: 12-day streak recorded",
    configs: {
      opencode: `// Pi agent target`,
      codex: `// Pi agent target`,
      claude: `// Pi agent target`,
      antigravity: `// Pi agent target`,
    },
  },
];

const RAW_EDGES: GraphEdge[] = [
  // Vault to Fast Cloud
  { from: "vault", to: "groq", label: "probes", type: "probes" },
  { from: "vault", to: "cerebras", label: "probes", type: "probes" },
  { from: "vault", to: "sambanova", label: "probes", type: "probes" },
  { from: "groq", to: "cerebras", label: "routes", type: "routes" },
  { from: "groq", to: "together", label: "routes", type: "routes" },
  { from: "cerebras", to: "deepinfra", label: "routes", type: "routes" },

  // Vault to Frontier
  { from: "vault", to: "gemini", label: "probes", type: "probes" },
  { from: "vault", to: "deepseek", label: "probes", type: "probes" },
  { from: "gemini", to: "claude", label: "routes", type: "routes" },
  { from: "gemini", to: "openai", label: "routes", type: "routes" },
  { from: "deepseek", to: "mistral", label: "routes", type: "routes" },

  // Vault to Always Free
  { from: "vault", to: "openrouter", label: "probes", type: "probes" },
  { from: "openrouter", to: "github", label: "routes", type: "routes" },
  { from: "openrouter", to: "cloudflare", label: "routes", type: "routes" },
  { from: "openrouter", to: "modelscope", label: "routes", type: "routes" },
  { from: "github", to: "huggingface", label: "routes", type: "routes" },

  // Vault to Local $0
  { from: "vault", to: "ollama", label: "keys", type: "keys" },
  { from: "ollama", to: "lmstudio", label: "syncs", type: "syncs" },
  { from: "ollama", to: "vllm", label: "syncs", type: "syncs" },
  { from: "ollama", to: "llamacpp", label: "syncs", type: "syncs" },

  // Provider to Agent Satellites
  { from: "vault", to: "agent_opencode", label: "exports", type: "exports" },
  { from: "vault", to: "agent_codex", label: "exports", type: "exports" },
  { from: "vault", to: "agent_claude", label: "exports", type: "exports" },
  { from: "vault", to: "agent_antigravity", label: "exports", type: "exports" },
  { from: "groq", to: "agent_opencode", label: "syncs", type: "syncs" },
  { from: "cerebras", to: "agent_codex", label: "syncs", type: "syncs" },
  { from: "gemini", to: "agent_claude", label: "syncs", type: "syncs" },
  { from: "openrouter", to: "agent_antigravity", label: "syncs", type: "syncs" },
  { from: "ollama", to: "agent_opencode", label: "syncs", type: "syncs" },
  { from: "agent_antigravity", to: "agent_zed", label: "syncs", type: "syncs" },
  { from: "agent_codex", to: "agent_hermes", label: "syncs", type: "syncs" },
  { from: "agent_opencode", to: "agent_pi", label: "syncs", type: "syncs" },
];

function toCartesian(latDeg: number, lngDeg: number): Vec3 {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180;
  return {
    x: Math.cos(lat) * Math.sin(lng),
    y: -Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lng),
  };
}

function rotatePoint(p: Vec3, rotX: number, rotY: number): Vec3 {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = p.x * cosY + p.z * sinY;
  const z1 = -p.x * sinY + p.z * cosY;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = p.y * cosX - z1 * sinX;
  const z2 = p.y * sinX + z1 * cosX;

  return { x: x1, y: y2, z: z2 };
}

function project(
  p: Vec3,
  cx: number,
  cy: number,
  R: number,
  D = 650
): { sx: number; sy: number; zNorm: number; fov: number } {
  const px = p.x * R;
  const py = p.y * R;
  const pz = p.z * R;

  const fov = D / (D - pz);
  return {
    sx: cx + px * fov,
    sy: cy + py * fov,
    zNorm: p.z,
    fov,
  };
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z;
  dot = Math.max(-1, Math.min(1, dot));
  const theta = Math.acos(dot);
  if (Math.abs(theta) < 0.001) {
    return { x: a.x, y: a.y, z: a.z };
  }
  const sinTheta = Math.sin(theta);
  const wA = Math.sin((1 - t) * theta) / sinTheta;
  const wB = Math.sin(t * theta) / sinTheta;
  return {
    x: a.x * wA + b.x * wB,
    y: a.y * wA + b.y * wB,
    z: a.z * wA + b.z * wB,
  };
}

export function HeroBuffetVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeCategory, setActiveCategory] = useState<"all" | NodeCategory>("all");
  const [selectedNode, setSelectedNode] = useState<GlobeNodeDef | null>(null);
  const [selectedAgentTab, setSelectedAgentTab] = useState<TargetAgent>("opencode");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeLog, setActiveLog] = useState<string>(
    "165 LLM Providers cataloged · Drag with mouse or touch to rotate 3D constellation"
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [probePulseCount, setProbePulseCount] = useState<number>(0);

  const nodeUnitMap = useMemo(() => {
    const map = new Map<string, Vec3>();
    RAW_NODES.forEach((n) => {
      map.set(n.id, toCartesian(n.lat, n.lng));
    });
    return map;
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GlobeNodeDef>();
    RAW_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const stateRef = useRef({
    width: 520,
    height: 480,
    dpr: 1,
    zoom: 1,
    rotX: 0.18,
    rotY: -0.2,
    vRotX: 0,
    vRotY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMoveX: 0,
    lastMoveY: 0,
    dragDist: 0,
    hoveredNodeId: null as string | null,
    isPaused: false,
    targetRotX: null as number | null,
    targetRotY: null as number | null,
    projectedNodes: [] as ProjectedNode[],
    probeWave: 0,
    probeWaveActive: false,
    packets: [
      { from: "vault", to: "groq", progress: 0.2, speed: 0.007 },
      { from: "vault", to: "cerebras", progress: 0.6, speed: 0.009 },
      { from: "vault", to: "gemini", progress: 0.4, speed: 0.006 },
      { from: "vault", to: "openrouter", progress: 0.8, speed: 0.008 },
      { from: "vault", to: "ollama", progress: 0.1, speed: 0.012 },
      { from: "groq", to: "agent_opencode", progress: 0.5, speed: 0.007 },
      { from: "cerebras", to: "agent_codex", progress: 0.3, speed: 0.009 },
      { from: "gemini", to: "agent_claude", progress: 0.7, speed: 0.006 },
    ],
    time: 0,
  });

  stateRef.current.zoom = zoom;
  stateRef.current.isPaused = isPaused;

  const rotateToNode = useCallback((node: GlobeNodeDef) => {
    const targetY = -((node.lng * Math.PI) / 180);
    const targetX = (node.lat * Math.PI) / 180;
    stateRef.current.targetRotX = Math.max(-1.4, Math.min(1.4, targetX));
    stateRef.current.targetRotY = targetY;
  }, []);

  const triggerProbeWave = useCallback(() => {
    setProbePulseCount((c) => c + 1);
    stateRef.current.probeWave = 0;
    stateRef.current.probeWaveActive = true;
    setActiveLog("DISPATCHING HEALTH PINGS to 165 providers... latencies verified 200 OK");
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    stateRef.current.targetRotX = 0.18;
    stateRef.current.targetRotY = -0.2;
    stateRef.current.vRotX = 0;
    stateRef.current.vRotY = 0;
    setSelectedNode(null);
    setActiveLog("3D constellation view centered on FreeBuffet Core Vault");
  }, []);

  const handleCopyConfig = async () => {
    if (!selectedNode) return;
    const code = selectedNode.configs[selectedAgentTab];
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g: CanvasRenderingContext2D = ctx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;

    const wrap = canvas.parentElement || container;
    function resize() {
      if (!wrap || !canvas) return;
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(280, Math.floor(rect.width));
      const h = Math.max(340, Math.floor(rect.height || (w < 600 ? 360 : 480)));

      stateRef.current.width = w;
      stateRef.current.height = h;
      stateRef.current.dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(w * stateRef.current.dpr);
      canvas.height = Math.round(h * stateRef.current.dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    function getPalette() {
      const isDark = document.documentElement.classList.contains("dark");
      return {
        isDark,
        rule: isDark ? "#F2F8FC" : "#000000",
        ruleSoft: isDark ? "rgba(242, 248, 252, 0.16)" : "rgba(0, 0, 0, 0.12)",
        ruleFaint: isDark ? "rgba(242, 248, 252, 0.06)" : "rgba(0, 0, 0, 0.04)",
        ink: isDark ? "#F2F8FC" : "#000000",
        inkMuted: isDark ? "rgba(242, 248, 252, 0.65)" : "rgba(0, 0, 0, 0.62)",
        highlightBg: isDark ? "#F2F8FC" : "#000000",
        highlightText: isDark ? "#24221f" : "#F2F8FC",
        surface: isDark ? "#282420" : "#ffffff",
        green: "#10b981",
        greenRgb: "16, 185, 129",
        amber: "#f59e0b",
        amberRgb: "245, 158, 11",
        purple: "#8b5cf6",
        purpleRgb: "139, 92, 246",
        pink: "#ec4899",
        pinkRgb: "236, 72, 153",
        wireBack: isDark ? "rgba(242, 248, 252, 0.04)" : "rgba(0, 0, 0, 0.035)",
        wireFront: isDark ? "rgba(242, 248, 252, 0.11)" : "rgba(0, 0, 0, 0.10)",
        wireEquator: isDark ? "rgba(242, 248, 252, 0.22)" : "rgba(0, 0, 0, 0.20)",
      };
    }

    function getNodeColor(category: NodeCategory, p: ReturnType<typeof getPalette>) {
      switch (category) {
        case "vault":
          return { fill: p.ink, stroke: p.ink, rgb: p.isDark ? "242, 248, 252" : "0, 0, 0" };
        case "fast":
          return { fill: p.green, stroke: p.green, rgb: p.greenRgb };
        case "frontier":
          return { fill: p.amber, stroke: p.amber, rgb: p.amberRgb };
        case "free":
          return { fill: p.purple, stroke: p.purple, rgb: p.purpleRgb };
        case "local":
          return { fill: p.pink, stroke: p.pink, rgb: p.pinkRgb };
        case "agent":
          return { fill: p.ink, stroke: p.ink, rgb: p.isDark ? "242, 248, 252" : "0, 0, 0" };
      }
    }

    function updatePackets() {
      const state = stateRef.current;
      if (state.isPaused) return;

      state.packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
        }
      });

      if (state.probeWaveActive) {
        state.probeWave += 0.016;
        if (state.probeWave >= 1) {
          state.probeWave = 0;
          state.probeWaveActive = false;
        }
      }
    }

    function updatePhysics() {
      const state = stateRef.current;

      if (state.targetRotX !== null && state.targetRotY !== null) {
        const dy = state.targetRotY - state.rotY;
        const shortestDy = Math.atan2(Math.sin(dy), Math.cos(dy));
        state.rotY += shortestDy * 0.07;
        state.rotX += (state.targetRotX - state.rotX) * 0.07;

        if (
          Math.abs(shortestDy) < 0.003 &&
          Math.abs(state.targetRotX - state.rotX) < 0.003
        ) {
          state.targetRotX = null;
          state.targetRotY = null;
        }
      } else if (!state.isDragging) {
        state.rotY += state.vRotY;
        state.rotX += state.vRotX;
        state.vRotY *= 0.93;
        state.vRotX *= 0.93;

        if (!state.isPaused && !reduced) {
          state.rotY += 0.0016;
        }
      }
    }

    function draw() {
      const {
        width,
        height,
        dpr,
        rotX,
        rotY,
        zoom: zScale,
        hoveredNodeId,
        probeWave,
        probeWaveActive,
        packets,
      } = stateRef.current;
      const p = getPalette();

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.36;
      const R = Math.max(110, baseR * zScale);
      const D = 650;

      const projectedNodes: ProjectedNode[] = RAW_NODES.map((def) => {
        const unit = nodeUnitMap.get(def.id) || { x: 0, y: 0, z: 1 };
        const rot = rotatePoint(unit, rotX, rotY);
        const { sx, sy, zNorm, fov } = project(rot, cx, cy, R, D);

        const isDimmed = activeCategory !== "all" && def.category !== activeCategory;
        const baseAlpha = zNorm >= 0 ? 0.85 + 0.15 * zNorm : 0.22 + 0.2 * (1 + zNorm);
        const alpha = isDimmed ? baseAlpha * 0.16 : baseAlpha;
        const scale = fov * (zNorm >= 0 ? 0.85 + 0.3 * zNorm : 0.65 + 0.25 * (1 + zNorm));
        const drawRadius = Math.max(4, def.radius * scale * 0.85);

        return {
          def,
          unit,
          rot,
          sx,
          sy,
          zNorm,
          drawRadius,
          alpha,
          scale,
        };
      });

      stateRef.current.projectedNodes = projectedNodes;

      const nodeProjMap = new Map<string, ProjectedNode>();
      projectedNodes.forEach((pn) => nodeProjMap.set(pn.def.id, pn));

      const backNodes = projectedNodes
        .filter((n) => n.zNorm < 0)
        .sort((a, b) => a.zNorm - b.zNorm);
      const frontNodes = projectedNodes
        .filter((n) => n.zNorm >= 0)
        .sort((a, b) => a.zNorm - b.zNorm);

      // Ambient Sphere Glow
      g.save();
      g.beginPath();
      g.arc(cx, cy, R, 0, Math.PI * 2);
      const sphereGrad = g.createRadialGradient(
        cx - R * 0.25,
        cy - R * 0.25,
        R * 0.05,
        cx,
        cy,
        R
      );
      if (p.isDark) {
        sphereGrad.addColorStop(0, "rgba(242, 248, 252, 0.05)");
        sphereGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.015)");
        sphereGrad.addColorStop(1, "rgba(16, 185, 129, 0.04)");
      } else {
        sphereGrad.addColorStop(0, "rgba(0, 0, 0, 0.03)");
        sphereGrad.addColorStop(0.65, "rgba(0, 0, 0, 0.01)");
        sphereGrad.addColorStop(1, "rgba(0, 0, 0, 0.04)");
      }
      g.fillStyle = sphereGrad;
      g.fill();
      g.strokeStyle = p.ruleSoft;
      g.lineWidth = 1;
      g.stroke();
      g.restore();

      // Back-face grid parallels
      g.save();
      const latitudes = [-60, -30, 0, 30, 60];
      latitudes.forEach((latDeg) => {
        g.beginPath();
        g.strokeStyle = p.wireBack;
        g.lineWidth = 0.7;
        g.setLineDash([2, 4]);

        let hasMoved = false;
        for (let lng = -180; lng <= 180; lng += 8) {
          const pt = toCartesian(latDeg, lng);
          const rot = rotatePoint(pt, rotX, rotY);
          if (rot.z < 0) {
            const { sx, sy } = project(rot, cx, cy, R, D);
            if (!hasMoved) {
              g.moveTo(sx, sy);
              hasMoved = true;
            } else {
              g.lineTo(sx, sy);
            }
          } else {
            hasMoved = false;
          }
        }
        g.stroke();
      });

      const longitudes = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180];
      longitudes.forEach((lngDeg) => {
        g.beginPath();
        g.strokeStyle = p.wireBack;
        g.lineWidth = 0.6;
        g.setLineDash([2, 4]);

        let hasMoved = false;
        for (let lat = -85; lat <= 85; lat += 7) {
          const pt = toCartesian(lat, lngDeg);
          const rot = rotatePoint(pt, rotX, rotY);
          if (rot.z < 0) {
            const { sx, sy } = project(rot, cx, cy, R, D);
            if (!hasMoved) {
              g.moveTo(sx, sy);
              hasMoved = true;
            } else {
              g.lineTo(sx, sy);
            }
          } else {
            hasMoved = false;
          }
        }
        g.stroke();
      });
      g.restore();

      // Back-face edges
      g.save();
      RAW_EDGES.forEach((edge) => {
        const fromPn = nodeProjMap.get(edge.from);
        const toPn = nodeProjMap.get(edge.to);
        if (!fromPn || !toPn) return;

        if (fromPn.zNorm < 0 && toPn.zNorm < 0) {
          g.beginPath();
          g.strokeStyle = p.wireBack;
          g.lineWidth = 0.8;
          g.setLineDash([1, 4]);
          const N = 8;
          for (let i = 0; i <= N; i++) {
            const pt = slerp(fromPn.unit, toPn.unit, i / N);
            const rot = rotatePoint(pt, rotX, rotY);
            const { sx, sy } = project(rot, cx, cy, R, D);
            if (i === 0) g.moveTo(sx, sy);
            else g.lineTo(sx, sy);
          }
          g.stroke();
        }
      });
      g.restore();

      // Back-face nodes
      backNodes.forEach((pn) => {
        g.save();
        g.globalAlpha = pn.alpha;
        g.beginPath();
        g.arc(pn.sx, pn.sy, Math.max(2, pn.drawRadius * 0.6), 0, Math.PI * 2);
        g.fillStyle = p.isDark ? "rgba(242, 248, 252, 0.4)" : "rgba(0, 0, 0, 0.3)";
        g.fill();
        g.restore();
      });

      // Front-face parallels
      g.save();
      latitudes.forEach((latDeg) => {
        g.beginPath();
        const isEquator = latDeg === 0;
        g.strokeStyle = isEquator ? p.wireEquator : p.wireFront;
        g.lineWidth = isEquator ? 1.2 : 0.8;
        g.setLineDash([]);

        let hasMoved = false;
        for (let lng = -180; lng <= 180; lng += 6) {
          const pt = toCartesian(latDeg, lng);
          const rot = rotatePoint(pt, rotX, rotY);
          if (rot.z >= -0.05) {
            const { sx, sy } = project(rot, cx, cy, R, D);
            if (!hasMoved) {
              g.moveTo(sx, sy);
              hasMoved = true;
            } else {
              g.lineTo(sx, sy);
            }
          } else {
            hasMoved = false;
          }
        }
        g.stroke();
      });

      longitudes.forEach((lngDeg) => {
        g.beginPath();
        g.strokeStyle = p.wireFront;
        g.lineWidth = 0.75;
        g.setLineDash([]);

        let hasMoved = false;
        for (let lat = -85; lat <= 85; lat += 5) {
          const pt = toCartesian(lat, lngDeg);
          const rot = rotatePoint(pt, rotX, rotY);
          if (rot.z >= -0.05) {
            const { sx, sy } = project(rot, cx, cy, R, D);
            if (!hasMoved) {
              g.moveTo(sx, sy);
              hasMoved = true;
            } else {
              g.lineTo(sx, sy);
            }
          } else {
            hasMoved = false;
          }
        }
        g.stroke();
      });

      // Astrolabe Rim Graduation Ticks
      const rimR = R * 1.05;
      g.beginPath();
      g.strokeStyle = p.ruleSoft;
      g.lineWidth = 0.75;
      g.arc(cx, cy, rimR, 0, Math.PI * 2);
      g.stroke();

      for (let deg = 0; deg < 360; deg += 15) {
        const rad = (deg * Math.PI) / 180;
        const isMajor = deg % 45 === 0;
        const tickLen = isMajor ? 6 : 3;
        const xA = cx + Math.cos(rad) * rimR;
        const yA = cy + Math.sin(rad) * rimR;
        const xB = cx + Math.cos(rad) * (rimR + tickLen);
        const yB = cy + Math.sin(rad) * (rimR + tickLen);

        g.beginPath();
        g.strokeStyle = isMajor ? p.rule : p.ruleSoft;
        g.lineWidth = isMajor ? 1.1 : 0.6;
        g.moveTo(xA, yA);
        g.lineTo(xB, yB);
        g.stroke();
      }
      g.restore();

      // Front-face edges
      RAW_EDGES.forEach((edge) => {
        const fromPn = nodeProjMap.get(edge.from);
        const toPn = nodeProjMap.get(edge.to);
        if (!fromPn || !toPn) return;
        if (fromPn.zNorm < 0 && toPn.zNorm < 0) return;

        const isHovered = hoveredNodeId === edge.from || hoveredNodeId === edge.to;
        const isSelected = selectedNode?.id === edge.from || selectedNode?.id === edge.to;
        const isDimmed =
          activeCategory !== "all" &&
          fromPn.def.category !== activeCategory &&
          toPn.def.category !== activeCategory;

        const N = 12;
        const points: { sx: number; sy: number; zNorm: number }[] = [];
        for (let i = 0; i <= N; i++) {
          const pt = slerp(fromPn.unit, toPn.unit, i / N);
          const rot = rotatePoint(pt, rotX, rotY);
          points.push(project(rot, cx, cy, R, D));
        }

        g.save();
        if (isDimmed) g.globalAlpha = 0.12;

        g.beginPath();
        let active = false;
        points.forEach((pt) => {
          if (pt.zNorm >= -0.15) {
            if (!active) {
              g.moveTo(pt.sx, pt.sy);
              active = true;
            } else {
              g.lineTo(pt.sx, pt.sy);
            }
          } else {
            active = false;
          }
        });

        if (isSelected || isHovered) {
          g.strokeStyle = p.green;
          g.lineWidth = 1.8;
        } else {
          g.strokeStyle = p.isDark ? "rgba(242, 248, 252, 0.42)" : "rgba(0, 0, 0, 0.38)";
          g.lineWidth = 0.85;
        }
        g.stroke();
        g.restore();
      });

      // Animated Data Packets (Health Pings & Telemetry Waves)
      packets.forEach((pkt) => {
        const fromPn = nodeProjMap.get(pkt.from);
        const toPn = nodeProjMap.get(pkt.to);
        if (!fromPn || !toPn) return;

        const pt = slerp(fromPn.unit, toPn.unit, pkt.progress);
        const elevated = { x: pt.x * 1.02, y: pt.y * 1.02, z: pt.z * 1.02 };
        const rot = rotatePoint(elevated, rotX, rotY);
        const proj = project(rot, cx, cy, R, D);

        if (proj.zNorm >= -0.15) {
          g.save();
          g.beginPath();
          g.arc(proj.sx, proj.sy, 2.5, 0, Math.PI * 2);
          g.fillStyle = p.green;
          g.fill();
          g.strokeStyle = p.isDark ? "#ffffff" : "#000000";
          g.lineWidth = 0.75;
          g.stroke();
          g.restore();
        }
      });

      // Interactive Probe Pulse Wave
      if (probeWaveActive) {
        g.save();
        const pulseR = R * probeWave * 1.35;
        g.beginPath();
        g.arc(cx, cy, pulseR, 0, Math.PI * 2);
        g.strokeStyle = `rgba(${p.greenRgb}, ${Math.max(0, 1 - probeWave)})`;
        g.lineWidth = 2;
        g.setLineDash([4, 4]);
        g.stroke();
        g.restore();
      }

      // Front-face Nodes (with latency chips and crisp typography)
      frontNodes.forEach((pn) => {
        const isHovered = hoveredNodeId === pn.def.id;
        const isSelected = selectedNode?.id === pn.def.id;
        const colors = getNodeColor(pn.def.category, p);

        g.save();
        g.globalAlpha = pn.alpha;

        // Radial Glow
        if (pn.def.isHub || isHovered || isSelected) {
          const haloR = pn.drawRadius + (isHovered || isSelected ? 14 : 8);
          const haloGrad = g.createRadialGradient(
            pn.sx,
            pn.sy,
            pn.drawRadius * 0.4,
            pn.sx,
            pn.sy,
            haloR
          );
          haloGrad.addColorStop(0, `rgba(${colors.rgb}, 0.32)`);
          haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          g.beginPath();
          g.arc(pn.sx, pn.sy, haloR, 0, Math.PI * 2);
          g.fillStyle = haloGrad;
          g.fill();
        }

        // Outer Ring for hubs
        if (pn.def.isHub || isHovered || isSelected) {
          g.beginPath();
          g.arc(pn.sx, pn.sy, pn.drawRadius + 3.5, 0, Math.PI * 2);
          g.strokeStyle = isHovered || isSelected ? colors.stroke : p.ruleSoft;
          g.lineWidth = isHovered || isSelected ? 1.5 : 0.8;
          g.stroke();
        }

        // Node Circle
        g.beginPath();
        g.arc(pn.sx, pn.sy, pn.drawRadius, 0, Math.PI * 2);
        g.fillStyle = isHovered || isSelected ? colors.fill : p.surface;
        g.fill();
        g.strokeStyle = colors.stroke;
        g.lineWidth = 1.4;
        g.stroke();

        // Inner glyph
        const fontSize = Math.max(8, Math.round(pn.drawRadius * 0.95));
        g.font = `700 ${fontSize}px monospace`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = isHovered || isSelected ? (p.isDark ? "#000000" : "#ffffff") : colors.fill;
        g.fillText(pn.def.glyph, pn.sx, pn.sy + 0.5);

        // Latency Badge & Label for Front Prominent Nodes
        if (pn.zNorm > 0.05 || isHovered || isSelected) {
          const label = pn.def.name;
          const latText = `${pn.def.latencyMs}ms`;
          const fontSz = Math.max(9, Math.min(11, Math.round(9.5 * pn.scale)));
          g.font = `600 ${fontSz}px monospace`;

          const textWidth = g.measureText(label).width;
          const badgeWidth = g.measureText(latText).width + 8;
          const labelY = pn.sy + pn.drawRadius + 11;

          // Latency chip
          g.beginPath();
          g.rect(pn.sx - textWidth / 2 - badgeWidth - 4, labelY - 6.5, badgeWidth, 12);
          g.fillStyle = p.isDark ? "rgba(24, 22, 20, 0.85)" : "rgba(255, 255, 255, 0.92)";
          g.fill();
          g.strokeStyle = colors.stroke;
          g.lineWidth = 0.8;
          g.stroke();

          g.fillStyle = colors.fill;
          g.font = `700 8px monospace`;
          g.textAlign = "center";
          g.fillText(latText, pn.sx - textWidth / 2 - badgeWidth / 2 - 4, labelY);

          // Name label background pill
          g.beginPath();
          g.rect(pn.sx - textWidth / 2 - 3, labelY - 7, textWidth + 6, 13);
          g.fillStyle = p.isDark ? "rgba(24, 22, 20, 0.85)" : "rgba(255, 255, 255, 0.92)";
          g.fill();
          g.strokeStyle = isHovered || isSelected ? colors.stroke : p.ruleSoft;
          g.lineWidth = 0.6;
          g.stroke();

          // Label text
          g.font = `600 ${fontSz}px monospace`;
          g.fillStyle = isHovered || isSelected ? colors.fill : p.ink;
          g.textAlign = "center";
          g.fillText(label, pn.sx, labelY);
        }

        g.restore();
      });
    }

    function frame(timestamp: number) {
      if (!running) return;
      stateRef.current.time = timestamp;
      updatePhysics();
      updatePackets();
      draw();
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    function getCanvasCoords(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    const onPointerDown = (e: PointerEvent) => {
      const state = stateRef.current;
      state.isDragging = true;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
      state.lastMoveX = e.clientX;
      state.lastMoveY = e.clientY;
      state.dragDist = 0;
      state.vRotX = 0;
      state.vRotY = 0;
      state.targetRotX = null;
      state.targetRotY = null;

      canvas!.setPointerCapture(e.pointerId);
      canvas!.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = stateRef.current;
      const { x, y } = getCanvasCoords(e);

      if (state.isDragging) {
        const dx = e.clientX - state.lastMoveX;
        const dy = e.clientY - state.lastMoveY;
        state.dragDist += Math.hypot(dx, dy);

        state.rotY += dx * 0.0055;
        state.rotX += dy * 0.0055;

        const maxPitch = Math.PI / 2 - 0.1;
        state.rotX = Math.max(-maxPitch, Math.min(maxPitch, state.rotX));

        state.vRotY = dx * 0.0055;
        state.vRotX = dy * 0.0055;

        state.lastMoveX = e.clientX;
        state.lastMoveY = e.clientY;
        return;
      }

      let hovered: ProjectedNode | null = null;
      for (const pn of state.projectedNodes) {
        if (pn.zNorm >= -0.15) {
          const d = Math.hypot(x - pn.sx, y - pn.sy);
          if (d <= pn.drawRadius + 8) {
            hovered = pn;
            break;
          }
        }
      }

      state.hoveredNodeId = hovered ? hovered.def.id : null;
      canvas!.style.cursor = hovered ? "pointer" : "grab";
      if (hovered) {
        setActiveLog(hovered.def.log);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const state = stateRef.current;
      state.isDragging = false;
      canvas!.style.cursor = "grab";

      if (state.dragDist < 6) {
        const { x, y } = getCanvasCoords(e);
        let clicked: ProjectedNode | null = null;
        for (const pn of state.projectedNodes) {
          if (pn.zNorm >= -0.15) {
            const d = Math.hypot(x - pn.sx, y - pn.sy);
            if (d <= pn.drawRadius + 9) {
              clicked = pn;
              break;
            }
          }
        }

        if (clicked) {
          setSelectedNode(clicked.def);
          rotateToNode(clicked.def);
          setActiveLog(clicked.def.log);
        }
      }

      try {
        canvas!.releasePointerCapture(e.pointerId);
      } catch {}
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.max(0.75, Math.min(1.65, z - e.deltaY * 0.0012)));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [nodeUnitMap, rotateToNode, activeCategory, selectedNode]);

  return (
    <div className="hero-graph-direct" ref={containerRef}>
      {/* Top Floating HUD Bar */}
      <div className="hero-graph-hud-top">
        <div className="hero-graph-status font-mono">
          <span className="hero-graph-pulse-dot" />
          <span className="hero-graph-title">165 PROVIDERS MENU</span>
          <span className="hero-graph-count">AES-256 Vault Encrypted</span>
        </div>
        <div className="hero-graph-actions">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="hero-graph-pill-btn font-mono"
            title={isPaused ? "Resume auto-rotation" : "Pause auto-rotation"}
          >
            {isPaused ? "RESUME ▶" : "PAUSE ⏸"}
          </button>
          <button
            type="button"
            onClick={triggerProbeWave}
            className="hero-graph-pill-btn primary font-mono"
            title="Dispatch simulated ping probes across all providers"
          >
            PROBE ⚡
          </button>
          <button
            type="button"
            onClick={resetView}
            className="hero-graph-pill-btn font-mono"
            title="Reset rotation to center vault"
          >
            RESET ⊙
          </button>
          <div className="hero-graph-zoom-group">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.65, z * 1.15))}
              className="hero-graph-pill-btn font-mono"
              title="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, z * 0.85))}
              className="hero-graph-pill-btn font-mono"
              title="Zoom out"
            >
              &minus;
            </button>
          </div>
        </div>
      </div>

      {/* Layer Filter Chips */}
      <div className="hero-graph-hud-filters font-mono">
        <span className="hero-graph-filter-label">CATEGORY:</span>
        {(
          [
            ["all", "ALL (27)"],
            ["fast", "FAST CLOUD (5)"],
            ["frontier", "FRONTIER (5)"],
            ["free", "ALWAYS FREE (5)"],
            ["local", "LOCAL $0 (4)"],
            ["agent", "AGENT TARGETS (7)"],
          ] as const
        ).map(([cat, label]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`hero-graph-filter-chip ${activeCategory === cat ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main 3D Globe Canvas Area */}
      <div className="hero-graph-direct-canvas-wrap">
        <canvas ref={canvasRef} className="hero-graph-canvas" />

        {/* Selected Provider / Agent Detail Inspector Drawer */}
        {selectedNode && (
          <div className="hero-graph-inspector font-mono" role="dialog" aria-label="Node Inspector">
            <div className="hero-graph-inspector-header">
              <span
                className="postcard-tag boxed tilt-up"
                style={{ fontSize: "9px", padding: "1px 6px" }}
              >
                {selectedNode.badge} &bull; {selectedNode.latencyMs}ms
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="hero-graph-inspector-close"
                aria-label="Close inspector"
              >
                &times;
              </button>
            </div>

            <div className="hero-graph-inspector-body">
              <h4 className="hero-graph-inspector-title">
                <span>{selectedNode.glyph}</span> {selectedNode.name}
              </h4>
              <div className="hero-graph-inspector-meta">
                <span>
                  FREE TIER: <strong>{selectedNode.freeTier}</strong>
                </span>
                <span>
                  TOP MODEL: <strong>{selectedNode.topModel}</strong>
                </span>
                <span>
                  ENDPOINT: <code>{selectedNode.endpoint}</code>
                </span>
              </div>
              <p className="hero-graph-inspector-desc">{selectedNode.description}</p>

              {/* Target Agent Tab Selection */}
              <div style={{ marginTop: "0.4rem" }}>
                <span className="hero-graph-inspector-edge-heading">
                  GENERATE AGENT CONFIG:
                </span>
                <div style={{ display: "flex", gap: "3px", marginBottom: "5px" }}>
                  {AGENT_CONFIG_TABS.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentTab(agent.id)}
                      className={`hero-graph-pill-btn ${
                        selectedAgentTab === agent.id ? "primary" : ""
                      }`}
                      style={{ fontSize: "7.5px", padding: "1px 4px" }}
                    >
                      {agent.label}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--rule-soft)",
                    padding: "0.4rem 0.5rem",
                    maxHeight: "90px",
                    overflowX: "auto",
                    overflowY: "auto",
                    fontSize: "9px",
                    lineHeight: "1.4",
                  }}
                >
                  <pre style={{ margin: 0 }}>
                    <code>{selectedNode.configs[selectedAgentTab]}</code>
                  </pre>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="btn-broadsheet-primary"
                  style={{
                    flex: 1,
                    padding: "0.35rem 0.6rem",
                    fontSize: "8.5px",
                    textAlign: "center",
                  }}
                >
                  {copied ? "COPIED TO CLIPBOARD ✓" : "COPY AGENT CONFIG"}
                </button>
                <button
                  type="button"
                  onClick={triggerProbeWave}
                  className="btn-broadsheet-outline"
                  style={{
                    padding: "0.35rem 0.6rem",
                    fontSize: "8.5px",
                  }}
                >
                  PING PROBE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean Human Status Ticker */}
      <div className="hero-graph-hud-bottom font-mono">
        <span className="hero-graph-status-tag">ACTIVE PROBE</span>
        <span className="hero-graph-log" title={activeLog}>
          {activeLog}
        </span>
      </div>
    </div>
  );
}
