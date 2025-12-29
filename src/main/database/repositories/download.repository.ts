import type { Database } from 'better-sqlite3'

export type DownloadRecord = {
  id: string
  url: string
  job_id: string | null
  status: string
  created_at: string
  progress: number | null
  speed: string | null
  eta: string | null
  output_path: string | null
  updated_at: string | null
  error_message: string | null
  video_id: string | null
}

export class DownloadRepository {
  constructor(private readonly db: Database) {}

  list(): DownloadRecord[] {
    const stmt = this.db.prepare('SELECT * FROM downloads ORDER BY created_at DESC')
    return stmt.all() as DownloadRecord[]
  }
}
