#!/usr/bin/env node
/**
 * agent-stats — scan local filesystem configs and logs for CLI/GUI coding agents
 * and report token usage + streaks.
 *
 * Usage:
 *   node src/agent-stats-cli.ts          # human-readable report
 *   node src/agent-stats-cli.ts --json   # JSON output
 *
 * Agents detected:
 *   OpenCode, Codex CLI, Claude Code, Antigravity, pi, Hermes, Zed (zed2cli)
 */

import { scanAgentUsage, renderReport } from "./agent-stats";

const argv = process.argv.slice(2);
const asJson = argv.includes("--json") || argv.includes("-j");

const result = scanAgentUsage();

if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(renderReport(result));
}
