# FreeBuffet

**One CLI to configure every AI coding agent with 165 LLM providers.**

Add API keys, health-check providers, and auto-generate configs for **OpenCode**, **Codex CLI**, and **Claude Code** from one interactive terminal session.

```sh
npx freebuffet
# or
bunx freebuffet
```

---

## Features

- **165 providers** — Groq, OpenAI, Anthropic, Together, Fireworks, DeepInfra, Cerebras, Replicate, Ollama, LM Studio, and 155+ more
- **47 no-credit-card providers** — free tiers that don't require billing info
- **99 permanent free tiers** — providers with always-free access
- **19 local engines** — Ollama, llama.cpp, vLLM, LocalAI, LM Studio, and more (zero cost)
- **Zero-config health check** — pings each provider's `/v1/models` or `/v1/messages`, measures latency, and discovers available models
- **3 target agents** — generate configs for OpenCode, Codex CLI, and Claude Code simultaneously
- **Interactive TUI** — searchable provider list, API key prompts, live health check spinner, config preview
- **Batteries included** — works immediately with [bun](https://bun.sh), no additional runtime deps

## Usage

Run the CLI:

```sh
npx freebuffet
```

Or if you have [bun](https://bun.sh) installed:

```sh
bunx freebuffet
```

Or run globally:

```sh
npm install -g freebuffet
fb
```

### The 5-Step Workflow

```
Step 1 ── Select providers (searchable checklist)
     │       Pick from 165 providers — type to filter
     ▼
Step 2 ── Enter API keys
     │       Prompts only for providers that need keys
     ▼           (local engines are auto-skipped)
Step 3 ── Health check
     │       Pings each provider, measures latency,
     ▼           discovers available models
Step 4 ── Select target agents
     │       OpenCode, Codex CLI, Claude Code,
     ▼           or all at once
Step 5 ── Configs generated
             Files written: opencode.json,
             ~/.local/share/opencode/auth.json,
             ~/.codex/config.toml, ~/.codex/freebuffet.env,
             ~/.claude/settings.json
```

### Output Files

| Agent | File | Description |
|-------|------|-------------|
| **OpenCode** | `./opencode.json` + `~/.local/share/opencode/auth.json` | Provider config with model lists + API keys |
| **Codex CLI** | `~/.codex/config.toml` + `~/.codex/freebuffet.env` | `[model_providers]` entries + API key exports |
| **Claude Code** | `~/.claude/settings.json` + `~/.claude/env.sh` | Settings JSON + API key exports |

## Supported Providers (165)

### Cloud Providers — Free Tier (47, no CC needed)

| Provider | baseURL | Free Tier |
|----------|---------|-----------|
| Groq | `api.groq.com/openai/v1` | 30 RPM, 14,400 RPD |
| Cerebras | `api.cerebras.ai/v1` | 1M tokens/day |
| Google Gemini | `generativelanguage.googleapis.com/v1beta` | 1,500 RPD (Flash) |
| GitHub Models | `models.github.ai/inference` | Free for GitHub accounts |
| Mistral AI | `api.mistral.ai/v1` | 1B tokens/month |
| Cloudflare Workers AI | `api.cloudflare.com/client/v4/accounts/{account}/ai/v1` | 10K neurons/day |
| Hugging Face | `router.huggingface.co/v1` | $0.10/mo credits |
| Cohere | `api.cohere.com/v2` | 1K requests/mo trial |
| AI21 Labs | `api.ai21.com/studio/v1` | 200 RPM, 10 RPS |
| OpenRouter | `openrouter.ai/api/v1` | 20+ free models |
| DeepSeek | `api.deepseek.com/v1` | 10M free tokens |
| Zhipu AI / GLM | `open.bigmodel.cn/api/paas/v4` | Free Flash models |
| SiliconFlow | `api.siliconflow.cn/v1` | 1K RPM on free models |
| ... and 34 more | | |

### Cloud Providers — Paid / Trial Credits

OpenAI, Anthropic, xAI/Grok, Together AI, Fireworks AI, Baseten, Nebius AI, DeepInfra, Novita AI, Perplexity, Replicate, Modal, SambaNova, Scaleway, Hyperbolic, Inference.net, Upstage, and 40+ more.

### Local & Self-Hosted (18)

Ollama, LM Studio, llama.cpp, vLLM, LocalAI, SGLang, Text Generation WebUI, TabbyAPI, KoboldCpp, Aphrodite Engine, GPT4All, Jan.ai, Tabby AI, MindSpore, ONNX Runtime, AegisGate, FreeLLMAPI, Atomic Chat.

### Chinese & Asian Providers

ModelScope, DashScope / Alibaba, MiniMax, Moonshot / Kimi, Baichuan, Stepfun, Tencent Hunyuan, ByteDance Volcengine / Ark, SenseTime, Yi / 01.AI, Gitee AI, Xiaomi Mimo, and more.

### European & GDPR-Compliant

OVHcloud, Scaleway, Nebius, Aleph Alpha, AiQu, Berget AI, Cortecs AI, EUrouter, Infercom, Verda.

### Gateways & Aggregators

OpenRouter, Portkey, Helicone, LiteLLM, Cloudflare AI Gateway, Vercel AI Gateway, Routeway, Adaline, LLM Gateway, TokenRouter, FastRouter, ZenMux.

## Development

```sh
# Clone
git clone https://github.com/code6yte/freebuffet
cd freebuffet

# Install dependencies
bun install

# Type check
bun run typecheck       # tsc --noEmit

# Build
bun run build           # bun build ./src/index.ts --outdir ./dist --target node

# Run locally
bun run dev             # bun run ./src/index.ts
```

### Project Structure

```
freebuffet/
├── src/
│   ├── index.ts              # CLI entry point (5-step workflow)
│   ├── providers.ts          # 165 provider definitions
│   ├── health.ts             # Health check logic
│   └── configs/
│       ├── index.ts          # Re-exports + generateAllConfigs
│       ├── opencode.ts       # opencode.json generator
│       ├── codex.ts          # ~/.codex/config.toml generator
│       ├── claude.ts         # Claude Code settings + env vars
│       └── antigravity.ts    # Experimental Antigravity CLI config generator
├── scripts/
│   ├── sync-modelscope-models.py
│   └── opencode-with-modelscope
├── dist/
│   └── index.js              # Built output (~115KB)
├── package.json
├── AGENTS.md
└── README.md
```

## License

MIT
