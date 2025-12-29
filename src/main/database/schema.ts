export const schema = `
-- Core videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  duration REAL,
  width INTEGER,
  height INTEGER,
  fps REAL,
  codec TEXT,
  container TEXT,
  bitrate INTEGER,
  title TEXT,
  description TEXT,
  thumbnail_path TEXT,
  source_url TEXT,
  source_platform TEXT,
  source_id TEXT,
  uploader TEXT,
  upload_date TEXT,
  transcript TEXT,
  summary TEXT,
  chapters_json TEXT,
  folder_path TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  last_watched_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tags table (normalized)
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  section TEXT,
  color TEXT,
  is_ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Video-tag relationships with extended metadata
CREATE TABLE IF NOT EXISTS video_tags (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'user',
  confidence REAL,
  is_locked INTEGER DEFAULT 0,
  locked_at TEXT,
  locked_by TEXT,
  suggestion_state TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, tag_id)
);

-- Frame extraction results
CREATE TABLE IF NOT EXISTS video_frames (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  embedding BLOB,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, frame_index)
);

-- Aggregated video embeddings
CREATE TABLE IF NOT EXISTS video_embeddings (
  video_id TEXT PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  embedding BLOB NOT NULL,
  frame_count INTEGER NOT NULL,
  model_version TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tag event history (audit log)
CREATE TABLE IF NOT EXISTS tag_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL,
  metadata_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Taxonomy cache
CREATE TABLE IF NOT EXISTS taxonomy_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  tag_name TEXT NOT NULL UNIQUE,
  min_confidence REAL NOT NULL,
  is_active INTEGER DEFAULT 1,
  parsed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Platform authentication/sessions
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  account_name TEXT,
  cookies_json TEXT,
  headers_json TEXT,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);

-- Hidden/private content
CREATE TABLE IF NOT EXISTS private_items (
  video_id TEXT PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  pin_hash TEXT,
  is_hidden INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  watched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  position REAL,
  duration REAL
);

-- Collections/Playlists
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,
  is_smart INTEGER DEFAULT 0,
  filter_json TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_videos (
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, video_id)
);

-- Downloads queue
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  progress REAL DEFAULT 0,
  speed TEXT,
  eta TEXT,
  format_id TEXT,
  quality TEXT,
  output_path TEXT,
  video_id TEXT REFERENCES videos(id),
  error_message TEXT,
  downloader TEXT,
  job_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT
);

-- Processing jobs queue
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  progress REAL DEFAULT 0,
  video_id TEXT REFERENCES videos(id),
  input_path TEXT,
  output_path TEXT,
  config_json TEXT,
  payload TEXT,
  result_json TEXT,
  log_tail TEXT,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_source ON videos(source_platform, source_id);
CREATE INDEX IF NOT EXISTS idx_videos_folder ON videos(folder_path);
CREATE INDEX IF NOT EXISTS idx_video_tags_video ON video_tags(video_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_tag ON video_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_locked ON video_tags(is_locked);
CREATE INDEX IF NOT EXISTS idx_video_frames_video ON video_frames(video_id);
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status, priority);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_auth_platform ON auth_sessions(platform, is_active);
CREATE INDEX IF NOT EXISTS idx_watch_history_video ON watch_history(video_id);
CREATE INDEX IF NOT EXISTS idx_tag_events_video ON tag_events(video_id);
CREATE INDEX IF NOT EXISTS idx_tag_events_created ON tag_events(created_at);
`;
