import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { homedir, hostname, platform } from "os"
import { join } from "path"

const APP_NAME = "freebuffet"
const CONFIG_DIR = join(homedir(), ".config", APP_NAME)
const CONFIG_PATH = join(CONFIG_DIR, "config.enc")
const ALGORITHM = "aes-256-gcm"

function deriveKey(): Buffer {
  const pepper = "freebuffet-ae85d1c3"
  const seed = [homedir(), hostname(), platform()].join(":")
  return scryptSync(seed, pepper, 32)
}

export interface LocalConfig {
  apiKeys: Record<string, string>
  savedAt: string
}

export function loadLocalConfig(): LocalConfig | null {
  if (!existsSync(CONFIG_PATH)) return null
  try {
    const data = readFileSync(CONFIG_PATH)
    if (data.length < 28) return null
    const key = deriveKey()
    const iv = data.subarray(0, 12)
    const authTag = data.subarray(12, 28)
    const encrypted = data.subarray(28)
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return JSON.parse(decrypted.toString("utf-8")) as LocalConfig
  } catch {
    return null
  }
}

export function saveLocalConfig(apiKeys: Record<string, string>): void {
  const key = deriveKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const payload = JSON.stringify({ apiKeys, savedAt: new Date().toISOString() })
  const encrypted = Buffer.concat([cipher.update(payload, "utf-8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(CONFIG_PATH, Buffer.concat([iv, authTag, encrypted]))
}

export function clearLocalConfig(): void {
  if (existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, "")
  }
}

export function getLocalConfigPath(): string {
  return CONFIG_PATH
}
