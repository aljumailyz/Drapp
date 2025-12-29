import type { Database } from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { Logger } from '../../utils/logger'

export type SessionInfo = {
  id: string
  platform: string
  accountName: string | null
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export type SessionSecret = SessionInfo & {
  cookies: string | null
  headers: string | null
}

export class SessionService {
  private readonly logger = new Logger('SessionService')

  constructor(private readonly db: Database) {}

  listSessions(): SessionInfo[] {
    this.logger.info('session list requested')
    const rows = this.db
      .prepare(
        'SELECT id, platform, account_name, is_active, created_at, last_used_at, expires_at FROM auth_sessions ORDER BY created_at DESC'
      )
      .all() as Array<{
      id: string
      platform: string
      account_name: string | null
      is_active: number
      created_at: string
      last_used_at: string | null
      expires_at: string | null
    }>

    return rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      accountName: row.account_name,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at
    }))
  }

  createSession(params: {
    platform: string
    accountName?: string | null
    cookies: string
    headers?: string | null
    expiresAt?: string | null
    setActive?: boolean
  }): string {
    const platform = params.platform.trim().toLowerCase()
    const id = randomUUID()
    const now = new Date().toISOString()
    const shouldActivate = params.setActive !== false

    if (shouldActivate) {
      this.db
        .prepare('UPDATE auth_sessions SET is_active = 0 WHERE lower(platform) = ?')
        .run(platform)
    }

    this.db
      .prepare(
        `INSERT INTO auth_sessions
        (id, platform, account_name, cookies_json, headers_json, is_active, expires_at, created_at, last_used_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        platform,
        params.accountName ?? null,
        params.cookies,
        params.headers ?? null,
        shouldActivate ? 1 : 0,
        params.expiresAt ?? null,
        now,
        now
      )

    return id
  }

  getActiveSession(platform: string): SessionSecret | null {
    const normalized = platform.trim().toLowerCase()
    const row = this.db
      .prepare(
        'SELECT id, platform, account_name, is_active, created_at, last_used_at, expires_at, cookies_json, headers_json FROM auth_sessions WHERE lower(platform) = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
      )
      .get(normalized) as {
      id: string
      platform: string
      account_name: string | null
      is_active: number
      created_at: string
      last_used_at: string | null
      expires_at: string | null
      cookies_json: string | null
      headers_json: string | null
    } | undefined

    if (!row) {
      return null
    }

    return {
      id: row.id,
      platform: row.platform,
      accountName: row.account_name,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at,
      cookies: row.cookies_json,
      headers: row.headers_json
    }
  }

  markUsed(sessionId: string): void {
    const now = new Date().toISOString()
    this.db
      .prepare('UPDATE auth_sessions SET last_used_at = ? WHERE id = ?')
      .run(now, sessionId)
  }

  setActive(sessionId: string): boolean {
    const row = this.db
      .prepare('SELECT id, platform FROM auth_sessions WHERE id = ?')
      .get(sessionId) as { id: string; platform: string } | undefined

    if (!row) {
      return false
    }

    const now = new Date().toISOString()
    const normalized = row.platform.trim().toLowerCase()
    this.db
      .prepare('UPDATE auth_sessions SET is_active = 0 WHERE lower(platform) = ?')
      .run(normalized)
    const result = this.db
      .prepare('UPDATE auth_sessions SET is_active = 1, last_used_at = ? WHERE id = ?')
      .run(now, sessionId)
    return result.changes > 0
  }

  deleteSession(sessionId: string): boolean {
    const result = this.db
      .prepare('DELETE FROM auth_sessions WHERE id = ?')
      .run(sessionId)
    return result.changes > 0
  }
}
