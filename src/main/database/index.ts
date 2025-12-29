import Database from 'better-sqlite3'
import { schema } from './schema'
import { getDatabasePath } from '../utils/paths'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(getDatabasePath())
    db.exec(schema)
    ensureDownloadColumns(db)
    ensureJobColumns(db)
  }

  return db
}

function ensureDownloadColumns(database: Database.Database): void {
  const columns = database.prepare('PRAGMA table_info(downloads)').all() as Array<{ name: string }>
  const columnSet = new Set(columns.map((column) => column.name))

  if (!columnSet.has('progress')) {
    database.exec('ALTER TABLE downloads ADD COLUMN progress REAL')
  }

  if (!columnSet.has('speed')) {
    database.exec('ALTER TABLE downloads ADD COLUMN speed TEXT')
  }

  if (!columnSet.has('eta')) {
    database.exec('ALTER TABLE downloads ADD COLUMN eta TEXT')
  }

  if (!columnSet.has('job_id')) {
    database.exec('ALTER TABLE downloads ADD COLUMN job_id TEXT')
  }

  if (!columnSet.has('output_path')) {
    database.exec('ALTER TABLE downloads ADD COLUMN output_path TEXT')
  }

  if (!columnSet.has('video_id')) {
    database.exec('ALTER TABLE downloads ADD COLUMN video_id TEXT')
  }

  if (!columnSet.has('error_message')) {
    database.exec('ALTER TABLE downloads ADD COLUMN error_message TEXT')
  }

  if (!columnSet.has('downloader')) {
    database.exec('ALTER TABLE downloads ADD COLUMN downloader TEXT')
  }

  if (!columnSet.has('started_at')) {
    database.exec('ALTER TABLE downloads ADD COLUMN started_at TEXT')
  }

  if (!columnSet.has('completed_at')) {
    database.exec('ALTER TABLE downloads ADD COLUMN completed_at TEXT')
  }

  if (!columnSet.has('updated_at')) {
    database.exec('ALTER TABLE downloads ADD COLUMN updated_at TEXT')
  }
}

function ensureJobColumns(database: Database.Database): void {
  const columns = database.prepare('PRAGMA table_info(jobs)').all() as Array<{ name: string }>
  const columnSet = new Set(columns.map((column) => column.name))

  if (!columnSet.has('updated_at')) {
    database.exec('ALTER TABLE jobs ADD COLUMN updated_at TEXT')
  }

  if (!columnSet.has('error_message')) {
    database.exec('ALTER TABLE jobs ADD COLUMN error_message TEXT')
  }

  if (!columnSet.has('input_path')) {
    database.exec('ALTER TABLE jobs ADD COLUMN input_path TEXT')
  }

  if (!columnSet.has('output_path')) {
    database.exec('ALTER TABLE jobs ADD COLUMN output_path TEXT')
  }

  if (!columnSet.has('config_json')) {
    database.exec('ALTER TABLE jobs ADD COLUMN config_json TEXT')
  }

  if (!columnSet.has('result_json')) {
    database.exec('ALTER TABLE jobs ADD COLUMN result_json TEXT')
  }

  if (!columnSet.has('log_tail')) {
    database.exec('ALTER TABLE jobs ADD COLUMN log_tail TEXT')
  }

  if (!columnSet.has('progress')) {
    database.exec('ALTER TABLE jobs ADD COLUMN progress REAL')
  }

  if (!columnSet.has('priority')) {
    database.exec('ALTER TABLE jobs ADD COLUMN priority INTEGER DEFAULT 0')
  }

  if (!columnSet.has('video_id')) {
    database.exec('ALTER TABLE jobs ADD COLUMN video_id TEXT')
  }

  if (!columnSet.has('started_at')) {
    database.exec('ALTER TABLE jobs ADD COLUMN started_at TEXT')
  }

  if (!columnSet.has('completed_at')) {
    database.exec('ALTER TABLE jobs ADD COLUMN completed_at TEXT')
  }
}
