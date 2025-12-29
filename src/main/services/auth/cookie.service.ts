import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { Logger } from '../../utils/logger'
import { KeychainService } from './keychain.service'
import { SessionService } from './session.service'

export type CookieImportRequest = {
  platform: string
  filePath: string
  accountName?: string | null
}

export type CookieImportResult = {
  sessionId: string
  cookieCount: number
  expiresAt: string | null
  accountName: string | null
  storage: 'secure' | 'plain'
}

type NetscapeCookie = {
  domain: string
  includeSubdomains: boolean
  path: string
  secure: boolean
  expires: number | null
  name: string
  value: string
  httpOnly: boolean
}

export class CookieService {
  private readonly logger = new Logger('CookieService')

  constructor(
    private readonly sessionService: SessionService,
    private readonly keychain: KeychainService
  ) {}

  async importCookies(request: CookieImportRequest): Promise<CookieImportResult> {
    this.logger.info('cookie import requested', { platform: request.platform })
    const raw = await readFile(request.filePath, 'utf-8')
    const parsed = this.parseCookieFile(raw)

    if (!parsed.cookies.length) {
      throw new Error('No cookies found in the selected file.')
    }

    const expiresAt = this.findLatestExpiry(parsed.cookies)
    const payload = {
      format: parsed.format,
      source: 'file',
      sourceFile: basename(request.filePath),
      importedAt: new Date().toISOString(),
      cookies: parsed.cookies
    }

    const encrypted = this.keychain.encryptToJson(JSON.stringify(payload))
    const sessionId = this.sessionService.createSession({
      platform: request.platform,
      accountName: request.accountName ?? null,
      cookies: encrypted,
      headers: null,
      expiresAt,
      setActive: true
    })

    return {
      sessionId,
      cookieCount: parsed.cookies.length,
      expiresAt,
      accountName: request.accountName ?? null,
      storage: this.keychain.isEncryptionAvailable() ? 'secure' : 'plain'
    }
  }

  private parseCookieFile(contents: string): { format: 'netscape' | 'json'; cookies: NetscapeCookie[] } {
    const trimmed = contents.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        const cookies = this.normalizeJsonCookies(parsed)
        if (cookies.length) {
          return { format: 'json', cookies }
        }
      } catch {
        // Fall back to Netscape parsing
      }
    }

    return { format: 'netscape', cookies: this.parseNetscapeCookies(contents) }
  }

  private normalizeJsonCookies(parsed: unknown): NetscapeCookie[] {
    const cookies: NetscapeCookie[] = []
    const cookieArray =
      Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === 'object' && Array.isArray((parsed as { cookies?: unknown }).cookies)
        ? (parsed as { cookies: unknown[] }).cookies
        : []

    for (const entry of cookieArray) {
      if (!entry || typeof entry !== 'object') {
        continue
      }
      const record = entry as Record<string, unknown>
      const name = typeof record.name === 'string' ? record.name : null
      const value = typeof record.value === 'string' ? record.value : null
      const domainRaw = typeof record.domain === 'string' ? record.domain : ''
      const hostRaw = typeof record.host === 'string' ? record.host : ''
      const domain = (domainRaw || hostRaw).trim()
      const path = typeof record.path === 'string' ? record.path : '/'
      const hostOnly = typeof record.hostOnly === 'boolean' ? record.hostOnly : null
      if (!name || value === null) {
        continue
      }
      if (!domain) {
        continue
      }
      const expiresRaw = record.expirationDate ?? record.expires
      const expires = this.normalizeExpiry(expiresRaw)
      const includeSubdomains = hostOnly === null ? domain.startsWith('.') : !hostOnly
      cookies.push({
        domain,
        includeSubdomains,
        path,
        secure: Boolean(record.secure),
        expires,
        name,
        value,
        httpOnly: Boolean(record.httpOnly)
      })
    }
    return cookies
  }

  private parseNetscapeCookies(contents: string): NetscapeCookie[] {
    const cookies: NetscapeCookie[] = []
    const lines = contents.split(/\r?\n/)

    for (const rawLine of lines) {
      const trimmed = rawLine.trim()
      if (!trimmed) {
        continue
      }

      const isHttpOnly = trimmed.startsWith('#HttpOnly_')
      const line = isHttpOnly ? trimmed.replace('#HttpOnly_', '') : trimmed

      if (line.startsWith('#')) {
        continue
      }

      let parts = line.split('\t')
      let usedWhitespaceSplit = false
      if (parts.length < 7) {
        parts = line.split(/\s+/)
        usedWhitespaceSplit = true
      }

      if (parts.length < 7) {
        continue
      }

      const [domain, includeSubdomains, path, secure, expiresRaw, name, ...rest] = parts
      const value = rest.join(usedWhitespaceSplit ? ' ' : '\t')
      const expires = this.normalizeExpiry(expiresRaw)
      const includeSubdomainsFlag = includeSubdomains.toLowerCase() === 'true'
      const secureFlag = secure.toLowerCase() === 'true'

      cookies.push({
        domain,
        includeSubdomains: includeSubdomainsFlag,
        path,
        secure: secureFlag,
        expires,
        name,
        value,
        httpOnly: isHttpOnly
      })
    }

    return cookies
  }

  private findLatestExpiry(cookies: NetscapeCookie[]): string | null {
    const latest = cookies.reduce((max, cookie) => {
      if (!cookie.expires) {
        return max
      }
      return cookie.expires > max ? cookie.expires : max
    }, 0)
    if (!latest) {
      return null
    }
    const date = new Date(latest * 1000)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  private normalizeExpiry(value: unknown): number | null {
    let numeric: number | null = null
    if (typeof value === 'number' && Number.isFinite(value)) {
      numeric = value
    } else if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      numeric = Number.isFinite(parsed) ? parsed : null
    }

    if (!numeric || numeric <= 0) {
      return null
    }

    const seconds = numeric > 1_000_000_000_000 ? numeric / 1000 : numeric
    return Math.trunc(seconds)
  }
}
