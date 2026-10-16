# FreeBuffet 🍱

All-you-can-eat LLM providers — manage API keys, health-check 165+ providers, and auto-generate configs for OpenCode, Codex CLI, Claude Code, and Antigravity CLI.

## Architecture

| File | Purpose |
|------|---------|
| `src/providers.ts` | 165 providers with `id`, `name`, `baseURL`, `envKey`, `website`, `apiType`, `freeTier`, `noCc`, `permanentFree`, `recommended`, `tags` |
| `src/health.ts` | Pings `/v1/models` (OpenAI) or `/v1/messages` (Anthropic); returns `{status, latencyMs, models[], error?}` |
| `src/config.ts` | AES-256-GCM encrypted local key store at `~/.config/freebuffet/config.enc` |
| `src/configs/opencode.ts` | Generates `opencode.json` with `@ai-sdk/openai-compatible` / `@ai-sdk/anthropic` |
| `src/configs/codex.ts` | Generates `~/.codex/config.toml` (model_providers tables) |
| `src/configs/claude.ts` | Generates `~/.claude/settings.json` + env vars |
| `src/configs/antigravity.ts` | Generates `~/.config/antigravity/config.toml` entries |
| `src/index.ts` | Interactive CLI: filter → search providers → enter key → instant health check → model selection → agent configs |

## Key Decisions
- UI: `@clack/prompts` + `picocolors`
- Package name: `freebuffet`, bins: `fb` / `freebuffet`
- 25 curated "free-coding favorites" with capability tags (coding, reasoning, vision, free, fast, no-cc)
- Encrypted key store bound to machine (scrypt + AES-256-GCM)
- `envKey` is optional — local/free providers (Ollama, LM Studio, vLLM, etc.) don't need one
- ModelScope returns models publicly at `https://api-inference.modelscope.cn/v1/models` (no auth needed)

## Build & Verify
```sh
bunx tsc --noEmit       # type check
bun run build           # bundle to dist/
bun run dev             # run interactively
```

## Current Status
- Full 165-provider registry ✓
- 25 curated free-coding favorites ✓
- Health check (latency + model discovery) ✓
- Config gen for all 4 agents ✓
- Encrypted API key persistence ✓
- Per-provider model selection ✓
- TypeScript compiles clean ✓
- Build produces ~130KB `dist/index.js` in ~7ms ✓
- Not yet published to npm

## agent-stats (new)

`bunx freebuffet/src/agent-stats-cli.ts` or `node dist/agent-stats-cli.js`

Scans local filesystem configs and logs for CLI/GUI coding agents and reports:
- Token usage (input/output/total) per agent
- Daily activity and streaks (current + longest)
- Installation and configuration status
- Zed token validity (via ~/.zed_jwt_token)

Agents detected:
| Agent | Config location | Usage logs |
|-------|-----------------|------------|
| OpenCode | ~/.config/opencode/opencode.json, ~/.local/share/opencode/auth.json | ~/.local/share/opencode/logs/*.log, history/ |
| Codex CLI | ~/.codex/config.toml | ~/.codex/logs/*.log |
| Claude Code | ~/.claude/settings.json | ~/.claude/logs/*.log, ~/.claude/history/*.jsonl, ~/.claude/projects/*/logs/*.log |
| Antigravity | ~/.config/antigravity/config.toml | not yet parsed |
| pi | ~/.pi/ | ~/.pi/logs/*.log, ~/.pi/history.jsonl |
| Hermes | ~/.hermes/config.yaml | not yet parsed |
| Zed (zed2cli) | ~/.zed_jwt_token, ~/.zed_access_token | cloud-side only |

Flags:
- `--json` / `-j`: output JSON instead of human-readable report

Usage extraction handles these JSON shapes:
- `{ usage: { prompt_tokens, completion_tokens, total_tokens } }`
- `{ usage: { input_tokens, output_tokens } }`
- `{ prompt_tokens, completion_tokens }` (top-level)
- Zed stream events: `{ event: { type: "message_start", message: { usage: {...} } } }`
- Zed message_delta: `{ event: { type: "message_delta", usage: {...} } }`

Streak logic:
- A "streak day" = any day with >0 tokens or messages
- Current streak: consecutive days ending today or yesterday
- Longest streak: max consecutive days in the recorded window
- Days are compared in UTC

## Future Ideas
- Publish to npm
- Per-provider model count display during health check
- "Refresh config" command to re-fetch models
- More providers as new free/cheap services emerge
