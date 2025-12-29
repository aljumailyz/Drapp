import type { Database } from 'better-sqlite3'

export type JobRecord = {
  id: string
  type: string
  status: string
  payload: string | null
  created_at: string
  updated_at: string | null
  error_message: string | null
}

export class JobRepository {
  constructor(private readonly db: Database) {}

  list(): JobRecord[] {
    const stmt = this.db.prepare('SELECT * FROM jobs ORDER BY created_at DESC')
    return stmt.all() as JobRecord[]
  }
}
