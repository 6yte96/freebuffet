#!/usr/bin/env bun
import pc from "picocolors"
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { homedir } from "os"
import { dirname } from "path"
import readline from "readline"
import { createInterface } from "readline/promises"
import { spawn } from "child_process"
import { getProviders, getProvider, getRecommendedProviderIds } from "./providers"
import type { Provider } from "./providers"
import { checkProviderHealth } from "./health"
import type { HealthResult } from "./health"
import { loadLocalConfig, saveLocalConfig, getLocalConfigPath, type LocalConfig } from "./config"
import {
  generateOpenCodeAuth,
  generateOpenCodeConfig,
  getOpenCodeAuthPath,
  serializeOpenCodeConfig,
  type OpenCodeAuth,
  type OpenCodeConfig,
} from "./configs/opencode"
import { generateCodexConfig, generateCodexEnvVars } from "./configs/codex"
import { generateClaudeEnvVars, generateClaudeSettingsJson } from "./configs/claude"

function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T
  } catch {
    return null
  }
}

function ensureDirForFile(path: string): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function backupIfExists(path: string): void {
  if (!existsSync(path)) return
  copyFileSync(path, `${path}.bak-${new Date().toISOString().replace(/[:.]/g, "-")}`)
}

function writeTextFile(path: string, content: string, backup = true): void {
  ensureDirForFile(path)
  if (backup) backupIfExists(path)
  writeFileSync(path, content)
}

function mergeOpenCodeConfig(existing: OpenCodeConfig | null, generated: OpenCodeConfig): OpenCodeConfig {
  return {
    ...(existing ?? {}),
    $schema: generated.$schema,
    provider: {
      ...(existing?.provider ?? {}),
      ...(generated.provider ?? {}),
    },
  }
}

function mergeOpenCodeAuth(existing: OpenCodeAuth | null, generated: OpenCodeAuth): OpenCodeAuth {
  return {
    ...(existing ?? {}),
    ...generated,
  }
}

function getTemplateVars(value: string): string[] {
  return [...new Set([...value.matchAll(/\{([^}]+)\}/g)].map(m => m[1]))]
}

function exitCancelled(message = "Cancelled"): never {
  restoreTerminal()
  console.log(message)
  process.exit(0)
}

async function promptLine(message: string, placeholder?: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const hint = placeholder ? ` (${placeholder})` : ""
  try {
    return (await rl.question(`${pc.cyan("?")} ${message}${pc.dim(hint)} `)).trim()
  } finally {
    rl.close()
  }
}

async function promptRequired(message: string, placeholder?: string): Promise<string> {
  while (true) {
    const value = await promptLine(message, placeholder)
    if (value) return value
    console.log("Required")
  }
}

async function promptConfirm(message: string, initialValue = true): Promise<boolean> {
  const suffix = initialValue ? "Y/n" : "y/N"
  const value = (await promptLine(`${message} [${suffix}]`)).toLowerCase()
  if (!value) return initialValue
  return value === "y" || value === "yes"
}

function ascii(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s*\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function terminalWidth(): number {
  return Math.max(60, process.stdout.columns ?? 100)
}

function truncate(value: string, max: number): string {
  if (max <= 0) return ""
  if (value.length <= max) return value
  if (max <= 3) return value.slice(0, max)
  return `${value.slice(0, max - 3)}...`
}

function clearScreen(): void {
  // Cursor-home + erase-below avoids pushing cleared frames into scrollback in terminals
  // that treat full-screen clear as scrollback content.
  process.stdout.write("\x1b[?25l\x1b[H\x1b[0J")
}

function enableRawInput(): void {
  process.stdin.resume()
  readline.emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY) process.stdin.setRawMode(true)
}

function disableRawInput(): void {
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.stdout.write("\x1b[?25h\x1b[0m\n")
}

function restoreTerminal(): void {
  try {
    if (process.stdin.isTTY) process.stdin.setRawMode(false)
  } catch {}
  process.stdout.write("\x1b[?25h\x1b[0m")
}

function isEscapeKey(str: string | undefined, key: readline.Key): boolean {
  return key.name === "escape" || key.name === "esc" || key.sequence === "\x1b" || str === "\x1b"
}

const nord = {
  polar0: (value: string) => `\x1b[38;5;237m${value}\x1b[0m`,
  polar1: (value: string) => `\x1b[38;5;240m${value}\x1b[0m`,
  textMuted: (value: string) => `\x1b[38;5;145m${value}\x1b[0m`,
  url: (value: string) => `\x1b[38;5;153m${value}\x1b[0m`,
  snow: (value: string) => `\x1b[38;5;252m${value}\x1b[0m`,
  frost: (value: string) => `\x1b[38;5;81m${value}\x1b[0m`,
  blue: (value: string) => `\x1b[38;5;110m${value}\x1b[0m`,
  green: (value: string) => `\x1b[38;5;108m${value}\x1b[0m`,
  yellow: (value: string) => `\x1b[38;5;180m${value}\x1b[0m`,
  active: (value: string) => `\x1b[48;5;24m\x1b[38;5;252m${value}\x1b[0m`,
  bar: (value: string) => `\x1b[48;5;237m${value}\x1b[0m`,
  badgeRec: (value: string) => `\x1b[48;5;24m\x1b[38;5;159m${value}\x1b[0m`,
  badgeFree: (value: string) => `\x1b[48;5;22m\x1b[38;5;230m${value}\x1b[0m`,
  badgeNoCc: (value: string) => `\x1b[48;5;58m\x1b[38;5;230m${value}\x1b[0m`,
}

function stripAnsi(value: string): string {
  return value.replace(/\x1b\[[0-9;]*m/g, "")
}

function padAnsiEnd(value: string, width: number): string {
  const visible = stripAnsi(value).length
  return value + " ".repeat(Math.max(0, width - visible))
}

type HomeAction = "saved" | "providers" | "browse" | "keys"

const HOME_ACTION_SENTINEL_PREFIX = "__freebuffet_home__:"
let navSavedProviderCount = 0
const NAV_PROMPT_HELP = "global: /1 saved | /2 providers | /3 browse | /4 keys"

function setNavSavedProviderCount(count: number): void {
  navSavedProviderCount = count
}

function homeActionFromKey(value: string): HomeAction | null {
  if (value === "1" && navSavedProviderCount > 0) return "saved"
  if (value === "2") return "providers"
  if (value === "3") return "browse"
  if (value === "4") return "keys"
  return null
}

function homeActionFromSlashCommand(value: string): HomeAction | null {
  const match = value.trim().match(/^\/([1-4])$/)
  return match ? homeActionFromKey(match[1]) : null
}

function homeActionSentinel(action: HomeAction): string {
  return `${HOME_ACTION_SENTINEL_PREFIX}${action}`
}

function parseHomeActionSentinel(value: string): HomeAction | null {
  if (!value.startsWith(HOME_ACTION_SENTINEL_PREFIX)) return null
  const action = value.slice(HOME_ACTION_SENTINEL_PREFIX.length)
  return action === "saved" || action === "providers" || action === "browse" || action === "keys" ? action : null
}

function renderNavBar(active?: HomeAction): void {
  const items: Array<{ action: HomeAction; key: string; label: string; disabled?: boolean }> = [
    { action: "saved", key: "1", label: `saved ${navSavedProviderCount}`, disabled: navSavedProviderCount === 0 },
    { action: "providers", key: "2", label: "providers" },
    { action: "browse", key: "3", label: "browse" },
    { action: "keys", key: "4", label: "keys" },
  ]
  const nav = items.map(item => {
    const label = ` ${item.key} ${item.label} `
    if (item.disabled) return nord.polar1(label)
    if (item.action === active) return nord.active(label)
    return nord.frost(label)
  }).join(nord.textMuted("|"))
  process.stdout.write(`${nav}\n`)
}

function activeNavFromTitle(title: string): HomeAction | undefined {
  const normalized = title.toLowerCase()
  if (normalized.includes("all model") || normalized.includes("model")) return "saved"
  if (normalized.includes("provider") && !normalized.includes("browse")) return "providers"
  if (normalized.includes("browse")) return "browse"
  if (normalized.includes("key")) return "keys"
  return undefined
}

function renderTitle(title: string, meta: string, active?: HomeAction): void {
  const width = terminalWidth()
  const rule = nord.textMuted("━".repeat(width))
  process.stdout.write(`${rule}\n`)
  process.stdout.write(`${nord.snow(title)} ${nord.polar1(meta)}\n`)
  renderNavBar(active ?? activeNavFromTitle(title))
  process.stdout.write(`${rule}\n\n`)
}

function renderBottomBar(args: {
  query: string
  selected: Set<string>
  shown: string
  total: number
  help: string
}): void {
  const width = terminalWidth()
  const rule = nord.textMuted("━".repeat(width))
  const search = args.query || "(all)"
  process.stdout.write(`\n${rule}\n`)
  process.stdout.write(`${nord.blue("search")} ${nord.frost(search)}  `)
  process.stdout.write(`${nord.blue("selected")} ${args.selected.size} ${selectedPreview(args.selected, Math.max(10, width - 48))}  `)
  process.stdout.write(`${nord.blue("showing")} ${args.shown}/${args.total}\n`)
  process.stdout.write(`${nord.textMuted(args.help)}\n`)
}

function selectedPreview(selected: Set<string>, maxWidth: number): string {
  if (selected.size === 0) return pc.dim("none")
  return truncate([...selected].slice(0, 4).join(", ") + (selected.size > 4 ? " +" : ""), maxWidth)
}

function maskKey(key: string): string {
  if (key.length <= 8) return "***"
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}

function renderEmpty(message: string): void {
  process.stdout.write(`\n  ${pc.dim(message)}\n`)
}

function renderDialog(title: string, lines: string[] = [], help?: string): void {
  clearScreen()
  renderTitle(title, "")
  for (const line of lines) {
    process.stdout.write(`${line}\n`)
  }
  if (help) {
    process.stdout.write(`\n${nord.textMuted(help)}\n`)
  }
  process.stdout.write(`\n${nord.textMuted(NAV_PROMPT_HELP)}\n`)
  process.stdout.write("\n")
  process.stdout.write("\x1b[?25h")
}

async function promptLineView(title: string, message: string, lines: string[] = [], placeholder?: string): Promise<string> {
  renderDialog(title, lines)
  const value = await promptLine(message, placeholder)
  const action = homeActionFromSlashCommand(value)
  return action ? homeActionSentinel(action) : value
}

async function promptRequiredView(title: string, message: string, lines: string[] = [], placeholder?: string): Promise<string> {
  while (true) {
    const value = await promptLineView(title, message, lines, placeholder)
    if (value) return value
    lines = [...lines, nord.yellow("Required")]
  }
}

async function promptLineViewEsc(title: string, message: string, lines: string[] = [], placeholder?: string): Promise<string | "ESC"> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return await promptLineView(title, message, lines, placeholder)
  }

  renderDialog(title, lines)
  enableRawInput()

  const hint = placeholder ? nord.textMuted(` (${placeholder})`) : ""
  let value = ""

  const renderInput = () => {
    process.stdout.write("\x1b[2K\r")
    const prompt = `${nord.frost("?")} ${message}${hint} ${value}`
    process.stdout.write(prompt)
  }

  return await new Promise<string | "ESC">((resolve) => {
    const onInputKeypress = (str: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        process.stdin.off("keypress", onInputKeypress)
        disableRawInput()
        exitCancelled()
      }

      if (isEscapeKey(str, key)) {
        process.stdin.off("keypress", onInputKeypress)
        disableRawInput()
        resolve("ESC")
        return
      }

      if (key.name === "return") {
        process.stdin.off("keypress", onInputKeypress)
        disableRawInput()
        const trimmed = value.trim()
        const action = homeActionFromSlashCommand(trimmed)
        resolve(action ? homeActionSentinel(action) : trimmed)
        return
      }

      if (key.name === "backspace" || key.name === "delete") {
        value = value.slice(0, -1)
      } else if (!key.ctrl && !key.meta && str && str >= " " && str <= "~") {
        value += str
      }

      renderInput()
    }

    renderInput()
    process.stdin.on("keypress", onInputKeypress)
  })
}

async function promptHealthFailureAction(lines: string[]): Promise<"continue" | "back" | "retry"> {
  const value = await promptLineViewEsc("Health check", "Enter continue, r retry, Esc back:", [
    ...lines,
    nord.textMuted("Enter skips this provider. r retries. Esc returns to provider selection."),
  ])
  if (value === "ESC") return "back"
  if (value.toLowerCase() === "r" || value.toLowerCase() === "retry") return "retry"
  if (value.toLowerCase() === "back") return "back"
  return "continue"
}

async function promptRequiredOrBackView(title: string, message: string, lines: string[] = [], placeholder?: string): Promise<string | "BACK"> {
  while (true) {
    const value = await promptLineViewEsc(title, message, [...lines, nord.textMuted("Press Esc to return to provider selection.")], placeholder)
    if (value === "ESC") return "BACK"
    if (value.toLowerCase() === "back") return "BACK"
    if (value) return value
    lines = [...lines, nord.yellow("Required")]
  }
}

async function promptConfirmView(title: string, message: string, lines: string[] = [], initialValue = true): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    renderDialog(title, lines)
    return await promptConfirm(message, initialValue)
  }

  renderDialog(title, [
    ...lines,
    "",
    `${nord.frost("?")} ${message}`,
    nord.textMuted(initialValue ? "Y yes | n no | Enter yes | Esc no" : "y yes | N no | Enter no | Esc no"),
  ])

  enableRawInput()

  return await new Promise<boolean>((resolve) => {
    const onConfirmKeypress = (str: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        process.stdin.off("keypress", onConfirmKeypress)
        disableRawInput()
        exitCancelled()
      }

      if (isEscapeKey(str, key)) {
        process.stdin.off("keypress", onConfirmKeypress)
        disableRawInput()
        resolve(false)
        return
      }

      if (key.name === "return") {
        process.stdin.off("keypress", onConfirmKeypress)
        disableRawInput()
        resolve(initialValue)
        return
      }

      const answer = str.toLowerCase()
      if (answer === "y" || answer === "n") {
        process.stdin.off("keypress", onConfirmKeypress)
        disableRawInput()
        resolve(answer === "y")
      }
    }

    process.stdin.on("keypress", onConfirmKeypress)
  })
}

function tag(value: string): string {
  if (value === "free") return nord.badgeFree(` ${value} `)
  if (value === "rec") return nord.badgeRec(` ${value} `)
  if (value === "no-cc") return nord.badgeNoCc(` ${value} `)
  return nord.polar1(`[${value}]`)
}

function providerBadges(provider: Provider, recommendedSet: Set<string>, savedKeySet: Set<string>): string[] {
  return [
    recommendedSet.has(provider.id) ? tag("rec") : "",
    provider.freeTier ? tag("free") : "",
    provider.noCc ? tag("no-cc") : "",
  ]
}

function providerSearchText(provider: Provider): string {
  return [
    provider.id,
    provider.name,
    ascii(provider.name),
    provider.baseURL,
    provider.website,
    provider.freeTier ?? "",
    provider.tags?.join(" ") ?? "",
  ].join(" ").toLowerCase()
}

function openUrl(url: string): void {
  const command = process.platform === "darwin"
    ? "open"
    : process.platform === "win32"
      ? "cmd"
      : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  const child = spawn(command, args, { detached: true, stdio: "ignore" })
  child.unref()
}

async function selectProvidersSearchable(
  providers: Provider[],
  recommendedSet: Set<string>,
  savedKeySet: Set<string>,
  title = "FreeBuffet providers",
  help = "/ search | up/down move | space select | w open website | enter confirm | 1-4 switch | ctrl+c exit",
): Promise<string[]> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const value = await promptLine("Provider ids, comma-separated:")
    return value.split(",").map(v => v.trim()).filter(Boolean)
  }

  enableRawInput()

  let query = ""
  let searchMode = false
  let cursor = 0
  let scroll = 0
  const selected = new Set<string>()
  let onProviderKeypress: ((str: string, key: readline.Key) => void) | undefined

  const filterProviders = () => {
    const q = query.trim().toLowerCase()
    if (!q) return providers
    const terms = q.split(/\s+/)
    return providers.filter(provider => {
      const haystack = providerSearchText(provider)
      return terms.every(term => haystack.includes(term))
    })
  }

  const cleanup = () => {
    if (onProviderKeypress) process.stdin.off("keypress", onProviderKeypress)
    disableRawInput()
  }

  const render = () => {
    const matches = filterProviders()
    if (cursor >= matches.length) cursor = Math.max(0, matches.length - 1)
    if (cursor < 0) cursor = 0

    const rows = Math.max(8, (process.stdout.rows ?? 24) - 9)
    if (cursor < scroll) scroll = cursor
    if (cursor >= scroll + rows) scroll = cursor - rows + 1
    const visible = matches.slice(scroll, scroll + rows)

    clearScreen()
    renderTitle(title, `${matches.length}/${providers.length}`)
    process.stdout.write(`${nord.blue("search")} ${searchMode ? nord.frost(query || "_") : nord.textMuted("press /")}\n\n`)

    if (visible.length === 0) {
      renderEmpty("No matching providers. Try another provider name, API domain, or tag.")
      renderBottomBar({
        query,
        selected,
        shown: "0",
        total: matches.length,
        help,
      })
      return
    }

    const width = terminalWidth()
    const leftWidth = Math.max(24, Math.floor(width * 0.32))
    const websiteWidth = Math.max(12, Math.floor(width * 0.22))
    for (let i = 0; i < visible.length; i++) {
      const provider = visible[i]
      const absoluteIndex = scroll + i
      const active = absoluteIndex === cursor
      const checked = selected.has(provider.id)
        ? "[x]"
        : savedKeySet.has(provider.id)
          ? nord.frost("[s]")
          : "[ ]"
      const pointer = active ? ">" : " "
      const url = ascii(provider.baseURL)
      const website = ascii(provider.website)
      const name = `${pointer} ${checked} ${ascii(provider.name)}`
      const [recBadge, freeBadge, noCcBadge] = providerBadges(provider, recommendedSet, savedKeySet)
      const leftText = padAnsiEnd(truncate(name, leftWidth), leftWidth)
      const recText = padAnsiEnd(recBadge, 6)
      const freeText = padAnsiEnd(freeBadge, 7)
      const noCcText = padAnsiEnd(noCcBadge, 8)
      const adjustedBaseWidth = Math.max(4, width - leftWidth - websiteWidth - 28)
      const websiteText = nord.frost(truncate(website, websiteWidth))
      const baseText = nord.url(truncate(url, adjustedBaseWidth))
      const line = `${leftText} ${recText} ${freeText} ${noCcText}  ${baseText}  ${websiteText}`
      process.stdout.write(active ? nord.active(line) + "\n" : line + "\n")
    }

    renderBottomBar({
      query,
      selected,
      shown: `${scroll + 1}-${scroll + visible.length}`,
      total: matches.length,
      help: `${help}${searchMode ? " | search active" : ""}`,
    })
  }

  return await new Promise<string[]>((resolve) => {
    onProviderKeypress = (_str: string, key: readline.Key) => {
      const matches = filterProviders()

      if (key.ctrl && key.name === "c") {
        cleanup()
        exitCancelled()
      }

      if (isEscapeKey(_str, key)) {
        if (searchMode || query) {
          searchMode = false
          query = ""
          cursor = 0
          scroll = 0
          render()
          return
        }
        cleanup()
        resolve([])
        return
      }

      const navAction = !searchMode ? homeActionFromKey(_str) : null
      if (navAction) {
        cleanup()
        resolve([homeActionSentinel(navAction)])
        return
      }

      if (key.name === "return") {
        if (searchMode) {
          searchMode = false
          render()
          return
        }
        if (matches.length === 0) {
          render()
          return
        }
        if (selected.size === 0 && matches[cursor]) {
          selected.add(matches[cursor].id)
        }
        cleanup()
        resolve([...selected])
        return
      }

      let handled = true
      if (!searchMode && _str === "/") {
        searchMode = true
      } else if (key.name === "up") cursor = Math.max(0, cursor - 1)
      else if (key.name === "down") cursor = Math.min(Math.max(0, matches.length - 1), cursor + 1)
      else if (!searchMode && key.name === "space" && matches[cursor]) {
        const id = matches[cursor].id
        if (selected.has(id)) selected.delete(id)
        else selected.add(id)
      } else if (!searchMode && !key.ctrl && !key.meta && key.name === "w" && matches[cursor]) {
        openUrl(matches[cursor].website)
      } else if (searchMode && (key.name === "backspace" || key.name === "delete")) {
        query = query.slice(0, -1)
        cursor = 0
        scroll = 0
      } else if (searchMode && !key.ctrl && !key.meta && _str && _str >= " " && _str <= "~") {
        query += _str
        cursor = 0
        scroll = 0
      } else {
        handled = false
      }

      if (handled) render()
    }

    render()
    process.stdin.on("keypress", onProviderKeypress)
  })
}

interface Choice {
  id: string
  label: string
  hint?: string
}

interface SearchableChoice extends Choice {
  searchText?: string
}

function parseSelection(input: string, max: number): number[] {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return []
  if (trimmed === "all") return Array.from({ length: max }, (_, i) => i)

  const selected = new Set<number>()
  for (const part of trimmed.split(",")) {
    const range = part.trim().match(/^(\d+)-(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      for (let n = Math.min(start, end); n <= Math.max(start, end); n++) {
        if (n >= 1 && n <= max) selected.add(n - 1)
      }
      continue
    }

    const n = Number(part.trim())
    if (Number.isInteger(n) && n >= 1 && n <= max) selected.add(n - 1)
  }
  return [...selected]
}

async function selectFromList(message: string, choices: Choice[], required = false): Promise<string[]> {
  while (true) {
    console.log("")
    console.log(pc.bold(message))
    choices.forEach((choice, index) => {
      const hint = choice.hint ? ` (${choice.hint})` : ""
      console.log(`${pc.dim(String(index + 1).padStart(2, " "))}. ${choice.label}${pc.dim(hint)}`)
    })
    console.log(pc.dim("Enter numbers separated by commas, ranges like 1-3, or 'all'."))
    const answer = await promptLine(required ? "Selection:" : "Selection (blank to skip):")
    const indexes = parseSelection(answer, choices.length)
    if (indexes.length > 0) return indexes.map(i => choices[i].id)
    if (!required) return []
    console.log(pc.yellow("Select at least one option."))
  }
}

async function selectAgentsView(): Promise<string[]> {
  const choices: Choice[] = [
    { id: "opencode", label: "OpenCode", hint: "opencode.json" },
    { id: "codex", label: "Codex CLI", hint: "~/.codex/config.toml" },
    { id: "claude", label: "Claude Code", hint: "settings.json" },
    { id: "all", label: "All supported" },
  ]

  while (true) {
    const answer = await promptLineView(
      "Configure coding agents",
      "Select agents:",
      [
        `${nord.blue("1")} OpenCode ${nord.textMuted("opencode.json")}`,
        `${nord.blue("2")} Codex CLI ${nord.textMuted("~/.codex/config.toml")}`,
        `${nord.blue("3")} Claude Code ${nord.textMuted("settings.json")}`,
        `${nord.blue("4")} All supported`,
        "",
        nord.textMuted("Enter defaults to OpenCode. Use comma-separated numbers, e.g. 1,2."),
      ],
      "1",
    )
    const indexes = parseSelection(answer || "1", choices.length)
    if (indexes.length > 0) return indexes.map(i => choices[i].id)
  }
}

async function showProviderDetails(provider: Provider, hasSavedKey: boolean): Promise<"setup" | "back" | "skip" | HomeAction> {
  while (true) {
    const answer = await promptLineView(
      "Provider details",
      "Choose action:",
      [
        `${nord.blue("provider")} ${ascii(provider.name)}`,
        `${nord.blue("base url")} ${provider.baseURL}`,
        `${nord.blue("website")} ${provider.website}`,
        `${nord.blue("env")} ${provider.envKey ?? "none"}`,
        `${nord.blue("free tier")} ${provider.freeTier ?? "unknown"}`,
        `${nord.blue("saved key")} ${hasSavedKey ? "yes" : "no"}`,
        "",
        `${nord.blue("1")} Setup / enter API key`,
        `${nord.blue("2")} Open provider website`,
        `${nord.blue("3")} Skip provider`,
        `${nord.blue("4")} Back to providers`,
      ],
      "1",
    )
    const navAction = parseHomeActionSentinel(answer)
    if (navAction) return navAction
    const choice = answer || "1"
    if (choice === "1") return "setup"
    if (choice === "2") {
      openUrl(provider.website)
      continue
    }
    if (choice === "3") return "skip"
    if (choice === "4" || choice.toLowerCase() === "back") return "back"
  }
}

async function manageSavedKeysView(config: LocalConfig | null, providers: Provider[]): Promise<{ config: LocalConfig | null; setupSaved: boolean; navAction?: HomeAction }> {
  let current = config
  while (true) {
    const keys = current?.apiKeys ?? {}
    const ids = Object.keys(keys).sort()
    const rows = ids.length === 0
      ? [nord.textMuted("No saved keys.")]
      : ids.map((id, index) => {
          const provider = getProvider(id)
          return `${nord.blue(String(index + 1).padStart(2, " "))} ${ascii(provider?.name ?? id)} ${nord.textMuted(maskKey(keys[id]))}`
        })

    const answer = await promptLineView(
      "Saved keys",
      "Choose action:",
      [
        ...rows,
        "",
        `${nord.blue("1")} Setup agents with saved keys`,
        `${nord.blue("2")} Update saved key`,
        `${nord.blue("3")} Delete saved key`,
        `${nord.blue("4")} Test saved key`,
        `${nord.blue("5")} Back`,
      ],
      "5",
    )

    const navAction = parseHomeActionSentinel(answer)
    if (navAction) return { config: current, setupSaved: false, navAction }
    if (answer === "1") return { config: current, setupSaved: true }
    if (answer === "5" || answer.toLowerCase() === "back" || !answer) return { config: current, setupSaved: false }

    if (answer === "2") {
      const id = await promptLineView("Saved keys", "Provider id to update:", [
        nord.textMuted("Example: groq, tokenrouter, openrouter"),
      ])
      const provider = providers.find(p => p.id === id)
      if (!provider) {
        await promptLineViewEsc("Saved keys", "Press Enter to continue:", [pc.red(`Unknown provider id: ${id}`)])
        continue
      }
      const key = await promptRequiredView("Saved keys", "New API key:", [
        `${nord.blue("provider")} ${ascii(provider.name)}`,
      ])
      const apiKeys = { ...(current?.apiKeys ?? {}), [provider.id]: key }
      saveLocalConfig(apiKeys)
      current = { apiKeys, savedAt: new Date().toISOString() }
      continue
    }

    if (answer === "3") {
      const id = await promptLineView("Saved keys", "Provider id to delete:")
      if (!id) continue
      const apiKeys = { ...(current?.apiKeys ?? {}) }
      delete apiKeys[id]
      saveLocalConfig(apiKeys)
      current = { apiKeys, savedAt: new Date().toISOString() }
      continue
    }

    if (answer === "4") {
      const id = await promptLineView("Saved keys", "Provider id to test:")
      const provider = providers.find(p => p.id === id)
      const key = current?.apiKeys[id]
      if (!provider || !key) {
        await promptLineViewEsc("Saved keys", "Press Enter to continue:", [pc.red("No saved key for that provider id.")])
        continue
      }
      renderDialog("Saved keys", [
        `${nord.blue("provider")} ${ascii(provider.name)}`,
        "Checking saved key...",
      ])
      const health = await checkProviderHealth(provider, key)
      await promptLineViewEsc("Saved keys", "Press Enter to continue:", [
        `${health.status === "ok" ? nord.green("OK") : pc.red("ERR")} ${ascii(provider.name)}`,
        `${nord.blue("latency")} ${health.latencyMs}ms`,
        `${nord.blue("models")} ${health.models?.length ?? 0}`,
        health.error ? `${nord.blue("error")} ${health.error}` : "",
      ].filter(Boolean))
    }
  }
}

async function browseProvidersView(providers: Provider[], recommendedSet: Set<string>, savedKeySet: Set<string>): Promise<HomeAction | null> {
  const selected = await selectProvidersSearchable(
    providers,
    recommendedSet,
    savedKeySet,
    "Browse providers",
    "/ search | up/down move | space select | w open website | enter view | 1-4 switch | esc back | ctrl+c exit",
  )
  if (selected.length === 1) {
    const action = parseHomeActionSentinel(selected[0])
    if (action) return action
  }
  for (const id of selected) {
    const provider = getProvider(id)
    if (!provider) continue
    const action = await showProviderDetails(provider, savedKeySet.has(provider.id))
    if (action === "saved" || action === "providers" || action === "browse" || action === "keys") return action
  }
  return null
}

async function selectHomeAction(savedProviderCount: number): Promise<HomeAction> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const answer = await promptLine("Workflow 1 saved models, 2 providers, 3 browse, 4 keys:", savedProviderCount > 0 ? "1" : "2")
    const choice = (answer || (savedProviderCount > 0 ? "1" : "2")).trim()
    if (choice === "1" && savedProviderCount > 0) return "saved"
    if (choice === "3") return "browse"
    if (choice === "4") return "keys"
    return "providers"
  }

  const items: Array<{ action: HomeAction; key: string; label: string; disabled?: boolean }> = [
    { action: "saved", key: "1", label: `saved models ${savedProviderCount}`, disabled: savedProviderCount === 0 },
    { action: "providers", key: "2", label: "providers" },
    { action: "browse", key: "3", label: "browse" },
    { action: "keys", key: "4", label: "keys" },
  ]
  let cursor = savedProviderCount > 0 ? 0 : 1

  const move = (delta: number) => {
    for (let step = 0; step < items.length; step++) {
      cursor = (cursor + delta + items.length) % items.length
      if (!items[cursor].disabled) return
    }
  }

  const render = () => {
    clearScreen()
    renderTitle("FreeBuffet", "home", items[cursor]?.action)
    process.stdout.write(`${nord.snow("Setup coding agents from free and saved LLM providers.")}\n\n`)
    process.stdout.write(`${nord.blue("saved providers")} ${savedProviderCount}\n`)
    process.stdout.write(`${nord.textMuted("Use 1-4 to switch views. Arrow keys and Enter also work on this screen.")}\n`)
  }

  enableRawInput()
  return await new Promise<HomeAction>((resolve) => {
    const cleanup = () => {
      process.stdin.off("keypress", onHomeKeypress)
      disableRawInput()
    }

    const choose = (index: number) => {
      const item = items[index]
      if (!item || item.disabled) return
      cleanup()
      resolve(item.action)
    }

    const onHomeKeypress = (str: string, key: readline.Key) => {
      if (key.ctrl && key.name === "c") {
        cleanup()
        exitCancelled()
      }
      if (key.name === "left" || key.name === "up") move(-1)
      else if (key.name === "right" || key.name === "down") move(1)
      else if (key.name === "return") {
        choose(cursor)
        return
      } else if (str >= "1" && str <= "4") {
        choose(Number(str) - 1)
        return
      }
      render()
    }

    render()
    process.stdin.on("keypress", onHomeKeypress)
  })
}

function isFreeModel(model: string): boolean {
  return model.toLowerCase().includes(":free")
}

function sortModels(models: string[]): string[] {
  return [...models].sort((a, b) => {
    const aFree = isFreeModel(a)
    const bFree = isFreeModel(b)
    if (aFree && !bFree) return -1
    if (!aFree && bFree) return 1
    return a.localeCompare(b)
  })
}

async function selectSearchableChoices(
  title: string,
  choices: SearchableChoice[],
  required = false,
): Promise<string[]> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return selectFromList(title, choices, required)
  }

  enableRawInput()

  let query = ""
  let searchMode = false
  let cursor = 0
  let scroll = 0
  const selected = new Set<string>()
  let onChoiceKeypress: ((str: string, key: readline.Key) => void) | undefined

  const filterChoices = () => {
    const q = query.trim().toLowerCase()
    if (!q) return choices
    const terms = q.split(/\s+/)
    return choices.filter(choice => {
      const haystack = `${choice.id} ${choice.label} ${choice.hint ?? ""} ${choice.searchText ?? ""}`.toLowerCase()
      return terms.every(term => haystack.includes(term))
    })
  }

  const cleanup = () => {
    if (onChoiceKeypress) process.stdin.off("keypress", onChoiceKeypress)
    disableRawInput()
  }

  const render = () => {
    const matches = filterChoices()
    if (cursor >= matches.length) cursor = Math.max(0, matches.length - 1)
    if (cursor < 0) cursor = 0

    const rows = Math.max(8, (process.stdout.rows ?? 24) - 9)
    if (cursor < scroll) scroll = cursor
    if (cursor >= scroll + rows) scroll = cursor - rows + 1
    const visible = matches.slice(scroll, scroll + rows)

    clearScreen()
    renderTitle(title, `${matches.length}/${choices.length}`)
    process.stdout.write(`${nord.blue("search")} ${searchMode ? nord.frost(query || "_") : nord.textMuted("press /")}\n\n`)

    if (visible.length === 0) {
      renderEmpty("No matches. Try a shorter model name or provider prefix.")
      renderBottomBar({
        query,
        selected,
        shown: "0",
        total: matches.length,
        help: "/ search | up/down move | space select | enter confirm | esc skip/clear | ctrl+c exit",
      })
      return
    }

    const width = terminalWidth()
    for (let i = 0; i < visible.length; i++) {
      const choice = visible[i]
      const absoluteIndex = scroll + i
      const active = absoluteIndex === cursor
      const checked = selected.has(choice.id) ? "[x]" : "[ ]"
      const pointer = active ? ">" : " "
      const hint = choice.hint ? tag(choice.hint) : ""
      const label = truncate(choice.label, width - 18)
      const line = `${pointer} ${checked} ${label}${hint ? ` ${hint}` : ""}`
      process.stdout.write(active ? nord.active(line) + "\n" : line + "\n")
    }

    renderBottomBar({
      query,
      selected,
      shown: `${scroll + 1}-${scroll + visible.length}`,
      total: matches.length,
      help: `/ search${searchMode ? " active" : ""} | up/down move | space select | enter confirm | esc skip/clear | ctrl+c exit`,
    })
  }

  return await new Promise<string[]>((resolve) => {
    onChoiceKeypress = (_str: string, key: readline.Key) => {
      const matches = filterChoices()

      if (key.ctrl && key.name === "c") {
        cleanup()
        exitCancelled()
      }

      if (isEscapeKey(_str, key) && !required) {
        if (searchMode || query) {
          searchMode = false
          query = ""
          cursor = 0
          scroll = 0
          render()
          return
        }
        cleanup()
        resolve([])
        return
      }

      if (key.name === "return") {
        if (searchMode) {
          searchMode = false
          render()
          return
        }
        if (matches.length === 0) {
          render()
          return
        }
        if (selected.size === 0 && matches[cursor]) {
          selected.add(matches[cursor].id)
        }
        if (required && selected.size === 0) {
          render()
          return
        }
        cleanup()
        resolve([...selected])
        return
      }

      let handled = true
      if (!searchMode && _str === "/") {
        searchMode = true
      } else if (key.name === "up") cursor = Math.max(0, cursor - 1)
      else if (key.name === "down") cursor = Math.min(Math.max(0, matches.length - 1), cursor + 1)
      else if (!searchMode && key.name === "space" && matches[cursor]) {
        const id = matches[cursor].id
        if (selected.has(id)) selected.delete(id)
        else selected.add(id)
      } else if (searchMode && (key.name === "backspace" || key.name === "delete")) {
        query = query.slice(0, -1)
        cursor = 0
        scroll = 0
      } else if (searchMode && !key.ctrl && !key.meta && _str && _str >= " " && _str <= "~") {
        query += _str
        cursor = 0
        scroll = 0
      } else {
        handled = false
      }

      if (handled) render()
    }

    render()
    process.stdin.on("keypress", onChoiceKeypress)
  })
}

async function resolveProviderTemplate(provider: Provider): Promise<Provider> {
  const vars = getTemplateVars(provider.baseURL)
  if (vars.length === 0) return provider

  let baseURL = provider.baseURL
  for (const name of vars) {
    const answer = await promptRequiredView(
      "Provider setup",
      `${ascii(provider.name)} needs ${name} for its API base URL:`,
      [
        `${nord.blue("provider")} ${ascii(provider.name)}`,
        `${nord.blue("base url")} ${baseURL}`,
      ],
      name === "region" ? "us-east-1" : name,
    )
    baseURL = baseURL.replaceAll(`{${name}}`, String(answer).trim())
  }

  return { ...provider, baseURL }
}

async function main() {
  clearScreen()
  process.stdout.write(`${pc.bold(pc.magenta("FreeBuffet"))}\n`)

  const recommendedSet = new Set(getRecommendedProviderIds())

  // ── Pick providers (type to search, OpenCode-style) ─────────────
  const allProviders = getProviders()
  const sortedProviders = [...allProviders].sort((a, b) => {
    const aRec = recommendedSet.has(a.id)
    const bRec = recommendedSet.has(b.id)
    if (aRec && !bRec) return -1
    if (!aRec && bRec) return 1
    return a.name.localeCompare(b.name)
  })

  // Configure each provider: key -> test
  let apiKeys: Record<string, string> = {}
  let healthyProviders: Array<{ provider: Provider; health: HealthResult }> = []
  let existingConfig = loadLocalConfig()
  let savedKeySet = new Set(Object.keys(existingConfig?.apiKeys ?? {}))
  let savedProviders = sortedProviders.filter(provider => savedKeySet.has(provider.id))
  let providerPool = sortedProviders
  let providerPickerTitle = "Providers"
  let providerPickerHelp = "/ search | up/down move | space select | w open website | enter confirm | 1-4 switch | ctrl+c exit"
  let selectedProviders: Provider[] = []
  let setupComplete = false
  let forcedHomeAction: HomeAction | null = null
  setNavSavedProviderCount(savedProviders.length)

  home:
  while (!setupComplete) {
    while (true) {
      setNavSavedProviderCount(savedProviders.length)
      const choice = forcedHomeAction ?? await selectHomeAction(savedProviders.length)
      forcedHomeAction = null
      if (choice === "saved" && savedProviders.length > 0) {
        providerPool = savedProviders
        providerPickerTitle = "All model listing"
        providerPickerHelp = "/ search | select saved-key providers | up/down move | space select | enter confirm | 1-4 switch | esc back | ctrl+c exit"
        break
      }
      if (choice === "providers" || (choice === "saved" && savedProviders.length === 0)) {
        providerPool = sortedProviders
        providerPickerTitle = "Providers"
        providerPickerHelp = "/ search | up/down move | space select | w open website | enter confirm | 1-4 switch | esc back | ctrl+c exit"
        break
      }
      if (choice === "browse") {
        const action = await browseProvidersView(sortedProviders, recommendedSet, savedKeySet)
        if (action) forcedHomeAction = action
        continue
      }
      if (choice === "keys") {
        const result = await manageSavedKeysView(existingConfig, sortedProviders)
        existingConfig = result.config
        savedKeySet = new Set(Object.keys(existingConfig?.apiKeys ?? {}))
        savedProviders = sortedProviders.filter(provider => savedKeySet.has(provider.id))
        setNavSavedProviderCount(savedProviders.length)
        if (result.navAction) {
          forcedHomeAction = result.navAction
          continue
        }
        if (result.setupSaved && savedProviders.length > 0) {
          providerPool = savedProviders
          providerPickerTitle = "All model listing"
          providerPickerHelp = "/ search | select saved-key providers | up/down move | space select | enter confirm | 1-4 switch | esc back | ctrl+c exit"
          break
        }
        continue
      }
    }

    providerSetup:
    while (true) {
      const selectedIds = await selectProvidersSearchable(
        providerPool,
        recommendedSet,
        savedKeySet,
        providerPickerTitle,
        providerPickerHelp,
      )

      if (selectedIds.length === 1) {
        const action = parseHomeActionSentinel(selectedIds[0])
        if (action) {
          forcedHomeAction = action
          continue home
        }
      }

      if (selectedIds.length === 0) {
        continue home
      }

      selectedProviders = selectedIds
        .map(id => getProvider(id))
        .filter((p): p is Provider => p != null)
      apiKeys = {}
      healthyProviders = []

    for (let i = 0; i < selectedProviders.length; i++) {
      let provider = selectedProviders[i]
      provider = await resolveProviderTemplate(provider)
      const remaining = selectedProviders.length - i - 1
      const tag = `[${i + 1}/${selectedProviders.length}]`

      // API key
      if (provider.envKey) {
        if (existingConfig?.apiKeys[provider.id]) {
          apiKeys[provider.id] = existingConfig.apiKeys[provider.id]
          const masked = existingConfig.apiKeys[provider.id].slice(0, 8) + "..."
          renderDialog("Provider setup", [
            `${nord.blue("provider")} ${ascii(provider.name)}`,
            `${nord.blue("step")} ${tag}`,
            `${nord.blue("base url")} ${provider.baseURL}`,
            `${nord.blue("website")} ${provider.website}`,
            `${nord.blue("api key")} using saved key ${masked}`,
          ])
        } else {
          const action = await showProviderDetails(provider, false)
          if (action === "saved" || action === "providers" || action === "browse" || action === "keys") {
            forcedHomeAction = action
            continue home
          }
          if (action === "back") continue providerSetup
          if (action === "skip") continue
          const envKey = provider.envKey
          const envVal = process.env[envKey]
          if (envVal) {
            apiKeys[provider.id] = envVal
            renderDialog("Provider setup", [
              `${nord.blue("provider")} ${ascii(provider.name)}`,
              `${nord.blue("base url")} ${provider.baseURL}`,
              `${nord.blue("website")} ${provider.website}`,
              `${nord.blue("api key")} using ${envKey}`,
            ])
          } else {
            const key = await promptRequiredOrBackView(
              "Provider setup",
              "Enter API key:",
              [
                `${nord.blue("provider")} ${ascii(provider.name)}`,
                `${nord.blue("step")} ${tag}`,
                `${nord.blue("base url")} ${provider.baseURL}`,
                `${nord.blue("website")} ${provider.website}`,
                `${nord.blue("env")} ${provider.envKey}`,
              ],
            )
            if (key === "BACK") continue providerSetup
            const navAction = parseHomeActionSentinel(key)
            if (navAction) {
              forcedHomeAction = navAction
              continue home
            }
            apiKeys[provider.id] = key
          }
        }
      } else {
        apiKeys[provider.id] = ""
      }

      // Health check
      while (true) {
        renderDialog("Health check", [
          `${nord.blue("provider")} ${ascii(provider.name)}`,
          `${nord.blue("endpoint")} ${provider.baseURL}`,
          "",
          "Checking provider...",
        ])
        const health = await checkProviderHealth(provider, apiKeys[provider.id])

        if (health.status === "ok") {
          const models = health.models ? ` ${health.models.length} models` : ""
          renderDialog("Health check", [
            `${nord.green("OK")} ${ascii(provider.name)}`,
            `${nord.blue("latency")} ${health.latencyMs}ms`,
            `${nord.blue("models")} ${models.trim() || "none reported"}`,
          ], remaining > 0 ? `Next provider: ${remaining} left` : undefined)
          healthyProviders.push({ provider, health })
          break
        }

        const failureLines = health.status === "timeout"
          ? [
              `${nord.yellow("TIMEOUT")} ${ascii(provider.name)}`,
              `${nord.blue("latency")} ${health.latencyMs}ms`,
            ]
          : [
              `${pc.red("ERR")} ${ascii(provider.name)}`,
              `${nord.blue("error")} ${health.error ?? ""}`,
            ]
        const action = await promptHealthFailureAction(failureLines)
        if (action === "back") continue providerSetup
        if (action === "retry") {
          if (provider.envKey) {
            const key = await promptRequiredOrBackView(
              "Provider setup",
              "Enter API key:",
              [
                `${nord.blue("provider")} ${ascii(provider.name)}`,
                `${nord.blue("step")} ${tag}`,
                `${nord.blue("base url")} ${provider.baseURL}`,
                `${nord.blue("website")} ${provider.website}`,
                `${nord.blue("env")} ${provider.envKey}`,
              ],
            )
            if (key === "BACK") continue providerSetup
            const navAction = parseHomeActionSentinel(key)
            if (navAction) {
              forcedHomeAction = navAction
              continue home
            }
            apiKeys[provider.id] = key
          }
          continue
        }
        break
      }

      if (remaining > 0) {
        const next = await promptLineViewEsc(
          "Provider setup",
          "Press Enter to continue:",
          [
            `${nord.blue("remaining")} ${remaining}`,
            nord.textMuted("Press Esc to return to provider selection."),
          ],
        )
        const navAction = next !== "ESC" ? parseHomeActionSentinel(next) : null
        if (navAction) {
          forcedHomeAction = navAction
          continue home
        }
        if (next === "ESC" || next.toLowerCase() === "back") continue providerSetup
      }
    }

      setupComplete = true
      break
    }
  }

  if (healthyProviders.length === 0) {
    exitCancelled("No healthy providers")
  }

  // Save keys
  const hasKeyable = Object.values(apiKeys).some(k => k.length > 0)
  if (hasKeyable) {
    const saveAnswer = await promptConfirmView(
      "Key storage",
      "Save API keys encrypted for FreeBuffet only?",
      [
        `${nord.blue("path")} ${getLocalConfigPath()}`,
        nord.textMuted("Agent config files still receive real keys or env exports where required."),
      ],
      true,
    )
    if (saveAnswer) {
      try {
        const nonEmptyKeys = Object.fromEntries(
          Object.entries(apiKeys).filter(([, key]) => key.length > 0),
        )
        const mergedKeys = {
          ...(existingConfig?.apiKeys ?? {}),
          ...nonEmptyKeys,
        }
        saveLocalConfig(mergedKeys)
        existingConfig = { apiKeys: mergedKeys, savedAt: new Date().toISOString() }
        for (const id of Object.keys(nonEmptyKeys)) savedKeySet.add(id)
        renderDialog("Key storage", [
          nord.green("Saved encrypted keys for FreeBuffet."),
          `${nord.blue("path")} ${getLocalConfigPath()}`,
        ])
      } catch (err) {
        await promptLineViewEsc("Key storage", "Press Enter to continue:", [
          pc.red("Could not save encrypted keys."),
          `${nord.blue("error")} ${err instanceof Error ? err.message : String(err)}`,
          nord.textMuted("Continuing without saving. Agent configs will still use keys from this run."),
        ])
      }
    }
  }

  // Pick models per provider
  for (const entry of healthyProviders) {
    const { provider, health } = entry
    if (!health.models || health.models.length === 0) continue
    health.models = sortModels(health.models)
    if (health.models.length <= 1) continue

    const selectedModels = await selectSearchableChoices(
      `${ascii(provider.name)} - search and pick models`,
      health.models.map(m => ({
        id: m,
        label: m,
        hint: isFreeModel(m) ? "free" : undefined,
      })),
      false,
    )
    if (selectedModels.length > 0) {
      health.models = selectedModels
    }

    const extraModels = await promptLineView(
      "Additional models",
      "Additional model ids, comma-separated (blank to skip):",
      [
        `${nord.blue("provider")} ${ascii(provider.name)}`,
        nord.textMuted("Use this when a provider supports a model that /models did not return."),
      ],
    )
    if (extraModels) {
      const merged = new Set([
        ...health.models,
        ...extraModels.split(",").map(m => m.trim()).filter(Boolean),
      ])
      health.models = [...merged]
    }
  }

  // Pick agents
  const selectedAgents = await selectAgentsView()

  // Write configs
  const lines: string[] = []
  const data = healthyProviders.map(h => ({ provider: h.provider, health: h.health }))
  const previewLines = [
    `${nord.blue("providers")} ${data.length}`,
    `${nord.blue("models")} ${data.reduce((sum, entry) => sum + (entry.health.models?.length ?? 0), 0)}`,
    `${nord.blue("agents")} ${selectedAgents.join(", ")}`,
    "",
  ]
  if (selectedAgents.includes("all") || selectedAgents.includes("opencode")) {
    previewLines.push(`${nord.blue("write")} ${process.cwd() + "/opencode.json"}`)
    previewLines.push(`${nord.blue("write")} ${getOpenCodeAuthPath()}`)
  }
  if (selectedAgents.includes("all") || selectedAgents.includes("codex")) {
    previewLines.push(`${nord.blue("write")} ${homedir() + "/.codex/config.toml"}`)
    previewLines.push(`${nord.blue("write")} ${homedir() + "/.codex/freebuffet.env"}`)
  }
  if (selectedAgents.includes("all") || selectedAgents.includes("claude")) {
    previewLines.push(`${nord.blue("write")} ${homedir() + "/.claude/env.sh"}`)
    previewLines.push(`${nord.blue("write")} ${homedir() + "/.claude/settings.json"}`)
  }
  const confirmWrite = await promptConfirmView(
    "Config preview",
    "Write these config files?",
    previewLines,
    true,
  )
  if (!confirmWrite) exitCancelled("Cancelled before writing config")

  if (selectedAgents.includes("all") || selectedAgents.includes("opencode")) {
    const p = process.cwd() + "/opencode.json"
    const generatedConfig = generateOpenCodeConfig(data)
    const existingConfig = readJsonFile<OpenCodeConfig>(p)
    const mergedConfig = mergeOpenCodeConfig(existingConfig, generatedConfig)
    writeTextFile(p, serializeOpenCodeConfig(mergedConfig) + "\n", existsSync(p) && existingConfig == null)

    const authPath = getOpenCodeAuthPath()
    const generatedAuth = generateOpenCodeAuth(data, apiKeys)
    const existingAuth = readJsonFile<OpenCodeAuth>(authPath)
    const mergedAuth = mergeOpenCodeAuth(existingAuth, generatedAuth)
    writeTextFile(authPath, JSON.stringify(mergedAuth, null, 2) + "\n", existsSync(authPath) && existingAuth == null)
    lines.push(`OK OpenCode ${p}`)
    lines.push(`OK OpenCode auth ${authPath}`)
  }

  if (selectedAgents.includes("all") || selectedAgents.includes("codex")) {
    const path = homedir() + "/.codex/config.toml"
    writeTextFile(path, generateCodexConfig(data))
    writeTextFile(homedir() + "/.codex/freebuffet.env", generateCodexEnvVars(data, apiKeys))
    lines.push(`OK Codex ${path}`)
  }

  if (selectedAgents.includes("all") || selectedAgents.includes("claude")) {
    const dir = homedir() + "/.claude"
    writeTextFile(dir + "/env.sh", generateClaudeEnvVars(data, apiKeys))
    writeTextFile(dir + "/settings.json", JSON.stringify(generateClaudeSettingsJson(data), null, 2) + "\n")
    lines.push(`OK Claude Code ${dir}`)
  }

  const totalModels = data.reduce((s, h) => s + (h.health.models?.length ?? 0), 0)
  renderDialog("FreeBuffet complete", [
    `${nord.blue("providers")} ${healthyProviders.length}`,
    `${nord.blue("models")} ${totalModels}`,
    `${nord.blue("agents")} ${selectedAgents.join(", ")}`,
    "",
    ...lines,
    "",
    `${nord.blue("keys")} ${getLocalConfigPath()}`,
  ])
}

process.on("uncaughtException", (err) => {
  restoreTerminal()
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

process.on("unhandledRejection", (reason) => {
  restoreTerminal()
  console.error(reason instanceof Error ? reason.message : String(reason))
  process.exit(1)
})

main().catch(err => {
  restoreTerminal()
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
