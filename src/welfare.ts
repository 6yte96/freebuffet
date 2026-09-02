/**
 * Welfare site registry — free credit relay/proxy stations.
 *
 * These are relay/proxy stations that offer free API credits for Claude Code,
 * Codex CLI, and other AI coding agents. Users register on these sites to get
 * free credits, then use the API endpoints with FreeBuffet's agent config generation.
 *
 * Features:
 * - Credit calculation (signup + invite + daily = first-day total)
 * - Live status probing (New API, VibeCode, Matrix, Relay panel types)
 * - Snapshot merge (handle Cloudflare blocks gracefully)
 * - Change detection (diff between snapshots for important changes)
 */

import { readFileSync, existsSync } from "fs"
import { join } from "path"

// ── Types ────────────────────────────────────────────────────────────────────

export interface WelfareCredits {
  signup?: number | null
  invite?: number | null
  dailyCheckin?: number | null
  dailyQuota?: number | null
  approx?: boolean
  unit?: "usd" | "point" | string
}

export interface WelfareMirror {
  label: string
  homeUrl: string
  signupUrl: string
}

export interface WelfareEndpoints {
  anthropic?: string | null
  openai?: string | null
}

export interface WelfareSetup {
  client: string
  note: string
  steps: string[]
  dashboardUrl?: string
}

export interface WelfareRegister {
  methods: string[]
  requirements: string[]
}

export interface WelfareSite {
  id: string
  name: string
  subtitle: string
  recommended?: boolean
  panel?: string
  credits: WelfareCredits
  signupUrl: string
  homeUrl: string
  docsUrl?: string | null
  statusApi: string
  pricingApi?: string | null
  mirrors: WelfareMirror[]
  tags: string[]
  highlights: string[]
  endpoints: WelfareEndpoints
  setup?: WelfareSetup
  modelsNote?: string
  register: WelfareRegister
  earnMore: string[]
  caveats: string[]
  community: string[]
}

export interface WelfareData {
  sites: WelfareSite[]
}

// ── Snapshot types (for live probing) ────────────────────────────────────────

export interface WelfareModel {
  name: string
  ratio?: number | null
  completionRatio?: number | null
  fixedPrice?: number | null
  inputPerMTok?: number | null
  outputPerMTok?: number | null
  groups?: string[]
  protocols?: string[]
}

export interface WelfareAnnouncement {
  id?: number | null
  date?: string | null
  text: string
}

export interface WelfareSnapshot {
  id: string
  checkedAt: string
  apiOk: boolean
  pricingOk: boolean
  latencyMs: number | null
  error: string | null
  systemName: string | null
  version: string | null
  registerOpen: boolean | null
  passwordRegister: boolean | null
  checkinEnabled: boolean | null
  loginMethods: string[]
  githubMinAccountAgeDays: number | null
  quotaPerUnit: number | null
  inviteeBonusUsd: number | null
  inviterBonusUsd: number | null
  topupEnabled: boolean | null
  services: string[]
  announcements: WelfareAnnouncement[]
  models: WelfareModel[]
  modelsSource: "public-api" | "login-required" | "cached"
  defaults: { claude: string | null; openai: string | null }
  online?: boolean
  probeBlocked?: boolean
  signup?: { status: number; ok: boolean; ms: number; error?: string } | null
  mirrors?: { homeUrl: string; online: boolean }[]
  dataStale?: boolean
  staleFrom?: string | null
  staleFields?: string[]
  modelsSource_?: string
}

export interface CreditPlan {
  name: string | null
  unit: string
  signup: number | null
  invite: number | null
  daily: number | null
  resets: boolean
  approx: boolean
  base: number | null
  sources: number
  firstDay: number | null
  apiInvite: number | null
  inviter: number | null
}

export interface LiveData {
  generatedAt: string
  sites: WelfareSnapshot[]
}

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_UNIT = "usd"
const UNITS: Record<string, { prefix: string; suffix: string }> = {
  usd: { prefix: "$", suffix: "" },
  point: { prefix: "", suffix: " pts" },
}
const KNOWN_UNITS = Object.keys(UNITS)
export const STALE_WARN_HOURS = 48
const TIMEOUT_MS = 20_000
const RETRIES = 2
const UA = "freebuffet/0.2.0 (+https://github.com/code6yte/freebuffet)"

// ── Data loading ─────────────────────────────────────────────────────────────

let _welfareSites: WelfareSite[] | null = null

function getWelfareDataPath(): string {
  // Try relative to the module, then relative to cwd
  const candidates = [
    join(__dirname, "..", "data", "welfare-sites.json"),
    join(process.cwd(), "data", "welfare-sites.json"),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return candidates[0]
}

function getLiveDataPath(): string {
  return join(process.cwd(), "data", "welfare-live.json")
}

export function loadWelfareSites(): WelfareSite[] {
  if (_welfareSites) return _welfareSites
  const p = getWelfareDataPath()
  if (!existsSync(p)) return []
  try {
    const raw = readFileSync(p, "utf-8")
    const data = JSON.parse(raw) as WelfareData
    _welfareSites = data.sites ?? []
    return _welfareSites
  } catch {
    return []
  }
}

export function loadLiveData(): LiveData | null {
  const p = getLiveDataPath()
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as LiveData
  } catch {
    return null
  }
}

export function getWelfareSite(id: string): WelfareSite | undefined {
  return loadWelfareSites().find(s => s.id === id)
}

export function searchWelfareSites(query: string): WelfareSite[] {
  const q = query.toLowerCase()
  return loadWelfareSites().filter(s =>
    s.id.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.subtitle.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  )
}

// ── Credit calculation ───────────────────────────────────────────────────────

const num = (v: unknown): number | null =>
  Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null

export function creditPlan(site: WelfareSite, snap?: WelfareSnapshot | null): CreditPlan {
  const c = site?.credits ?? {}
  const signup = num(c.signup)
  const invite = num(c.invite)
  const checkin = num(c.dailyCheckin)
  const pool = num(c.dailyQuota)
  const approx = Boolean(c.approx)
  const unit = c.unit ?? DEFAULT_UNIT

  const daily = checkin ?? pool
  const resets = checkin == null && pool != null

  const parts = [signup, invite].filter((n): n is number => n != null)
  const base = parts.length ? parts.reduce((a, b) => a + b, 0) : null
  const firstDay = base != null || daily != null ? (base ?? 0) + (daily ?? 0) : null
  const sources = [signup, invite, daily].filter((n): n is number => n != null).length

  return {
    name: site?.name ?? null,
    unit,
    signup,
    invite,
    daily,
    resets,
    approx,
    base,
    sources,
    firstDay,
    apiInvite: snap?.inviteeBonusUsd ?? null,
    inviter: snap?.inviterBonusUsd ?? null,
  }
}

const unitStyle = (unit: string) =>
  UNITS[unit] ?? { prefix: "", suffix: ` ${unit}` }

export function formatCredits(n: number | null, approx = false, unit = DEFAULT_UNIT): string | null {
  if (n == null) return null
  const { prefix, suffix } = unitStyle(unit)
  return `${approx ? "~" : ""}${prefix}${n}${suffix}`
}

export function perDay(plan: CreditPlan): string | null {
  if (plan.daily == null) return null
  return `${formatCredits(plan.daily, plan.approx, plan.unit)}/day${plan.resets ? " (resets)" : ""}`
}

export function breakdown(plan: CreditPlan): string | null {
  const items = [
    plan.signup != null ? `Sign-up ${formatCredits(plan.signup, false, plan.unit)}` : null,
    plan.invite != null ? `Invite ${formatCredits(plan.invite, false, plan.unit)}` : null,
    plan.daily != null ? `${plan.resets ? "Daily pool" : "Check-in"} ${formatCredits(plan.daily, plan.approx, plan.unit)}` : null,
  ].filter(Boolean)
  if (items.length > 1) return items.join(" + ")
  if (items.length !== 1) return null
  return plan.resets ? `${items[0]} (resets daily, does not accumulate)` : items[0]
}

export function usdTotals(plans: CreditPlan[]): {
  count: number
  best: number
  total: number
  resetting: boolean
  others: CreditPlan[]
} {
  const inUsd = plans.filter(p => p.unit === DEFAULT_UNIT)
  return {
    count: inUsd.length,
    best: Math.max(0, ...inUsd.map(p => p.firstDay ?? 0)),
    total: inUsd.reduce((sum, p) => sum + (p.firstDay ?? 0), 0),
    resetting: inUsd.some(p => p.resets),
    others: plans.filter(p => p.unit !== DEFAULT_UNIT && p.firstDay != null),
  }
}

// ── HTTP probing ─────────────────────────────────────────────────────────────

function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

interface FetchResult {
  ok: boolean
  status?: number
  ms: number
  json?: unknown
  error?: string
  attempts?: number
}

async function fetchOnce(url: string): Promise<FetchResult> {
  const started = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "application/json" },
      signal: ctrl.signal,
      redirect: "follow",
    })
    const ms = Date.now() - started
    const text = await res.text()
    if (!res.ok) return { ok: false, status: res.status, ms, error: `HTTP ${res.status}` }
    try {
      return { ok: true, status: res.status, ms, json: JSON.parse(text) }
    } catch {
      return { ok: false, status: res.status, ms, error: "invalid json" }
    }
  } catch (err) {
    return {
      ok: false,
      ms: Date.now() - started,
      error: err instanceof DOMException && err.name === "AbortError" ? "timeout" : String((err as Error).message || err),
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchJson(url: string): Promise<FetchResult> {
  if (!url) return { ok: false, error: "no url", ms: 0 }
  if (!isHttpsUrl(url)) return { ok: false, status: 0, error: "only https allowed", ms: 0 }
  let last: FetchResult = { ok: false, error: "unreachable", ms: 0 }
  for (let i = 0; i <= RETRIES; i++) {
    if (i) await sleep(1500 * i)
    last = await fetchOnce(url)
    if (last.ok) return { ...last, attempts: i + 1 }
  }
  return { ...last, attempts: RETRIES + 1 }
}

export async function probeUrl(
  url: string,
  opts?: { retries?: number; backoffMs?: number },
): Promise<FetchResult | null> {
  if (!url) return null
  if (!isHttpsUrl(url)) return { status: 0, ok: false, ms: 0, error: "only https allowed" }
  const retries = opts?.retries ?? RETRIES
  const backoffMs = opts?.backoffMs ?? 1500
  let last: FetchResult | null = null
  for (let i = 0; i <= retries; i++) {
    if (i) await sleep(backoffMs * i)
    const started = Date.now()
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      return { status: res.status, ok: res.ok, ms: Date.now() - started, attempts: i + 1 }
    } catch (err) {
      last = {
        status: 0,
        ok: false,
        ms: Date.now() - started,
        error: String((err as Error).message || err),
        attempts: i + 1,
      }
    }
  }
  return last
}

// ── Snapshot types (filter detection) ────────────────────────────────────────

const FILTERED_STATUS = new Set([403, 429, 451, 503])

export function looksFiltered(res: FetchResult | null): boolean {
  if (!res || res.ok) return false
  if (FILTERED_STATUS.has(Number(res.status))) return true
  return Number(res.status) === 200 && res.error === "invalid json"
}

// ── Blank snapshot ───────────────────────────────────────────────────────────

function blankSnapshot(
  site: WelfareSite,
  opts: { apiOk: boolean; pricingOk: boolean; latencyMs: number | null; error: string | null },
): WelfareSnapshot {
  return {
    id: site.id,
    checkedAt: new Date().toISOString(),
    apiOk: Boolean(opts.apiOk),
    pricingOk: Boolean(opts.pricingOk),
    latencyMs: opts.latencyMs ?? null,
    error: opts.error ?? null,
    systemName: null,
    version: null,
    registerOpen: null,
    passwordRegister: null,
    checkinEnabled: null,
    loginMethods: [],
    githubMinAccountAgeDays: null,
    quotaPerUnit: null,
    inviteeBonusUsd: null,
    inviterBonusUsd: null,
    topupEnabled: null,
    services: [],
    announcements: [],
    models: [],
    modelsSource: opts.pricingOk ? "public-api" : "login-required",
    defaults: { claude: null, openai: null },
  }
}

// ── Panel probing ────────────────────────────────────────────────────────────

const RATIO_USD_PER_MTOK = 2

function money(n: number): number | null {
  if (!Number.isFinite(n)) return null
  return Math.round(n * 1000) / 1000
}

function versionKey(name: string): number[] {
  return (name.match(/\d+/g) ?? []).map(Number)
}

export function pickPreferred(
  models: WelfareModel[] | null | undefined,
  re: RegExp,
): string | null {
  const hits = (models ?? []).filter(m => re.test(m.name))
  if (!hits.length) return null
  return hits.sort((a, b) => {
    const [x, y] = [versionKey(a.name), versionKey(b.name)]
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const d = (y[i] ?? -1) - (x[i] ?? -1)
      if (d) return d
    }
    return a.name.localeCompare(b.name)
  })[0].name
}

function normalizeModels(pricing: unknown[]): WelfareModel[] {
  if (!Array.isArray(pricing)) return []
  return pricing
    .filter((m): m is Record<string, unknown> => m != null && typeof m === "object" && "model_name" in m)
    .map(m => {
      const ratio = Number(m.model_ratio)
      const compl = Number(m.completion_ratio)
      const fixed = Number(m.model_price) > 0
      return {
        name: String(m.model_name),
        ratio: Number.isFinite(ratio) ? ratio : null,
        completionRatio: Number.isFinite(compl) ? compl : null,
        fixedPrice: fixed ? Number(m.model_price) : null,
        inputPerMTok: fixed ? null : money(ratio * RATIO_USD_PER_MTOK),
        outputPerMTok: fixed ? null : money(ratio * compl * RATIO_USD_PER_MTOK),
        groups: Array.isArray(m.enable_groups) ? (m.enable_groups as string[]) : [],
        protocols: Array.isArray(m.supported_endpoint_types) ? (m.supported_endpoint_types as string[]) : [],
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ── Probe: New API panel ─────────────────────────────────────────────────────

async function probeNewApi(site: WelfareSite): Promise<WelfareSnapshot> {
  const [statusRes, pricingRes] = await Promise.all([
    fetchJson(site.statusApi),
    site.pricingApi ? fetchJson(site.pricingApi) : Promise.resolve<FetchResult>({ ok: false, error: "not public", ms: 0 }),
  ])

  const snapshot = blankSnapshot(site, {
    apiOk: statusRes.ok,
    pricingOk: pricingRes.ok,
    latencyMs: statusRes.ms ?? null,
    error: statusRes.ok ? null : statusRes.error ?? null,
  })

  snapshot.models = normalizeModels(
    (pricingRes.ok && pricingRes.json && typeof pricingRes.json === "object" && "data" in pricingRes.json)
      ? (pricingRes.json as { data: unknown[] }).data
      : [],
  )

  const d = (statusRes.ok && statusRes.json && typeof statusRes.json === "object" && "data" in statusRes.json)
    ? (statusRes.json as { data: Record<string, unknown> }).data ?? {}
    : {}

  const per = Number(d.quota_per_unit) || null
  Object.assign(snapshot, {
    systemName: (d.system_name as string) ?? null,
    version: (d.version as string) ?? null,
    registerOpen: typeof d.register_enabled === "boolean" ? d.register_enabled : null,
    passwordRegister: typeof d.password_register_enabled === "boolean" ? d.password_register_enabled : null,
    checkinEnabled: typeof d.checkin_enabled === "boolean" ? d.checkin_enabled : null,
    githubMinAccountAgeDays: Number(d.github_minimum_account_age_days) || null,
    quotaPerUnit: per,
    inviteeBonusUsd: per && Number(d.quota_for_invitee) ? money(Number(d.quota_for_invitee) / per) : null,
    inviterBonusUsd: per && Number(d.quota_for_inviter) ? money(Number(d.quota_for_inviter) / per) : null,
    topupEnabled: typeof d.enable_online_topup === "boolean" ? d.enable_online_topup : null,
    loginMethods: [
      d.github_oauth && "GitHub",
      d.linuxdo_oauth && "LinuxDO",
      d.discord_oauth && "Discord",
      d.telegram_oauth && "Telegram",
      d.wechat_login && "WeChat",
      d.oidc_enabled && "OIDC",
      d.passkey_login && "Passkey",
      d.password_login_enabled && "Password",
    ].filter(Boolean) as string[],
  })

  snapshot.defaults = {
    claude: pickPreferred(snapshot.models, /^claude/i),
    openai: pickPreferred(snapshot.models, /^(gpt|o\d|glm|deepseek|qwen|kimi)/i)
      ?? pickPreferred(snapshot.models, /./)
      ?? null,
  }

  return snapshot
}

// ── Probe: VibeCode panel (RawChat style) ───────────────────────────────────

const SERVICES: Record<string, string> = {
  isAuthCodex: "Codex",
  isAuthClaude: "Claude Code",
  isAuthClaude2api: "Claude API",
  isAuthGemini: "Gemini",
  isAuthGrok: "Grok",
}

const LOGINS: Record<string, string> = {
  isEnableMailRegister: "Email",
  isEnableGitHubLogin: "GitHub",
  isEnableGoogleLogin: "Google",
  isEnableLinuxDoLogin: "LinuxDO",
}

function labels(dict: Record<string, string>, data: Record<string, unknown>): string[] {
  return Object.entries(dict)
    .filter(([k]) => data?.[k] === true)
    .map(([, label]) => label)
}

async function probeVibeCode(site: WelfareSite): Promise<WelfareSnapshot> {
  const loginUrl = site.statusApi.replace(/[^/]+$/, "getLoginConfig")
  const [cfgRes, loginRes] = await Promise.all([
    fetchJson(site.statusApi),
    fetchJson(loginUrl),
  ])

  const cfgJson = cfgRes.json as Record<string, unknown> | undefined
  const cfgPayload = (cfgRes.ok && cfgJson && cfgJson.code === 1)
    ? ((cfgJson.data as Record<string, unknown>) ?? null)
    : null
  const loginJson = loginRes.json as Record<string, unknown> | undefined
  const loginPayload = (loginRes.ok && loginJson && loginJson.code === 1)
    ? ((loginJson.data as Record<string, unknown>) ?? null)
    : null

  const snapshot = blankSnapshot(site, {
    apiOk: Boolean(cfgPayload),
    pricingOk: false,
    latencyMs: cfgRes.ms ?? null,
    error: cfgPayload ? null : cfgRes.error ?? "API not open",
  })

  Object.assign(snapshot, {
    systemName: (cfgPayload?.siteName as string) ?? (loginPayload?.siteName as string) ?? null,
    version: (loginPayload?.backendVersion as string) ?? null,
    registerOpen: typeof loginPayload?.isEnableRegister === "boolean" ? loginPayload.isEnableRegister : null,
    passwordRegister: typeof loginPayload?.isEnableMailRegister === "boolean" ? loginPayload.isEnableMailRegister : null,
    services: labels(SERVICES, cfgPayload ?? {}),
    loginMethods: labels(LOGINS, loginPayload ?? {}),
    announcements: (loginPayload && loginPayload.notice && String(loginPayload.notice).trim())
      ? [{ id: null, date: null, text: String(loginPayload.notice).replace(/\s+/g, " ").trim().slice(0, 220) }]
      : [],
  })

  return snapshot
}

// ── Probe: Matrix panel ──────────────────────────────────────────────────────

async function probeMatrix(site: WelfareSite): Promise<WelfareSnapshot> {
  const res = await fetchJson(site.statusApi)
  const json = res.json as Record<string, unknown> | undefined
  const ok = Boolean(res.ok && json && String(json.status ?? "") === "ok")

  return blankSnapshot(site, {
    apiOk: ok,
    pricingOk: false,
    latencyMs: res?.ms ?? null,
    error: ok ? null : res?.error ?? "health check failed",
  })
}

// ── Probe: Relay panel (CheapCodex, NOFX) ───────────────────────────────────

async function probeRelay(site: WelfareSite): Promise<WelfareSnapshot> {
  const res = await probeUrl(site.statusApi)
  const ok = res?.ok || Number(res?.status) === 401

  return blankSnapshot(site, {
    apiOk: ok,
    pricingOk: false,
    latencyMs: res?.ms ?? null,
    error: ok ? null : res?.error ?? "unreachable",
  })
}

// ── Panel router ─────────────────────────────────────────────────────────────

const PANELS: Record<string, (site: WelfareSite) => Promise<WelfareSnapshot>> = {
  newapi: probeNewApi,
  vibecode: probeVibeCode,
  matrix: probeMatrix,
  relay: probeRelay,
}

export async function probeSite(site: WelfareSite): Promise<WelfareSnapshot> {
  const probe = PANELS[site.panel ?? "newapi"]
  if (!probe) throw new Error(`Unknown panel type: ${site.panel}`)
  return probe(site)
}

// ── Snapshot merge (handle Cloudflare blocks) ────────────────────────────────

const FRESH_ALWAYS = new Set([
  "id", "checkedAt", "apiOk", "pricingOk", "latencyMs", "error", "signup", "mirrors",
])

function meaningful(v: unknown): boolean {
  if (v == null) return false
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === "string") return v.trim() !== ""
  if (typeof v === "object" && v !== null) return Object.values(v).some(meaningful)
  return true
}

export function probeFiltered(fresh: WelfareSnapshot): boolean {
  const api = { ok: fresh.apiOk, status: Number(/^HTTP (\d{3})$/.exec(fresh.error ?? "")?.[1]) || 200, error: fresh.error }
  const failures = [api, fresh.signup].filter(r => r && !r.ok)
  return failures.length > 0 && failures.every(r => looksFiltered(r as FetchResult | null))
}

const hoursSince = (iso: string): number => {
  const t = new Date(iso ?? "").getTime()
  return Number.isFinite(t) ? (Date.now() - t) / 3_600_000 : Infinity
}

export function mergeSnapshot(fresh: WelfareSnapshot, old?: WelfareSnapshot | null): WelfareSnapshot {
  const out: Partial<WelfareSnapshot> = { ...(old ?? {}) } as Partial<WelfareSnapshot>
  const reused: string[] = []

  for (const [k, v] of Object.entries(fresh)) {
    const oldVal = old != null ? (old as unknown as Record<string, unknown>)[k] : undefined
    if (FRESH_ALWAYS.has(k) || meaningful(v) || !meaningful(oldVal)) {
      ;(out as unknown as Record<string, unknown>)[k] = v
    } else {
      reused.push(k)
    }
  }

  if (reused.includes("models")) out.modelsSource = "cached"

  out.defaults = {
    claude: pickPreferred(out.models, /^claude/i),
    openai: pickPreferred(out.models, /^(gpt|o\d|glm|deepseek|qwen|kimi)/i)
      ?? pickPreferred(out.models, /./)
      ?? null,
  }

  const answered = Boolean(fresh.apiOk || fresh.signup?.ok)
  const dataFrom = old?.staleFrom ?? old?.checkedAt ?? null

  out.probeBlocked =
    !answered && probeFiltered(fresh) && old?.online === true && dataFrom != null && hoursSince(dataFrom) <= STALE_WARN_HOURS
  out.online = answered || out.probeBlocked
  out.dataStale = reused.length > 0
  out.staleFrom = reused.length ? dataFrom : null
  out.staleFields = reused

  return out as WelfareSnapshot
}

// ── Diff (change detection between snapshots) ────────────────────────────────

export interface WelfareEvent {
  at: string
  siteId: string
  siteName: string
  type: string
  text: string
  severity: "major" | "minor"
}

const MAJOR = new Set([
  "site_added", "site_removed", "offline", "online",
  "invite_change", "register_closed", "register_open",
  "checkin_on", "checkin_off",
  "models_added", "models_removed", "price_change",
])

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function priceLabel(m: WelfareModel | null | undefined): string {
  if (!m) return "-"
  if (m.fixedPrice != null) return `$${m.fixedPrice}/req`
  const hasTok = m.inputPerMTok != null || m.outputPerMTok != null
  if (hasTok) return `$${m.inputPerMTok ?? "-"} in / $${m.outputPerMTok ?? "-"} out per 1M tok`
  return m.ratio != null ? `ratio ${m.ratio}` : "-"
}

function listNames(names: string[], cap = 4): string {
  return names.length <= cap ? names.join(", ") : `${names.slice(0, cap).join(", ")} and ${names.length} more`
}

function modelMap(snap: WelfareSnapshot | null | undefined): Map<string, WelfareModel> {
  return new Map((snap?.models ?? []).map(m => [m.name, m]))
}

const priceKey = (m: WelfareModel | null | undefined): string =>
  [m?.fixedPrice ?? "", m?.inputPerMTok ?? "", m?.outputPerMTok ?? "", m?.ratio ?? ""].join("|")

export function diffSite(opts: {
  prev: WelfareSnapshot
  next: WelfareSnapshot
  site: WelfareSite | undefined
  at: string
}): WelfareEvent[] {
  const { prev, next, site, at } = opts
  const events: WelfareEvent[] = []
  const siteId = next.id ?? prev.id
  const siteName = site?.name ?? siteId

  const push = (type: string, text: string) =>
    events.push({ at, siteId, siteName, type, text, severity: MAJOR.has(type) ? "major" : "minor" })

  if (next.probeBlocked !== true && Boolean(prev.online) !== Boolean(next.online)) {
    if (next.online) push("online", `${siteName} is back online`)
    else push("offline", `${siteName} unreachable: no response from API or signup page`)
  }

  if (prev.registerOpen === true && next.registerOpen === false)
    push("register_closed", `${siteName} closed registration (register_enabled=false)`)
  if (prev.registerOpen === false && next.registerOpen === true)
    push("register_open", `${siteName} reopened registration`)
  if (prev.checkinEnabled === false && next.checkinEnabled === true)
    push("checkin_on", `${siteName} enabled daily check-in`)
  if (prev.checkinEnabled === true && next.checkinEnabled === false)
    push("checkin_off", `${siteName} disabled daily check-in`)

  const invA = numOrNull(prev.inviteeBonusUsd)
  const invB = numOrNull(next.inviteeBonusUsd)
  if (invA != null && invB != null && invA !== invB)
    push("invite_change", `${siteName} invite credit $${invA} -> $${invB}`)

  const A = modelMap(prev)
  const B = modelMap(next)
  const added = [...B.keys()].filter(k => !A.has(k))
  const removed = [...A.keys()].filter(k => !B.has(k))
  if (added.length) push("models_added", `${siteName} added models: ${listNames(added)}`)
  if (removed.length) push("models_removed", `${siteName} removed models: ${listNames(removed)}`)

  for (const [name, m] of B) {
    const old = A.get(name)
    if (old && priceKey(old) !== priceKey(m))
      push("price_change", `${siteName} ${name} price ${priceLabel(old)} -> ${priceLabel(m)}`)
  }

  return events
}

export function diffSnapshots(
  prevLive: LiveData | null,
  nextLive: LiveData | null,
  sites: WelfareSite[] = [],
): WelfareEvent[] {
  const at = nextLive?.generatedAt ?? new Date().toISOString()
  const meta = new Map(sites.map(s => [s.id, s]))
  const A = new Map((prevLive?.sites ?? []).map(s => [s.id, s]))
  const B = new Map((nextLive?.sites ?? []).map(s => [s.id, s]))
  const events: WelfareEvent[] = []

  for (const [id, next] of B) {
    if (!A.has(id)) {
      const site = meta.get(id)
      const c = site?.credits ?? {}
      const bits = [
        c.signup ? `sign-up $${c.signup}` : null,
        c.invite ? `invite ${c.unit === "point" ? `${c.invite} pts` : `$${c.invite}`}` : null,
        c.dailyCheckin ? `daily check-in $${c.dailyCheckin}` : null,
        c.dailyQuota ? `daily pool $${c.dailyQuota}` : null,
      ].filter(Boolean)
      events.push({
        at,
        siteId: id,
        siteName: site?.name ?? id,
        type: "site_added",
        severity: "major",
        text: `New site: ${site?.name ?? id}${bits.length ? ` (${bits.join(", ")})` : ""}`,
      })
      continue
    }
    events.push(...diffSite({ prev: A.get(id)!, next, site: meta.get(id), at }))
  }

  for (const [id] of A) {
    if (B.has(id)) continue
    events.push({
      at,
      siteId: id,
      siteName: meta.get(id)?.name ?? id,
      type: "site_removed",
      severity: "major",
      text: `Removed site: ${meta.get(id)?.name ?? id}`,
    })
  }

  return events
}

// ── Refresh all sites ────────────────────────────────────────────────────────

export async function refreshWelfareSites(): Promise<LiveData> {
  const sites = loadWelfareSites()
  const snapshots = await Promise.all(sites.map(site => probeSite(site)))

  const previous = loadLiveData()
  const merged = snapshots.map(fresh => {
    const old = previous?.sites?.find(s => s.id === fresh.id)
    return mergeSnapshot(fresh, old)
  })

  // Determine online status from signup page probe
  for (const snap of merged) {
    const site = sites.find(s => s.id === snap.id)
    if (site?.signupUrl) {
      const signupProbe = await probeUrl(site.signupUrl)
      snap.signup = signupProbe ? { status: signupProbe.status ?? 0, ok: signupProbe.ok, ms: signupProbe.ms, error: signupProbe.error } : null
      if (!snap.apiOk && snap.signup?.ok) snap.online = true
    }
  }

  const live: LiveData = {
    generatedAt: new Date().toISOString(),
    sites: merged,
  }

  // Write live data
  const { writeFileSync, mkdirSync } = await import("fs")
  const dir = join(process.cwd(), "data")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "welfare-live.json"), JSON.stringify(live, null, 2) + "\n")

  return live
}

// ── Totals summary ───────────────────────────────────────────────────────────

export function welfareSummary(): {
  totalSites: number
  usdSites: number
  pointSites: number
  bestFirstDay: number
  totalFirstDayUsd: number
  recommended: WelfareSite[]
} {
  const sites = loadWelfareSites()
  const plans = sites.map(s => creditPlan(s))
  const totals = usdTotals(plans)
  return {
    totalSites: sites.length,
    usdSites: totals.count,
    pointSites: plans.filter(p => p.unit !== DEFAULT_UNIT).length,
    bestFirstDay: totals.best,
    totalFirstDayUsd: totals.total,
    recommended: sites.filter(s => s.recommended),
  }
}
