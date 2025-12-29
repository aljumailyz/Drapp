import type { Database } from 'better-sqlite3'

export type VideoRecord = {
  id: string
  title: string | null
  path: string
  created_at: string
}

export class VideoRepository {
  constructor(private readonly db: Database) {}

  list(): VideoRecord[] {
    const stmt = this.db.prepare('SELECT * FROM videos ORDER BY created_at DESC')
    return stmt.all() as VideoRecord[]
  }
}
