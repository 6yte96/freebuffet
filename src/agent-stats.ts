#!/usr/bin/env node
/**
 * agent-stats — scan local filesystem configs and logs for CLI/GUI coding agents
 * and report token usage + streaks.
 *
 * Agents detected:
 *  - OpenCode        (~/.config/opencode/, ~/.local/share/opencode/auth.json, logs)
 *  - Codex CLI       (~/.codex/config.toml, ~/.codex/*.log)
 *  - Claude Code     (~/.claude/settings.json, ~/.claude/*.log, ~/.claude/history/)
 *  - Antigravity     (~/.config/antigravity/config.toml)
 *  - pi              (~/.pi/, pi logs)
 *  - Hermes          (~/.hermes/config.yaml)
 *  - Zed (via zed2cli)  (~/.zed_jwt_token, ~/.local/state/zed-refresh/)
 *
 * Streak logic:
 *   - Parse timestamped log entries or history files.
 *   - Group by UTC day.
 *   - A "streak day" is any day with >0 tokens used (or >0 messages, depending on agent).
 *   - Current streak = consecutive days ending today (or yesterday if today is empty).
 *   - Longest streak = max consecutive days in the recorded window.
 *
 * Token usage:
 *   - Sum prompt_tokens + completion_tokens (or input/output) across all parsed entries.
 *   - Where agents expose usage in their logs/history, extract it.
 *   - Where they don't, report "usage unknown (no usage logs found)".
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentUsageEntry {
  timestamp?: string; // ISO-ish or raw string
  date?: string; // UTC YYYY-MM-DD
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  messages?: number; // fallback when tokens unknown
  model?: string;
  raw?: unknown;
}

export interface AgentStats {
  agent: string;
  installed: boolean;
  configured: boolean;
  tokenSource?: string; // e.g. "env ZED_TOKEN", "~/.zed_jwt_token", "keyring"
  tokenValid?: boolean;
  tokenExpiry?: string;
  usageEntries: AgentUsageEntry[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalMessages: number;
  daysActive: string[]; // UTC YYYY-MM-DD sorted
  currentStreak: number;
  longestStreak: number;
  lastUsed?: string;
  firstUsed?: string;
  usageUnknown: boolean;
}

export interface ScanResult {
  agents: AgentStats[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalMessages: number;
  totalDaysActive: number;
  currentStreak: number;
  longestStreak: number;
  scanTime: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function utcDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayKeyFromDateString(s: string): string | null {
  // Accept YYYY-MM-DD or parse common date formats
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (!isNaN(d.getTime())) return utcDate(d.getTime());
  return null;
}

function parseTimestamp(raw: string): number | null {
  // Try ISO, then common log formats
  const trimmed = raw.trim();

  // ISO-like: 2026-09-10T12:34:56...
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
  if (iso) {
    const d = new Date(iso[1].replace(" ", "T"));
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Unix epoch (pure digits, 10-13 chars)
  if (/^\d{10,13}$/.test(trimmed)) {
    const n = Number(trimmed);
    return n > 1e12 ? n : n * 1000;
  }

  // "Sep 10 2026 12:34:56" style
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.getTime();

  return null;
}

// parseISO removed — not used


function computeStreaks(daysActive: string[]): { current: number; longest: number } {
  if (daysActive.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(daysActive)].sort();
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const curr = new Date(sorted[i] + "T00:00:00Z");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      cur += 1;
      if (cur > longest) longest = cur;
    } else {
      cur = 1;
    }
  }
  if (cur > longest) longest = cur;

  // Current streak: count from most recent day backward
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const prev = new Date(sorted[i - 1] + "T00:00:00Z");
    const curr = new Date(sorted[i] + "T00:00:00Z");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) current += 1;
    else break;
  }

  // If today (or yesterday) is not in the list, current streak starts from most recent
  const today = utcDate(Date.now());
  const yesterday = utcDate(Date.now() - 86400000);
  if (sorted[sorted.length - 1] !== today && sorted[sorted.length - 1] !== yesterday) {
    // Streak is broken; current = 0 unless we count from last used
    // We'll still report the backward count but flag it
    current = 0;
  }

  return { current, longest };
}

// ---------------------------------------------------------------------------
// Token/source helpers (reuse logic from zed2cli)
// ---------------------------------------------------------------------------

function zedTokenSources(): { installed: boolean; configured: boolean; tokenSource?: string; tokenValid?: boolean; tokenExpiry?: string } {
  const jwtFile = join(homedir(), ".zed_jwt_token");
  const accessTokenFile = join(homedir(), ".zed_access_token");
  const stateDir = join(homedir(), ".local", "state", "zed-refresh");

  const hasJwt = existsSync(jwtFile);
  const hasAccessToken = existsSync(accessTokenFile);
  const hasStateDir = existsSync(stateDir);
  const hasZedTokenEnv = typeof process.env.ZED_TOKEN === "string" && process.env.ZED_TOKEN.trim().length > 0;

  let source: string | undefined;
  if (hasZedTokenEnv) source = "env ZED_TOKEN";
  else if (hasJwt) source = jwtFile;
  else if (hasAccessToken) source = accessTokenFile;
  else if (hasStateDir) source = "zed-refresh state (daemon may be running)";

  // Try to decode JWT expiry if we have a file
  let tokenValid: boolean | undefined;
  let tokenExpiry: string | undefined;
  const tokPath = hasJwt ? jwtFile : hasAccessToken ? accessTokenFile : undefined;

  if (tokPath) {
    try {
      const raw = readFileSync(tokPath, "utf-8").trim().split("\n").find(Boolean);
      if (raw && raw.startsWith("eyJ")) {
        const payload = raw.split(".")[1];
        if (payload) {
          const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
          const padlen = (4 - (padded.length % 4)) % 4;
          const base64 = padded + "=".repeat(padlen);
          const decoded = Buffer.from(base64, "base64").toString("utf-8");
          try {
            const json = JSON.parse(decoded);
            if (json.exp) {
              tokenValid = json.exp > Date.now() / 1000;
              tokenExpiry = new Date(json.exp * 1000).toISOString();
            }
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
  }

  return {
    installed: hasJwt || hasAccessToken || hasZedTokenEnv || hasStateDir,
    configured: source !== undefined,
    tokenSource: source,
    tokenValid,
    tokenExpiry,
  };
}

function hasZwtFile(): boolean {
  // Typo protection: check both spellings
  return existsSync(join(homedir(), ".zed_jwt_token"));
}

function hasAccessTokenFile(): boolean {
  return existsSync(join(homedir(), ".zed_access_token"));
}

// ---------------------------------------------------------------------------
// OpenCode
// ---------------------------------------------------------------------------

interface OpenCodeAuthFile {
  [providerId: string]: { type: "api"; key: string } | { type: "oauth"; access_token: string; refresh_token?: string; expiry?: number };
}

function scanOpenCode(): AgentStats {
  const configDir = join(homedir(), ".config", "opencode");
  const configFile = join(configDir, "opencode.json");
  const authFile = join(homedir(), ".local", "share", "opencode", "auth.json");
  const logsDir = join(homedir(), ".local", "share", "opencode", "logs");
  const historyDir = join(homedir(), ".local", "share", "opencode", "history");

  const configured = existsSync(configFile) || existsSync(authFile);

  // Try to find usage in logs or history
  const usageEntries: AgentUsageEntry[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalMessages = 0;
  const daysSet = new Set<string>();

  // OpenCode may log to ~/.local/share/opencode/logs/*.log or keep history
  // Format varies; try to extract anything timestamped with token counts
  for (const dir of [logsDir, historyDir]) {
    if (!existsSync(dir)) continue;
    try {
      for (const file of readdirSync(dir)) {
        const filePath = join(dir, file);
        if (!statSync(filePath).isFile()) continue;
        const content = readFileSync(filePath, "utf-8");
        // Try JSON lines or NDJSON
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const entry = extractUsageFromObject(parsed);
            if (entry) {
              usageEntries.push(entry);
              if (entry.inputTokens) totalInput += entry.inputTokens;
              if (entry.outputTokens) totalOutput += entry.outputTokens;
              if (entry.totalTokens) totalInput += entry.totalTokens; // approximate
              if (entry.messages) totalMessages += entry.messages;
              if (entry.date) daysSet.add(entry.date);
              else if (entry.timestamp) {
                const ts = parseTimestamp(entry.timestamp);
                if (ts) daysSet.add(utcDate(ts));
              }
            }
          } catch { /* skip non-JSON lines */ }
        }
      }
    } catch { /* ignore read errors */ }
  }

  // Fallback: if OpenCode keeps a SQLite or other DB, we can't parse easily
  const usageUnknown = usageEntries.length === 0;

  // Deduplicate entries by approximate timestamp
  const deduped = deduplicateEntries(usageEntries);

  const days = [...daysSet].sort();
  const streaks = computeStreaks(days);

  let lastUsed: string | undefined;
  let firstUsed: string | undefined;
  if (days.length > 0) {
    firstUsed = days[0];
    lastUsed = days[days.length - 1];
  }

  return {
    agent: "OpenCode",
    installed: existsSync(configDir),
    configured,
    usageEntries: deduped,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    totalMessages,
    daysActive: days,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    lastUsed,
    firstUsed,
    usageUnknown,
  };
}

// ---------------------------------------------------------------------------
// Codex CLI
// ---------------------------------------------------------------------------

function scanCodex(): AgentStats {
  const configDir = join(homedir(), ".codex");
  const configFile = join(configDir, "config.toml");
  const logsDir = join(configDir, "logs");
  const authEnvFile = join(configDir, "freebuffet.env"); // created by freebuffet

  const configured = existsSync(configFile);

  const usageEntries: AgentUsageEntry[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalMessages = 0;
  const daysSet = new Set<string>();

  // Codex keeps logs in ~/.codex/logs/*.log (JSON lines with usage)
  if (existsSync(logsDir)) {
    try {
      for (const file of readdirSync(logsDir)) {
        if (!file.endsWith(".log")) continue;
        const filePath = join(logsDir, file);
        const content = readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const entry = extractUsageFromObject(parsed);
            if (entry) {
              usageEntries.push(entry);
              if (entry.inputTokens) totalInput += entry.inputTokens;
              if (entry.outputTokens) totalOutput += entry.outputTokens;
              if (entry.totalTokens) totalOutput += entry.totalTokens;
              if (entry.messages) totalMessages += entry.messages;
              if (entry.date) daysSet.add(entry.date);
              else if (entry.timestamp) {
                const ts = parseTimestamp(entry.timestamp);
                if (ts) daysSet.add(utcDate(ts));
              }
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* ignore */ }
  }

  const usageUnknown = usageEntries.length === 0;
  const deduped = deduplicateEntries(usageEntries);
  const days = [...daysSet].sort();
  const streaks = computeStreaks(days);

  let lastUsed: string | undefined;
  let firstUsed: string | undefined;
  if (days.length > 0) {
    firstUsed = days[0];
    lastUsed = days[days.length - 1];
  }

  return {
    agent: "Codex CLI",
    installed: existsSync(configDir),
    configured,
    usageEntries: deduped,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    totalMessages,
    daysActive: days,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    lastUsed,
    firstUsed,
    usageUnknown,
  };
}

// ---------------------------------------------------------------------------
// Claude Code
// ---------------------------------------------------------------------------

function scanClaudeCode(): AgentStats {
  const configDir = join(homedir(), ".claude");
  const settingsFile = join(configDir, "settings.json");
  const logsDir = join(configDir, "logs");
  const historyDir = join(configDir, "history");
  const projectDir = join(configDir, "projects");

  const configured = existsSync(settingsFile);

  const usageEntries: AgentUsageEntry[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalMessages = 0;
  const daysSet = new Set<string>();

  // Claude Code logs: ~/.claude/logs/*.log or ~/.claude/history/*.jsonl
  for (const dir of [logsDir, historyDir]) {
    if (!existsSync(dir)) continue;
    try {
      for (const file of readdirSync(dir)) {
        const filePath = join(dir, file);
        if (!statSync(filePath).isFile()) continue;
        const content = readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const entry = extractUsageFromObject(parsed);
            if (entry) {
              usageEntries.push(entry);
              if (entry.inputTokens) totalInput += entry.inputTokens;
              if (entry.outputTokens) totalOutput += entry.outputTokens;
              if (entry.totalTokens) totalOutput += entry.totalTokens;
              if (entry.messages) totalMessages += entry.messages;
              if (entry.date) daysSet.add(entry.date);
              else if (entry.timestamp) {
                const ts = parseTimestamp(entry.timestamp);
                if (ts) daysSet.add(utcDate(ts));
              }
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* ignore */ }
  }

  // Also scan project logs if any
  if (existsSync(projectDir)) {
    try {
      for (const proj of readdirSync(projectDir)) {
        const projLogDir = join(projectDir, proj, "logs");
        if (!existsSync(projLogDir)) continue;
        for (const file of readdirSync(projLogDir)) {
          if (!file.endsWith(".log")) continue;
          const filePath = join(projLogDir, file);
          const content = readFileSync(filePath, "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const entry = extractUsageFromObject(parsed);
              if (entry) {
                usageEntries.push(entry);
                if (entry.inputTokens) totalInput += entry.inputTokens;
                if (entry.outputTokens) totalOutput += entry.outputTokens;
                if (entry.totalTokens) totalOutput += entry.totalTokens;
                if (entry.messages) totalMessages += entry.messages;
                if (entry.date) daysSet.add(entry.date);
                else if (entry.timestamp) {
                  const ts = parseTimestamp(entry.timestamp);
                  if (ts) daysSet.add(utcDate(ts));
                }
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* ignore */ }
  }

  const usageUnknown = usageEntries.length === 0;
  const deduped = deduplicateEntries(usageEntries);
  const days = [...daysSet].sort();
  const streaks = computeStreaks(days);

  let lastUsed: string | undefined;
  let firstUsed: string | undefined;
  if (days.length > 0) {
    firstUsed = days[0];
    lastUsed = days[days.length - 1];
  }

  return {
    agent: "Claude Code",
    installed: existsSync(configDir),
    configured,
    usageEntries: deduped,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    totalMessages,
    daysActive: days,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    lastUsed,
    firstUsed,
    usageUnknown,
  };
}

// ---------------------------------------------------------------------------
// Antigravity
// ---------------------------------------------------------------------------

function scanAntigravity(): AgentStats {
  const configDir = join(homedir(), ".config", "antigravity");
  const configFile = join(configDir, "config.toml");

  const configured = existsSync(configFile);

  // Antigravity may keep usage logs; location not standardized yet
  const usageEntries: AgentUsageEntry[] = [];
  const usageUnknown = true; // no known log format yet

  return {
    agent: "Antigravity",
    installed: existsSync(configDir),
    configured,
    usageEntries,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalMessages: 0,
    daysActive: [],
    currentStreak: 0,
    longestStreak: 0,
    usageUnknown,
  };
}

// ---------------------------------------------------------------------------
// pi (pi coding agent)
// ---------------------------------------------------------------------------

function scanPi(): AgentStats {
  const configDir = join(homedir(), ".pi");
  const logsDir = join(configDir, "logs");
  const historyFile = join(configDir, "history.jsonl");

  const installed = existsSync(configDir);

  const usageEntries: AgentUsageEntry[] = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalMessages = 0;
  const daysSet = new Set<string>();

  // pi may keep logs
  for (const dir of [logsDir]) {
    if (!existsSync(dir)) continue;
    try {
      for (const file of readdirSync(dir)) {
        const filePath = join(dir, file);
        if (!statSync(filePath).isFile()) continue;
        const content = readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            const entry = extractUsageFromObject(parsed);
            if (entry) {
              usageEntries.push(entry);
              if (entry.inputTokens) totalInput += entry.inputTokens;
              if (entry.outputTokens) totalOutput += entry.outputTokens;
              if (entry.totalTokens) totalOutput += entry.totalTokens;
              if (entry.messages) totalMessages += entry.messages;
              if (entry.date) daysSet.add(entry.date);
              else if (entry.timestamp) {
                const ts = parseTimestamp(entry.timestamp);
                if (ts) daysSet.add(utcDate(ts));
              }
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* ignore */ }
  }

  if (existsSync(historyFile)) {
    try {
      const content = readFileSync(historyFile, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          // pi history may have "timestamp", "message", "model", "usage"
          const entry = extractUsageFromObject(parsed);
          if (entry) {
            usageEntries.push(entry);
            if (entry.inputTokens) totalInput += entry.inputTokens;
            if (entry.outputTokens) totalOutput += entry.outputTokens;
            if (entry.totalTokens) totalOutput += entry.totalTokens;
            if (entry.messages) totalMessages += entry.messages;
            if (entry.date) daysSet.add(entry.date);
            else if (entry.timestamp) {
              const ts = parseTimestamp(entry.timestamp);
              if (ts) daysSet.add(utcDate(ts));
            }
          }
        } catch { /* skip */ }
      }
    } catch { /* ignore */ }
  }

  const usageUnknown = usageEntries.length === 0;
  const deduped = deduplicateEntries(usageEntries);
  const days = [...daysSet].sort();
  const streaks = computeStreaks(days);

  let lastUsed: string | undefined;
  let firstUsed: string | undefined;
  if (days.length > 0) {
    firstUsed = days[0];
    lastUsed = days[days.length - 1];
  }

  return {
    agent: "pi",
    installed,
    configured: installed, // pi is configured if installed
    usageEntries: deduped,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    totalMessages,
    daysActive: days,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    lastUsed,
    firstUsed,
    usageUnknown,
  };
}

// ---------------------------------------------------------------------------
// Hermes
// ---------------------------------------------------------------------------

function scanHermes(): AgentStats {
  const configDir = join(homedir(), ".hermes");
  const configFile = join(configDir, "config.yaml");

  const installed = existsSync(configDir);
  const configured = existsSync(configFile);

  // Hermes may keep logs; location not standardized
  const usageEntries: AgentUsageEntry[] = [];
  const usageUnknown = true;

  return {
    agent: "Hermes",
    installed,
    configured,
    usageEntries,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalMessages: 0,
    daysActive: [],
    currentStreak: 0,
    longestStreak: 0,
    usageUnknown,
  };
}

// ---------------------------------------------------------------------------
// Zed (via zed2cli bridge)
// ---------------------------------------------------------------------------

function scanZed(): AgentStats {
  const sources = zedTokenSources();

  // Zed doesn't keep local usage logs; usage is on cloud.zed.dev
  // We report token validity but no local usage stats
  return {
    agent: "Zed (zed2cli)",
    installed: sources.installed,
    configured: sources.configured,
    tokenSource: sources.tokenSource,
    tokenValid: sources.tokenValid,
    tokenExpiry: sources.tokenExpiry,
    usageEntries: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalMessages: 0,
    daysActive: [],
    currentStreak: 0,
    longestStreak: 0,
    usageUnknown: true,
  };
}

// ---------------------------------------------------------------------------
// Usage extraction from arbitrary JSON objects
// ---------------------------------------------------------------------------

function extractUsageFromObject(obj: Record<string, unknown>): AgentUsageEntry | null {
  // Try common shapes:
  // - { usage: { input_tokens, output_tokens, total_tokens } }
  // - { usage: { prompt_tokens, completion_tokens, total_tokens } }
  // - { prompt_tokens, completion_tokens }
  // - { input_tokens, output_tokens }
  // - { message: { usage: {...} } }  (Zed stream)
  // - { timestamp, date, model }

  let inputTokens: number | undefined;
  let outputTokens: number | undefined;
  let totalTokens: number | undefined;
  let messages: number | undefined;
  let timestamp: string | undefined;
  let date: string | undefined;
  let model: string | undefined;

  // Walk known paths
  const usage = obj.usage;
  if (usage && typeof usage === "object" && !Array.isArray(usage)) {
    const u = usage as Record<string, unknown>;
    inputTokens = num(u.prompt_tokens ?? u.input_tokens ?? u.inputTokenCount ?? u.input_token_count);
    outputTokens = num(u.completion_tokens ?? u.output_tokens ?? u.outputTokenCount ?? u.output_token_count ?? u.response_tokens);
    totalTokens = num(u.total_tokens ?? u.totalTokenCount ?? u.total_token_count ?? u.total_tokens);
    if (inputTokens && outputTokens && totalTokens === undefined) totalTokens = inputTokens + outputTokens;
  }

  // Top-level tokens
  if (inputTokens === undefined) inputTokens = num(obj.prompt_tokens ?? obj.input_tokens ?? obj.inputTokenCount);
  if (outputTokens === undefined) outputTokens = num(obj.completion_tokens ?? obj.output_tokens ?? obj.outputTokenCount ?? obj.response_tokens);
  if (totalTokens === undefined) totalTokens = num(obj.total_tokens ?? obj.totalTokenCount ?? obj.total_token_count);
  if (messages === undefined) messages = num(obj.message_count ?? obj.messageCount ?? obj.num_messages ?? obj.numMessages);

  // Timestamp / date
  if (timestamp === undefined) {
    if (obj.timestamp) timestamp = String(obj.timestamp);
    else if (obj.ts) timestamp = String(obj.ts);
    else if (obj.date) date = String(obj.date);
    else if (obj.created) timestamp = String(obj.created);
    else if (obj.time) timestamp = String(obj.time);
  }

  if (model === undefined) model = typeof obj.model === "string" ? obj.model : undefined;

  // Zed message_start shape: { event: { type: "message_start", message: { usage: {...}, model: "..." } } }
  if (!usage && obj.event && typeof obj.event === "object") {
    const ev = obj.event as Record<string, unknown>;
    if (ev.type === "message_start" && ev.message && typeof ev.message === "object") {
      const msg = ev.message as Record<string, unknown>;
      const mu = msg.usage;
      if (mu && typeof mu === "object") {
        const m = mu as Record<string, unknown>;
        inputTokens ??= num(m.input_tokens ?? m.prompt_tokens);
        outputTokens ??= num(m.output_tokens ?? m.completion_tokens);
        totalTokens ??= num(m.total_tokens);
        if (inputTokens && outputTokens && totalTokens === undefined) totalTokens = inputTokens + outputTokens;
      }
      if (!model && msg.model) model = String(msg.model);
    }
    // Also check for message_delta with usage
    if (ev.type === "message_delta" && ev.usage && typeof ev.usage === "object") {
      const eu = ev.usage as Record<string, unknown>;
      inputTokens ??= num(eu.input_tokens ?? eu.prompt_tokens);
      outputTokens ??= num(eu.output_tokens ?? eu.completion_tokens);
      totalTokens ??= num(eu.total_tokens);
      if (inputTokens && outputTokens && totalTokens === undefined) totalTokens = inputTokens + outputTokens;
    }
  }

  // Normalize: if we have total but not input/output, split evenly (best effort)
  if (totalTokens && !inputTokens && !outputTokens) {
    inputTokens = Math.floor(totalTokens / 2);
    outputTokens = totalTokens - inputTokens;
  }

  if (inputTokens === undefined && outputTokens === undefined && messages === undefined) {
    return null; // nothing useful
  }

  // Resolve date
  if (!date && timestamp) {
    const ts = parseTimestamp(timestamp);
    if (ts) date = utcDate(ts);
  }

  return {
    timestamp,
    date,
    inputTokens: inputTokens ?? 0,
    outputTokens: outputTokens ?? 0,
    totalTokens: totalTokens ?? (inputTokens ?? 0) + (outputTokens ?? 0),
    messages: messages ?? 0,
    model,
    raw: obj,
  };
}

function num(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// ---------------------------------------------------------------------------
// Deduplicate entries by approximate time (within 1 minute)
// ---------------------------------------------------------------------------

function deduplicateEntries(entries: AgentUsageEntry[]): AgentUsageEntry[] {
  if (entries.length === 0) return [];
  const sorted = [...entries].sort((a, b) => {
    const ta = a.timestamp ? parseTimestamp(a.timestamp) ?? 0 : 0;
    const tb = b.timestamp ? parseTimestamp(b.timestamp) ?? 0 : 0;
    return ta - tb;
  });
  const out: AgentUsageEntry[] = [];
  let lastTs = -Infinity;
  for (const e of sorted) {
    const ts = e.timestamp ? (parseTimestamp(e.timestamp) ?? -Infinity) : -Infinity;
    if (ts - lastTs > 60000) {
      out.push(e);
      lastTs = ts;
    } else if (ts > lastTs) {
      // Merge into last entry
      const last = out[out.length - 1];
      if (last) {
        last.inputTokens = (last.inputTokens ?? 0) + (e.inputTokens ?? 0);
        last.outputTokens = (last.outputTokens ?? 0) + (e.outputTokens ?? 0);
        last.totalTokens = (last.totalTokens ?? 0) + (e.totalTokens ?? 0);
        last.messages = (last.messages ?? 0) + (e.messages ?? 0);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

export function scanAgentUsage(): ScanResult {
  const agents: AgentStats[] = [
    scanOpenCode(),
    scanCodex(),
    scanClaudeCode(),
    scanAntigravity(),
    scanPi(),
    scanHermes(),
    scanZed(),
  ];

  let totalInput = 0;
  let totalOutput = 0;
  let totalMessages = 0;
  const allDays = new Set<string>();
  let globalCurrent = 0;
  let globalLongest = 0;

  for (const a of agents) {
    totalInput += a.totalInputTokens;
    totalOutput += a.totalOutputTokens;
    totalMessages += a.totalMessages;
    for (const d of a.daysActive) allDays.add(d);
    if (a.currentStreak > globalCurrent) globalCurrent = a.currentStreak;
    if (a.longestStreak > globalLongest) globalLongest = a.longestStreak;
  }

  const sortedDays = [...allDays].sort();
  const globalStreaks = computeStreaks(sortedDays);
  // Use the global streaks if they beat per-agent
  if (globalStreaks.current > globalCurrent) globalCurrent = globalStreaks.current;
  if (globalStreaks.longest > globalLongest) globalLongest = globalStreaks.longest;

  return {
    agents,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    totalMessages,
    totalDaysActive: allDays.size,
    currentStreak: globalCurrent,
    longestStreak: globalLongest,
    scanTime: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatTokenAmount(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export function renderReport(result: ScanResult): string {
  const lines: string[] = [];
  const width = 60;

  lines.push("");
  lines.push("═".repeat(width));
  lines.push("  Agent Token Usage & Streak Report");
  lines.push("═".repeat(width));
  lines.push("");
  lines.push(`  Scan time: ${result.scanTime}`);
  lines.push("");
  lines.push(`  ${"─".repeat(width)}`);
  lines.push(`  SUMMARY`);
  lines.push(`  ${"─".repeat(width)}`);
  lines.push(``);
  lines.push(`  Total tokens used:    ${formatTokenAmount(result.totalTokens)} tokens`);
  lines.push(`    ├─ input:           ${formatTokenAmount(result.totalInputTokens)} tokens`);
  lines.push(`    └─ output:          ${formatTokenAmount(result.totalOutputTokens)} tokens`);
  lines.push(`  Total messages:       ${result.totalMessages}`);
  lines.push(`  Days active:          ${result.totalDaysActive} unique days`);
  lines.push(`  Current streak:       ${result.currentStreak} day${result.currentStreak === 1 ? "" : "s"}`);
  lines.push(`  Longest streak:       ${result.longestStreak} days`);
  lines.push(``);

  for (const a of result.agents) {
    lines.push(`  ${"─".repeat(width)}`);
    lines.push(`  ${a.agent}`);
    lines.push(`  ${"─".repeat(width)}`);
    lines.push(``);
    lines.push(`    Installed:    ${a.installed ? "yes" : "no"}`);
    lines.push(`    Configured:   ${a.configured ? "yes" : "no"}`);

    if (a.tokenSource) {
      lines.push(`    Token source: ${a.tokenSource}`);
      if (a.tokenValid !== undefined) {
        lines.push(`    Token valid:  ${a.tokenValid ? "yes" : "NO (expired/missing)"}`);
      }
      if (a.tokenExpiry) {
        lines.push(`    Expires:      ${a.tokenExpiry}`);
      }
    }

    lines.push(``);
    if (a.usageUnknown && a.usageEntries.length === 0) {
      lines.push(`    Usage:        ? unknown (no usage logs found locally)`);
    } else {
      lines.push(`    Input tokens:  ${formatTokenAmount(a.totalInputTokens)}`);
      lines.push(`    Output tokens: ${formatTokenAmount(a.totalOutputTokens)}`);
      lines.push(`    Total tokens:  ${formatTokenAmount(a.totalTokens)}`);
      lines.push(`    Messages:      ${a.totalMessages}`);
    }

    lines.push(`    Days active:   ${a.daysActive.length}`);
    if (a.daysActive.length > 0) {
      lines.push(`    First used:    ${a.firstUsed ?? "?"}`);
      lines.push(`    Last used:     ${a.lastUsed ?? "?"}`);
    }
    lines.push(`    Current streak: ${a.currentStreak} day${a.currentStreak === 1 ? "" : "s"}`);
    lines.push(`    Longest streak: ${a.longestStreak} days`);
    lines.push(``);
  }

  lines.push(`  ${"─".repeat(width)}`);
  lines.push(`  Tip: This tool reads local logs/configs only.`);
  lines.push(`       For cloud-side usage (e.g. Zed dashboard), check the provider's web UI.`);
  lines.push(`  ${"─".repeat(width)}`);
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// CLI entry (when run directly)
// ---------------------------------------------------------------------------

export function main(argv: string[]) {
  const result = scanAgentUsage();
  console.log(renderReport(result));

  // Also output JSON if --json flag
  if (argv.includes("--json")) {
    console.log("\n--- JSON ---\n");
    console.log(JSON.stringify(result, null, 2));
  }
}

if (typeof require !== "undefined" && require.main === module) {
  main(process.argv);
}

// Also support ESM main detection
if (typeof process !== "undefined" && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv);
}
