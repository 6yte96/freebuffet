"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PROJECT_CONFIG } from "@/config";

export type BuffetCategory =
  | "all"
  | "express"
  | "frontier"
  | "free"
  | "local";

export type TargetAgent = "opencode" | "codex" | "claude" | "antigravity";

export interface BuffetDish {
  id: string;
  name: string;
  subtitle: string;
  course: "Fast Express" | "Frontier Chef" | "Always Free" | "Local $0";
  category: BuffetCategory;
  glyph: string;
  foodIcon: string;
  latencyMs: number;
  portion: string;
  topModel: string;
  endpoint: string;
  envKey: string;
  accentColor: string;
  accentRgb: string;
  description: string;
  chefNote: string;
  configs: {
    opencode: string;
    codex: string;
    claude: string;
    antigravity: string;
  };
}

export interface AgentCustomer {
  id: TargetAgent;
  name: string;
  configFile: string;
  plateGlyph: string;
  tag: string;
}

const AGENT_CUSTOMERS: AgentCustomer[] = [
  { id: "opencode", name: "OpenCode", configFile: "opencode.json", plateGlyph: "🥢", tag: "@ai-sdk" },
  { id: "codex", name: "Codex CLI", configFile: "config.toml", plateGlyph: "🍴", tag: "TOML table" },
  { id: "claude", name: "Claude Code", configFile: "settings.json", plateGlyph: "🥣", tag: "BASE_URL" },
  { id: "antigravity", name: "Antigravity", configFile: "config.toml", plateGlyph: "🍱", tag: "Multi-Agent" },
];

const BUFFET_DISHES: BuffetDish[] = [
  {
    id: "groq",
    name: "Groq LPU",
    subtitle: "Flash-Fried Llama 3.3",
    course: "Fast Express",
    category: "express",
    glyph: "⚡",
    foodIcon: "🥟",
    latencyMs: 42,
    portion: "30 RPM, 14,400 RPD (Free)",
    topModel: "llama-3.3-70b-versatile",
    endpoint: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    accentColor: "#10b981",
    accentRgb: "16, 185, 129",
    description: "Ultra-fast custom LPU inference serving 300+ tok/s with zero cold-starts and generous daily free quotas.",
    chefNote: "Groq LPU sizzling at 42ms ping · Fresh batch of 14,400 free requests ready to serve",
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
    subtitle: "Wafer-Scale Feast",
    course: "Fast Express",
    category: "express",
    glyph: "⚡",
    foodIcon: "🥩",
    latencyMs: 24,
    portion: "1,000,000 tokens / day free",
    topModel: "llama-3.3-70b",
    endpoint: "https://api.cerebras.ai/v1",
    envKey: "CEREBRAS_API_KEY",
    accentColor: "#059669",
    accentRgb: "5, 150, 105",
    description: "The world's fastest LLM engine. Giant silicon wafer architecture clocking 24ms latency and 1,800 tok/s.",
    chefNote: "Cerebras Wafer CS-3 serving 1,000,000 daily free tokens · Record 24ms wire speed",
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
    subtitle: "Dataflow Sizzler",
    course: "Fast Express",
    category: "express",
    glyph: "⚡",
    foodIcon: "🍢",
    latencyMs: 35,
    portion: "10 RPM, Full DeepSeek V3",
    topModel: "DeepSeek-V3",
    endpoint: "https://api.sambanova.ai/v1",
    envKey: "SAMBANOVA_API_KEY",
    accentColor: "#10b981",
    accentRgb: "16, 185, 129",
    description: "Reconfigurable Dataflow architecture serving full 671B DeepSeek V3 and Llama 3.1 405B at blistering speeds.",
    chefNote: "SambaNova SN40L dataflow grill hot at 35ms · DeepSeek-V3 on tap",
    configs: {
      opencode: `"provider": {\n  "sambanova": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "SambaNova",\n    "options": { "baseURL": "https://api.sambanova.ai/v1" }\n  }\n}`,
      codex: `[model_providers.sambanova]\nname = "SambaNova"\nbase_url = "https://api.sambanova.ai/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.sambanova.ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "sambanova"\nbase_url = "https://api.sambanova.ai/v1"\nmodel = "DeepSeek-V3"`,
    },
  },
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    subtitle: "DeepMind Multimodal Banquet",
    course: "Frontier Chef",
    category: "frontier",
    glyph: "✧",
    foodIcon: "🍱",
    latencyMs: 86,
    portion: "1,500 RPD Free (No credit card)",
    topModel: "gemini-2.0-flash",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
    envKey: "GEMINI_API_KEY",
    accentColor: "#f59e0b",
    accentRgb: "245, 158, 11",
    description: "Google DeepMind's premier fast multimodal model with a 1M token context window and 1,500 daily free calls.",
    chefNote: "Gemini Flash tasting platter · 1,500 free requests refreshed every day",
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
    subtitle: "Reasoning Dim Sum",
    course: "Frontier Chef",
    category: "frontier",
    glyph: "✧",
    foodIcon: "🍜",
    latencyMs: 64,
    portion: "5M tokens onboarding trial",
    topModel: "deepseek-coder / deepseek-r1",
    endpoint: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    accentColor: "#f59e0b",
    accentRgb: "245, 158, 11",
    description: "State of the art coding and chain-of-thought reasoning models with drop-in OpenAI wire protocol.",
    chefNote: "DeepSeek steaming at 64ms · DeepSeek-Coder & DeepSeek-R1 ready",
    configs: {
      opencode: `"provider": {\n  "deepseek": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api.deepseek.com/v1" }\n  }\n}`,
      codex: `[model_providers.deepseek]\nname = "DeepSeek"\nbase_url = "https://api.deepseek.com/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "deepseek"\nbase_url = "https://api.deepseek.com/v1"\nmodel = "deepseek-coder"`,
    },
  },
  {
    id: "mistral",
    name: "Mistral Codestral",
    subtitle: "Parisian Code Tart",
    course: "Frontier Chef",
    category: "frontier",
    glyph: "✧",
    foodIcon: "🥐",
    latencyMs: 70,
    portion: "La Plateforme Free Tier",
    topModel: "codestral-latest",
    endpoint: "https://api.mistral.ai/v1",
    envKey: "MISTRAL_API_KEY",
    accentColor: "#f59e0b",
    accentRgb: "245, 158, 11",
    description: "European frontier model masterclass for 80+ coding languages with 256k fill-in-the-middle context.",
    chefNote: "Mistral Codestral freshly baked · FIM completion ready at 70ms",
    configs: {
      opencode: `"provider": {\n  "mistral": {\n    "npm": "@ai-sdk/mistral"\n  }\n}`,
      codex: `[model_providers.mistral]\nname = "Mistral"\nbase_url = "https://api.mistral.ai/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.mistral.ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "mistral"\nbase_url = "https://api.mistral.ai/v1"\nmodel = "codestral-latest"`,
    },
  },
  {
    id: "openrouter",
    name: "OpenRouter Free",
    subtitle: "All-You-Can-Eat Sampler",
    course: "Always Free",
    category: "free",
    glyph: "◎",
    foodIcon: "🍣",
    latencyMs: 78,
    portion: "20+ Permanent Free Dishes (:free)",
    topModel: "deepseek/deepseek-r1:free",
    endpoint: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    accentColor: "#8b5cf6",
    accentRgb: "139, 92, 246",
    description: "Multi-provider gateway offering permanent zero-cost access to DeepSeek R1, Llama 3.3, and Gemma.",
    chefNote: "OpenRouter free buffet table loaded · 24 community free endpoints online",
    configs: {
      opencode: `"provider": {\n  "openrouter": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "OpenRouter",\n    "options": { "baseURL": "https://openrouter.ai/api/v1" }\n  }\n}`,
      codex: `[model_providers.openrouter]\nname = "OpenRouter"\nbase_url = "https://openrouter.ai/api/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "openrouter"\nbase_url = "https://openrouter.ai/api/v1"\nmodel = "deepseek/deepseek-r1:free"`,
    },
  },
  {
    id: "github",
    name: "GitHub Models",
    subtitle: "Developer Tasting Bento",
    course: "Always Free",
    category: "free",
    glyph: "◎",
    foodIcon: "🍛",
    latencyMs: 55,
    portion: "Included with any GitHub Account",
    topModel: "gpt-4o / llama-3.3-70b",
    endpoint: "https://models.inference.ai.azure.com",
    envKey: "GITHUB_TOKEN",
    accentColor: "#8b5cf6",
    accentRgb: "139, 92, 246",
    description: "Free developer playground for GPT-4o, Claude 3.5 Sonnet, and Llama 3.3 authenticated via your GITHUB_TOKEN.",
    chefNote: "GitHub Models bento box ready · Zero cost for all authenticated developers",
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
    subtitle: "Global Edge Tapas",
    course: "Always Free",
    category: "free",
    glyph: "◎",
    foodIcon: "🍤",
    latencyMs: 48,
    portion: "10,000 neurons / day free",
    topModel: "@cf/meta/llama-3.1-8b-instruct",
    endpoint: "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1",
    envKey: "CLOUDFLARE_API_TOKEN",
    accentColor: "#8b5cf6",
    accentRgb: "139, 92, 246",
    description: "Serverless inference deployed across 330+ edge data centers. 10k daily neurons on the house.",
    chefNote: "Cloudflare edge tapas served fresh · 48ms low latency across global nodes",
    configs: {
      opencode: `"provider": {\n  "cloudflare": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1" }\n  }\n}`,
      codex: `[model_providers.cloudflare]\nname = "Cloudflare AI"\nbase_url = "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "cloudflare"\nbase_url = "https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1"`,
    },
  },
  {
    id: "ollama",
    name: "Ollama Local",
    subtitle: "Home-Cooked $0 On-Device",
    course: "Local $0",
    category: "local",
    glyph: "⌂",
    foodIcon: "🍙",
    latencyMs: 6,
    portion: "100% Free, Unlimited, Offline",
    topModel: "qwen2.5-coder:14b",
    endpoint: "http://localhost:11434/v1",
    envKey: "NONE",
    accentColor: "#ec4899",
    accentRgb: "236, 72, 153",
    description: "Run GGUF open-weights models locally on Apple Silicon, NVIDIA GPUs, or CPU. Completely private and keyless.",
    chefNote: "Ollama home kitchen warm · 6ms local socket response · 0 API keys required",
    configs: {
      opencode: `"provider": {\n  "ollama": {\n    "npm": "@ai-sdk/openai-compatible",\n    "name": "Ollama Local",\n    "options": { "baseURL": "http://localhost:11434/v1" }\n  }\n}`,
      codex: `[model_providers.ollama]\nname = "Ollama Local"\nbase_url = "http://localhost:11434/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:11434/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "ollama"\nbase_url = "http://localhost:11434/v1"\nmodel = "qwen2.5-coder:14b"`,
    },
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    subtitle: "Private Desktop Booth",
    course: "Local $0",
    category: "local",
    glyph: "⌂",
    foodIcon: "🍵",
    latencyMs: 8,
    portion: "100% Private Offline Server",
    topModel: "deepseek-r1-distill-qwen-14b",
    endpoint: "http://localhost:1234/v1",
    envKey: "NONE",
    accentColor: "#ec4899",
    accentRgb: "236, 72, 153",
    description: "Desktop UI and local OpenAI-compatible inference server running HuggingFace GGUFs with 1-click downloads.",
    chefNote: "LM Studio private dining booth ready · Listening on port 1234",
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
    subtitle: "Continuous Batching Hot Pot",
    course: "Local $0",
    category: "local",
    glyph: "⌂",
    foodIcon: "🍲",
    latencyMs: 5,
    portion: "Self-Hosted GPU High Throughput",
    topModel: "mistralai/Mistral-7B-Instruct",
    endpoint: "http://localhost:8000/v1",
    envKey: "NONE",
    accentColor: "#ec4899",
    accentRgb: "236, 72, 153",
    description: "Industrial grade high-throughput serving engine with PagedAttention memory management for self-hosted rigs.",
    chefNote: "vLLM hot pot boiling at 5ms · Continuous batching serving full throughput",
    configs: {
      opencode: `"provider": {\n  "vllm": {\n    "npm": "@ai-sdk/openai-compatible",\n    "options": { "baseURL": "http://localhost:8000/v1" }\n  }\n}`,
      codex: `[model_providers.vllm]\nname = "vLLM"\nbase_url = "http://localhost:8000/v1"\nwire_specification = "openai"`,
      claude: `{\n  "env": {\n    "ANTHROPIC_BASE_URL": "http://localhost:8000/v1"\n  }\n}`,
      antigravity: `[[providers]]\nname = "vllm"\nbase_url = "http://localhost:8000/v1"`,
    },
  },
];

interface SteamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface TokenDrop {
  dishId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  speed: number;
  color: string;
  glyph: string;
}

export function HeroBuffetVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeCategory, setActiveCategory] = useState<BuffetCategory>("all");
  const [selectedDishId, setSelectedDishId] = useState<string>("cerebras");
  const [selectedAgent, setSelectedAgent] = useState<TargetAgent>("opencode");
  const [copied, setCopied] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [servingAlert, setServingAlert] = useState<string | null>(null);
  const [activeLog, setActiveLog] = useState<string>(
    "🍱 FreeBuffet Tasting Table · Spin the carousel to sample 165+ free LLM dishes"
  );

  const selectedDish =
    BUFFET_DISHES.find((d) => d.id === selectedDishId) || BUFFET_DISHES[0];
  const selectedAgentInfo =
    AGENT_CUSTOMERS.find((a) => a.id === selectedAgent) || AGENT_CUSTOMERS[0];

  const stateRef = useRef({
    width: 520,
    height: 480,
    dpr: 1,
    angle: 0.35,
    vAngle: 0,
    isDragging: false,
    dragStartX: 0,
    lastMoveX: 0,
    dragDist: 0,
    targetAngle: null as number | null,
    hoveredDishId: null as string | null,
    isPaused: false,
    tasteRipple: 0,
    tasteRippleActive: false,
    steamParticles: [] as SteamParticle[],
    tokenDrops: [] as TokenDrop[],
    projectedDishes: [] as {
      dish: BuffetDish;
      x: number;
      y: number;
      z: number;
      plateR: number;
      scale: number;
      alpha: number;
    }[],
    agentPlates: [] as {
      agent: AgentCustomer;
      x: number;
      y: number;
      w: number;
      h: number;
    }[],
  });

  stateRef.current.isPaused = isPaused;

  const rotateToDish = useCallback((dishId: string) => {
    setSelectedDishId(dishId);
    const dish = BUFFET_DISHES.find((d) => d.id === dishId);
    if (!dish) return;

    const idx = BUFFET_DISHES.findIndex((d) => d.id === dishId);
    const N = BUFFET_DISHES.length;
    // Front position is angle = Math.PI / 2
    const targetA = Math.PI / 2 - (idx * (2 * Math.PI)) / N;
    stateRef.current.targetAngle = targetA;
    setActiveLog(dish.chefNote);
  }, []);

  const triggerTasteTest = useCallback(() => {
    stateRef.current.tasteRipple = 0;
    stateRef.current.tasteRippleActive = true;
    setServingAlert(`✓ 200 OK PING: ${selectedDish.name} served ${selectedDish.latencyMs}ms latency to ${selectedAgentInfo.name}!`);
    setTimeout(() => setServingAlert(null), 3500);

    // Spawn burst of token drops from active dish to selected customer plate
    const frontProj = stateRef.current.projectedDishes.find(
      (p) => p.dish.id === selectedDish.id
    );
    const targetAgentPlate = stateRef.current.agentPlates.find(
      (a) => a.agent.id === selectedAgent
    );

    if (frontProj && targetAgentPlate) {
      for (let i = 0; i < 7; i++) {
        stateRef.current.tokenDrops.push({
          dishId: selectedDish.id,
          fromX: frontProj.x + (Math.random() - 0.5) * 20,
          fromY: frontProj.y + (Math.random() - 0.5) * 10,
          toX: targetAgentPlate.x + targetAgentPlate.w / 2 + (Math.random() - 0.5) * 24,
          toY: targetAgentPlate.y + targetAgentPlate.h / 2,
          progress: -(i * 0.12),
          speed: 0.02 + Math.random() * 0.01,
          color: selectedDish.accentColor,
          glyph: ["0", "1", "{", "}", "$", "✓", "tok"][i % 7],
        });
      }
    }

    setActiveLog(`Tasting ${selectedDish.name} · ${selectedDish.latencyMs}ms ping verified · Config ready for ${selectedAgentInfo.configFile}`);
  }, [selectedDish, selectedAgent, selectedAgentInfo]);

  const handleCopyConfig = async () => {
    const code = selectedDish.configs[selectedAgent];
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
    const g = ctx;

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
        ink: isDark ? "#F2F8FC" : "#111827",
        surface: isDark ? "#1c1917" : "#ffffff",
        surfaceSoft: isDark ? "#292524" : "#f4f4f5",
        rule: isDark ? "rgba(242, 248, 252, 0.2)" : "rgba(0, 0, 0, 0.15)",
        ruleSoft: isDark ? "rgba(242, 248, 252, 0.1)" : "rgba(0, 0, 0, 0.08)",
        tableWoodDark: isDark ? "#2c2621" : "#e7e0d6",
        tableWoodLight: isDark ? "#38312b" : "#f2ece2",
        tableRim: isDark ? "#1f1b17" : "#d9cfc2",
        tableGroove: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.12)",
        gold: isDark ? "#f5b942" : "#b45309",
        goldRgb: isDark ? "245, 185, 66" : "180, 83, 9",
        green: "#10b981",
        greenRgb: "16, 185, 129",
      };
    }

    // Physics & Animation update loop
    function updatePhysics() {
      const state = stateRef.current;

      if (state.targetAngle !== null) {
        let diff = (state.targetAngle - state.angle) % (2 * Math.PI);
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;

        state.angle += diff * 0.08;
        if (Math.abs(diff) < 0.003) {
          state.angle = state.targetAngle;
          state.targetAngle = null;
        }
      } else if (!state.isDragging) {
        state.angle += state.vAngle;
        state.vAngle *= 0.94;

        if (!state.isPaused && !reduced) {
          state.angle += 0.0022; // gentle auto-revolving Lazy Susan
        }
      }

      // Update taste ripple
      if (state.tasteRippleActive) {
        state.tasteRipple += 0.024;
        if (state.tasteRipple >= 1) {
          state.tasteRipple = 0;
          state.tasteRippleActive = false;
        }
      }

      // Spawn steam particles around hot dishes
      if (Math.random() < 0.4 && state.projectedDishes.length > 0) {
        const randDish =
          state.projectedDishes[
            Math.floor(Math.random() * state.projectedDishes.length)
          ];
        if (randDish && randDish.z > -0.2) {
          state.steamParticles.push({
            x: randDish.x + (Math.random() - 0.5) * 14,
            y: randDish.y - 10,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.6 - Math.random() * 0.5,
            life: 0,
            maxLife: 45 + Math.random() * 25,
            size: 2.5 + Math.random() * 3,
          });
        }
      }

      // Update steam particles
      for (let i = state.steamParticles.length - 1; i >= 0; i--) {
        const sp = state.steamParticles[i];
        sp.x += sp.vx + Math.sin(sp.life * 0.15) * 0.3;
        sp.y += sp.vy;
        sp.life++;
        if (sp.life >= sp.maxLife) {
          state.steamParticles.splice(i, 1);
        }
      }

      // Update token drops
      for (let i = state.tokenDrops.length - 1; i >= 0; i--) {
        const drop = state.tokenDrops[i];
        drop.progress += drop.speed;
        if (drop.progress >= 1) {
          state.tokenDrops.splice(i, 1);
        }
      }
    }

    // Render Canvas Frame
    function draw() {
      const {
        width,
        height,
        dpr,
        angle,
        hoveredDishId,
        tasteRipple,
        tasteRippleActive,
        steamParticles,
        tokenDrops,
      } = stateRef.current;
      const p = getPalette();

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, height);

      // Banquet Turntable Dimensions (Isometric perspective tilted oval)
      const cx = width / 2;
      const cy = height * 0.43;
      const rx = Math.min(width * 0.42, 230);
      const ry = rx * 0.48; // Tilted aspect ratio
      const tableThickness = 16;

      // 1. Draw Banquet Lazy Susan Wooden / Slate Platter
      g.save();

      // Platter rim side shadow
      g.beginPath();
      g.ellipse(cx, cy + tableThickness, rx, ry, 0, 0, Math.PI * 2);
      g.fillStyle = p.tableRim;
      g.fill();
      g.strokeStyle = p.rule;
      g.lineWidth = 1.2;
      g.stroke();

      // Side extrusion cylinder
      g.beginPath();
      g.rect(cx - rx, cy, rx * 2, tableThickness);
      g.fillStyle = p.tableRim;
      g.fill();

      // Top surface of rotating lazy susan
      g.beginPath();
      g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      const tableGrad = g.createRadialGradient(
        cx - rx * 0.2,
        cy - ry * 0.3,
        rx * 0.1,
        cx,
        cy,
        rx
      );
      tableGrad.addColorStop(0, p.tableWoodLight);
      tableGrad.addColorStop(0.7, p.tableWoodDark);
      tableGrad.addColorStop(1, p.tableRim);
      g.fillStyle = tableGrad;
      g.fill();
      g.strokeStyle = p.tableGroove;
      g.lineWidth = 1.5;
      g.stroke();

      // Concentric turntable lacquer ring grooves
      [0.86, 0.58, 0.36].forEach((scaleRatio) => {
        g.beginPath();
        g.ellipse(cx, cy, rx * scaleRatio, ry * scaleRatio, 0, 0, Math.PI * 2);
        g.strokeStyle = p.ruleSoft;
        g.lineWidth = 0.8;
        g.stroke();
      });

      // Rotating decorative brass radial spokes
      for (let s = 0; s < 6; s++) {
        const spokeA = angle + (s * Math.PI) / 3;
        const x1 = cx + Math.cos(spokeA) * rx * 0.36;
        const y1 = cy + Math.sin(spokeA) * ry * 0.36;
        const x2 = cx + Math.cos(spokeA) * rx * 0.86;
        const y2 = cy + Math.sin(spokeA) * ry * 0.86;

        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokeStyle = p.ruleSoft;
        g.lineWidth = 0.7;
        g.stroke();
      }

      g.restore();

      // 2. Calculate Dish Positions on Turntable Circle
      const N = BUFFET_DISHES.length;
      const dishOrbitR_x = rx * 0.76;
      const dishOrbitR_y = ry * 0.76;

      const projected = BUFFET_DISHES.map((dish, i) => {
        const dishAngle = angle + (i * 2 * Math.PI) / N;
        const x = cx + Math.cos(dishAngle) * dishOrbitR_x;
        const y = cy + Math.sin(dishAngle) * dishOrbitR_y;
        const z = Math.sin(dishAngle); // -1 (back) to +1 (front)

        // Depth perspective scale: front dishes are larger and higher contrast
        const scale = 0.76 + 0.34 * ((z + 1) / 2);
        const plateR = 21 * scale;
        const isDimmed = activeCategory !== "all" && dish.category !== activeCategory;
        const alpha = isDimmed ? 0.2 : (z > 0 ? 1 : 0.65 + 0.35 * ((z + 1) / 2));

        return { dish, x, y, z, plateR, scale, alpha };
      });

      stateRef.current.projectedDishes = projected;

      // Depth sort: back dishes first, then center vault cloche, then front dishes!
      const backDishes = projected.filter((d) => d.z < 0).sort((a, b) => a.z - b.z);
      const frontDishes = projected.filter((d) => d.z >= 0).sort((a, b) => a.z - b.z);

      // Function to render an individual dish plate
      function renderDishPlate(item: typeof projected[0]) {
        const { dish, x, y, plateR, scale, alpha } = item;
        const isSelected = selectedDishId === dish.id;
        const isHovered = hoveredDishId === dish.id;

        g.save();
        g.globalAlpha = alpha;

        // Plate drop shadow
        g.beginPath();
        g.ellipse(x, y + 4 * scale, plateR * 1.05, plateR * 0.62, 0, 0, Math.PI * 2);
        g.fillStyle = p.isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)";
        g.fill();

        // Selected / Hover glowing halo
        if (isSelected || isHovered) {
          g.beginPath();
          g.ellipse(x, y, plateR * 1.35, plateR * 0.85, 0, 0, Math.PI * 2);
          g.fillStyle = `rgba(${dish.accentRgb}, 0.28)`;
          g.fill();
        }

        // Porcelain outer plate
        g.beginPath();
        g.ellipse(x, y, plateR, plateR * 0.6, 0, 0, Math.PI * 2);
        g.fillStyle = p.surface;
        g.fill();
        g.strokeStyle = isSelected ? dish.accentColor : p.rule;
        g.lineWidth = isSelected ? 2 : 1;
        g.stroke();

        // Porcelain inner food bowl
        g.beginPath();
        g.ellipse(x, y - 1 * scale, plateR * 0.72, plateR * 0.44, 0, 0, Math.PI * 2);
        g.fillStyle = p.surfaceSoft;
        g.fill();
        g.strokeStyle = isSelected ? dish.accentColor : p.ruleSoft;
        g.lineWidth = 0.8;
        g.stroke();

        // Food icon / glyph
        const iconSize = Math.max(10, Math.round(15 * scale));
        g.font = `${iconSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(dish.foodIcon, x, y - 2 * scale);

        // Latency banner pill (always clearly visible for front or selected dishes)
        if (item.z > -0.3 || isSelected || isHovered) {
          const latText = `${dish.latencyMs}ms`;
          const fontSz = Math.max(8.5, Math.round(9 * scale));
          g.font = `700 ${fontSz}px monospace`;
          const badgeW = g.measureText(latText).width + 8;
          const badgeY = y + plateR * 0.65 + 6 * scale;

          // Chip background
          g.beginPath();
          g.rect(x - badgeW / 2, badgeY - 5.5, badgeW, 11);
          g.fillStyle = isSelected ? dish.accentColor : p.surface;
          g.fill();
          g.strokeStyle = isSelected ? dish.accentColor : p.rule;
          g.lineWidth = 0.8;
          g.stroke();

          // Latency text
          g.fillStyle = isSelected ? (p.isDark ? "#000" : "#fff") : dish.accentColor;
          g.textAlign = "center";
          g.fillText(latText, x, badgeY);

          // Name label for front-most dishes
          if (item.z > 0.3 || isSelected) {
            const nameY = badgeY + 12 * scale;
            g.font = `700 ${Math.max(9, Math.round(10 * scale))}px monospace`;
            const nameW = g.measureText(dish.name).width;

            g.beginPath();
            g.rect(x - nameW / 2 - 3, nameY - 6, nameW + 6, 12);
            g.fillStyle = p.isDark ? "rgba(28,25,23,0.85)" : "rgba(255,255,255,0.9)";
            g.fill();

            g.fillStyle = isSelected ? dish.accentColor : p.ink;
            g.fillText(dish.name, x, nameY);
          }
        }

        g.restore();
      }

      // 3. Draw Back Dishes
      backDishes.forEach(renderDishPlate);

      // 4. Center Master Chef Cloche Dome (FreeBuffet AES-256 Vault)
      g.save();
      const vaultR = rx * 0.28;
      const vaultRy = ry * 0.28;
      const vaultY = cy - 6;

      // Vault pedestal shadow
      g.beginPath();
      g.ellipse(cx, vaultY + 8, vaultR * 1.1, vaultRy * 1.1, 0, 0, Math.PI * 2);
      g.fillStyle = p.isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.18)";
      g.fill();

      // Golden Cloche Dome base ring
      g.beginPath();
      g.ellipse(cx, vaultY, vaultR, vaultRy, 0, 0, Math.PI * 2);
      g.fillStyle = p.surface;
      g.fill();
      g.strokeStyle = p.gold;
      g.lineWidth = 2;
      g.stroke();

      // Cloche hemisphere dome
      g.beginPath();
      g.arc(cx, vaultY - 4, vaultR * 0.85, Math.PI, 0, false);
      const domeGrad = g.createLinearGradient(
        cx - vaultR,
        vaultY - vaultR,
        cx + vaultR,
        vaultY
      );
      if (p.isDark) {
        domeGrad.addColorStop(0, "#f5b942");
        domeGrad.addColorStop(0.5, "#d97706");
        domeGrad.addColorStop(1, "#78350f");
      } else {
        domeGrad.addColorStop(0, "#fbbf24");
        domeGrad.addColorStop(0.6, "#d97706");
        domeGrad.addColorStop(1, "#b45309");
      }
      g.fillStyle = domeGrad;
      g.fill();
      g.strokeStyle = p.gold;
      g.lineWidth = 1.2;
      g.stroke();

      // Golden handle knob on top of cloche
      g.beginPath();
      g.arc(cx, vaultY - vaultR * 0.85 - 5, 5.5, 0, Math.PI * 2);
      g.fillStyle = p.gold;
      g.fill();
      g.strokeStyle = p.ink;
      g.lineWidth = 0.8;
      g.stroke();

      // Vault Title badge on dome
      g.font = "700 8.5px monospace";
      g.textAlign = "center";
      g.fillStyle = "#ffffff";
      g.fillText("165 VAULT", cx, vaultY - 14);
      g.font = "600 7px monospace";
      g.fillText("AES-256", cx, vaultY - 5);

      g.restore();

      // 5. Draw Front Dishes
      frontDishes.forEach(renderDishPlate);

      // 6. Draw Steam Particles Rising from Delicacies
      steamParticles.forEach((sp) => {
        g.save();
        const lifeRatio = sp.life / sp.maxLife;
        const alpha = Math.sin(lifeRatio * Math.PI) * 0.35;
        g.beginPath();
        g.arc(sp.x, sp.y, sp.size * (1 + lifeRatio * 0.8), 0, Math.PI * 2);
        g.fillStyle = p.isDark
          ? `rgba(245, 245, 245, ${alpha})`
          : `rgba(120, 113, 108, ${alpha})`;
        g.fill();
        g.restore();
      });

      // 7. Customer Agent Tasting Trays at the Bottom
      const trayY = height - 44;
      const trayCount = AGENT_CUSTOMERS.length;
      const traySpacing = Math.min((width - 40) / trayCount, 125);
      const startX = cx - ((trayCount - 1) * traySpacing) / 2;

      const agentPlates: typeof stateRef.current.agentPlates = [];

      AGENT_CUSTOMERS.forEach((agent, i) => {
        const trayX = startX + i * traySpacing;
        const trayW = Math.min(traySpacing - 8, 110);
        const trayH = 34;
        const isTarget = selectedAgent === agent.id;

        agentPlates.push({
          agent,
          x: trayX - trayW / 2,
          y: trayY,
          w: trayW,
          h: trayH,
        });

        g.save();

        // Customer tray plate
        g.beginPath();
        g.roundRect(trayX - trayW / 2, trayY, trayW, trayH, 4);
        g.fillStyle = isTarget ? (p.isDark ? "#292524" : "#f4f4f5") : p.surface;
        g.fill();
        g.strokeStyle = isTarget ? p.ink : p.ruleSoft;
        g.lineWidth = isTarget ? 1.6 : 0.8;
        g.stroke();

        // Chopsticks / Fork icon
        g.font = '11px "Segoe UI Emoji", sans-serif';
        g.textAlign = "left";
        g.fillText(agent.plateGlyph, trayX - trayW / 2 + 6, trayY + 16);

        // Agent Name
        g.font = "700 9.5px monospace";
        g.textAlign = "left";
        g.fillStyle = isTarget ? p.ink : p.rule;
        g.fillText(agent.name, trayX - trayW / 2 + 23, trayY + 13);

        // Config file name
        g.font = "600 7.5px monospace";
        g.fillStyle = p.isDark ? "rgba(242,248,252,0.6)" : "rgba(0,0,0,0.55)";
        g.fillText(agent.configFile, trayX - trayW / 2 + 23, trayY + 24);

        g.restore();
      });

      stateRef.current.agentPlates = agentPlates;

      // 8. Animated Token Drops (Dispensing from front dish to selected agent tray)
      tokenDrops.forEach((td) => {
        if (td.progress < 0) return;
        const curX = td.fromX + (td.toX - td.fromX) * td.progress;
        // Arc curve: drops fly up slightly then plunge down
        const arcY = Math.sin(td.progress * Math.PI) * 45;
        const curY = td.fromY + (td.toY - td.fromY) * td.progress - arcY;

        g.save();
        g.beginPath();
        g.arc(curX, curY, 3, 0, Math.PI * 2);
        g.fillStyle = td.color;
        g.fill();
        g.strokeStyle = p.isDark ? "#ffffff" : "#000000";
        g.lineWidth = 0.75;
        g.stroke();

        g.font = "700 8px monospace";
        g.fillStyle = td.color;
        g.fillText(td.glyph, curX + 4, curY + 2);
        g.restore();
      });

      // 9. Taste Test Ping Wave Ripple
      if (tasteRippleActive) {
        g.save();
        const ripR = (rx * 0.9) * tasteRipple;
        g.beginPath();
        g.ellipse(cx, cy, ripR, ripR * 0.48, 0, 0, Math.PI * 2);
        g.strokeStyle = `rgba(${p.greenRgb}, ${Math.max(0, 1 - tasteRipple)})`;
        g.lineWidth = 2.2;
        g.setLineDash([4, 4]);
        g.stroke();
        g.restore();
      }
    }

    function frame() {
      if (!running) return;
      updatePhysics();
      draw();
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    // Pointer events for dragging Lazy Susan
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
      state.lastMoveX = e.clientX;
      state.dragDist = 0;
      state.vAngle = 0;
      state.targetAngle = null;

      canvas!.setPointerCapture(e.pointerId);
      canvas!.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      const state = stateRef.current;
      const { x, y } = getCanvasCoords(e);

      if (state.isDragging) {
        const dx = e.clientX - state.lastMoveX;
        state.dragDist += Math.abs(dx);
        // Drag turntable rotation
        state.angle += dx * 0.007;
        state.vAngle = dx * 0.007;
        state.lastMoveX = e.clientX;
        return;
      }

      // Hit testing dishes
      let hovered: BuffetDish | null = null;
      for (const p of state.projectedDishes) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d <= p.plateR + 6) {
          hovered = p.dish;
          break;
        }
      }

      state.hoveredDishId = hovered ? hovered.id : null;
      canvas!.style.cursor = hovered ? "pointer" : "grab";
      if (hovered) {
        setActiveLog(`${hovered.foodIcon} ${hovered.name} · ${hovered.course} · ${hovered.latencyMs}ms latency · ${hovered.portion}`);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const state = stateRef.current;
      state.isDragging = false;
      canvas!.style.cursor = "grab";

      if (state.dragDist < 6) {
        const { x, y } = getCanvasCoords(e);

        // Check if user clicked an agent tray
        for (const plate of state.agentPlates) {
          if (
            x >= plate.x &&
            x <= plate.x + plate.w &&
            y >= plate.y &&
            y <= plate.y + plate.h
          ) {
            setSelectedAgent(plate.agent.id);
            setActiveLog(`Serving ${selectedDish.name} configuration into ${plate.agent.configFile}`);
            return;
          }
        }

        // Check if user clicked a dish
        for (const p of state.projectedDishes) {
          const d = Math.hypot(x - p.x, y - p.y);
          if (d <= p.plateR + 8) {
            rotateToDish(p.dish.id);
            return;
          }
        }
      }

      try {
        canvas!.releasePointerCapture(e.pointerId);
      } catch {}
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [rotateToDish, activeCategory, selectedDishId, selectedDish, selectedAgent]);

  return (
    <div className="hero-buffet-turntable-wrap" ref={containerRef}>
      {/* Top Banquet Header & Action Buttons */}
      <div className="buffet-hud-header">
        <div className="buffet-hud-title font-mono">
          <span className="buffet-live-dot" />
          <span className="buffet-title-text">ALL-YOU-CAN-EAT BUFFET</span>
          <span className="buffet-badge-count">165 DISHES ON TAP</span>
        </div>

        <div className="buffet-hud-controls">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="buffet-btn font-mono"
            title={isPaused ? "Resume revolving turntable" : "Pause turntable"}
          >
            {isPaused ? "SPIN ↻" : "PAUSE ⏸"}
          </button>
          <button
            type="button"
            onClick={triggerTasteTest}
            className="buffet-btn primary font-mono"
            title="Send live test ping and dispense token stream"
          >
            TASTE TEST 🥢
          </button>
          <button
            type="button"
            onClick={() => rotateToDish("cerebras")}
            className="buffet-btn font-mono"
            title="Rotate to fastest dish"
          >
            FASTEST (24ms)
          </button>
        </div>
      </div>

      {/* Serving Alert Banner */}
      {servingAlert && (
        <div className="buffet-serving-alert font-mono" role="status">
          <span>{servingAlert}</span>
        </div>
      )}

      {/* Course Filter Chips */}
      <div className="buffet-course-filter font-mono">
        <span className="course-label">COURSE:</span>
        {(
          [
            ["all", "FULL BANQUET (165)"],
            ["express", "FAST EXPRESS (Sub-50ms)"],
            ["frontier", "FRONTIER CHEF"],
            ["free", "ALWAYS FREE (No-CC)"],
            ["local", "LOCAL $0 (Home-Cooked)"],
          ] as const
        ).map(([cat, label]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`buffet-filter-chip ${activeCategory === cat ? "active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 3D Lazy Susan Buffet Canvas */}
      <div className="buffet-canvas-container">
        <canvas ref={canvasRef} className="buffet-canvas" />

        {/* Restaurant Order Receipt Docket (Selected Dish Inspector) */}
        <div className="buffet-order-ticket font-mono" role="region" aria-label="Order Ticket">
          <div className="ticket-header">
            <div className="ticket-title-row">
              <span className="ticket-dish-icon">{selectedDish.foodIcon}</span>
              <div>
                <div className="ticket-dish-name">{selectedDish.name}</div>
                <div className="ticket-dish-sub">{selectedDish.subtitle}</div>
              </div>
            </div>
            <div className="ticket-latency-tag" style={{ color: selectedDish.accentColor }}>
              {selectedDish.latencyMs}ms OK
            </div>
          </div>

          <div className="ticket-body">
            <div className="ticket-meta-row">
              <span className="meta-k">COURSE:</span>
              <span className="meta-v">{selectedDish.course}</span>
            </div>
            <div className="ticket-meta-row">
              <span className="meta-k">PORTION:</span>
              <span className="meta-v highlight">{selectedDish.portion}</span>
            </div>
            <div className="ticket-meta-row">
              <span className="meta-k">TOP MODEL:</span>
              <span className="meta-v">{selectedDish.topModel}</span>
            </div>
            <div className="ticket-meta-row">
              <span className="meta-k">ENDPOINT:</span>
              <span className="meta-v endpoint" title={selectedDish.endpoint}>
                {selectedDish.endpoint.replace(/^https?:\/\//, "")}
              </span>
            </div>

            {/* Target Agent Customer Plate Selector */}
            <div className="ticket-agent-tabs">
              <span className="agent-select-label">SERVE TO AGENT:</span>
              <div className="agent-tab-btns">
                {AGENT_CUSTOMERS.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`agent-tab-btn ${selectedAgent === agent.id ? "active" : ""}`}
                  >
                    <span>{agent.plateGlyph}</span>
                    <span>{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Generated Config Receipt */}
            <div className="ticket-code-box">
              <div className="ticket-code-header">
                <span>
                  <i className="fas fa-receipt" style={{ marginRight: "4px" }} />
                  {selectedAgentInfo.configFile}
                </span>
                <span className="ticket-auth-tag">
                  {selectedDish.envKey === "NONE" ? "0 Keys Needed" : selectedDish.envKey}
                </span>
              </div>
              <pre className="ticket-code-pre">
                <code>{selectedDish.configs[selectedAgent]}</code>
              </pre>
            </div>

            <div className="ticket-action-row">
              <button
                type="button"
                onClick={handleCopyConfig}
                className="btn-broadsheet-primary"
                style={{
                  flex: 1,
                  padding: "0.38rem 0.6rem",
                  fontSize: "9px",
                  textAlign: "center",
                }}
              >
                {copied ? "COPIED TO CLIPBOARD ✓" : "TAKE AWAY CONFIG"}
              </button>
              <button
                type="button"
                onClick={triggerTasteTest}
                className="btn-broadsheet-outline"
                style={{
                  padding: "0.38rem 0.6rem",
                  fontSize: "9px",
                }}
                title="Send test request and stream tokens"
              >
                SAMPLE DISH 🥢
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chef's Status Telemetry Ticker */}
      <div className="buffet-hud-bottom font-mono">
        <span className="buffet-chef-tag">CHEF DISPATCH</span>
        <span className="buffet-ticker-text" title={activeLog}>
          {activeLog}
        </span>
      </div>
    </div>
  );
}
