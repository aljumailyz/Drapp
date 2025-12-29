import type { Database } from 'better-sqlite3'

export type TagRecord = {
  id: number
  name: string
  section: string | null
  color: string | null
  is_ai_generated: number
  created_at: string
}

export type VideoTagRecord = {
  tag_id: number
  tag_name: string
  section: string | null
  confidence: number | null
  is_locked: number
  source: string
}

export class TagRepository {
  constructor(private readonly db: Database) {}

  findByVideo(videoId: string): VideoTagRecord[] {
    const stmt = this.db.prepare(`
      SELECT
        t.id as tag_id,
        t.name as tag_name,
        t.section,
        vt.confidence,
        vt.is_locked,
        vt.source
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      WHERE vt.video_id = ?
    `)
    return stmt.all(videoId) as VideoTagRecord[]
  }

  findAll(): TagRecord[] {
    const stmt = this.db.prepare('SELECT * FROM tags ORDER BY section, name')
    return stmt.all() as TagRecord[]
  }

  findByName(name: string): TagRecord | undefined {
    const stmt = this.db.prepare('SELECT * FROM tags WHERE name = ?')
    return stmt.get(name) as TagRecord | undefined
  }

  create(name: string, section?: string | null): TagRecord {
    const stmt = this.db.prepare(`
      INSERT INTO tags (name, section, is_ai_generated)
      VALUES (?, ?, 0)
    `)
    const result = stmt.run(name, section || null)
    return {
      id: result.lastInsertRowid as number,
      name,
      section: section || null,
      color: null,
      is_ai_generated: 0,
      created_at: new Date().toISOString()
    }
  }
}
