import type { Database } from 'better-sqlite3'

export function getSetting(database: Database, key: string): string | null {
  const row = database.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value?: string } | undefined
  return row?.value ?? null
}

export function setSetting(database: Database, key: string, value: string): void {
  const now = new Date().toISOString()
  database
    .prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?')
    .run(key, value, now, value, now)
}
