# Drapp - Video Download & AI Processing Application

## Overview
A cross-platform desktop application for downloading, managing, and AI-processing videos from any source.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Electron 28+ |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (lightweight, simple) |
| Database | better-sqlite3 |
| Build | Vite (for React) + electron-builder |
| IPC | Electron IPC with type-safe wrappers |

### External Tools (Bundled/Required)
- **yt-dlp** - primary video downloader
- **ffmpeg/ffprobe** - transcoding and metadata
- **whisper.cpp** (optional) - local transcription

---

## Project Structure

```
drapp/
├── package.json
├── electron.vite.config.ts
├── tailwind.config.js
├── tsconfig.json
│
├── resources/                    # Bundled binaries
│   ├── bin/
│   │   ├── darwin/              # macOS binaries
│   │   │   ├── yt-dlp
│   │   │   ├── ffmpeg
│   │   │   └── ffprobe
│   │   ├── win32/               # Windows binaries
│   │   └── linux/               # Linux binaries
│   └── icons/
│
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Entry point
│   │   ├── ipc/                 # IPC handlers
│   │   │   ├── index.ts
│   │   │   ├── download.ipc.ts
│   │   │   ├── library.ipc.ts
│   │   │   ├── processing.ipc.ts
│   │   │   └── llm.ipc.ts
│   │   │
│   │   ├── services/            # Core business logic
│   │   │   ├── downloader/
│   │   │   │   ├── index.ts
│   │   │   │   ├── ytdlp.service.ts
│   │   │   │   ├── cobalt.service.ts
│   │   │   │   └── downloader.factory.ts
│   │   │   │
│   │   │   ├── transcoder/
│   │   │   │   ├── index.ts
│   │   │   │   ├── ffmpeg.service.ts
│   │   │   │   └── presets.ts
│   │   │   │
│   │   │   ├── llm/
│   │   │   │   ├── index.ts
│   │   │   │   ├── openrouter.service.ts
│   │   │   │   ├── lmstudio.service.ts
│   │   │   │   └── llm.factory.ts
│   │   │   │
│   │   │   ├── transcription/
│   │   │   │   ├── index.ts
│   │   │   │   └── whisper.service.ts
│   │   │   │
│   │   │   ├── library/
│   │   │   │   ├── index.ts
│   │   │   │   ├── scanner.service.ts
│   │   │   │   └── metadata.service.ts
│   │   │   │
│   │   │   └── auth/
│   │   │       ├── index.ts
│   │   │       ├── cookie.service.ts      # Cookie import/management
│   │   │       ├── session.service.ts     # Session persistence
│   │   │       └── keychain.service.ts    # OS keychain integration
│   │   │
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   ├── schema.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   │       ├── video.repository.ts
│   │   │       ├── tag.repository.ts
│   │   │       ├── download.repository.ts
│   │   │       └── job.repository.ts
│   │   │
│   │   ├── queue/               # Job queue system
│   │   │   ├── index.ts
│   │   │   ├── queue.manager.ts
│   │   │   └── workers/
│   │   │       ├── download.worker.ts
│   │   │       ├── transcode.worker.ts
│   │   │       └── llm.worker.ts
│   │   │
│   │   └── utils/
│   │       ├── binary.ts        # Find/verify binaries
│   │       ├── paths.ts         # App paths helper
│   │       └── logger.ts
│   │
│   ├── preload/                 # Preload scripts
│   │   ├── index.ts
│   │   └── api.ts               # Exposed API types
│   │
│   ├── renderer/                # React frontend
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   │
│   │   │   ├── library/
│   │   │   │   ├── VideoGrid.tsx
│   │   │   │   ├── VideoCard.tsx
│   │   │   │   ├── VideoDetails.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   │
│   │   │   ├── download/
│   │   │   │   ├── DownloadDialog.tsx
│   │   │   │   ├── DownloadQueue.tsx
│   │   │   │   ├── DownloadItem.tsx
│   │   │   │   └── FormatSelector.tsx
│   │   │   │
│   │   │   ├── processing/
│   │   │   │   ├── ProcessingQueue.tsx
│   │   │   │   ├── TranscodeDialog.tsx
│   │   │   │   ├── PresetSelector.tsx
│   │   │   │   └── BatchProcessor.tsx
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── AIPanel.tsx
│   │   │   │   ├── CaptionGenerator.tsx
│   │   │   │   ├── TagSuggestions.tsx
│   │   │   │   ├── VideoSummary.tsx
│   │   │   │   └── TranscriptEditor.tsx
│   │   │   │
│   │   │   ├── player/
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── PlayerControls.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── VolumeControl.tsx
│   │   │   │   └── SubtitleOverlay.tsx
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── SettingsDialog.tsx
│   │   │   │   ├── GeneralSettings.tsx
│   │   │   │   ├── DownloadSettings.tsx
│   │   │   │   ├── LLMSettings.tsx
│   │   │   │   ├── StorageSettings.tsx
│   │   │   │   ├── AuthSettings.tsx
│   │   │   │   └── PrivacySettings.tsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── AuthManager.tsx
│   │   │   │   ├── CookieImporter.tsx
│   │   │   │   ├── PlatformAuth.tsx
│   │   │   │   └── SessionList.tsx
│   │   │   │
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       ├── Toast.tsx
│   │   │       └── Dropdown.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Library.tsx
│   │   │   ├── Downloads.tsx
│   │   │   ├── Processing.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── stores/
│   │   │   ├── library.store.ts
│   │   │   ├── download.store.ts
│   │   │   ├── processing.store.ts
│   │   │   ├── settings.store.ts
│   │   │   └── ui.store.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDownload.ts
│   │   │   ├── useLibrary.ts
│   │   │   ├── useLLM.ts
│   │   │   └── useIPC.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   └── shared/                  # Shared types
│       ├── types/
│       │   ├── video.types.ts
│       │   ├── download.types.ts
│       │   ├── processing.types.ts
│       │   ├── llm.types.ts
│       │   └── ipc.types.ts
│       │
│       └── constants/
│           ├── formats.ts
│           ├── presets.ts
│           └── platforms.ts
│
└── data/                        # User data (created at runtime)
    ├── database.sqlite
    ├── config.json
    └── logs/
```

---

## Database Schema

```sql
-- Videos table (core)
CREATE TABLE videos (
  id TEXT PRIMARY KEY,           -- UUID
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  duration REAL,                 -- seconds
  width INTEGER,
  height INTEGER,
  fps REAL,
  codec TEXT,
  container TEXT,
  bitrate INTEGER,

  -- Metadata
  title TEXT,
  description TEXT,
  thumbnail_path TEXT,

  -- Source info
  source_url TEXT,
  source_platform TEXT,          -- youtube, tiktok, etc.
  source_id TEXT,                -- platform-specific ID
  uploader TEXT,
  upload_date TEXT,

  -- AI-generated
  transcript TEXT,
  summary TEXT,
  chapters_json TEXT,            -- JSON array of chapters

  -- Organization
  folder_path TEXT,
  is_favorite INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  last_watched_at TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tags (many-to-many with videos)
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,                    -- hex color for UI
  is_ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_tags (
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  confidence REAL,               -- AI confidence score (0-1)
  PRIMARY KEY (video_id, tag_id)
);

-- Collections/Playlists
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,
  is_smart INTEGER DEFAULT 0,    -- smart collection with filters
  filter_json TEXT,              -- JSON filter criteria for smart collections
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_videos (
  collection_id TEXT REFERENCES collections(id) ON DELETE CASCADE,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, video_id)
);

-- Download history & queue
CREATE TABLE downloads (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT NOT NULL,          -- pending, downloading, completed, failed, cancelled
  progress REAL DEFAULT 0,
  speed TEXT,
  eta TEXT,

  -- Selected options
  format_id TEXT,
  quality TEXT,

  -- Result
  video_id TEXT REFERENCES videos(id),
  error_message TEXT,

  -- Downloader used
  downloader TEXT,               -- ytdlp, cobalt

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT
);

-- Processing jobs queue
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,            -- transcode, caption, tag, summarize, transcribe
  status TEXT NOT NULL,          -- pending, running, completed, failed, cancelled
  priority INTEGER DEFAULT 0,
  progress REAL DEFAULT 0,

  video_id TEXT REFERENCES videos(id),
  input_path TEXT,
  output_path TEXT,

  -- Job-specific config
  config_json TEXT,

  -- Result
  result_json TEXT,
  error_message TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT
);

-- Settings (key-value store)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Platform authentication/sessions
CREATE TABLE auth_sessions (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,          -- youtube, pornhub, etc.
  account_name TEXT,               -- display name/email
  cookies_json TEXT,               -- encrypted cookie data
  headers_json TEXT,               -- custom headers
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT
);

-- Hidden/private content tracking
CREATE TABLE private_items (
  video_id TEXT PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  pin_hash TEXT,                   -- optional per-item PIN
  is_hidden INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Watch history (can be disabled)
CREATE TABLE watch_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  watched_at TEXT DEFAULT CURRENT_TIMESTAMP,
  position REAL,                   -- last position in seconds
  duration REAL                    -- watch duration this session
);

-- Indexes for performance
CREATE INDEX idx_videos_source ON videos(source_platform, source_id);
CREATE INDEX idx_videos_folder ON videos(folder_path);
CREATE INDEX idx_downloads_status ON downloads(status);
CREATE INDEX idx_jobs_status ON jobs(status, priority);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_auth_platform ON auth_sessions(platform, is_active);
CREATE INDEX idx_watch_history_video ON watch_history(video_id);
```

---

## File Organization Structure

```
~/Drapp/                         # Default library location (configurable)
├── YouTube/
│   ├── Channel Name/
│   │   ├── Video Title [videoId].mp4
│   │   ├── Video Title [videoId].json       # Sidecar metadata
│   │   └── Video Title [videoId].thumb.jpg  # Thumbnail
│   └── .../
├── TikTok/
│   └── @username/
│       └── ...
├── Twitter/
│   └── @handle/
│       └── ...
├── Instagram/
│   └── @username/
│       └── ...
├── Other/                       # Unsupported platforms
│   └── ...
├── Processed/                   # Transcoded outputs
│   └── ...
└── .drapp/                      # Hidden app data
    ├── thumbnails/              # Generated thumbnails
    ├── transcripts/             # Transcript files
    └── temp/                    # Temporary processing files
```

### Sidecar JSON Format
```json
{
  "version": 1,
  "drapp_id": "uuid",
  "source": {
    "url": "https://...",
    "platform": "youtube",
    "id": "dQw4w9WgXcQ",
    "title": "Original Title",
    "uploader": "Channel Name",
    "upload_date": "2023-01-15",
    "description": "..."
  },
  "file": {
    "original_filename": "...",
    "download_date": "2024-01-20T15:30:00Z",
    "format": "mp4",
    "quality": "1080p"
  },
  "ai": {
    "tags": ["music", "80s", "meme"],
    "summary": "...",
    "transcript_file": "transcript.vtt",
    "processed_at": "2024-01-20T16:00:00Z",
    "model_used": "gpt-4o"
  }
}
```

---

## Core Features & Implementation Details

### 1. Download System

#### Downloader Factory Pattern
```typescript
interface Downloader {
  name: string;
  supports(url: string): Promise<boolean>;
  getFormats(url: string): Promise<Format[]>;
  download(url: string, options: DownloadOptions): DownloadProcess;
}

class DownloaderFactory {
  private downloaders: Downloader[] = [
    new YtDlpDownloader(),    // Primary
    new CobaltDownloader(),   // Fallback
  ];

  async getDownloader(url: string): Promise<Downloader> {
    for (const dl of this.downloaders) {
      if (await dl.supports(url)) return dl;
    }
    throw new Error('Unsupported URL');
  }
}
```

#### yt-dlp Integration
- Spawn as child process with `--progress --newline -J` for JSON output
- Parse real-time progress from stdout
- Support all yt-dlp options: format selection, cookies, authentication
- Extract metadata before download with `--dump-json`

#### Cobalt Fallback
- Use cobalt.tools API when yt-dlp fails
- Limited to supported platforms but reliable
- No binary dependency

### 2. Transcoding System

#### FFmpeg Service
- Use fluent-ffmpeg for Node.js integration
- Pre-configured presets for common use cases
- Real-time progress via ffmpeg's `-progress` flag

#### Preset System
```typescript
const PRESETS = {
  // Quality presets
  'high-quality': { crf: 18, preset: 'slow' },
  'balanced': { crf: 23, preset: 'medium' },
  'small-file': { crf: 28, preset: 'fast' },

  // Platform presets
  'youtube-1080p': { width: 1920, height: 1080, bitrate: '8M' },
  'tiktok': { width: 1080, height: 1920, bitrate: '4M' },
  'twitter': { width: 1280, height: 720, maxDuration: 140 },
  'discord-8mb': { targetSize: '8M' },
  'discord-nitro': { targetSize: '100M' },

  // Codec presets
  'h264-compatible': { codec: 'libx264' },
  'h265-efficient': { codec: 'libx265' },
  'av1-modern': { codec: 'libaom-av1' },
};
```

### 3. LLM Integration

#### Unified LLM Interface
```typescript
interface LLMProvider {
  name: string;
  models: Model[];
  chat(messages: Message[], options?: LLMOptions): AsyncGenerator<string>;
  isAvailable(): Promise<boolean>;
}

// OpenRouter - cloud models
class OpenRouterProvider implements LLMProvider {
  // Uses OpenAI SDK with baseURL: 'https://openrouter.ai/api/v1'
  // Supports model selection from OpenRouter's catalog
}

// LM Studio - local models
class LMStudioProvider implements LLMProvider {
  // Uses OpenAI SDK with baseURL: 'http://localhost:1234/v1'
  // Auto-detects running models
}
```

#### AI Features

**Transcription Pipeline:**
1. Extract audio from video (ffmpeg)
2. Run through Whisper (local or API)
3. Clean up with LLM (punctuation, speaker labels)
4. Save as VTT/SRT

**Smart Tagging:**
```typescript
async function generateTags(video: Video): Promise<Tag[]> {
  const prompt = `Analyze this video and suggest relevant tags:
    Title: ${video.title}
    Description: ${video.description}
    Transcript: ${video.transcript?.slice(0, 2000)}

    Return 5-10 tags as JSON array with confidence scores.`;

  const response = await llm.chat([{ role: 'user', content: prompt }]);
  return JSON.parse(response);
}
```

**Video Summarization:**
- Uses transcript + metadata
- Generates concise summary
- Can identify key moments/chapters

### 4. Queue System

#### Job Queue Manager
```typescript
class QueueManager {
  private queues = {
    download: new Queue({ concurrency: 3 }),
    transcode: new Queue({ concurrency: 2 }),  // CPU intensive
    llm: new Queue({ concurrency: 1 }),        // API rate limits
  };

  async addJob(type: JobType, data: JobData, priority = 0): Promise<Job> {
    const job = await this.db.jobs.create({ type, data, priority });
    this.queues[type].add(() => this.processJob(job));
    return job;
  }
}
```

---

## UI Screens

### 1. Library View (Main)
- Grid/list view toggle
- Thumbnail previews with duration overlay
- Quick actions on hover (play, edit, delete)
- Search bar with autocomplete
- Filter sidebar: platforms, tags, date range, duration
- Bulk selection mode

### 2. Video Details Panel
- Large thumbnail/video preview player
- Metadata display & editing
- Tag management
- AI panel (generate/edit captions, tags, summary)
- File info & actions (reveal in Finder, transcode, delete)

### 3. Downloads Page
- URL input with paste detection
- Format/quality selector
- Active downloads with progress bars
- Download history
- Batch download support

### 4. Processing Page
- Active jobs with progress
- Job queue (reorder, cancel)
- Batch processing wizard
- Preset management

### 5. Video Player
- Built-in video player using HTML5 video or video.js
- Playback controls (play/pause, seek, volume, playback speed)
- Fullscreen support
- Keyboard shortcuts (space, arrows, etc.)
- Picture-in-picture mode
- Subtitle/caption display
- Continue watching (remember position)
- Quick trim tool (mark in/out points)

### 6. Settings
- General: Library location, startup behavior
- Downloads: Default quality, concurrent downloads
- Processing: Default presets, output location
- LLM: Provider selection, API keys, model preferences
- Storage: Cache management, cleanup options
- Authentication: Cookie/session management per platform

### 7. Authentication Manager
- Import cookies from browser (Chrome, Firefox, Safari, Edge)
- Manual cookie entry
- Session persistence per platform
- Login status indicators
- Secure credential storage (OS keychain)

---

## Niche Use-Cases & Power User Features

### Adult Content Support
Adult sites have unique technical challenges that require special handling:

**Authentication & Access:**
- Premium account cookie management (most adult sites require auth for HD)
- Multi-account support per platform
- Session refresh handling (many sites expire sessions frequently)
- Age verification bypass via cookies (legal content, just verification walls)

**Platform-Specific Handling:**
- Site-specific extractors (yt-dlp supports 100+ adult sites)
- Fallback URL patterns when main extractors break
- HLS/DASH stream handling (common on adult sites)
- DRM-free stream detection

**Privacy Features:**
- Incognito library mode (separate password-protected library)
- Hidden folders (not visible in main library, require PIN)
- No thumbnails mode (show placeholders instead)
- Secure delete (overwrite files before deletion)
- No history mode (don't log download URLs)
- Export without metadata (strip source URLs from files)

**Content Organization:**
- Performer/studio tagging
- Custom taxonomies (user-defined tag categories)
- Duplicate detection by video hash (same content, different sources)
- Series/collection tracking

**Download Challenges:**
- Rate limiting handling (auto-throttle, delays between downloads)
- Geo-restriction bypass suggestions (VPN detection)
- Fragmented video stitching
- Multi-part video merging
- Playlist/channel bulk download with smart naming

### Power User Features (All Content Types)

**Automation:**
- Watch folders (auto-download from URL files)
- Scheduled downloads (off-peak hours)
- RSS/subscription feed monitoring
- CLI mode for scripting
- Headless operation

**Batch Operations:**
- URL list import (txt, csv)
- Regex-based URL filtering
- Bulk metadata editing
- Mass transcode with presets
- Bulk tag application

**Network Features:**
- Proxy support (HTTP, SOCKS5)
- Custom User-Agent strings
- Request header customization
- Bandwidth limiting
- Resume interrupted downloads

**Advanced Library:**
- Duplicate finder (by hash, filename, or fuzzy match)
- Missing file scanner
- Orphaned metadata cleanup
- Library integrity check
- Export/import library database
- Multi-library support (work, personal, etc.)

**Developer/Debug:**
- Raw yt-dlp output logging
- Network request inspector
- FFmpeg command preview
- Export job as shell script

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
1. Initialize Electron + Vite + React + TypeScript project
2. Set up project structure and build configuration
3. Implement binary management (yt-dlp, ffmpeg bundling/detection)
4. Create SQLite database layer with schema and migrations
5. Build IPC communication layer with type safety
6. Create basic app shell with navigation and routing
7. Set up Tailwind CSS and base UI components

### Phase 2: Download System
1. Implement yt-dlp service with process spawning
2. Build format detection and selection
3. Create download queue manager
4. Add Cobalt fallback service
5. Build download UI (dialog, queue, history)
6. Implement file organization and sidecar JSON
7. Add URL parsing and platform detection

### Phase 3: Library Management
1. Build library scanner service
2. Implement video repository with search/filter
3. Create video grid and card components
4. Build video details panel
5. Implement tag management
6. Add collections/playlists

### Phase 4: Video Player
1. Implement HTML5 video player component
2. Build custom player controls
3. Add subtitle/caption rendering
4. Implement playback position persistence
5. Add keyboard shortcuts
6. Picture-in-picture support
7. Fullscreen mode

### Phase 5: Transcoding
1. Implement FFmpeg service
2. Create preset system
3. Build transcode dialog UI
4. Add batch processing
5. Implement job queue UI
6. Add platform-optimized export presets

### Phase 6: Authentication & Privacy
1. Implement cookie import from browsers
2. Build session management per platform
3. Create authentication UI
4. Implement OS keychain integration for secrets
5. Add hidden folder/PIN protection
6. Build privacy mode toggle
7. Implement secure delete

### Phase 7: LLM Integration
1. Build LLM provider abstraction
2. Implement OpenRouter integration
3. Implement LM Studio integration
4. Add Whisper transcription
5. Build AI panel UI
6. Implement smart tagging, captioning, summarization

### Phase 8: Power User Features
1. Watch folder monitoring
2. Batch URL import
3. Proxy configuration
4. Rate limiting controls
5. Duplicate detection
6. Library integrity tools

### Phase 9: Polish & Release
1. Keyboard shortcuts throughout app
2. Drag and drop support
3. Dark/light theme
4. Export/share functionality
5. Statistics dashboard
6. Auto-updates (electron-updater)
7. Performance optimization
8. Error reporting/logging

---

## Configuration Defaults

```json
{
  "library": {
    "path": "~/Drapp",
    "organizeByPlatform": true,
    "generateThumbnails": true,
    "saveSidecarJson": true
  },
  "downloads": {
    "defaultQuality": "1080p",
    "preferredFormat": "mp4",
    "maxConcurrent": 3,
    "retryOnFail": true,
    "useBackupDownloader": true,
    "rateLimitMs": 0,
    "proxy": null
  },
  "processing": {
    "maxConcurrentJobs": 2,
    "defaultPreset": "balanced",
    "preserveOriginal": true
  },
  "llm": {
    "provider": "openrouter",
    "openrouter": {
      "apiKey": "",
      "defaultModel": "anthropic/claude-3.5-sonnet"
    },
    "lmstudio": {
      "endpoint": "http://localhost:1234/v1",
      "defaultModel": "auto"
    }
  },
  "player": {
    "volume": 1.0,
    "playbackSpeed": 1.0,
    "autoplay": false,
    "rememberPosition": true
  },
  "privacy": {
    "enableHistory": true,
    "showThumbnails": true,
    "hiddenFolderEnabled": false,
    "hiddenFolderPin": null,
    "secureDeleteEnabled": false
  },
  "ui": {
    "theme": "system",
    "defaultView": "grid",
    "thumbnailSize": "medium",
    "sidebarCollapsed": false
  }
}
```

---

## Key Technical Decisions

1. **Why Zustand over Redux?**
   - Simpler API, less boilerplate
   - Better TypeScript support
   - Smaller bundle size
   - Perfect for medium-sized apps

2. **Why better-sqlite3 over SQL.js?**
   - Native performance (not WASM)
   - Synchronous API simplifies code
   - Works well with Electron

3. **Why spawn processes vs. node bindings?**
   - yt-dlp and ffmpeg are CLI tools, no good Node bindings
   - Process spawning is reliable and allows progress monitoring
   - Easier to update binaries independently

4. **Why file-based + SQLite?**
   - Files remain portable and browsable
   - SQLite enables fast search across thousands of videos
   - Sidecar JSON allows DB rebuilding if corrupted

---

## Dependencies

### Core
```json
{
  "dependencies": {
    "electron-store": "^8.1.0",
    "better-sqlite3": "^9.4.0",
    "uuid": "^9.0.0",
    "date-fns": "^3.0.0",
    "openai": "^4.28.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "electron": "^28.2.0",
    "electron-vite": "^2.0.0",
    "electron-builder": "^24.9.0",
    "vite": "^5.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "@types/better-sqlite3": "^7.6.8",
    "@types/react": "^18.2.0",
    "@types/node": "^20.11.0"
  }
}
```

### UI Components
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-progress": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.0",
    "@radix-ui/react-toast": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "lucide-react": "^0.323.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## Binary Management Strategy

### Development
- Expect yt-dlp and ffmpeg to be installed on system PATH
- Log warnings if not found, provide installation instructions

### Production Build
- Bundle binaries in `resources/bin/{platform}/`
- Use `electron-builder` extraResources to include them
- Detect platform at runtime and use appropriate binary
- Support both bundled and system-installed binaries

```typescript
// src/main/utils/binary.ts
function getBinaryPath(name: 'yt-dlp' | 'ffmpeg' | 'ffprobe'): string {
  const isDev = !app.isPackaged;

  if (isDev) {
    // Check system PATH
    const systemPath = which.sync(name, { nothrow: true });
    if (systemPath) return systemPath;
  }

  // Check bundled
  const platform = process.platform;
  const ext = platform === 'win32' ? '.exe' : '';
  const bundledPath = path.join(
    app.isPackaged ? process.resourcesPath : path.join(__dirname, '../../resources'),
    'bin',
    platform,
    name + ext
  );

  if (fs.existsSync(bundledPath)) return bundledPath;

  throw new Error(`Binary not found: ${name}`);
}
```

---

## Error Handling & Resilience

### Download Fallback Chain
```typescript
async function downloadWithFallback(url: string, options: DownloadOptions): Promise<Video> {
  const errors: Error[] = [];

  // Try yt-dlp first
  try {
    return await ytdlp.download(url, options);
  } catch (e) {
    errors.push(e);
    log.warn('yt-dlp failed, trying cobalt...', e.message);
  }

  // Fallback to cobalt
  try {
    return await cobalt.download(url, options);
  } catch (e) {
    errors.push(e);
    log.error('All downloaders failed');
  }

  throw new AggregateError(errors, 'All download methods failed');
}
```

### Database Resilience
- WAL mode for concurrent reads
- Automatic backup before migrations
- Sidecar JSON allows full DB rebuild
- Graceful handling of missing files (mark as missing, allow re-link)

---

## Security Considerations

1. **API Keys**: Store encrypted using electron-store with OS keychain
2. **User Input**: Sanitize URLs before passing to shell commands
3. **IPC**: Validate all IPC messages, use contextIsolation
4. **Updates**: Use electron-updater with code signing
5. **File Paths**: Prevent path traversal attacks

---

## Files to Create (Ordered by Phase)

### Phase 1: Foundation
```
drapp/
├── package.json
├── electron.vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── src/
│   ├── main/
│   │   ├── index.ts                          # Electron entry point
│   │   ├── utils/
│   │   │   ├── paths.ts                      # App path utilities
│   │   │   ├── binary.ts                     # Binary detection
│   │   │   └── logger.ts                     # Logging utility
│   │   ├── database/
│   │   │   ├── index.ts                      # DB initialization
│   │   │   └── schema.ts                     # Schema definition
│   │   └── ipc/
│   │       └── index.ts                      # IPC handler registration
│   ├── preload/
│   │   ├── index.ts                          # Preload script
│   │   └── api.ts                            # Exposed API types
│   ├── renderer/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── styles/globals.css
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       └── Modal.tsx
│   │   └── pages/
│   │       ├── Library.tsx
│   │       └── Settings.tsx
│   └── shared/
│       └── types/
│           ├── video.types.ts
│           ├── ipc.types.ts
│           └── settings.types.ts
```

### Phase 2: Download System
```
src/main/services/downloader/
├── index.ts
├── ytdlp.service.ts
├── cobalt.service.ts
└── downloader.factory.ts

src/main/ipc/download.ipc.ts
src/renderer/components/download/
├── DownloadDialog.tsx
├── DownloadQueue.tsx
├── DownloadItem.tsx
└── FormatSelector.tsx
src/renderer/pages/Downloads.tsx
src/renderer/stores/download.store.ts
```

### Phase 3: Library
```
src/main/services/library/
├── index.ts
├── scanner.service.ts
└── metadata.service.ts

src/main/database/repositories/
├── video.repository.ts
└── tag.repository.ts

src/renderer/components/library/
├── VideoGrid.tsx
├── VideoCard.tsx
├── VideoDetails.tsx
├── FilterBar.tsx
└── SearchBar.tsx
src/renderer/stores/library.store.ts
```

### Phase 4: Video Player
```
src/renderer/components/player/
├── VideoPlayer.tsx
├── PlayerControls.tsx
├── ProgressBar.tsx
├── VolumeControl.tsx
└── SubtitleOverlay.tsx
src/renderer/hooks/usePlayer.ts
```

### Phase 5: Transcoding
```
src/main/services/transcoder/
├── index.ts
├── ffmpeg.service.ts
└── presets.ts

src/main/queue/
├── index.ts
├── queue.manager.ts
└── workers/transcode.worker.ts

src/renderer/components/processing/
├── ProcessingQueue.tsx
├── TranscodeDialog.tsx
├── PresetSelector.tsx
└── BatchProcessor.tsx
src/renderer/pages/Processing.tsx
```

### Phase 6: Authentication & Privacy
```
src/main/services/auth/
├── index.ts
├── cookie.service.ts
├── session.service.ts
└── keychain.service.ts

src/main/database/repositories/auth.repository.ts

src/renderer/components/auth/
├── AuthManager.tsx
├── CookieImporter.tsx
├── PlatformAuth.tsx
└── SessionList.tsx
src/renderer/components/settings/
├── AuthSettings.tsx
└── PrivacySettings.tsx
```

### Phase 7: LLM Integration
```
src/main/services/llm/
├── index.ts
├── openrouter.service.ts
├── lmstudio.service.ts
└── llm.factory.ts

src/main/services/transcription/
├── index.ts
└── whisper.service.ts

src/renderer/components/ai/
├── AIPanel.tsx
├── CaptionGenerator.tsx
├── TagSuggestions.tsx
├── VideoSummary.tsx
└── TranscriptEditor.tsx
```

### Critical First Files (Create in Order)
1. `package.json` - All dependencies
2. `electron.vite.config.ts` - Build config
3. `tailwind.config.js` + `postcss.config.js`
4. `tsconfig.json` (+ node/web variants)
5. `src/main/index.ts` - Electron entry
6. `src/preload/index.ts` - Preload script
7. `src/renderer/index.html` - HTML template
8. `src/renderer/main.tsx` - React entry
9. `src/renderer/App.tsx` - App shell
10. `src/shared/types/*.ts` - Type definitions
11. `src/main/database/schema.ts` - Database
