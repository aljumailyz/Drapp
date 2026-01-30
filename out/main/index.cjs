"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require$$1 = require("electron");
const require$$0 = require("node:path");
const node_url = require("node:url");
const promises = require("node:fs/promises");
const node_fs = require("node:fs");
const Database = require("better-sqlite3");
const require$$1$1 = require("node:crypto");
const require$$0$1 = require("node:child_process");
const promises$1 = require("node:stream/promises");
const require$$0$2 = require("node:util");
const os$1 = require("node:os");
const require$$1$2 = require("fs");
const require$$0$3 = require("constants");
const require$$0$4 = require("stream");
const require$$4 = require("util");
const require$$5 = require("assert");
const require$$1$3 = require("path");
const require$$1$6 = require("child_process");
const require$$0$5 = require("events");
const require$$0$6 = require("crypto");
const require$$1$4 = require("tty");
const require$$2 = require("os");
const require$$4$1 = require("url");
const require$$1$5 = require("string_decoder");
const require$$14 = require("zlib");
const require$$4$2 = require("http");
const schema$1 = `
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
function getAppDataPath() {
  return require$$1.app.getPath("userData");
}
function getDatabasePath() {
  return require$$0.join(getAppDataPath(), "drapp.sqlite");
}
function getDownloadPath() {
  return require$$1.app.getPath("downloads");
}
let db = null;
function getDatabase() {
  if (!db) {
    db = new Database(getDatabasePath());
    db.exec(schema$1);
    ensureDownloadColumns(db);
    ensureJobColumns(db);
  }
  return db;
}
function ensureDownloadColumns(database) {
  const columns = database.prepare("PRAGMA table_info(downloads)").all();
  const columnSet = new Set(columns.map((column) => column.name));
  if (!columnSet.has("progress")) {
    database.exec("ALTER TABLE downloads ADD COLUMN progress REAL");
  }
  if (!columnSet.has("speed")) {
    database.exec("ALTER TABLE downloads ADD COLUMN speed TEXT");
  }
  if (!columnSet.has("eta")) {
    database.exec("ALTER TABLE downloads ADD COLUMN eta TEXT");
  }
  if (!columnSet.has("job_id")) {
    database.exec("ALTER TABLE downloads ADD COLUMN job_id TEXT");
  }
  if (!columnSet.has("output_path")) {
    database.exec("ALTER TABLE downloads ADD COLUMN output_path TEXT");
  }
  if (!columnSet.has("video_id")) {
    database.exec("ALTER TABLE downloads ADD COLUMN video_id TEXT");
  }
  if (!columnSet.has("error_message")) {
    database.exec("ALTER TABLE downloads ADD COLUMN error_message TEXT");
  }
  if (!columnSet.has("downloader")) {
    database.exec("ALTER TABLE downloads ADD COLUMN downloader TEXT");
  }
  if (!columnSet.has("started_at")) {
    database.exec("ALTER TABLE downloads ADD COLUMN started_at TEXT");
  }
  if (!columnSet.has("completed_at")) {
    database.exec("ALTER TABLE downloads ADD COLUMN completed_at TEXT");
  }
  if (!columnSet.has("updated_at")) {
    database.exec("ALTER TABLE downloads ADD COLUMN updated_at TEXT");
  }
}
function ensureJobColumns(database) {
  const columns = database.prepare("PRAGMA table_info(jobs)").all();
  const columnSet = new Set(columns.map((column) => column.name));
  if (!columnSet.has("updated_at")) {
    database.exec("ALTER TABLE jobs ADD COLUMN updated_at TEXT");
  }
  if (!columnSet.has("error_message")) {
    database.exec("ALTER TABLE jobs ADD COLUMN error_message TEXT");
  }
  if (!columnSet.has("input_path")) {
    database.exec("ALTER TABLE jobs ADD COLUMN input_path TEXT");
  }
  if (!columnSet.has("output_path")) {
    database.exec("ALTER TABLE jobs ADD COLUMN output_path TEXT");
  }
  if (!columnSet.has("config_json")) {
    database.exec("ALTER TABLE jobs ADD COLUMN config_json TEXT");
  }
  if (!columnSet.has("result_json")) {
    database.exec("ALTER TABLE jobs ADD COLUMN result_json TEXT");
  }
  if (!columnSet.has("log_tail")) {
    database.exec("ALTER TABLE jobs ADD COLUMN log_tail TEXT");
  }
  if (!columnSet.has("progress")) {
    database.exec("ALTER TABLE jobs ADD COLUMN progress REAL");
  }
  if (!columnSet.has("priority")) {
    database.exec("ALTER TABLE jobs ADD COLUMN priority INTEGER DEFAULT 0");
  }
  if (!columnSet.has("video_id")) {
    database.exec("ALTER TABLE jobs ADD COLUMN video_id TEXT");
  }
  if (!columnSet.has("started_at")) {
    database.exec("ALTER TABLE jobs ADD COLUMN started_at TEXT");
  }
  if (!columnSet.has("completed_at")) {
    database.exec("ALTER TABLE jobs ADD COLUMN completed_at TEXT");
  }
}
class Logger {
  constructor(scope) {
    this.scope = scope;
  }
  write(level, message, meta) {
    const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : "";
    console[level](`[${timestamp2}] [${this.scope}] ${message}${suffix}`);
  }
  debug(message, meta) {
    this.write("debug", message, meta);
  }
  info(message, meta) {
    this.write("info", message, meta);
  }
  warn(message, meta) {
    this.write("warn", message, meta);
  }
  error(message, meta) {
    this.write("error", message, meta);
  }
}
class QueueManager {
  constructor(db2) {
    this.db = db2;
    this.logger = new Logger("QueueManager");
  }
  enqueue(job) {
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const payloadJson = JSON.stringify(job.payload);
    const configJson = job.config ? JSON.stringify(job.config) : null;
    this.db.prepare(
      "INSERT INTO jobs (id, type, status, payload, created_at, updated_at, error_message, input_path, output_path, config_json, video_id, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      job.id,
      job.type,
      "queued",
      payloadJson,
      createdAt,
      createdAt,
      null,
      job.inputPath ?? null,
      job.outputPath ?? null,
      configJson,
      job.videoId ?? null,
      job.priority ?? 0
    );
    this.logger.info("job enqueued", { id: job.id, type: job.type });
  }
}
function platformDir() {
  if (process.platform === "darwin") {
    return "darwin";
  }
  if (process.platform === "win32") {
    return "win32";
  }
  return "linux";
}
function findInSystemPath(name) {
  if (process.platform === "win32") {
    return null;
  }
  try {
    const result = require$$0$1.execSync(`which ${name}`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    const path2 = result.trim();
    if (path2 && node_fs.existsSync(path2)) {
      return path2;
    }
  } catch {
  }
  const commonPaths = [
    `/usr/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/opt/homebrew/bin/${name}`,
    // macOS Homebrew ARM
    `/home/linuxbrew/.linuxbrew/bin/${name}`
    // Linux Homebrew
  ];
  for (const path2 of commonPaths) {
    if (node_fs.existsSync(path2)) {
      return path2;
    }
  }
  return null;
}
function resolveBundledBinary(name) {
  const resourcesPath = require$$1.app.isPackaged ? process.resourcesPath : require$$0.join(require$$1.app.getAppPath(), "resources");
  const binaryName = process.platform === "win32" ? `${name}.exe` : name;
  const bundledPath = require$$0.join(resourcesPath, "bin", platformDir(), binaryName);
  if (node_fs.existsSync(bundledPath)) {
    return bundledPath;
  }
  if (process.platform !== "win32") {
    const systemPath = findInSystemPath(name);
    if (systemPath) {
      return systemPath;
    }
  }
  return bundledPath;
}
function getBundledBinaryDir() {
  const resourcesPath = require$$1.app.isPackaged ? process.resourcesPath : require$$0.join(require$$1.app.getAppPath(), "resources");
  return require$$0.join(resourcesPath, "bin", platformDir());
}
function isBinaryAvailable(name) {
  const path2 = resolveBundledBinary(name);
  return node_fs.existsSync(path2);
}
function detectFasterWhisper() {
  const cliTools = [
    "faster-whisper",
    // Main CLI (from faster-whisper package with CLI extras)
    "whisper-ctranslate2"
    // Alternative CLI that uses faster-whisper
  ];
  for (const tool of cliTools) {
    try {
      require$$0$1.execSync(`${tool} --help`, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
      return { available: true, command: [tool] };
    } catch {
    }
  }
  return { available: false, command: [] };
}
function detectBestWhisperBackend() {
  const whisperCppAvailable = isBinaryAvailable("whisper");
  const fasterWhisper = detectFasterWhisper();
  if (process.platform === "linux") {
    if (fasterWhisper.available) {
      return {
        backend: "faster-whisper",
        reason: "faster-whisper provides better CPU performance on Linux",
        command: fasterWhisper.command
      };
    }
    if (whisperCppAvailable) {
      return {
        backend: "whisper.cpp",
        reason: "whisper.cpp is available (consider installing faster-whisper for better performance)",
        command: void 0
      };
    }
    return {
      backend: "none",
      reason: "No whisper backend available. Install faster-whisper: pip install faster-whisper"
    };
  }
  if (process.platform === "darwin") {
    if (whisperCppAvailable) {
      return {
        backend: "whisper.cpp",
        reason: "whisper.cpp with Metal GPU acceleration",
        command: void 0
      };
    }
    if (fasterWhisper.available) {
      return {
        backend: "faster-whisper",
        reason: "faster-whisper (whisper.cpp not available)",
        command: fasterWhisper.command
      };
    }
    return {
      backend: "none",
      reason: "No whisper backend available"
    };
  }
  if (whisperCppAvailable) {
    return {
      backend: "whisper.cpp",
      reason: "whisper.cpp",
      command: void 0
    };
  }
  if (fasterWhisper.available) {
    return {
      backend: "faster-whisper",
      reason: "faster-whisper (whisper.cpp not available)",
      command: fasterWhisper.command
    };
  }
  return {
    backend: "none",
    reason: "No whisper backend available"
  };
}
class MetadataService {
  constructor() {
    this.logger = new Logger("MetadataService");
  }
  async extract(request) {
    this.logger.info("metadata extraction requested", { file: request.filePath });
    const binaryPath = resolveBundledBinary("ffprobe");
    const args = ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", request.filePath];
    const raw = await new Promise((resolve, reject) => {
      const child = require$$0$1.spawn(binaryPath, args, { stdio: "pipe" });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error2) => {
        reject(error2);
      });
      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `ffprobe exited with code ${code ?? "unknown"}`));
        }
      });
    });
    const parsed = JSON.parse(raw);
    const format = parsed.format ?? {};
    const streams = parsed.streams ?? [];
    const videoStream = streams.find((stream) => stream.codec_type === "video");
    const duration = this.parseFloatOrNull(format.duration);
    const bitrate = this.parseIntOrNull(format.bit_rate);
    const container = format.format_name ? format.format_name.split(",")[0] : null;
    const fileSize = this.parseIntOrNull(format.size) ?? this.statSize(request.filePath);
    return {
      duration,
      width: videoStream?.width ?? null,
      height: videoStream?.height ?? null,
      fps: this.parseFps(videoStream?.avg_frame_rate ?? videoStream?.r_frame_rate),
      codec: videoStream?.codec_name ?? null,
      container,
      bitrate,
      fileSize
    };
  }
  parseFloatOrNull(value) {
    if (!value) {
      return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  parseIntOrNull(value) {
    if (!value) {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  parseFps(value) {
    if (!value) {
      return null;
    }
    const [num, den] = value.split("/").map((part) => Number.parseFloat(part));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) {
      return null;
    }
    return num / den;
  }
  statSize(filePath) {
    try {
      return node_fs.statSync(filePath).size;
    } catch {
      return null;
    }
  }
}
function getSetting(database, key) {
  const row = database.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}
function setSetting(database, key, value) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  database.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?").run(key, value, now, value, now);
}
class DownloadWorker {
  constructor(db2, service, onEvent, auth) {
    this.db = db2;
    this.service = service;
    this.onEvent = onEvent;
    this.auth = auth;
    this.logger = new Logger("DownloadWorker");
    this.isRunning = false;
    this.timer = null;
    this.lastProgressUpdate = /* @__PURE__ */ new Map();
    this.activeControllers = /* @__PURE__ */ new Map();
    this.cooldownUntil = 0;
    this.metadata = new MetadataService();
  }
  start(pollMs = 4e3) {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, pollMs);
    void this.tick();
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  cancel(downloadId) {
    const controller = this.activeControllers.get(downloadId);
    if (controller) {
      controller.abort();
    }
  }
  async tick() {
    if (this.isRunning) {
      return;
    }
    if (this.cooldownUntil && Date.now() < this.cooldownUntil) {
      return;
    }
    this.isRunning = true;
    let currentJob;
    let currentPayload = null;
    let delayMs = 0;
    try {
      currentJob = this.db.prepare("SELECT id, payload FROM jobs WHERE type = 'download' AND status = 'queued' ORDER BY created_at ASC LIMIT 1").get();
      if (!currentJob) {
        return;
      }
      currentPayload = this.safeParse(currentJob.payload);
      if (!currentPayload) {
        this.markJob(currentJob.id, "failed", "invalid_payload");
        return;
      }
      const statusSnapshot = this.getJobStatus(currentJob.id);
      if (statusSnapshot && statusSnapshot !== "queued") {
        return;
      }
      const controller = new AbortController();
      this.activeControllers.set(currentPayload.downloadId, controller);
      this.markJob(currentJob.id, "running");
      this.markDownload(currentPayload.downloadId, "downloading");
      if (currentPayload.outputDir) {
        node_fs.mkdirSync(currentPayload.outputDir, { recursive: true });
      }
      this.logger.info("processing download", { jobId: currentJob.id, downloadId: currentPayload.downloadId });
      const session = this.resolveSession(currentPayload.url);
      const cookiesPath = session ? await this.writeCookieFile(session.cookies, currentPayload.downloadId) : null;
      const headers = session?.headers ?? void 0;
      const proxySetting = getSetting(this.db, "download_proxy");
      const proxy = proxySetting && proxySetting.trim() ? proxySetting.trim() : void 0;
      const rateLimitSetting = getSetting(this.db, "download_rate_limit");
      const rateLimit = rateLimitSetting && rateLimitSetting.trim() ? rateLimitSetting.trim() : void 0;
      delayMs = this.parseDelayMs(getSetting(this.db, "download_rate_limit_ms"));
      const downloadId = currentPayload.downloadId;
      const result = await this.service.download({
        url: currentPayload.url,
        outputPath: currentPayload.outputDir ? require$$0.join(currentPayload.outputDir, "%(title)s.%(ext)s") : void 0,
        cookiesPath: cookiesPath ?? void 0,
        headers,
        proxy,
        rateLimit,
        signal: controller.signal,
        onDestination: (path2) => {
          this.updateDownloadOutput(downloadId, path2);
        },
        onProgress: (progress) => {
          this.updateDownloadProgress(downloadId, progress);
        }
      });
      if (session?.sessionId) {
        this.auth?.sessionService.markUsed(session.sessionId);
      }
      const latestStatus = this.getJobStatus(currentJob.id);
      if (latestStatus === "canceled") {
        this.markDownload(currentPayload.downloadId, "canceled", "canceled_by_user");
        return;
      }
      if (result.outputPath) {
        this.upsertVideo(currentPayload.downloadId, currentPayload.url, result);
        await this.updateVideoMetadata(currentPayload.downloadId, result.outputPath);
      }
      this.markDownload(currentPayload.downloadId, "completed");
      this.markJob(currentJob.id, "completed");
    } catch (error2) {
      this.logger.error("download failed", { error: this.errorMessage(error2) });
      if (currentJob) {
        if (this.isCanceledError(error2)) {
          this.markJob(currentJob.id, "canceled", "canceled_by_user");
        } else {
          this.markJob(currentJob.id, "failed", this.errorMessage(error2));
        }
      }
      if (currentPayload) {
        if (this.isCanceledError(error2)) {
          this.markDownload(currentPayload.downloadId, "canceled", "canceled_by_user");
        } else {
          this.markDownload(currentPayload.downloadId, "failed", this.errorMessage(error2));
        }
      }
    } finally {
      if (currentPayload) {
        this.activeControllers.delete(currentPayload.downloadId);
        this.lastProgressUpdate.delete(currentPayload.downloadId);
      }
      if (currentPayload) {
        await this.cleanupCookieFile(currentPayload.downloadId);
      }
      if (currentJob && delayMs > 0) {
        this.cooldownUntil = Date.now() + delayMs;
      }
      this.isRunning = false;
    }
  }
  resolveSession(url) {
    if (!this.auth) {
      return null;
    }
    const platform2 = this.detectPlatform(url);
    if (!platform2) {
      return null;
    }
    const session = this.auth.sessionService.getActiveSession(platform2);
    if (!session?.cookies) {
      return null;
    }
    const decrypted = this.auth.keychain.decryptFromJson(session.cookies);
    if (!decrypted) {
      return null;
    }
    try {
      const parsed = JSON.parse(decrypted);
      if (!parsed.cookies || !Array.isArray(parsed.cookies) || parsed.cookies.length === 0) {
        return null;
      }
      const now = Math.floor(Date.now() / 1e3);
      const filtered = parsed.cookies.filter((cookie) => {
        if (!cookie || !cookie.name || !cookie.domain) {
          return false;
        }
        if (!cookie.expires) {
          return true;
        }
        return cookie.expires > now;
      });
      if (!filtered.length) {
        return null;
      }
      const headers = this.parseHeaders(session.headers);
      return {
        sessionId: session.id,
        cookies: filtered,
        headers: headers ?? void 0
      };
    } catch (error2) {
      this.logger.warn("unable to parse cookies", { error: this.errorMessage(error2) });
      return null;
    }
  }
  detectPlatform(url) {
    const candidate = url.match(/^https?:\/\//i) ? url : `https://${url}`;
    try {
      const parsed = new URL(candidate);
      const host = parsed.hostname.toLowerCase();
      if (host.endsWith("youtube.com") || host === "youtu.be") {
        return "youtube";
      }
      if (host.endsWith("tiktok.com")) {
        return "tiktok";
      }
      if (host.endsWith("instagram.com")) {
        return "instagram";
      }
      if (host.endsWith("twitter.com") || host.endsWith("x.com")) {
        return "twitter";
      }
      if (host.endsWith("reddit.com")) {
        return "reddit";
      }
      if (host.endsWith("vimeo.com")) {
        return "vimeo";
      }
      return "other";
    } catch {
      return null;
    }
  }
  parseHeaders(headers) {
    if (!headers) {
      return null;
    }
    try {
      const parsed = JSON.parse(headers);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return Object.fromEntries(
        Object.entries(parsed).filter(([key, value]) => key && typeof value === "string")
      );
    } catch {
      return null;
    }
  }
  cookieFilePath(downloadId) {
    return require$$0.join(getAppDataPath(), "auth", `cookies-${downloadId}.txt`);
  }
  async writeCookieFile(cookies, downloadId) {
    const dir = require$$0.join(getAppDataPath(), "auth");
    await promises.mkdir(dir, { recursive: true });
    const path2 = this.cookieFilePath(downloadId);
    const content = this.serializeCookies(cookies);
    await promises.writeFile(path2, content, "utf-8");
    return path2;
  }
  async cleanupCookieFile(downloadId) {
    const path2 = this.cookieFilePath(downloadId);
    try {
      await promises.unlink(path2);
    } catch {
    }
  }
  serializeCookies(cookies) {
    const lines = [
      "# Netscape HTTP Cookie File",
      "# This file was generated by Drapp"
    ];
    for (const cookie of cookies) {
      const domain = cookie.httpOnly ? `#HttpOnly_${cookie.domain}` : cookie.domain;
      const includeSubdomains = cookie.includeSubdomains ? "TRUE" : "FALSE";
      const secure = cookie.secure ? "TRUE" : "FALSE";
      const expires = cookie.expires ?? 0;
      const path2 = cookie.path || "/";
      const name = cookie.name;
      const value = cookie.value;
      lines.push([domain, includeSubdomains, path2, secure, String(expires), name, value].join("	"));
    }
    return lines.join("\n") + "\n";
  }
  markJob(jobId, status, error2) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?").run(status, updatedAt, error2 ?? null, jobId);
  }
  markDownload(downloadId, status, error2) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "completed") {
      this.db.prepare("UPDATE downloads SET status = ?, progress = ?, speed = NULL, eta = NULL, updated_at = ?, error_message = NULL, completed_at = ? WHERE id = ?").run(status, 100, updatedAt, updatedAt, downloadId);
    } else if (status === "downloading") {
      this.db.prepare("UPDATE downloads SET status = ?, started_at = ?, updated_at = ? WHERE id = ?").run(status, updatedAt, updatedAt, downloadId);
    } else {
      this.db.prepare("UPDATE downloads SET status = ?, updated_at = ?, error_message = ? WHERE id = ?").run(status, updatedAt, error2 ?? null, downloadId);
    }
    this.emit({ type: "status", downloadId, status, error: error2 });
  }
  updateDownloadOutput(downloadId, outputPath) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE downloads SET output_path = ?, updated_at = ?, error_message = NULL WHERE id = ?").run(outputPath, updatedAt, downloadId);
    this.emit({ type: "status", downloadId, status: "downloading" });
  }
  upsertVideo(downloadId, sourceUrl, result) {
    if (!result.outputPath) {
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fileName = result.fileName ?? require$$0.basename(result.outputPath);
    const title = fileName.replace(new RegExp(`${require$$0.extname(fileName)}$`), "");
    this.db.prepare(
      "INSERT INTO videos (id, file_path, file_name, title, source_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET file_path = ?, file_name = ?, title = ?, source_url = ?, updated_at = ?"
    ).run(
      downloadId,
      result.outputPath,
      fileName,
      title,
      sourceUrl,
      now,
      now,
      result.outputPath,
      fileName,
      title,
      sourceUrl,
      now
    );
    this.db.prepare("UPDATE downloads SET video_id = ?, output_path = ?, updated_at = ? WHERE id = ?").run(downloadId, result.outputPath, now, downloadId);
  }
  async updateVideoMetadata(videoId, filePath) {
    try {
      const metadata = await this.metadata.extract({ filePath });
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const folderPath = require$$0.dirname(filePath);
      this.db.prepare(
        "UPDATE videos SET file_size = ?, duration = ?, width = ?, height = ?, fps = ?, codec = ?, container = ?, bitrate = ?, folder_path = ?, updated_at = ? WHERE id = ?"
      ).run(
        metadata.fileSize,
        metadata.duration,
        metadata.width,
        metadata.height,
        metadata.fps,
        metadata.codec,
        metadata.container,
        metadata.bitrate,
        folderPath,
        now,
        videoId
      );
    } catch (error2) {
      this.logger.warn("metadata extraction failed", { error: this.errorMessage(error2) });
    }
  }
  safeParse(payload) {
    if (!payload) {
      return null;
    }
    try {
      const parsed = JSON.parse(payload);
      if (!parsed.downloadId || !parsed.url) {
        return null;
      }
      return parsed;
    } catch (error2) {
      this.logger.error("failed to parse job payload", { error: this.errorMessage(error2) });
      return null;
    }
  }
  errorMessage(error2) {
    return error2 instanceof Error ? error2.message : "unknown error";
  }
  parseDelayMs(value) {
    if (!value) {
      return 0;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed);
  }
  isCanceledError(error2) {
    return error2 instanceof Error && (error2.name === "AbortError" || error2.message === "canceled");
  }
  getJobStatus(jobId) {
    const row = this.db.prepare("SELECT status FROM jobs WHERE id = ?").get(jobId);
    return row?.status ?? null;
  }
  emitProgress(downloadId, progress) {
    this.emit({
      type: "progress",
      downloadId,
      progress: progress.percent,
      speed: progress.speed,
      eta: progress.eta
    });
  }
  emit(event) {
    if (this.onEvent) {
      this.onEvent(event);
    }
  }
  updateDownloadProgress(downloadId, progress) {
    const now = Date.now();
    const lastUpdate = this.lastProgressUpdate.get(downloadId) ?? 0;
    if (now - lastUpdate < 1e3) {
      return;
    }
    this.lastProgressUpdate.set(downloadId, now);
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE downloads SET progress = ?, speed = ?, eta = ?, updated_at = ? WHERE id = ?").run(progress.percent, progress.speed ?? null, progress.eta ?? null, updatedAt, downloadId);
    this.emitProgress(downloadId, progress);
  }
}
class TranscodeWorker {
  constructor(db2, service, metadata = new MetadataService(), onJobEvent) {
    this.db = db2;
    this.service = service;
    this.metadata = metadata;
    this.onJobEvent = onJobEvent;
    this.logger = new Logger("TranscodeWorker");
    this.isRunning = false;
    this.timer = null;
    this.activeJobId = null;
    this.activeAbort = null;
  }
  start(pollMs = 5e3) {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, pollMs);
    void this.tick();
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  cancel(jobId) {
    if (this.activeJobId === jobId && this.activeAbort) {
      this.activeAbort.abort();
      return true;
    }
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const result = this.db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ? AND status = 'queued'").run("cancelled", updatedAt, "canceled_by_user", jobId);
    if (result.changes > 0) {
      this.emit({
        jobId,
        kind: "status",
        status: "cancelled",
        error: "canceled_by_user",
        updatedAt
      });
    }
    return result.changes > 0;
  }
  async tick() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    let job;
    try {
      job = this.db.prepare("SELECT id, input_path, output_path, config_json FROM jobs WHERE type = 'transcode' AND status = 'queued' ORDER BY created_at ASC LIMIT 1").get();
      if (!job) {
        return;
      }
      if (!job.input_path || !job.output_path) {
        this.markJob(job.id, "failed", "missing_input_output");
        return;
      }
      const config = this.safeParse(job.config_json);
      const args = config?.args ?? [];
      const totalDurationMs = await this.getDurationMs(job.input_path);
      this.markJob(job.id, "running");
      this.updateJobTimes(job.id, "started_at");
      this.updateJobProgress(job.id, 1);
      const abortController = new AbortController();
      this.activeJobId = job.id;
      this.activeAbort = abortController;
      node_fs.mkdirSync(require$$0.dirname(job.output_path), { recursive: true });
      const jobId = job.id;
      this.logger.info("processing transcode", { jobId });
      let lastProgress = 0;
      let lastProgressAt = 0;
      let logTail = "";
      let lastLogAt = 0;
      await this.service.transcode({
        inputPath: job.input_path,
        outputPath: job.output_path,
        args,
        signal: abortController.signal,
        onProgress: (outTimeMs) => {
          if (!totalDurationMs) {
            return;
          }
          const percent = Math.max(1, Math.min(99, Math.round(outTimeMs / totalDurationMs * 100)));
          const now = Date.now();
          if (percent !== lastProgress && now - lastProgressAt > 750) {
            lastProgress = percent;
            lastProgressAt = now;
            this.updateJobProgress(jobId, percent);
          }
        },
        onLog: (chunk) => {
          logTail = this.appendLog(logTail, chunk);
          const now = Date.now();
          if (now - lastLogAt > 1e3) {
            lastLogAt = now;
            this.updateJobLog(jobId, logTail);
          }
        }
      });
      const outputMetadata = await this.safeOutputMetadata(job.output_path);
      this.db.prepare("UPDATE jobs SET result_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify({ outputPath: job.output_path, metadata: outputMetadata }), (/* @__PURE__ */ new Date()).toISOString(), job.id);
      this.emit({
        jobId: job.id,
        kind: "result",
        result: { outputPath: job.output_path, metadata: outputMetadata }
      });
      this.markJob(job.id, "completed");
      this.updateJobTimes(job.id, "completed_at", 100);
      if (logTail) {
        this.updateJobLog(job.id, logTail);
      }
    } catch (error2) {
      const message = this.errorMessage(error2);
      if (job && this.isAbortError(error2)) {
        this.markJob(job.id, "cancelled", "canceled_by_user");
      } else {
        this.logger.error("transcode failed", { error: message });
        if (job) {
          this.markJob(job.id, "failed", message);
        }
      }
    } finally {
      this.activeJobId = null;
      this.activeAbort = null;
      this.isRunning = false;
    }
  }
  markJob(jobId, status, error2) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?").run(status, updatedAt, error2 ?? null, jobId);
    this.emit({
      jobId,
      kind: "status",
      status,
      error: error2 ?? null,
      updatedAt
    });
  }
  updateJobTimes(jobId, column, progress) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (typeof progress === "number") {
      this.db.prepare(`UPDATE jobs SET ${column} = ?, updated_at = ?, progress = ? WHERE id = ?`).run(updatedAt, updatedAt, progress, jobId);
    } else {
      this.db.prepare(`UPDATE jobs SET ${column} = ?, updated_at = ? WHERE id = ?`).run(updatedAt, updatedAt, jobId);
    }
  }
  updateJobProgress(jobId, progress) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET progress = ?, updated_at = ? WHERE id = ?").run(progress, updatedAt, jobId);
    this.emit({
      jobId,
      kind: "progress",
      progress,
      updatedAt
    });
  }
  updateJobLog(jobId, logTail) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET log_tail = ?, updated_at = ? WHERE id = ?").run(logTail, updatedAt, jobId);
    this.emit({
      jobId,
      kind: "log",
      logTail,
      updatedAt
    });
  }
  appendLog(current, chunk, maxLength = 8e3) {
    const next = `${current}${chunk}`;
    if (next.length <= maxLength) {
      return next;
    }
    return next.slice(-maxLength);
  }
  async getDurationMs(filePath) {
    try {
      const metadata = await this.metadata.extract({ filePath });
      if (!metadata.duration || metadata.duration <= 0) {
        return null;
      }
      return Math.round(metadata.duration * 1e3);
    } catch (error2) {
      this.logger.warn("failed to read duration for transcode progress", { error: this.errorMessage(error2) });
      return null;
    }
  }
  async safeOutputMetadata(filePath) {
    try {
      const metadata = await this.metadata.extract({ filePath });
      return {
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: metadata.fps,
        codec: metadata.codec,
        container: metadata.container,
        bitrate: metadata.bitrate,
        fileSize: metadata.fileSize
      };
    } catch (error2) {
      this.logger.warn("failed to read output metadata", { error: this.errorMessage(error2) });
      return null;
    }
  }
  safeParse(config) {
    if (!config) {
      return null;
    }
    try {
      return JSON.parse(config);
    } catch (error2) {
      this.logger.warn("invalid transcode config", { error: this.errorMessage(error2) });
      return null;
    }
  }
  errorMessage(error2) {
    return error2 instanceof Error ? error2.message : "unknown error";
  }
  isAbortError(error2) {
    return error2 instanceof Error && (error2.name === "AbortError" || error2.message === "canceled");
  }
  emit(event) {
    if (!this.onJobEvent) {
      return;
    }
    this.onJobEvent({ jobType: "transcode", ...event });
  }
}
class TranscriptionWorker {
  constructor(db2, service, metadata = new MetadataService(), onJobEvent) {
    this.db = db2;
    this.service = service;
    this.metadata = metadata;
    this.onJobEvent = onJobEvent;
    this.logger = new Logger("TranscriptionWorker");
    this.isRunning = false;
    this.timer = null;
    this.activeJobId = null;
    this.activeAbort = null;
  }
  start(pollMs = 6e3) {
    if (this.timer) {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, pollMs);
    void this.tick();
  }
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  cancel(jobId) {
    if (this.activeJobId === jobId && this.activeAbort) {
      this.activeAbort.abort();
      return true;
    }
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const result = this.db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ? AND status = 'queued'").run("cancelled", updatedAt, "canceled_by_user", jobId);
    if (result.changes > 0) {
      this.emit({
        jobId,
        kind: "status",
        status: "cancelled",
        error: "canceled_by_user",
        updatedAt
      });
    }
    return result.changes > 0;
  }
  async tick() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    let job;
    let progressTimer = null;
    let logTail = "";
    let lastLogAt = 0;
    try {
      job = this.db.prepare("SELECT id, input_path, output_path, config_json, video_id FROM jobs WHERE type = 'transcription' AND status = 'queued' ORDER BY created_at ASC LIMIT 1").get();
      if (!job) {
        return;
      }
      if (!job.input_path) {
        this.markJob(job.id, "failed", "missing_input");
        return;
      }
      const config = this.safeParse(job.config_json);
      const modelPath = config?.modelPath;
      if (!modelPath) {
        this.markJob(job.id, "failed", "missing_model");
        return;
      }
      this.markJob(job.id, "running");
      this.updateJobTimes(job.id, "started_at");
      this.updateJobProgress(job.id, 1);
      const abortController = new AbortController();
      this.activeJobId = job.id;
      this.activeAbort = abortController;
      const jobId = job.id;
      progressTimer = await this.startProgressTimer(jobId, job.input_path, abortController.signal);
      const result = await this.service.transcribe({
        audioPath: job.input_path,
        modelPath,
        outputDir: job.output_path ? require$$0.dirname(job.output_path) : void 0,
        language: config?.language,
        signal: abortController.signal,
        onLog: (chunk) => {
          logTail = this.appendLog(logTail, chunk);
          const now = Date.now();
          if (now - lastLogAt > 1e3) {
            lastLogAt = now;
            this.updateJobLog(jobId, logTail);
          }
        }
      });
      const videoId = job.video_id ?? this.findVideoId(job.input_path) ?? this.createVideo(job.input_path);
      this.db.prepare("UPDATE videos SET transcript = ?, updated_at = ? WHERE id = ?").run(result.transcript, (/* @__PURE__ */ new Date()).toISOString(), videoId);
      this.markJob(job.id, "completed");
      this.updateJobTimes(job.id, "completed_at", 100);
      this.updateJobProgress(job.id, 100);
      const outputMeta = await this.safeTranscriptMeta(result.outputPath, result.transcript);
      const captionPath = this.resolveCaptionPath(result.outputPath);
      const resultPayload = {
        outputPath: result.outputPath,
        captionPath,
        ...outputMeta
      };
      this.db.prepare("UPDATE jobs SET result_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(resultPayload), (/* @__PURE__ */ new Date()).toISOString(), job.id);
      this.emit({
        jobId: job.id,
        kind: "result",
        result: resultPayload
      });
    } catch (error2) {
      const message = this.errorMessage(error2);
      if (job && this.isAbortError(error2)) {
        this.markJob(job.id, "cancelled", "canceled_by_user");
      } else {
        this.logger.error("transcription failed", { error: message });
        if (job) {
          this.markJob(job.id, "failed", message);
        }
      }
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
      if (job && logTail) {
        this.updateJobLog(job.id, logTail);
      }
      this.activeJobId = null;
      this.activeAbort = null;
      this.isRunning = false;
    }
  }
  markJob(jobId, status, error2) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?").run(status, updatedAt, error2 ?? null, jobId);
    this.emit({
      jobId,
      kind: "status",
      status,
      error: error2 ?? null,
      updatedAt
    });
  }
  updateJobTimes(jobId, column, progress) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (typeof progress === "number") {
      this.db.prepare(`UPDATE jobs SET ${column} = ?, updated_at = ?, progress = ? WHERE id = ?`).run(updatedAt, updatedAt, progress, jobId);
    } else {
      this.db.prepare(`UPDATE jobs SET ${column} = ?, updated_at = ? WHERE id = ?`).run(updatedAt, updatedAt, jobId);
    }
  }
  updateJobProgress(jobId, progress) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET progress = ?, updated_at = ? WHERE id = ?").run(progress, updatedAt, jobId);
    this.emit({
      jobId,
      kind: "progress",
      progress,
      updatedAt
    });
  }
  updateJobLog(jobId, logTail) {
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE jobs SET log_tail = ?, updated_at = ? WHERE id = ?").run(logTail, updatedAt, jobId);
    this.emit({
      jobId,
      kind: "log",
      logTail,
      updatedAt
    });
  }
  appendLog(current, chunk, maxLength = 8e3) {
    const next = `${current}${chunk}`;
    if (next.length <= maxLength) {
      return next;
    }
    return next.slice(-maxLength);
  }
  async startProgressTimer(jobId, filePath, signal) {
    const durationMs = await this.getDurationMs(filePath);
    if (!durationMs) {
      return null;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (signal.aborted) {
        clearInterval(timer);
        return;
      }
      const elapsed = Date.now() - startedAt;
      const percent = Math.min(95, Math.max(1, Math.round(elapsed / durationMs * 100)));
      this.updateJobProgress(jobId, percent);
    }, 4e3);
    return timer;
  }
  safeParse(config) {
    if (!config) {
      return null;
    }
    try {
      return JSON.parse(config);
    } catch (error2) {
      this.logger.warn("invalid transcription config", { error: this.errorMessage(error2) });
      return null;
    }
  }
  findVideoId(filePath) {
    const row = this.db.prepare("SELECT id FROM videos WHERE file_path = ? ORDER BY created_at DESC LIMIT 1").get(filePath);
    return row?.id ?? null;
  }
  createVideo(filePath) {
    const id = require$$1$1.randomUUID();
    const fileName = require$$0.basename(filePath);
    const title = fileName.replace(new RegExp(`${require$$0.extname(fileName)}$`), "");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("INSERT INTO videos (id, file_path, file_name, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, filePath, fileName, title, now, now);
    return id;
  }
  errorMessage(error2) {
    return error2 instanceof Error ? error2.message : "unknown error";
  }
  isAbortError(error2) {
    return error2 instanceof Error && (error2.name === "AbortError" || error2.message === "canceled");
  }
  async getDurationMs(filePath) {
    try {
      const metadata = await this.metadata.extract({ filePath });
      if (!metadata.duration || metadata.duration <= 0) {
        return null;
      }
      return Math.round(metadata.duration * 1e3);
    } catch (error2) {
      this.logger.warn("failed to read duration for transcription progress", { error: this.errorMessage(error2) });
      return null;
    }
  }
  async safeTranscriptMeta(outputPath, transcript) {
    try {
      const info = await promises.stat(outputPath);
      return { transcriptLength: transcript.length, outputSize: info.size };
    } catch {
      return { transcriptLength: transcript.length, outputSize: null };
    }
  }
  resolveCaptionPath(outputPath) {
    const vttPath = outputPath.replace(/\.txt$/i, ".vtt");
    if (vttPath !== outputPath && node_fs.existsSync(vttPath)) {
      return vttPath;
    }
    return null;
  }
  emit(event) {
    if (!this.onJobEvent) {
      return;
    }
    this.onJobEvent({ jobType: "transcription", ...event });
  }
}
const parseBoolean = (value, fallback) => {
  if (value === null) {
    return fallback;
  }
  return value === "1" || value.toLowerCase() === "true";
};
function registerDownloadHandlers({ downloadWorker: downloadWorker2 } = {}) {
  const db2 = getDatabase();
  const queue = new QueueManager(db2);
  const downloadExistsStmt = db2.prepare("SELECT id FROM downloads WHERE url = ? LIMIT 1");
  const videoExistsStmt = db2.prepare("SELECT id FROM videos WHERE source_url = ? LIMIT 1");
  const checkDuplicate = (url) => {
    const download = downloadExistsStmt.get(url);
    if (download?.id) {
      return { exists: true, source: "downloads" };
    }
    const video = videoExistsStmt.get(url);
    if (video?.id) {
      return { exists: true, source: "videos" };
    }
    return { exists: false, source: null };
  };
  require$$1.ipcMain.handle("download/start", async (_event, url) => {
    const trimmed = url?.trim();
    if (!trimmed) {
      return { ok: false, error: "invalid_url" };
    }
    const dedupeEnabled = parseBoolean(getSetting(db2, "download_dedupe_enabled"), true);
    if (dedupeEnabled) {
      const duplicate = checkDuplicate(trimmed);
      if (duplicate.exists) {
        return { ok: false, error: duplicate.source === "videos" ? "already_downloaded" : "already_queued" };
      }
    }
    const downloadId = require$$1$1.randomUUID();
    const jobId = require$$1$1.randomUUID();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const outputDir = getSetting(db2, "download_path") ?? getDownloadPath();
    db2.prepare(
      "INSERT INTO downloads (id, url, job_id, status, progress, speed, eta, output_path, downloader, created_at, updated_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(downloadId, trimmed, jobId, "queued", 0, null, null, null, "yt-dlp", createdAt, createdAt, null);
    queue.enqueue({
      id: jobId,
      type: "download",
      payload: {
        downloadId,
        url: trimmed,
        outputDir
      }
    });
    return { ok: true, downloadId, jobId, status: "queued" };
  });
  require$$1.ipcMain.handle("download/list", async () => {
    const rows = db2.prepare(
      "SELECT id, url, job_id, status, created_at, progress, speed, eta, output_path, updated_at, error_message, video_id FROM downloads ORDER BY created_at DESC"
    ).all();
    return { ok: true, downloads: rows };
  });
  require$$1.ipcMain.handle("download/cancel", async (_event, downloadId) => {
    const row = db2.prepare("SELECT id, job_id, status FROM downloads WHERE id = ?").get(downloadId);
    if (!row) {
      return { ok: false, error: "not_found" };
    }
    if (row.status === "completed") {
      return { ok: false, error: "already_completed" };
    }
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db2.prepare("UPDATE downloads SET status = ?, error_message = ?, updated_at = ? WHERE id = ?").run(
      "canceled",
      "canceled_by_user",
      updatedAt,
      row.id
    );
    if (row.job_id) {
      db2.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?").run(
        "canceled",
        updatedAt,
        "canceled_by_user",
        row.job_id
      );
    }
    if (downloadWorker2) {
      downloadWorker2.cancel(row.id);
    }
    return { ok: true, status: "canceled" };
  });
  require$$1.ipcMain.handle("download/retry", async (_event, downloadId) => {
    const row = db2.prepare("SELECT id, url, status FROM downloads WHERE id = ?").get(downloadId);
    if (!row) {
      return { ok: false, error: "not_found" };
    }
    if (!["failed", "canceled"].includes(row.status)) {
      return { ok: false, error: "not_retryable" };
    }
    const jobId = require$$1$1.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const outputDir = getSetting(db2, "download_path") ?? getDownloadPath();
    db2.prepare(
      "UPDATE downloads SET job_id = ?, status = ?, progress = ?, speed = NULL, eta = NULL, output_path = NULL, video_id = NULL, updated_at = ?, error_message = NULL WHERE id = ?"
    ).run(jobId, "queued", 0, now, row.id);
    queue.enqueue({
      id: jobId,
      type: "download",
      payload: {
        downloadId: row.id,
        url: row.url,
        outputDir
      }
    });
    return { ok: true, jobId, status: "queued" };
  });
  require$$1.ipcMain.handle("download/batch", async (_event, payload) => {
    if (!payload || !Array.isArray(payload.urls)) {
      return { ok: false, queued: 0, skipped: 0, failed: 0, results: [], error: "invalid_payload" };
    }
    const outputDir = getSetting(db2, "download_path") ?? getDownloadPath();
    const dedupeEnabled = parseBoolean(getSetting(db2, "download_dedupe_enabled"), true);
    const seen = /* @__PURE__ */ new Set();
    const results = [];
    let queued = 0;
    let skipped = 0;
    let failed = 0;
    const insertStmt = db2.prepare(
      "INSERT INTO downloads (id, url, job_id, status, progress, speed, eta, output_path, downloader, created_at, updated_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const rawUrl of payload.urls) {
      const trimmed = typeof rawUrl === "string" ? rawUrl.trim() : "";
      if (!trimmed) {
        skipped += 1;
        results.push({ url: "", status: "skipped", reason: "empty" });
        continue;
      }
      if (seen.has(trimmed)) {
        skipped += 1;
        results.push({ url: trimmed, status: "skipped", reason: "duplicate_in_batch" });
        continue;
      }
      seen.add(trimmed);
      if (dedupeEnabled) {
        const duplicate = checkDuplicate(trimmed);
        if (duplicate.exists) {
          skipped += 1;
          results.push({
            url: trimmed,
            status: "skipped",
            reason: duplicate.source === "videos" ? "already_downloaded" : "already_queued"
          });
          continue;
        }
      }
      try {
        const downloadId = require$$1$1.randomUUID();
        const jobId = require$$1$1.randomUUID();
        const createdAt = (/* @__PURE__ */ new Date()).toISOString();
        insertStmt.run(downloadId, trimmed, jobId, "queued", 0, null, null, null, "yt-dlp", createdAt, createdAt, null);
        queue.enqueue({
          id: jobId,
          type: "download",
          payload: {
            downloadId,
            url: trimmed,
            outputDir
          }
        });
        queued += 1;
        results.push({ url: trimmed, status: "queued", downloadId, jobId });
      } catch (error2) {
        failed += 1;
        results.push({
          url: trimmed,
          status: "error",
          reason: error2 instanceof Error ? error2.message : "queue_failed"
        });
      }
    }
    return { ok: true, queued, skipped, failed, results };
  });
}
const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;
class ImportExportService {
  constructor(db2, metadata) {
    this.db = db2;
    this.metadata = metadata;
    this.videoExtensions = /* @__PURE__ */ new Set([
      ".mp4",
      ".mkv",
      ".mov",
      ".webm",
      ".avi",
      ".flv",
      ".m4v",
      ".wmv",
      ".mpg",
      ".mpeg"
    ]);
  }
  async exportVideos(request, onProgress) {
    const { videoIds, destinationDir } = request;
    let exportedCount = 0;
    let failedCount = 0;
    const errors = [];
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      try {
        const video = this.db.prepare(
          `SELECT id, file_path, file_name, title, transcript, summary, source_url, source_platform
             FROM videos WHERE id = ?`
        ).get(videoId);
        if (!video) {
          throw new Error("Video not found in database");
        }
        if (!node_fs.existsSync(video.file_path)) {
          throw new Error("Video file not found on disk");
        }
        const fileName = video.file_name ?? require$$0.basename(video.file_path);
        onProgress?.({
          current: i + 1,
          total: videoIds.length,
          currentFile: fileName,
          status: "copying"
        });
        let destVideoPath = require$$0.join(destinationDir, fileName);
        let counter = 1;
        while (node_fs.existsSync(destVideoPath)) {
          const parsed = require$$0.parse(fileName);
          destVideoPath = require$$0.join(destinationDir, `${parsed.name}_${counter}${parsed.ext}`);
          counter++;
        }
        const fileInfo = await promises.stat(video.file_path);
        if (fileInfo.size > LARGE_FILE_THRESHOLD) {
          await this.copyFileWithStreams(video.file_path, destVideoPath);
        } else {
          await promises.copyFile(video.file_path, destVideoPath);
        }
        onProgress?.({
          current: i + 1,
          total: videoIds.length,
          currentFile: fileName,
          status: "metadata"
        });
        const metadata = await this.buildMetadataBundle(videoId);
        const destFileName = require$$0.basename(destVideoPath);
        const metaPath = require$$0.join(destinationDir, `${require$$0.parse(destFileName).name}.drapp-meta.json`);
        await promises.writeFile(metaPath, JSON.stringify(metadata, null, 2), "utf-8");
        exportedCount++;
        console.info("Exported video", { videoId, destVideoPath });
      } catch (error2) {
        failedCount++;
        const errorMessage2 = error2 instanceof Error ? error2.message : "Unknown error";
        errors.push({ videoId, error: errorMessage2 });
        console.warn("Failed to export video", { videoId, error: errorMessage2 });
      }
    }
    onProgress?.({
      current: videoIds.length,
      total: videoIds.length,
      currentFile: "",
      status: "complete"
    });
    console.info("Export completed", { exportedCount, failedCount });
    return { exportedCount, failedCount, errors };
  }
  async importVideos(request, onProgress) {
    const { filePaths, libraryDir } = request;
    console.info("Starting import", { count: filePaths.length, libraryDir });
    if (!node_fs.existsSync(libraryDir)) {
      node_fs.mkdirSync(libraryDir, { recursive: true });
    }
    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors = [];
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileName = require$$0.basename(filePath);
      try {
        const ext = require$$0.extname(filePath).toLowerCase();
        if (!this.videoExtensions.has(ext)) {
          throw new Error(`Unsupported video format: ${ext}`);
        }
        onProgress?.({
          current: i + 1,
          total: filePaths.length,
          currentFile: fileName,
          status: "copying"
        });
        let destPath = require$$0.join(libraryDir, fileName);
        if (node_fs.existsSync(destPath)) {
          if (filePath === destPath) {
            skippedCount++;
            continue;
          }
          let counter = 1;
          while (node_fs.existsSync(destPath)) {
            const parsed = require$$0.parse(fileName);
            destPath = require$$0.join(libraryDir, `${parsed.name}_${counter}${parsed.ext}`);
            counter++;
          }
        }
        const fileInfo = await promises.stat(filePath);
        if (fileInfo.size > LARGE_FILE_THRESHOLD) {
          await this.copyFileWithStreams(filePath, destPath);
        } else {
          await promises.copyFile(filePath, destPath);
        }
        onProgress?.({
          current: i + 1,
          total: filePaths.length,
          currentFile: fileName,
          status: "metadata"
        });
        await this.indexSingleFile(destPath);
        await this.tryRestoreMetadata(filePath, destPath);
        importedCount++;
        console.info("Imported video", { filePath, destPath });
      } catch (error2) {
        failedCount++;
        const errorMessage2 = error2 instanceof Error ? error2.message : "Unknown error";
        errors.push({ filePath, error: errorMessage2 });
        console.warn("Failed to import video", { filePath, error: errorMessage2 });
      }
    }
    onProgress?.({
      current: filePaths.length,
      total: filePaths.length,
      currentFile: "",
      status: "complete"
    });
    console.info("Import completed", { importedCount, skippedCount, failedCount });
    return { importedCount, skippedCount, failedCount, errors };
  }
  async buildMetadataBundle(videoId) {
    const video = this.db.prepare(
      `SELECT title, transcript, summary, source_url, source_platform
         FROM videos WHERE id = ?`
    ).get(videoId);
    const tags = this.db.prepare(
      `SELECT t.name, vt.source, vt.confidence, vt.is_locked
         FROM video_tags vt
         JOIN tags t ON t.id = vt.tag_id
         WHERE vt.video_id = ?`
    ).all(videoId);
    return {
      version: 1,
      title: video.title,
      transcript: video.transcript,
      summary: video.summary,
      tags: tags.map((t2) => ({
        name: t2.name,
        source: t2.source,
        confidence: t2.confidence,
        is_locked: Boolean(t2.is_locked)
      })),
      source_url: video.source_url,
      source_platform: video.source_platform
    };
  }
  async tryRestoreMetadata(sourceFilePath, destFilePath) {
    const sourceDir = require$$0.dirname(sourceFilePath);
    const sourceBaseName = require$$0.parse(require$$0.basename(sourceFilePath)).name;
    const metaPath = require$$0.join(sourceDir, `${sourceBaseName}.drapp-meta.json`);
    if (!node_fs.existsSync(metaPath)) {
      return;
    }
    try {
      const raw = await promises.readFile(metaPath, "utf-8");
      const metadata = JSON.parse(raw);
      if (metadata.version !== 1) {
        console.warn("Unsupported metadata version", { version: metadata.version });
        return;
      }
      const video = this.db.prepare("SELECT id FROM videos WHERE file_path = ?").get(destFilePath);
      if (video) {
        await this.restoreMetadataBundle(video.id, metadata);
        console.info("Restored metadata for video", { videoId: video.id });
      }
    } catch (error2) {
      console.warn("Failed to restore metadata", { metaPath, error: error2 });
    }
  }
  async restoreMetadataBundle(videoId, metadata) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare(
      `UPDATE videos SET
          title = COALESCE(?, title),
          transcript = COALESCE(?, transcript),
          summary = COALESCE(?, summary),
          source_url = COALESCE(?, source_url),
          source_platform = COALESCE(?, source_platform),
          updated_at = ?
        WHERE id = ?`
    ).run(
      metadata.title,
      metadata.transcript,
      metadata.summary,
      metadata.source_url,
      metadata.source_platform,
      now,
      videoId
    );
    for (const tag of metadata.tags) {
      this.db.prepare(
        `INSERT INTO tags (name, section, created_at)
           VALUES (?, 'imported', ?)
           ON CONFLICT(name) DO NOTHING`
      ).run(tag.name, now);
      const tagRow = this.db.prepare("SELECT id FROM tags WHERE name = ?").get(tag.name);
      this.db.prepare(
        `INSERT INTO video_tags (id, video_id, tag_id, source, confidence, is_locked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(video_id, tag_id) DO UPDATE SET
             source = excluded.source,
             confidence = excluded.confidence,
             is_locked = excluded.is_locked,
             updated_at = excluded.updated_at`
      ).run(
        require$$1$1.randomUUID(),
        videoId,
        tagRow.id,
        tag.source,
        tag.confidence,
        tag.is_locked ? 1 : 0,
        now,
        now
      );
    }
  }
  async indexSingleFile(filePath) {
    const fileName = require$$0.basename(filePath);
    const folderPath = require$$0.dirname(filePath);
    const title = fileName.replace(/\.[^.]+$/, "");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = this.db.prepare("SELECT id FROM videos WHERE file_path = ?").get(filePath);
    if (existing) {
      return;
    }
    let metadata = {
      duration: null,
      width: null,
      height: null,
      fps: null,
      codec: null,
      container: null,
      bitrate: null,
      fileSize: null
    };
    try {
      metadata = await this.metadata.extract({ filePath });
      if (!metadata.fileSize) {
        const fileInfo = await promises.stat(filePath);
        metadata.fileSize = fileInfo.size;
      }
    } catch (error2) {
      console.warn("Metadata extraction failed during import", { filePath, error: error2 });
      try {
        const fileInfo = await promises.stat(filePath);
        metadata.fileSize = fileInfo.size;
      } catch {
      }
    }
    this.db.prepare(
      `INSERT INTO videos (
          id, file_path, file_name, file_size, duration, width, height, fps,
          codec, container, bitrate, title, folder_path, created_at, updated_at
        ) VALUES (
          @id, @file_path, @file_name, @file_size, @duration, @width, @height, @fps,
          @codec, @container, @bitrate, @title, @folder_path, @created_at, @updated_at
        )`
    ).run({
      id: require$$1$1.randomUUID(),
      file_path: filePath,
      file_name: fileName,
      file_size: metadata.fileSize,
      duration: metadata.duration,
      width: metadata.width,
      height: metadata.height,
      fps: metadata.fps,
      codec: metadata.codec,
      container: metadata.container,
      bitrate: metadata.bitrate,
      title,
      folder_path: folderPath,
      created_at: now,
      updated_at: now
    });
  }
  async copyFileWithStreams(src2, dest) {
    const readStream = node_fs.createReadStream(src2);
    const writeStream = node_fs.createWriteStream(dest);
    await promises$1.pipeline(readStream, writeStream);
  }
}
class ScannerService {
  constructor(db2, metadata) {
    this.db = db2;
    this.metadata = metadata;
    this.logger = new Logger("ScannerService");
    this.videoExtensions = /* @__PURE__ */ new Set([
      ".mp4",
      ".mkv",
      ".mov",
      ".webm",
      ".avi",
      ".flv",
      ".m4v",
      ".wmv",
      ".mpg",
      ".mpeg"
    ]);
    this.ignoredDirs = /* @__PURE__ */ new Set([
      ".drapp",
      ".git",
      "node_modules"
    ]);
  }
  async scan(request, options = {}) {
    this.logger.info("library scan requested", { root: request.rootPath });
    const files = [];
    await this.walk(request.rootPath, files, options.signal);
    const selectStmt = this.db.prepare("SELECT id, title FROM videos WHERE file_path = ?");
    const insertStmt = this.db.prepare(`
      INSERT INTO videos (
        id,
        file_path,
        file_name,
        file_size,
        duration,
        width,
        height,
        fps,
        codec,
        container,
        bitrate,
        title,
        folder_path,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @file_path,
        @file_name,
        @file_size,
        @duration,
        @width,
        @height,
        @fps,
        @codec,
        @container,
        @bitrate,
        @title,
        @folder_path,
        @created_at,
        @updated_at
      )
    `);
    const updateStmt = this.db.prepare(`
      UPDATE videos
      SET
        file_name = @file_name,
        file_size = @file_size,
        duration = @duration,
        width = @width,
        height = @height,
        fps = @fps,
        codec = @codec,
        container = @container,
        bitrate = @bitrate,
        title = @title,
        folder_path = @folder_path,
        updated_at = @updated_at
      WHERE id = @id
    `);
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    let processed = 0;
    for (const filePath of files) {
      if (options.signal?.aborted) {
        return { found: files.length, inserted, updated, errors, canceled: true };
      }
      let fileFailed = false;
      let metadata = {
        duration: null,
        width: null,
        height: null,
        fps: null,
        codec: null,
        container: null,
        bitrate: null,
        fileSize: await this.safeStatSize(filePath)
      };
      try {
        metadata = await this.metadata.extract({ filePath });
        if (!metadata.fileSize) {
          metadata.fileSize = await this.safeStatSize(filePath);
        }
      } catch (error2) {
        if (!fileFailed) {
          errors += 1;
          fileFailed = true;
        }
        this.logger.warn("Metadata extraction failed, continuing with defaults", { filePath, error: error2 });
      }
      try {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const fileName = require$$0.basename(filePath);
        const folderPath = require$$0.dirname(filePath);
        const title = fileName.replace(/\.[^.]+$/, "");
        const existing = selectStmt.get(filePath);
        if (existing) {
          updateStmt.run({
            id: existing.id,
            file_name: fileName,
            file_size: metadata.fileSize,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            fps: metadata.fps,
            codec: metadata.codec,
            container: metadata.container,
            bitrate: metadata.bitrate,
            title: existing.title ?? title,
            folder_path: folderPath,
            updated_at: now
          });
          updated += 1;
        } else {
          insertStmt.run({
            id: require$$1$1.randomUUID(),
            file_path: filePath,
            file_name: fileName,
            file_size: metadata.fileSize,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            fps: metadata.fps,
            codec: metadata.codec,
            container: metadata.container,
            bitrate: metadata.bitrate,
            title,
            folder_path: folderPath,
            created_at: now,
            updated_at: now
          });
          inserted += 1;
        }
      } catch (error2) {
        if (!fileFailed) {
          errors += 1;
          fileFailed = true;
        }
        this.logger.warn("Failed to index file", { filePath, error: error2 });
      } finally {
        processed += 1;
        options.onProgress?.({
          found: files.length,
          processed,
          inserted,
          updated,
          errors,
          currentPath: filePath
        });
      }
    }
    return { found: files.length, inserted, updated, errors, canceled: false };
  }
  async walk(root2, files, signal) {
    let entries;
    try {
      entries = await promises.readdir(root2, { withFileTypes: true });
    } catch (error2) {
      this.logger.warn("Failed to read directory", { root: root2, error: error2 });
      return;
    }
    for (const entry of entries) {
      if (signal?.aborted) {
        return;
      }
      const fullPath = require$$0.join(root2, entry.name);
      if (entry.isDirectory()) {
        if (this.ignoredDirs.has(entry.name)) {
          continue;
        }
        if (entry.name.startsWith(".")) {
          continue;
        }
        await this.walk(fullPath, files, signal);
        continue;
      }
      if (entry.isFile()) {
        const ext = require$$0.extname(entry.name).toLowerCase();
        if (this.videoExtensions.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  async safeStatSize(filePath) {
    try {
      const info = await promises.stat(filePath);
      return info.size;
    } catch {
      return null;
    }
  }
}
function isHistoryEnabled() {
  const db2 = getDatabase();
  const value = getSetting(db2, "privacy_history_enabled");
  if (value === null) {
    return true;
  }
  return value === "1" || value.toLowerCase() === "true";
}
function isHiddenFolderEnabled() {
  const db2 = getDatabase();
  const value = getSetting(db2, "privacy_hidden_folder_enabled");
  if (value === null) {
    return false;
  }
  return value === "1" || value.toLowerCase() === "true";
}
function isSecureDeleteEnabled() {
  const db2 = getDatabase();
  const value = getSetting(db2, "privacy_secure_delete_enabled");
  if (value === null) {
    return false;
  }
  return value === "1" || value.toLowerCase() === "true";
}
function registerLibraryHandlers() {
  const db2 = getDatabase();
  const scanner = new ScannerService(db2, new MetadataService());
  const scanControllers = /* @__PURE__ */ new Map();
  const deleteVideoRecords = (videoId) => {
    db2.prepare("DELETE FROM video_tags WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM tag_events WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM video_frames WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM video_embeddings WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM private_items WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM watch_history WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM collection_videos WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM jobs WHERE video_id = ?").run(videoId);
    db2.prepare("UPDATE downloads SET video_id = NULL WHERE video_id = ?").run(videoId);
    db2.prepare("DELETE FROM videos WHERE id = ?").run(videoId);
  };
  require$$1.ipcMain.handle("library/select-folder", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openDirectory", "createDirectory"]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: result.filePaths[0] };
  });
  require$$1.ipcMain.handle("library/scan-start", async (event, path2) => {
    if (!path2) {
      return { ok: false, error: "No scan path provided." };
    }
    const scanId = require$$1$1.randomUUID();
    const controller = new AbortController();
    scanControllers.set(scanId, controller);
    const sender = event.sender;
    void scanner.scan(
      { rootPath: path2 },
      {
        signal: controller.signal,
        onProgress: (progress) => {
          sender.send("library/scan-progress", {
            scanId,
            ...progress
          });
        }
      }
    ).then((result) => {
      sender.send("library/scan-complete", {
        scanId,
        ok: true,
        result
      });
    }).catch((error2) => {
      sender.send("library/scan-complete", {
        scanId,
        ok: false,
        error: error2 instanceof Error ? error2.message : "Library scan failed."
      });
    }).finally(() => {
      scanControllers.delete(scanId);
    });
    return { ok: true, scanId };
  });
  require$$1.ipcMain.handle("library/scan-cancel", async (_event, scanId) => {
    if (!scanId) {
      return { ok: false, error: "No scan id provided." };
    }
    const controller = scanControllers.get(scanId);
    if (!controller) {
      return { ok: false, error: "Scan not found." };
    }
    controller.abort();
    return { ok: true };
  });
  require$$1.ipcMain.handle("library/scan", async (_event, path2) => {
    if (!path2) {
      return { ok: false, error: "No scan path provided." };
    }
    try {
      const result = await scanner.scan({ rootPath: path2 });
      return { ok: true, result };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Library scan failed." };
    }
  });
  require$$1.ipcMain.handle("library/stats", async () => {
    const totals = db2.prepare("SELECT COUNT(*) as count, SUM(duration) as totalDuration, SUM(file_size) as totalSize FROM videos").get();
    const hidden = db2.prepare("SELECT COUNT(*) as count FROM private_items WHERE is_hidden = 1").get();
    const downloadRows = db2.prepare("SELECT status, COUNT(*) as count FROM downloads GROUP BY status").all();
    const downloadStats = {
      queued: 0,
      downloading: 0,
      completed: 0,
      failed: 0,
      canceled: 0
    };
    for (const row of downloadRows) {
      if (!row?.status) {
        continue;
      }
      downloadStats[row.status] = row.count;
    }
    return {
      ok: true,
      stats: {
        videoCount: totals?.count ?? 0,
        totalDuration: totals?.totalDuration ?? 0,
        totalSize: totals?.totalSize ?? 0,
        hiddenCount: hidden?.count ?? 0,
        downloads: downloadStats
      }
    };
  });
  require$$1.ipcMain.handle("library/select-export-folder", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openDirectory", "createDirectory"]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: result.filePaths[0] };
  });
  require$$1.ipcMain.handle("library/export-assets", async (_event, payload) => {
    if (!payload?.videoId) {
      return { ok: false, error: "missing_video" };
    }
    const row = db2.prepare("SELECT file_path, file_name, title, transcript, summary, duration FROM videos WHERE id = ?").get(payload.videoId);
    if (!row?.file_path) {
      return { ok: false, error: "video_not_found" };
    }
    const baseName = row.file_name ? require$$0.parse(row.file_name).name : require$$0.parse(row.file_path).name;
    const parsedSource = require$$0.parse(row.file_path);
    const exportDir = payload.targetDir && payload.targetDir.trim() ? payload.targetDir : parsedSource.dir;
    const vttPath = require$$0.join(parsedSource.dir, `${parsedSource.name}.vtt`);
    if (payload.includeCaptions && !node_fs.existsSync(vttPath) && !row.transcript) {
      return { ok: false, error: "missing_transcript" };
    }
    try {
      const results = [];
      const transcriptTarget = require$$0.join(exportDir, `${baseName}.txt`);
      const summaryTarget = require$$0.join(exportDir, `${baseName}.summary.txt`);
      const metadataTarget = require$$0.join(exportDir, `${baseName}.metadata.json`);
      const captionsTarget = require$$0.join(exportDir, `${baseName}.vtt`);
      if (payload.includeTranscript) {
        await promises.writeFile(transcriptTarget, row.transcript ?? "", "utf-8");
        results.push(transcriptTarget);
      }
      if (payload.includeSummary) {
        await promises.writeFile(summaryTarget, row.summary ?? "", "utf-8");
        results.push(summaryTarget);
      }
      if (payload.includeMetadata) {
        const metadata = {
          id: payload.videoId,
          title: row.title,
          fileName: row.file_name ?? null,
          sourcePath: row.file_path,
          duration: row.duration ?? null
        };
        await promises.writeFile(metadataTarget, JSON.stringify(metadata, null, 2), "utf-8");
        results.push(metadataTarget);
      }
      if (payload.includeCaptions) {
        if (node_fs.existsSync(vttPath)) {
          await promises.writeFile(captionsTarget, await promises.readFile(vttPath, "utf-8"), "utf-8");
        } else if (row.transcript) {
          const duration = Number.isFinite(row.duration) && row.duration ? row.duration : 300;
          const content = buildSingleCueVtt(row.transcript, duration);
          await promises.writeFile(captionsTarget, content, "utf-8");
        }
        results.push(captionsTarget);
      }
      if (results.length && exportDir) {
        require$$1.shell.showItemInFolder(results[0]);
      }
      return { ok: true, files: results, exportDir };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "export_failed" };
    }
  });
  require$$1.ipcMain.handle("library/integrity-scan", async () => {
    const videos = db2.prepare("SELECT id, file_path, title, file_name FROM videos").all();
    const downloads = db2.prepare("SELECT id, url, output_path, status FROM downloads WHERE status = 'completed'").all();
    const missingVideos = [];
    for (const video of videos) {
      if (!video.file_path || !node_fs.existsSync(video.file_path)) {
        missingVideos.push(video);
      }
    }
    const missingDownloads = [];
    for (const download of downloads) {
      if (!download.output_path || !node_fs.existsSync(download.output_path)) {
        missingDownloads.push(download);
      }
    }
    return {
      ok: true,
      summary: {
        videosTotal: videos.length,
        missingVideos: missingVideos.length,
        downloadsTotal: downloads.length,
        missingDownloads: missingDownloads.length
      },
      missingVideos,
      missingDownloads
    };
  });
  require$$1.ipcMain.handle(
    "library/integrity-fix",
    async (_event, payload) => {
      if (!payload) {
        return { ok: false, error: "missing_payload" };
      }
      const missingVideoIds = Array.isArray(payload.missingVideoIds) ? payload.missingVideoIds : [];
      const missingDownloadIds = Array.isArray(payload.missingDownloadIds) ? payload.missingDownloadIds : [];
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let removedVideos = 0;
      let markedDownloads = 0;
      const tx = db2.transaction(() => {
        for (const videoId of missingVideoIds) {
          if (!videoId) {
            continue;
          }
          deleteVideoRecords(videoId);
          removedVideos += 1;
        }
        for (const downloadId of missingDownloadIds) {
          if (!downloadId) {
            continue;
          }
          const result = db2.prepare("UPDATE downloads SET status = ?, error_message = ?, updated_at = ? WHERE id = ?").run("failed", "missing_output", now, downloadId);
          if (result.changes > 0) {
            markedDownloads += 1;
          }
        }
      });
      tx();
      return { ok: true, removedVideos, markedDownloads };
    }
  );
  require$$1.ipcMain.handle("library/get-playback", async (_event, videoId) => {
    if (!videoId) {
      return { ok: false, error: "No video id provided." };
    }
    if (!isHistoryEnabled()) {
      return { ok: true, position: 0 };
    }
    const row = db2.prepare("SELECT position FROM watch_history WHERE video_id = ? ORDER BY watched_at DESC LIMIT 1").get(videoId);
    return { ok: true, position: row?.position ?? 0 };
  });
  require$$1.ipcMain.handle("library/save-playback", async (_event, payload) => {
    if (!payload?.videoId) {
      return { ok: false, error: "No video id provided." };
    }
    if (!isHistoryEnabled()) {
      return { ok: true };
    }
    const position = Number.isFinite(payload.position) ? payload.position : 0;
    const duration = Number.isFinite(payload.duration) ? payload.duration : null;
    db2.prepare(`
      INSERT INTO watch_history (video_id, position, duration)
      VALUES (?, ?, ?)
    `).run(payload.videoId, position, duration);
    db2.prepare(`
      UPDATE videos
      SET last_watched_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(payload.videoId);
    if (duration && position >= duration * 0.95) {
      db2.prepare(`
        UPDATE videos
        SET watch_count = COALESCE(watch_count, 0) + 1
        WHERE id = ?
      `).run(payload.videoId);
    }
    return { ok: true };
  });
  require$$1.ipcMain.handle("library/get-transcript", async (_event, videoId) => {
    if (!videoId) {
      return { ok: false, error: "missing_video" };
    }
    const row = db2.prepare("SELECT transcript FROM videos WHERE id = ?").get(videoId);
    if (!row) {
      return { ok: false, error: "video_not_found" };
    }
    return { ok: true, transcript: row.transcript ?? "" };
  });
  require$$1.ipcMain.handle("library/update-transcript", async (_event, payload) => {
    if (!payload?.videoId) {
      return { ok: false, error: "missing_video" };
    }
    const transcript = payload.transcript ?? "";
    const result = db2.prepare("UPDATE videos SET transcript = ?, updated_at = ? WHERE id = ?").run(transcript, (/* @__PURE__ */ new Date()).toISOString(), payload.videoId);
    return result.changes > 0 ? { ok: true } : { ok: false, error: "video_not_found" };
  });
  require$$1.ipcMain.handle("library/export-captions", async (_event, payload) => {
    if (!payload?.videoId) {
      return { ok: false, error: "missing_video" };
    }
    const row = db2.prepare("SELECT file_path, transcript, duration FROM videos WHERE id = ?").get(payload.videoId);
    if (!row?.file_path) {
      return { ok: false, error: "video_not_found" };
    }
    const parsed = require$$0.parse(row.file_path);
    const vttPath = require$$0.join(parsed.dir, `${parsed.name}.vtt`);
    if (node_fs.existsSync(vttPath)) {
      return { ok: true, path: vttPath };
    }
    if (!row.transcript) {
      return { ok: false, error: "missing_transcript" };
    }
    const duration = Number.isFinite(row.duration) && row.duration ? row.duration : 300;
    const content = buildSingleCueVtt(row.transcript, duration);
    await promises.writeFile(vttPath, content, "utf-8");
    return { ok: true, path: vttPath };
  });
  require$$1.ipcMain.handle("library/list", async (_event, includeHidden) => {
    const hideHidden = isHiddenFolderEnabled();
    const shouldHide = hideHidden && !includeHidden;
    const query = shouldHide ? `SELECT videos.id, videos.file_path, videos.file_name, videos.title, videos.summary, videos.file_size, videos.duration, videos.width, videos.height, videos.codec, videos.container, videos.bitrate, videos.created_at, videos.updated_at,
           CASE WHEN private_items.video_id IS NULL THEN 0 ELSE 1 END AS is_hidden
         FROM videos
         LEFT JOIN private_items ON private_items.video_id = videos.id AND private_items.is_hidden = 1
         WHERE private_items.video_id IS NULL
         ORDER BY videos.created_at DESC` : `SELECT videos.id, videos.file_path, videos.file_name, videos.title, videos.summary, videos.file_size, videos.duration, videos.width, videos.height, videos.codec, videos.container, videos.bitrate, videos.created_at, videos.updated_at,
           CASE WHEN private_items.video_id IS NULL THEN 0 ELSE 1 END AS is_hidden
         FROM videos
         LEFT JOIN private_items ON private_items.video_id = videos.id AND private_items.is_hidden = 1
         ORDER BY videos.created_at DESC`;
    const rows = db2.prepare(query).all();
    return {
      ok: true,
      videos: rows.map((row) => ({
        ...row,
        is_hidden: row.is_hidden === 1
      }))
    };
  });
  require$$1.ipcMain.handle("library/set-hidden", async (_event, payload) => {
    if (!payload?.videoId) {
      return { ok: false, error: "missing_video" };
    }
    if (payload.hidden) {
      db2.prepare(
        "INSERT INTO private_items (video_id, is_hidden, created_at) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(video_id) DO UPDATE SET is_hidden = 1"
      ).run(payload.videoId);
    } else {
      db2.prepare("DELETE FROM private_items WHERE video_id = ?").run(payload.videoId);
    }
    return { ok: true };
  });
  require$$1.ipcMain.handle("library/delete", async (_event, payload) => {
    if (!payload?.videoId) {
      return { ok: false, error: "missing_video" };
    }
    const row = db2.prepare("SELECT file_path FROM videos WHERE id = ?").get(payload.videoId);
    if (!row?.file_path) {
      return { ok: false, error: "file_not_found" };
    }
    const secureDelete = isSecureDeleteEnabled();
    try {
      await removeFile(row.file_path, secureDelete);
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to delete file." };
    }
    db2.prepare("DELETE FROM video_tags WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM tag_events WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM video_frames WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM video_embeddings WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM private_items WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM watch_history WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM collection_videos WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM jobs WHERE video_id = ?").run(payload.videoId);
    db2.prepare("UPDATE downloads SET video_id = NULL WHERE video_id = ?").run(payload.videoId);
    db2.prepare("DELETE FROM videos WHERE id = ?").run(payload.videoId);
    return { ok: true, removedPath: row.file_path };
  });
  const metadataService = new MetadataService();
  const importExportService = new ImportExportService(db2, metadataService);
  require$$1.ipcMain.handle("library/select-import-files", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Video Files",
          extensions: ["mp4", "mkv", "mov", "webm", "avi", "flv", "m4v", "wmv", "mpg", "mpeg"]
        }
      ]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, paths: result.filePaths };
  });
  require$$1.ipcMain.handle(
    "library/export-videos",
    async (event, payload) => {
      if (!payload?.videoIds?.length || !payload.destinationDir) {
        return { ok: false, error: "Missing required parameters" };
      }
      const sender = event.sender;
      try {
        const result = await importExportService.exportVideos(
          { videoIds: payload.videoIds, destinationDir: payload.destinationDir },
          (progress) => {
            sender.send("library/import-export-event", {
              operationType: "export",
              ...progress
            });
          }
        );
        return {
          ok: true,
          exportedCount: result.exportedCount,
          failedCount: result.failedCount,
          errors: result.errors
        };
      } catch (error2) {
        return { ok: false, error: error2 instanceof Error ? error2.message : "Export failed" };
      }
    }
  );
  require$$1.ipcMain.handle(
    "library/import-videos",
    async (event, payload) => {
      if (!payload?.filePaths?.length) {
        return { ok: false, error: "No files provided" };
      }
      const libraryDir = getSetting(db2, "library_import_folder") ?? getSetting(db2, "download_path") ?? getDefaultDownloadPath();
      const sender = event.sender;
      try {
        const result = await importExportService.importVideos(
          { filePaths: payload.filePaths, libraryDir },
          (progress) => {
            sender.send("library/import-export-event", {
              operationType: "import",
              ...progress
            });
          }
        );
        return {
          ok: true,
          importedCount: result.importedCount,
          skippedCount: result.skippedCount,
          failedCount: result.failedCount,
          errors: result.errors
        };
      } catch (error2) {
        return { ok: false, error: error2 instanceof Error ? error2.message : "Import failed" };
      }
    }
  );
}
function getDefaultDownloadPath() {
  return require$$1.app.getPath("downloads");
}
async function removeFile(filePath, secureDelete) {
  if (!secureDelete) {
    try {
      await promises.unlink(filePath);
    } catch (error2) {
      if (isMissingFileError(error2)) {
        return;
      }
      throw error2;
    }
    return;
  }
  let info;
  try {
    info = await promises.stat(filePath);
  } catch (error2) {
    if (isMissingFileError(error2)) {
      return;
    }
    throw error2;
  }
  if (info.size <= 0) {
    try {
      await promises.unlink(filePath);
    } catch (error2) {
      if (isMissingFileError(error2)) {
        return;
      }
      throw error2;
    }
    return;
  }
  const handle = await promises.open(filePath, "r+");
  const buffer = Buffer.alloc(1024 * 1024);
  let offset = 0;
  try {
    while (offset < info.size) {
      const chunkSize = Math.min(buffer.length, info.size - offset);
      require$$1$1.randomFillSync(buffer, 0, chunkSize);
      await handle.write(buffer, 0, chunkSize, offset);
      offset += chunkSize;
    }
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await promises.unlink(filePath);
  } catch (error2) {
    if (isMissingFileError(error2)) {
      return;
    }
    throw error2;
  }
}
function isMissingFileError(error2) {
  return typeof error2 === "object" && error2 !== null && "code" in error2 && error2.code === "ENOENT";
}
function formatVttTimestamp(seconds) {
  const safe = Math.max(0, seconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor(safe % 3600 / 60);
  const secs = Math.floor(safe % 60);
  const ms2 = Math.floor((safe - Math.floor(safe)) * 1e3);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms2).padStart(3, "0")}`;
}
function buildSingleCueVtt(transcript, duration) {
  const end = formatVttTimestamp(duration);
  return `WEBVTT

00:00:00.000 --> ${end}
${transcript.trim()}
`;
}
class FfmpegService {
  constructor() {
    this.logger = new Logger("FfmpegService");
  }
  async transcode(request) {
    const binaryPath = resolveBundledBinary("ffmpeg");
    this.logger.info("transcode requested", { input: request.inputPath, output: request.outputPath });
    try {
      node_fs.accessSync(binaryPath, node_fs.constants.X_OK);
    } catch (error2) {
      throw new Error(`ffmpeg not executable at ${binaryPath}`);
    }
    await new Promise((resolve, reject) => {
      if (request.signal?.aborted) {
        const error2 = new Error("canceled");
        error2.name = "AbortError";
        reject(error2);
        return;
      }
      const child = require$$0$1.spawn(
        binaryPath,
        ["-y", "-i", request.inputPath, ...request.args, "-progress", "pipe:1", "-nostats", request.outputPath],
        {
          stdio: "pipe"
        }
      );
      let stderr = "";
      let stdoutBuffer = "";
      let settled = false;
      const finalize = (error2) => {
        if (settled) {
          return;
        }
        settled = true;
        if (request.signal) {
          request.signal.removeEventListener("abort", onAbort);
        }
        if (error2) {
          reject(error2);
        } else {
          resolve();
        }
      };
      const onAbort = () => {
        child.kill();
        const error2 = new Error("canceled");
        error2.name = "AbortError";
        finalize(error2);
      };
      if (request.signal) {
        request.signal.addEventListener("abort", onAbort, { once: true });
      }
      child.stdout.on("data", (chunk) => {
        stdoutBuffer += chunk.toString();
        const lines = stdoutBuffer.split("\n");
        stdoutBuffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }
          const [key, value] = trimmed.split("=");
          if (!value) {
            continue;
          }
          if (key === "out_time_ms") {
            const outTimeMs = Number.parseInt(value, 10);
            if (Number.isFinite(outTimeMs)) {
              request.onProgress?.(Math.floor(outTimeMs / 1e3));
            }
          } else if (key === "out_time") {
            const outTimeMs = this.parseOutTime(value);
            if (outTimeMs !== null) {
              request.onProgress?.(outTimeMs);
            }
          }
        }
      });
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        request.onLog?.(text);
        stderr += text;
        if (stderr.length > 8e3) {
          stderr = stderr.slice(-8e3);
        }
      });
      child.on("error", (error2) => {
        finalize(error2);
      });
      child.on("close", (code) => {
        if (code === 0) {
          finalize();
        } else {
          finalize(new Error(stderr || `ffmpeg exited with code ${code ?? "unknown"}`));
        }
      });
    });
  }
  parseOutTime(value) {
    const parts = value.trim().split(":");
    if (parts.length !== 3) {
      return null;
    }
    const [hours, minutes, secondsRaw] = parts;
    const seconds = Number.parseFloat(secondsRaw);
    const hrs = Number.parseInt(hours, 10);
    const mins = Number.parseInt(minutes, 10);
    if (!Number.isFinite(seconds) || !Number.isFinite(hrs) || !Number.isFinite(mins)) {
      return null;
    }
    return Math.max(0, (hrs * 3600 + mins * 60 + seconds) * 1e3);
  }
}
const presets = [
  {
    id: "source-copy",
    label: "Source Copy",
    description: "Fastest option, keeps original codecs and quality.",
    ffmpegArgs: ["-c", "copy"]
  },
  {
    id: "balanced-h264",
    label: "Balanced H.264",
    description: "Great quality/size tradeoff for sharing and archiving.",
    ffmpegArgs: ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "192k"],
    outputExtension: ".mp4"
  },
  {
    id: "high-quality-h264",
    label: "High Quality H.264",
    description: "Larger files with minimal compression artifacts.",
    ffmpegArgs: ["-c:v", "libx264", "-preset", "slow", "-crf", "18", "-c:a", "aac", "-b:a", "320k"],
    outputExtension: ".mp4"
  },
  {
    id: "small-file-h264",
    label: "Small File H.264",
    description: "Aggressive compression for smaller storage.",
    ffmpegArgs: ["-c:v", "libx264", "-preset", "fast", "-crf", "28", "-c:a", "aac", "-b:a", "128k"],
    outputExtension: ".mp4"
  },
  {
    id: "h265-efficient",
    label: "Efficient H.265",
    description: "Smaller files with more CPU usage on playback.",
    ffmpegArgs: ["-c:v", "libx265", "-preset", "medium", "-crf", "28", "-c:a", "aac", "-b:a", "192k"],
    outputExtension: ".mp4"
  },
  {
    id: "youtube-1080p",
    label: "YouTube 1080p",
    description: "1080p H.264 at streaming-friendly bitrates.",
    ffmpegArgs: [
      "-vf",
      "scale=-2:1080",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-b:a",
      "192k"
    ],
    outputExtension: ".mp4"
  },
  {
    id: "tiktok-vertical",
    label: "TikTok Vertical",
    description: "Portrait crop and resize for vertical platforms.",
    ffmpegArgs: [
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "22",
      "-c:a",
      "aac",
      "-b:a",
      "160k"
    ],
    outputExtension: ".mp4"
  }
];
const execFileAsync = require$$0$2.promisify(require$$0$1.execFile);
async function detectHWAccelerators(ffmpegPath) {
  const platform2 = os$1.platform();
  const available = ["none"];
  let gpuVendor = null;
  let gpuModel = null;
  try {
    const { stdout } = await execFileAsync(ffmpegPath, ["-hide_banner", "-encoders"], {
      timeout: 1e4
    });
    const encoderList = stdout.toLowerCase();
    if (platform2 === "darwin") {
      if (encoderList.includes("h264_videotoolbox") || encoderList.includes("hevc_videotoolbox")) {
        available.push("videotoolbox");
        gpuVendor = "Apple";
        gpuModel = await detectMacGPU();
      }
    } else if (platform2 === "win32" || platform2 === "linux") {
      if (encoderList.includes("h264_nvenc") || encoderList.includes("hevc_nvenc")) {
        available.push("nvenc");
        gpuVendor = "NVIDIA";
        gpuModel = await detectNvidiaGPU();
      }
      if (encoderList.includes("h264_amf") || encoderList.includes("hevc_amf")) {
        available.push("amf");
        if (!gpuVendor) {
          gpuVendor = "AMD";
          gpuModel = await detectAMDGPU();
        }
      }
      if (encoderList.includes("h264_qsv") || encoderList.includes("hevc_qsv")) {
        available.push("qsv");
        if (!gpuVendor) {
          gpuVendor = "Intel";
        }
      }
    }
  } catch (error2) {
    console.warn("HW acceleration detection failed:", error2);
  }
  const recommended = getRecommendedAccelerator(available, platform2);
  const cpuCapabilities = await detectCPUSIMDCapabilities();
  return {
    available,
    recommended,
    platform: platform2,
    gpuVendor,
    gpuModel,
    cpuCapabilities
  };
}
function getRecommendedAccelerator(available, platform2) {
  if (platform2 === "darwin" && available.includes("videotoolbox")) {
    return "videotoolbox";
  }
  if (available.includes("nvenc")) {
    return "nvenc";
  }
  if (available.includes("amf")) {
    return "amf";
  }
  if (available.includes("qsv")) {
    return "qsv";
  }
  return "none";
}
async function detectMacGPU() {
  try {
    const { stdout } = await execFileAsync("system_profiler", ["SPDisplaysDataType", "-json"], {
      timeout: 5e3
    });
    const data = JSON.parse(stdout);
    const displays = data.SPDisplaysDataType;
    if (displays && displays.length > 0) {
      return displays[0].sppci_model || displays[0]._name || null;
    }
  } catch {
  }
  return null;
}
async function detectNvidiaGPU() {
  try {
    const { stdout } = await execFileAsync("nvidia-smi", ["--query-gpu=name", "--format=csv,noheader"], {
      timeout: 5e3
    });
    return stdout.trim().split("\n")[0] || null;
  } catch {
  }
  return null;
}
async function detectAMDGPU() {
  if (os$1.platform() !== "win32") return null;
  try {
    const { stdout } = await execFileAsync("wmic", ["path", "win32_VideoController", "get", "name"], {
      timeout: 5e3
    });
    const lines = stdout.trim().split("\n").filter((l) => l.trim() && !l.includes("Name"));
    const amdGpu = lines.find((l) => l.toLowerCase().includes("amd") || l.toLowerCase().includes("radeon"));
    return amdGpu?.trim() || null;
  } catch {
  }
  return null;
}
async function detectCPUSIMDCapabilities() {
  const platform2 = os$1.platform();
  const capabilities = {
    // x86
    sse: false,
    sse2: false,
    sse3: false,
    ssse3: false,
    sse41: false,
    sse42: false,
    avx: false,
    avx2: false,
    avx512: false,
    // ARM
    neon: false,
    sve: false,
    sve2: false,
    // Info
    cpuModel: null,
    architecture: "unknown"
  };
  try {
    if (platform2 === "win32") {
      await detectWindowsCPUCapabilities(capabilities);
    } else if (platform2 === "linux") {
      await detectLinuxCPUCapabilities(capabilities);
    } else if (platform2 === "darwin") {
      await detectMacOSCPUCapabilities(capabilities);
    }
  } catch (error2) {
    console.warn("CPU SIMD detection failed:", error2);
    return null;
  }
  return capabilities;
}
async function detectWindowsCPUCapabilities(capabilities) {
  try {
    const { stdout: cpuName } = await execFileAsync("wmic", ["cpu", "get", "name"], {
      timeout: 5e3
    });
    const lines = cpuName.trim().split("\n").filter((l) => l.trim() && !l.includes("Name"));
    capabilities.cpuModel = lines[0]?.trim() || null;
  } catch {
  }
  try {
    const { stdout: psOutput } = await execFileAsync("powershell", [
      "-NoProfile",
      "-Command",
      `
      $cpu = Get-CimInstance -ClassName Win32_Processor
      $procName = $cpu.Name.ToLower()

      # Conservative heuristics for AVX-512 capable CPUs
      # Intel: Only specific generations have AVX-512 enabled
      #   - Ice Lake (10th gen mobile): i[3579]-10xxGx patterns
      #   - Tiger Lake (11th gen mobile): i[3579]-11xxGx patterns
      #   - Rocket Lake (11th gen desktop): i[3579]-11xxx (non-G suffix)
      #   - Xeon Scalable (various gens), Xeon W
      # Note: Intel 12th+ gen (Alder Lake, Raptor Lake) had AVX-512 disabled via microcode
      # AMD: Zen 4+ (Ryzen 7000/8000/9000 series, EPYC Genoa)

      $hasAVX512 = $false

      # Intel 10th gen mobile (Ice Lake) - pattern: i7-1065G7, i5-1035G1, etc.
      if ($procName -match 'i[3579]-10[0-9]{2}g') { $hasAVX512 = $true }

      # Intel 11th gen (Tiger Lake mobile + Rocket Lake desktop)
      if ($procName -match 'i[3579]-11[0-9]{2,3}') { $hasAVX512 = $true }

      # Intel Xeon W series (various generations with AVX-512)
      if ($procName -match 'xeon.*w-[0-9]{4,5}') { $hasAVX512 = $true }

      # Intel Xeon Scalable (Gold, Platinum, Silver, Bronze)
      if ($procName -match 'xeon.*(gold|platinum|silver|bronze)') { $hasAVX512 = $true }

      # Intel Xeon with 4-5 digit model numbers (Scalable, etc.)
      if ($procName -match 'xeon.*[0-9]{4,5}' -and $procName -notmatch 'e[357]-') { $hasAVX512 = $true }

      # AMD Ryzen 7000 series (Zen 4) - pattern: Ryzen 5 7600, Ryzen 9 7950X, etc.
      if ($procName -match 'ryzen.*[3579].*7[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen 8000 series (Zen 4 APUs, e.g., 8700G)
      if ($procName -match 'ryzen.*[3579].*8[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen 9000 series (Zen 5)
      if ($procName -match 'ryzen.*[3579].*9[0-9]{3}') { $hasAVX512 = $true }

      # AMD Ryzen AI 300 series (Strix Point, Zen 5)
      if ($procName -match 'ryzen.*ai.*3[0-9]{2}') { $hasAVX512 = $true }

      # AMD EPYC 9000 series (Genoa, Zen 4)
      if ($procName -match 'epyc.*9[0-9]{3}') { $hasAVX512 = $true }

      # AMD EPYC 8000 series (Siena, Zen 4c)
      if ($procName -match 'epyc.*8[0-9]{3}') { $hasAVX512 = $true }

      Write-Output "MODEL:$($cpu.Name)"
      Write-Output "AVX512:$hasAVX512"
      `
    ], { timeout: 1e4 });
    const modelMatch = psOutput.match(/MODEL:(.+)/i);
    if (modelMatch && !capabilities.cpuModel) {
      capabilities.cpuModel = modelMatch[1].trim();
    }
    if (psOutput.toLowerCase().includes("avx512:true")) {
      capabilities.avx512 = true;
    }
  } catch {
    console.warn("PowerShell CPU detection failed, using baseline assumptions");
  }
  const arch = os$1.arch();
  if (arch === "arm64") {
    capabilities.architecture = "arm64";
    capabilities.neon = true;
    capabilities.sse = false;
    capabilities.sse2 = false;
    capabilities.sse3 = false;
    capabilities.ssse3 = false;
    capabilities.sse41 = false;
    capabilities.sse42 = false;
    capabilities.avx = false;
    capabilities.avx2 = false;
    capabilities.avx512 = false;
  } else {
    capabilities.architecture = "x86_64";
    capabilities.sse = true;
    capabilities.sse2 = true;
    capabilities.sse3 = true;
    capabilities.ssse3 = true;
    capabilities.sse41 = true;
    capabilities.sse42 = true;
    capabilities.avx = true;
    capabilities.avx2 = true;
  }
}
async function detectLinuxCPUCapabilities(capabilities) {
  const { stdout } = await execFileAsync("cat", ["/proc/cpuinfo"], {
    timeout: 5e3
  });
  const arch = os$1.arch();
  const isARM = arch === "arm64" || arch === "aarch64";
  if (isARM) {
    capabilities.architecture = "arm64";
    const modelMatch = stdout.match(/model name\s*:\s*(.+)/i) || stdout.match(/Hardware\s*:\s*(.+)/i) || stdout.match(/CPU implementer\s*:\s*(.+)/i);
    capabilities.cpuModel = modelMatch ? modelMatch[1].trim() : null;
    const featuresMatch = stdout.match(/^Features\s*:\s*(.+)$/im);
    if (featuresMatch) {
      const features = ` ${featuresMatch[1].toLowerCase()} `;
      capabilities.neon = / asimd /.test(features) || / neon /.test(features);
      if (!capabilities.neon) {
        capabilities.neon = true;
      }
      capabilities.sve = / sve /.test(features);
      capabilities.sve2 = / sve2 /.test(features);
    } else {
      capabilities.neon = true;
    }
    if (!capabilities.cpuModel) {
      try {
        const { stdout: lscpuOut } = await execFileAsync("lscpu", [], { timeout: 3e3 });
        const modelNameMatch = lscpuOut.match(/Model name:\s*(.+)/i);
        if (modelNameMatch) {
          capabilities.cpuModel = modelNameMatch[1].trim();
        }
      } catch {
      }
    }
  } else {
    capabilities.architecture = "x86_64";
    const modelMatch = stdout.match(/model name\s*:\s*(.+)/i);
    capabilities.cpuModel = modelMatch ? modelMatch[1].trim() : null;
    const flagsMatch = stdout.match(/^flags\s*:\s*(.+)$/im);
    if (flagsMatch) {
      const flags = ` ${flagsMatch[1].toLowerCase()} `;
      capabilities.sse = / sse /.test(flags);
      capabilities.sse2 = / sse2 /.test(flags);
      capabilities.sse3 = / sse3 /.test(flags) || / pni /.test(flags);
      capabilities.ssse3 = / ssse3 /.test(flags);
      capabilities.sse41 = / sse4_1 /.test(flags);
      capabilities.sse42 = / sse4_2 /.test(flags);
      capabilities.avx = / avx /.test(flags);
      capabilities.avx2 = / avx2 /.test(flags);
      capabilities.avx512 = /avx512/.test(flags);
    }
  }
}
async function detectMacOSCPUCapabilities(capabilities) {
  try {
    const { stdout: archOutput } = await execFileAsync("uname", ["-m"], { timeout: 2e3 });
    const isAppleSilicon = archOutput.trim().toLowerCase() === "arm64";
    if (isAppleSilicon) {
      capabilities.architecture = "arm64";
      try {
        const { stdout: brandOutput } = await execFileAsync(
          "sysctl",
          ["-n", "machdep.cpu.brand_string"],
          { timeout: 2e3 }
        );
        capabilities.cpuModel = brandOutput.trim() || "Apple Silicon";
      } catch {
        try {
          const { stdout: chipOutput } = await execFileAsync(
            "sysctl",
            ["-n", "hw.chip"],
            { timeout: 2e3 }
          );
          capabilities.cpuModel = chipOutput.trim() || "Apple Silicon";
        } catch {
          capabilities.cpuModel = "Apple Silicon";
        }
      }
      capabilities.neon = true;
      capabilities.sve = false;
      capabilities.sve2 = false;
      return;
    }
  } catch {
  }
  capabilities.architecture = "x86_64";
  try {
    const { stdout: brandOutput } = await execFileAsync(
      "sysctl",
      ["-n", "machdep.cpu.brand_string"],
      { timeout: 2e3 }
    );
    capabilities.cpuModel = brandOutput.trim();
  } catch {
  }
  try {
    const { stdout: featuresOutput } = await execFileAsync(
      "sysctl",
      ["-n", "machdep.cpu.features"],
      { timeout: 2e3 }
    );
    const features = ` ${featuresOutput.toLowerCase()} `;
    capabilities.sse = features.includes("sse");
    capabilities.sse2 = features.includes("sse2");
    capabilities.sse3 = features.includes("sse3");
    capabilities.ssse3 = features.includes("ssse3") || features.includes("supplementalsse3");
    capabilities.sse41 = features.includes("sse4.1");
    capabilities.sse42 = features.includes("sse4.2");
    capabilities.avx = features.includes("avx1.0") || / avx /.test(features);
  } catch {
  }
  try {
    const { stdout: leaf7Output } = await execFileAsync(
      "sysctl",
      ["-n", "machdep.cpu.leaf7_features"],
      { timeout: 2e3 }
    );
    const leaf7 = leaf7Output.toLowerCase();
    capabilities.avx2 = leaf7.includes("avx2");
    capabilities.avx512 = leaf7.includes("avx512");
  } catch {
  }
}
function buildFFmpegArgs(inputPath, outputPath, config, sourceInfo) {
  const args = [];
  const hwAccelInput = getHWAccelInputArgs(config.hwAccel);
  args.push(...hwAccelInput);
  args.push("-i", inputPath);
  const filters = buildVideoFilters(config);
  if (filters.length > 0) {
    args.push("-vf", filters.join(","));
  }
  if (config.videoCodec === "copy") {
    args.push("-c:v", "copy");
  } else {
    const videoCodecArgs = buildVideoCodecArgs(config);
    args.push(...videoCodecArgs);
  }
  if (config.audioCodec === "none") {
    args.push("-an");
  } else if (config.audioCodec === "copy") {
    args.push("-c:a", "copy");
  } else {
    const audioArgs = buildAudioArgs$1(config);
    args.push(...audioArgs);
  }
  if (config.container === "mp4" && config.fastStart) {
    args.push("-movflags", "+faststart");
  }
  if (config.frameRate !== "source") {
    const fps = config.frameRate === "custom" ? config.customFrameRate : parseInt(config.frameRate);
    if (fps) {
      args.push("-r", fps.toString());
    }
  }
  args.push("-y");
  args.push(outputPath);
  return args;
}
function getHWAccelInputArgs(hwAccel) {
  switch (hwAccel) {
    case "videotoolbox":
      return ["-hwaccel", "videotoolbox"];
    case "nvenc":
      return ["-hwaccel", "cuda"];
    case "amf":
      return ["-hwaccel", "dxva2"];
    case "qsv":
      return ["-hwaccel", "qsv"];
    default:
      return [];
  }
}
function buildVideoCodecArgs(config) {
  const args = [];
  const encoder = getEncoderName(config.videoCodec, config.hwAccel);
  args.push("-c:v", encoder);
  if (config.profile && (config.videoCodec === "h264" || config.videoCodec === "h265")) {
    if (config.hwAccel === "none") {
      args.push("-profile:v", config.profile);
    }
  }
  if (config.hwAccel === "none") {
    args.push("-preset", config.encodingSpeed);
  } else if (config.hwAccel === "nvenc") {
    const nvencPreset = mapToNVENCPreset(config.encodingSpeed);
    args.push("-preset", nvencPreset);
  } else if (config.hwAccel === "videotoolbox") ;
  if (config.bitrateMode === "crf") {
    if (config.hwAccel === "none") {
      args.push("-crf", config.crf.toString());
    } else if (config.hwAccel === "nvenc") {
      args.push("-cq", config.crf.toString());
      args.push("-rc", "vbr");
    } else if (config.hwAccel === "videotoolbox") {
      const vtQuality = Math.max(0, Math.min(100, 100 - config.crf * 2));
      args.push("-q:v", vtQuality.toString());
    } else if (config.hwAccel === "amf") {
      args.push("-quality", "quality");
      args.push("-rc", "cqp");
      args.push("-qp_i", config.crf.toString());
      args.push("-qp_p", (config.crf + 2).toString());
    }
  } else if (config.bitrateMode === "cbr" && config.targetBitrate) {
    args.push("-b:v", `${config.targetBitrate}k`);
    args.push("-maxrate", `${config.targetBitrate}k`);
    args.push("-bufsize", `${config.targetBitrate * 2}k`);
  } else if (config.bitrateMode === "vbr" && config.targetBitrate) {
    args.push("-b:v", `${config.targetBitrate}k`);
    if (config.maxBitrate) {
      args.push("-maxrate", `${config.maxBitrate}k`);
      args.push("-bufsize", `${config.maxBitrate * 2}k`);
    }
  }
  if (config.profile === "high10" || config.profile === "main10") {
    args.push("-pix_fmt", "yuv420p10le");
  } else if (config.videoCodec !== "prores") {
    args.push("-pix_fmt", "yuv420p");
  }
  return args;
}
function getEncoderName(codec, hwAccel) {
  const encoderMap = {
    h264: {
      none: "libx264",
      videotoolbox: "h264_videotoolbox",
      nvenc: "h264_nvenc",
      amf: "h264_amf",
      qsv: "h264_qsv"
    },
    h265: {
      none: "libx265",
      videotoolbox: "hevc_videotoolbox",
      nvenc: "hevc_nvenc",
      amf: "hevc_amf",
      qsv: "hevc_qsv"
    },
    vp9: {
      none: "libvpx-vp9",
      videotoolbox: "libvpx-vp9",
      nvenc: "libvpx-vp9",
      amf: "libvpx-vp9",
      qsv: "libvpx-vp9"
    },
    av1: {
      none: "libsvtav1",
      videotoolbox: "libsvtav1",
      nvenc: "av1_nvenc",
      // Only on RTX 40 series
      amf: "libsvtav1",
      qsv: "av1_qsv"
    },
    prores: {
      none: "prores_ks",
      videotoolbox: "prores_videotoolbox",
      nvenc: "prores_ks",
      amf: "prores_ks",
      qsv: "prores_ks"
    },
    copy: {
      none: "copy",
      videotoolbox: "copy",
      nvenc: "copy",
      amf: "copy",
      qsv: "copy"
    }
  };
  return encoderMap[codec][hwAccel] || encoderMap[codec].none;
}
function mapToNVENCPreset(speed) {
  const map2 = {
    ultrafast: "p1",
    superfast: "p2",
    veryfast: "p3",
    faster: "p4",
    fast: "p5",
    medium: "p5",
    slow: "p6",
    slower: "p7",
    veryslow: "p7",
    placebo: "p7"
  };
  return map2[speed] || "p5";
}
function buildVideoFilters(config, sourceInfo) {
  const filters = [];
  if (config.filters.deinterlace) {
    filters.push("yadif=mode=0:parity=-1:deint=0");
  }
  if (config.cropMode !== "none") {
    const cropFilter = buildCropFilter(config);
    if (cropFilter) {
      filters.push(cropFilter);
    }
  }
  const scaleFilter = buildScaleFilter(config);
  if (scaleFilter) {
    filters.push(scaleFilter);
  }
  if (config.filters.denoise !== "none") {
    const denoiseStrength = { light: "3:3:2:2", medium: "5:5:4:4", heavy: "8:8:6:6" };
    filters.push(`hqdn3d=${denoiseStrength[config.filters.denoise]}`);
  }
  if (config.filters.sharpen !== "none") {
    const sharpenStrength = { light: "0.5", medium: "1.0", strong: "1.5" };
    filters.push(`unsharp=5:5:${sharpenStrength[config.filters.sharpen]}:5:5:0`);
  }
  const { brightness, contrast, saturation, gamma } = config.filters;
  if (brightness !== 0 || contrast !== 1 || saturation !== 1 || gamma !== 1) {
    const eqParts = [];
    if (brightness !== 0) eqParts.push(`brightness=${brightness}`);
    if (contrast !== 1) eqParts.push(`contrast=${contrast}`);
    if (saturation !== 1) eqParts.push(`saturation=${saturation}`);
    if (gamma !== 1) eqParts.push(`gamma=${gamma}`);
    if (eqParts.length > 0) {
      filters.push(`eq=${eqParts.join(":")}`);
    }
  }
  if (config.filters.speed !== 1) {
    filters.push(`setpts=${1 / config.filters.speed}*PTS`);
  }
  return filters;
}
function buildCropFilter(config, sourceInfo) {
  if (config.cropMode === "auto") {
    return "cropdetect=24:16:0";
  }
  if (config.cropMode === "custom" && config.customCrop) {
    const { x, y, width, height } = config.customCrop;
    return `crop=${width}:${height}:${x}:${y}`;
  }
  const aspectRatios = {
    "16:9": 16 / 9,
    "4:3": 4 / 3,
    "1:1": 1,
    "9:16": 9 / 16,
    "21:9": 21 / 9
  };
  aspectRatios[config.cropMode];
  return null;
}
function buildScaleFilter(config, sourceInfo) {
  if (config.resolution === "source") {
    return null;
  }
  let targetWidth;
  if (config.resolution === "custom") {
    if (!config.customWidth || !config.customHeight) return null;
    targetWidth = config.customWidth;
    config.customHeight;
  } else {
    const preset = {
      "4k": { width: 3840, height: 2160 },
      "1440p": { width: 2560, height: 1440 },
      "1080p": { width: 1920, height: 1080 },
      "720p": { width: 1280, height: 720 },
      "480p": { width: 854, height: 480 },
      "360p": { width: 640, height: 360 }
    }[config.resolution];
    if (!preset) return null;
    targetWidth = preset.width;
    preset.height;
  }
  const scaleFlags = {
    lanczos: "lanczos",
    bicubic: "bicubic",
    bilinear: "bilinear",
    neighbor: "neighbor",
    spline: "spline"
  };
  const flags = scaleFlags[config.scalingAlgorithm] || "lanczos";
  return `scale=${targetWidth}:-2:flags=${flags}`;
}
function buildAudioArgs$1(config) {
  const args = [];
  const audioEncoders = {
    aac: "aac",
    mp3: "libmp3lame",
    opus: "libopus",
    flac: "flac"
  };
  args.push("-c:a", audioEncoders[config.audioCodec] || "aac");
  if (config.audioCodec !== "flac" && config.audioBitrate > 0) {
    args.push("-b:a", `${config.audioBitrate}k`);
  }
  if (config.audioChannels !== "copy") {
    const channelMap = {
      mono: "1",
      stereo: "2",
      "5.1": "6"
    };
    args.push("-ac", channelMap[config.audioChannels] || "2");
  }
  args.push("-ar", config.audioSampleRate.toString());
  const audioFilters = [];
  if (config.normalizeAudio) {
    audioFilters.push("loudnorm=I=-16:TP=-1.5:LRA=11");
  }
  if (config.filters.speed !== 1) {
    const audioSpeed = config.filters.speed;
    if (audioSpeed >= 0.5 && audioSpeed <= 2) {
      audioFilters.push(`atempo=${audioSpeed}`);
    } else if (audioSpeed < 0.5) {
      const tempo1 = 0.5;
      const tempo2 = audioSpeed / 0.5;
      audioFilters.push(`atempo=${tempo1}`, `atempo=${tempo2}`);
    } else {
      const tempo1 = 2;
      const tempo2 = audioSpeed / 2;
      audioFilters.push(`atempo=${tempo1}`, `atempo=${tempo2}`);
    }
  }
  if (audioFilters.length > 0) {
    args.push("-af", audioFilters.join(","));
  }
  return args;
}
class FrameExtractorService {
  constructor() {
    this.ffmpegPath = resolveBundledBinary("ffmpeg");
    this.ffprobePath = resolveBundledBinary("ffprobe");
  }
  async extractFrames(videoPath, videoId, options = {}) {
    const opts = {
      maxFrames: 30,
      sceneChangeThreshold: 0.3,
      minIntervalMs: 1e3,
      outputDir: require$$0.join(require$$1.app.getPath("userData"), "frames", videoId),
      ...options
    };
    await promises.mkdir(opts.outputDir, { recursive: true });
    const duration = await this.getVideoDuration(videoPath);
    let frames = await this.extractWithSceneDetection(videoPath, opts);
    if (frames.length < opts.maxFrames / 2) {
      const existingTimestamps = new Set(frames.map((f) => f.timestampMs));
      const uniformFrames = await this.extractUniformSamples(
        videoPath,
        opts,
        duration,
        opts.maxFrames - frames.length,
        existingTimestamps
      );
      frames = [...frames, ...uniformFrames];
    }
    frames.sort((a, b) => a.timestampMs - b.timestampMs);
    return frames.slice(0, opts.maxFrames).map((frame, index) => ({
      ...frame,
      index
    }));
  }
  async getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
      const proc = require$$0$1.spawn(this.ffprobePath, [
        "-v",
        "quiet",
        "-show_entries",
        "format=duration",
        "-of",
        "json",
        videoPath
      ]);
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      proc.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
          return;
        }
        try {
          const data = JSON.parse(stdout);
          const duration = parseFloat(data.format?.duration || "0");
          resolve(duration * 1e3);
        } catch (e) {
          reject(new Error(`Failed to parse ffprobe output: ${e}`));
        }
      });
      proc.on("error", reject);
    });
  }
  async extractWithSceneDetection(videoPath, opts) {
    const outputPattern = require$$0.join(opts.outputDir, "scene_%04d.jpg");
    const selectFilter = `select='gt(scene,${opts.sceneChangeThreshold})',scale='min(1280,iw):-2',showinfo`;
    const args = [
      "-i",
      videoPath,
      "-vf",
      selectFilter,
      "-vsync",
      "vfr",
      "-q:v",
      "3",
      // Slightly lower quality for smaller file size
      "-frames:v",
      String(opts.maxFrames),
      outputPattern
    ];
    return new Promise((resolve, reject) => {
      const proc = require$$0$1.spawn(this.ffmpegPath, args);
      const frames = [];
      let frameIndex = 0;
      let stderrBuffer = "";
      proc.stderr.on("data", (data) => {
        stderrBuffer += data.toString();
        const lines = stderrBuffer.split("\n");
        stderrBuffer = lines.pop() || "";
        for (const line of lines) {
          const ptsMatch = line.match(/pts_time:([\d.]+)/);
          if (ptsMatch) {
            const timestampSec = parseFloat(ptsMatch[1]);
            frameIndex++;
            frames.push({
              index: frameIndex - 1,
              timestampMs: Math.round(timestampSec * 1e3),
              filePath: require$$0.join(opts.outputDir, `scene_${String(frameIndex).padStart(4, "0")}.jpg`)
            });
          }
        }
      });
      proc.on("close", () => {
        resolve(frames);
      });
      proc.on("error", (err) => {
        console.warn("Scene detection failed:", err);
        resolve([]);
      });
    });
  }
  async extractUniformSamples(videoPath, opts, durationMs, count, existingTimestamps) {
    const frames = [];
    if (count <= 0 || durationMs <= 0) {
      return frames;
    }
    const interval = durationMs / (count + 1);
    for (let i = 1; i <= count; i++) {
      const timestampMs = Math.round(i * interval);
      let tooClose = false;
      for (const existing of existingTimestamps) {
        if (Math.abs(existing - timestampMs) < opts.minIntervalMs) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      const outputPath = require$$0.join(opts.outputDir, `uniform_${String(i).padStart(4, "0")}.jpg`);
      try {
        await this.extractSingleFrame(videoPath, timestampMs, outputPath);
        frames.push({
          index: frames.length,
          timestampMs,
          filePath: outputPath
        });
        existingTimestamps.add(timestampMs);
      } catch (error2) {
        console.warn(`Failed to extract frame at ${timestampMs}ms:`, error2);
      }
    }
    return frames;
  }
  async extractSingleFrame(videoPath, timestampMs, outputPath) {
    const timestampSec = timestampMs / 1e3;
    return new Promise((resolve, reject) => {
      const proc = require$$0$1.spawn(this.ffmpegPath, [
        "-ss",
        timestampSec.toFixed(3),
        "-i",
        videoPath,
        "-vf",
        "scale='min(1280,iw):-2'",
        // Scale down large frames
        "-vframes",
        "1",
        "-q:v",
        "3",
        // Slightly lower quality for smaller file size
        "-y",
        outputPath
      ]);
      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to extract frame: ${stderr}`));
        }
      });
      proc.on("error", reject);
    });
  }
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      const proc = require$$0$1.spawn(this.ffprobePath, [
        "-v",
        "quiet",
        "-show_entries",
        "format=duration:stream=width,height,r_frame_rate,codec_name",
        "-select_streams",
        "v:0",
        "-of",
        "json",
        videoPath
      ]);
      let stdout = "";
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}`));
          return;
        }
        try {
          const data = JSON.parse(stdout);
          const stream = data.streams?.[0] || {};
          const format = data.format || {};
          let fps = 0;
          if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split("/");
            fps = den ? parseInt(num) / parseInt(den) : parseFloat(num);
          }
          resolve({
            duration: parseFloat(format.duration || "0") * 1e3,
            width: stream.width || 0,
            height: stream.height || 0,
            fps,
            codec: stream.codec_name || "unknown"
          });
        } catch (e) {
          reject(new Error(`Failed to parse ffprobe output: ${e}`));
        }
      });
      proc.on("error", reject);
    });
  }
  async cleanup(videoId) {
    const frameDir = require$$0.join(require$$1.app.getPath("userData"), "frames", videoId);
    try {
      await promises.rm(frameDir, { recursive: true, force: true });
    } catch (error2) {
      console.warn(`Failed to cleanup frames for ${videoId}:`, error2);
    }
  }
  getFramesDirectory(videoId) {
    return require$$0.join(require$$1.app.getPath("userData"), "frames", videoId);
  }
}
class LMStudioService {
  constructor(config) {
    this.config = config;
    this.logger = new Logger("LMStudioService");
  }
  async complete(request) {
    this.logger.info("lm studio completion requested", { model: request.model });
    const baseUrl = (this.config.baseUrl ?? "http://localhost:1234/v1").replace(/\/$/, "");
    let response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: request.model,
          messages: [
            request.systemPrompt ? { role: "system", content: request.systemPrompt } : null,
            { role: "user", content: request.prompt }
          ].filter(Boolean),
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxTokens ?? 512
        }),
        signal: AbortSignal.timeout(12e4)
        // 2 minute timeout
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.includes("fetch failed") || message.includes("ECONNREFUSED")) {
        throw new Error("Cannot connect to LM Studio. Make sure LM Studio is running and the server is started on port 1234.");
      }
      throw new Error(`LM Studio connection failed: ${message}`);
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LM Studio error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("LM Studio returned empty response");
    }
    return content;
  }
  async completeWithVision(request) {
    this.logger.info("lm studio vision completion requested", { model: request.model });
    const baseUrl = (this.config.baseUrl ?? "http://localhost:1234/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          request.systemPrompt ? { role: "system", content: request.systemPrompt } : null,
          { role: "user", content: request.content }
        ].filter(Boolean),
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 1024
      }),
      signal: AbortSignal.timeout(18e4)
      // 3 minute timeout for vision (images take longer)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LM Studio vision error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("LM Studio returned empty response");
    }
    return content;
  }
}
class OpenRouterService {
  constructor(config) {
    this.config = config;
    this.logger = new Logger("OpenRouterService");
  }
  async complete(request) {
    this.logger.info("openrouter completion requested", { model: request.model });
    if (!this.config.apiKey) {
      throw new Error("OpenRouter API key is not set");
    }
    const baseUrl = (this.config.baseUrl ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          request.systemPrompt ? { role: "system", content: request.systemPrompt } : null,
          { role: "user", content: request.prompt }
        ].filter(Boolean),
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 512
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenRouter returned empty response");
    }
    return content;
  }
  async completeWithVision(request) {
    this.logger.info("openrouter vision completion requested", { model: request.model });
    if (!this.config.apiKey) {
      throw new Error("OpenRouter API key is not set");
    }
    const baseUrl = (this.config.baseUrl ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          request.systemPrompt ? { role: "system", content: request.systemPrompt } : null,
          { role: "user", content: request.content }
        ].filter(Boolean),
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 1024
      }),
      signal: AbortSignal.timeout(12e4)
      // 2 minute timeout for OpenRouter
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter vision error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error("OpenRouter returned empty response");
    }
    return content;
  }
}
function createLlmProvider(provider, config) {
  if (provider === "lmstudio") {
    return new LMStudioService({ baseUrl: config.baseUrl ?? "http://localhost:1234/v1" });
  }
  return new OpenRouterService({ apiKey: config.apiKey ?? "", baseUrl: config.baseUrl });
}
function registerProcessingHandlers(deps = {}) {
  const db2 = getDatabase();
  const queue = new QueueManager(db2);
  require$$1.ipcMain.handle("processing/presets", async () => {
    return {
      ok: true,
      presets: presets.map((preset) => ({
        id: preset.id,
        label: preset.label,
        description: preset.description,
        outputExtension: preset.outputExtension ?? null
      }))
    };
  });
  require$$1.ipcMain.handle("processing/select-input", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openFile"],
      filters: [
        {
          name: "Video files",
          extensions: ["mp4", "mkv", "mov", "webm", "avi", "m4v"]
        }
      ]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: result.filePaths[0] };
  });
  require$$1.ipcMain.handle("processing/select-batch", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Video files",
          extensions: ["mp4", "mkv", "mov", "webm", "avi", "m4v"]
        }
      ]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, paths: result.filePaths };
  });
  require$$1.ipcMain.handle(
    "processing/transcode",
    async (_event, request) => {
      const inputPath = request.inputPath?.trim();
      if (!inputPath) {
        return { ok: false, error: "missing_input" };
      }
      const preset = presets.find((item) => item.id === request.presetId) ?? presets[0];
      if (!preset) {
        return { ok: false, error: "missing_preset" };
      }
      const parsed = require$$0.parse(inputPath);
      const ext = preset.outputExtension ?? (parsed.ext || ".mp4");
      const outputPath = require$$0.join(parsed.dir || require$$0.dirname(inputPath), `${parsed.name}-transcoded${ext}`);
      const jobId = require$$1$1.randomUUID();
      queue.enqueue({
        id: jobId,
        type: "transcode",
        payload: {
          inputPath,
          outputPath,
          presetId: preset.id
        },
        inputPath,
        outputPath,
        config: {
          presetId: preset.id,
          args: preset.ffmpegArgs
        }
      });
      return { ok: true, jobId, outputPath };
    }
  );
  require$$1.ipcMain.handle(
    "processing/transcribe",
    async (_event, request) => {
      const inputPath = request.inputPath?.trim();
      if (!inputPath) {
        return { ok: false, error: "missing_input" };
      }
      const modelPath = request.modelPath?.trim() ?? getSetting(db2, "whisper_model_path");
      if (!modelPath) {
        return { ok: false, error: "missing_model" };
      }
      const parsed = require$$0.parse(inputPath);
      const outputPath = require$$0.join(parsed.dir || require$$0.dirname(inputPath), `${parsed.name}.txt`);
      const jobId = require$$1$1.randomUUID();
      queue.enqueue({
        id: jobId,
        type: "transcription",
        payload: {
          inputPath,
          outputPath,
          modelPath,
          language: request.language
        },
        inputPath,
        outputPath,
        config: {
          modelPath,
          language: request.language
        }
      });
      return { ok: true, jobId, outputPath };
    }
  );
  require$$1.ipcMain.handle("processing/list", async (_event, type2) => {
    const jobType = type2 ?? "transcode";
    const rows = db2.prepare(
      "SELECT id, status, input_path, output_path, progress, created_at, updated_at, error_message, log_tail, result_json FROM jobs WHERE type = ? ORDER BY created_at DESC"
    ).all(jobType);
    const jobs = rows.map((row) => ({
      ...row,
      result_json: row.result_json ? safeParse(row.result_json) : null
    }));
    return { ok: true, jobs };
  });
  require$$1.ipcMain.handle("processing/details", async (_event, jobId) => {
    if (!jobId) {
      return { ok: false, error: "missing_job_id" };
    }
    const row = db2.prepare(
      "SELECT id, type, status, input_path, output_path, progress, created_at, updated_at, error_message, log_tail, result_json FROM jobs WHERE id = ?"
    ).get(jobId);
    if (!row) {
      return { ok: false, error: "job_not_found" };
    }
    const result = row.result_json ? safeParse(row.result_json) : null;
    return {
      ok: true,
      job: {
        ...row,
        result_json: result
      }
    };
  });
  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  require$$1.ipcMain.handle("processing/cancel", async (_event, jobId) => {
    if (!jobId) {
      return { ok: false, error: "missing_job_id" };
    }
    const job = db2.prepare("SELECT id, type, status FROM jobs WHERE id = ?").get(jobId);
    if (!job) {
      return { ok: false, error: "job_not_found" };
    }
    if (!["queued", "running"].includes(job.status)) {
      return { ok: false, error: "job_not_cancellable" };
    }
    if (job.status === "queued") {
      const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      db2.prepare("UPDATE jobs SET status = ?, updated_at = ?, error_message = ? WHERE id = ?").run("cancelled", updatedAt, "canceled_by_user", jobId);
      return { ok: true };
    }
    if (job.type === "transcode" && deps.transcodeWorker) {
      return { ok: deps.transcodeWorker.cancel(jobId) };
    }
    if (job.type === "transcription" && deps.transcriptionWorker) {
      return { ok: deps.transcriptionWorker.cancel(jobId) };
    }
    return { ok: false, error: "worker_unavailable" };
  });
  require$$1.ipcMain.handle("processing/detect-hw-accel", async () => {
    try {
      const ffmpegPath = getSetting(db2, "ffmpeg_path") || "ffmpeg";
      const result = await detectHWAccelerators(ffmpegPath);
      return {
        ok: true,
        available: result.available,
        recommended: result.recommended,
        platform: result.platform,
        gpuVendor: result.gpuVendor,
        gpuModel: result.gpuModel,
        cpuCapabilities: result.cpuCapabilities
      };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to detect hardware acceleration"
      };
    }
  });
  require$$1.ipcMain.handle(
    "processing/preview-command",
    async (_event, request) => {
      const inputPath = request.inputPath?.trim();
      if (!inputPath) {
        return { ok: false, error: "missing_input" };
      }
      const config = request.config;
      if (!config) {
        return { ok: false, error: "missing_config" };
      }
      try {
        const parsed = require$$0.parse(inputPath);
        const dir = parsed.dir || require$$0.dirname(inputPath);
        const outputPath = require$$0.join(dir, `${parsed.name}-encoded.${config.container}`);
        const args = buildFFmpegArgs(inputPath, outputPath, config);
        return { ok: true, command: args };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to build command"
        };
      }
    }
  );
  require$$1.ipcMain.handle(
    "processing/advanced-transcode",
    async (_event, request) => {
      const inputPath = request.inputPath?.trim();
      if (!inputPath) {
        return { ok: false, error: "missing_input" };
      }
      const config = request.config;
      if (!config) {
        return { ok: false, error: "missing_config" };
      }
      try {
        const parsed = require$$0.parse(inputPath);
        const outputDir = request.outputDir || parsed.dir || require$$0.dirname(inputPath);
        const outputPath = require$$0.join(outputDir, `${parsed.name}-encoded.${config.container}`);
        const ffmpegArgs = buildFFmpegArgs(inputPath, outputPath, config);
        const jobId = require$$1$1.randomUUID();
        queue.enqueue({
          id: jobId,
          type: "transcode",
          payload: {
            inputPath,
            outputPath,
            presetId: "custom",
            customArgs: ffmpegArgs
          },
          inputPath,
          outputPath,
          config: {
            presetId: "custom",
            args: ffmpegArgs.slice(ffmpegArgs.indexOf("-i") + 2)
            // Args after input
          }
        });
        return { ok: true, jobId, outputPath, ffmpegCommand: ffmpegArgs };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to queue transcode"
        };
      }
    }
  );
  const metadataService = new MetadataService();
  require$$1.ipcMain.handle("processing/probe-video", async (_event, filePath) => {
    if (!filePath?.trim()) {
      return { ok: false, error: "missing_file_path" };
    }
    try {
      const metadata = await metadataService.extract({ filePath: filePath.trim() });
      return {
        ok: true,
        metadata: {
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          frameRate: metadata.fps,
          bitrate: metadata.bitrate,
          codec: metadata.codec,
          container: metadata.container,
          fileSize: metadata.fileSize
        }
      };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to probe video"
      };
    }
  });
  const frameExtractor = new FrameExtractorService();
  require$$1.ipcMain.handle(
    "processing/analyze-video-vision",
    async (_event, request) => {
      const videoPath = request.videoPath?.trim();
      if (!videoPath) {
        return { ok: false, error: "missing_video_path" };
      }
      const maxFrames = Math.min(request.maxFrames ?? 8, 20);
      const customPrompt = request.prompt?.trim();
      const provider = getSetting(db2, "llm_provider") ?? "lmstudio";
      const apiKey = provider === "openrouter" ? getSetting(db2, "openrouter_api_key") ?? "" : "";
      const baseUrl = provider === "lmstudio" ? getSetting(db2, "lmstudio_url") ?? "http://localhost:1234/v1" : void 0;
      if (provider === "openrouter" && !apiKey) {
        return { ok: false, error: "OpenRouter API key not configured. Go to Settings to add it." };
      }
      let visionModel = request.visionModel?.trim();
      if (!visionModel) {
        if (provider === "openrouter") {
          visionModel = "anthropic/claude-3.5-sonnet";
        } else {
          visionModel = getSetting(db2, "lmstudio_model") ?? "auto";
        }
      }
      const llmClient = createLlmProvider(provider, { apiKey, baseUrl });
      if (!llmClient.completeWithVision) {
        return { ok: false, error: "Vision not supported by current LLM provider" };
      }
      const videoId = `vision_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      try {
        const frames = await frameExtractor.extractFrames(videoPath, videoId, {
          maxFrames,
          sceneChangeThreshold: 0.25,
          // Slightly lower threshold for more diverse frames
          minIntervalMs: 500
        });
        if (frames.length === 0) {
          await frameExtractor.cleanup(videoId);
          return { ok: false, error: "Failed to extract frames from video" };
        }
        const validFrames = [];
        for (const frame of frames) {
          try {
            await promises.access(frame.filePath);
            validFrames.push(frame);
          } catch {
          }
        }
        if (validFrames.length === 0) {
          await frameExtractor.cleanup(videoId);
          return { ok: false, error: "No valid frames could be extracted from video" };
        }
        const imageContents = await Promise.all(
          validFrames.map(async (frame) => {
            const buffer = await promises.readFile(frame.filePath);
            const base64 = buffer.toString("base64");
            return {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            };
          })
        );
        const systemPrompt = `You are a video analysis assistant. You will be shown ${validFrames.length} frames extracted from a video at different timestamps (in chronological order). Analyze the visual content comprehensively, paying attention to temporal progression.

Your task is to:
1. Describe what you see across all frames
2. Identify key subjects, objects, actions, and settings
3. Note any temporal patterns, scene changes, or narrative progression
4. Suggest relevant tags/keywords for categorizing this video

Be concise but thorough. Focus on factual observations.

IMPORTANT: End your response with a line starting with "Tags:" followed by comma-separated keywords.`;
        const userPrompt = customPrompt || `Analyze these ${validFrames.length} sequential frames from a video.

Provide:
1. **Description**: A brief summary of what this video shows
2. **Content**: Key subjects, objects, actions, locations, and visual elements
3. **Progression**: How the content changes or develops across frames (if applicable)
4. **Tags**: A comma-separated list of relevant keywords for categorization

Format your tags line exactly as: Tags: keyword1, keyword2, keyword3`;
        const content = [
          { type: "text", text: userPrompt },
          ...imageContents
        ];
        const response = await llmClient.completeWithVision({
          content,
          model: visionModel,
          systemPrompt,
          temperature: 0.3,
          maxTokens: 1500
        });
        await frameExtractor.cleanup(videoId);
        const tags = [];
        const tagPatterns = [
          /tags?[:\s]*([^\n]+)/i,
          /suggested tags?[:\s]*([^\n]+)/i,
          /keywords?[:\s]*([^\n]+)/i
        ];
        for (const pattern of tagPatterns) {
          const match = response.match(pattern);
          if (match) {
            const tagLine = match[1];
            tags.push(
              ...tagLine.split(/[,;]/).map((t2) => t2.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")).filter((t2) => t2.length > 1 && t2.length < 50)
            );
            break;
          }
        }
        return {
          ok: true,
          analysis: response,
          tags: [...new Set(tags)],
          // Dedupe
          framesAnalyzed: validFrames.length
        };
      } catch (error2) {
        await frameExtractor.cleanup(videoId).catch(() => {
        });
        const message = error2 instanceof Error ? error2.message : "Vision analysis failed";
        if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
          return { ok: false, error: "LLM request timed out. The model may be overloaded or the video too complex." };
        }
        if (message.includes("context") || message.includes("token")) {
          return { ok: false, error: "Too many frames for model context. Try reducing the frame count." };
        }
        return { ok: false, error: message };
      }
    }
  );
  require$$1.ipcMain.handle(
    "processing/generate-thumbnail",
    async (_event, request) => {
      const videoPath = request.videoPath?.trim();
      const videoId = request.videoId?.trim();
      if (!videoPath || !videoId) {
        return { ok: false, error: "missing_video_path_or_id" };
      }
      try {
        await promises.access(videoPath);
        const thumbDir = require$$0.join(require$$1.app.getPath("userData"), "thumbnails");
        await promises.mkdir(thumbDir, { recursive: true });
        const thumbPath = require$$0.join(thumbDir, `${videoId}.jpg`);
        try {
          await promises.access(thumbPath);
          const thumbData2 = await promises.readFile(thumbPath);
          return {
            ok: true,
            thumbnailPath: thumbPath,
            thumbnailBase64: `data:image/jpeg;base64,${thumbData2.toString("base64")}`
          };
        } catch {
        }
        let timestampMs = request.timestampMs;
        if (timestampMs == null) {
          try {
            const metadata = await frameExtractor.getVideoMetadata(videoPath);
            timestampMs = Math.round(metadata.duration * 0.1);
          } catch {
            timestampMs = 1e3;
          }
        }
        const ffmpegPath = resolveBundledBinary("ffmpeg");
        const timestampSec = timestampMs / 1e3;
        await new Promise((resolve, reject) => {
          const proc = require$$0$1.spawn(ffmpegPath, [
            "-ss",
            timestampSec.toFixed(3),
            "-i",
            videoPath,
            "-vf",
            "scale='min(480,iw):-2'",
            // Small thumbnail, max 480px width
            "-vframes",
            "1",
            "-q:v",
            "5",
            // Lower quality for smaller file
            "-y",
            thumbPath
          ]);
          let stderr = "";
          proc.stderr.on("data", (data) => {
            stderr += data.toString();
          });
          proc.on("close", (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`FFmpeg failed: ${stderr.slice(-500)}`));
            }
          });
          proc.on("error", reject);
        });
        const thumbData = await promises.readFile(thumbPath);
        return {
          ok: true,
          thumbnailPath: thumbPath,
          thumbnailBase64: `data:image/jpeg;base64,${thumbData.toString("base64")}`
        };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to generate thumbnail"
        };
      }
    }
  );
}
const DEFAULT_LMSTUDIO_URL$1 = "http://localhost:1234/v1";
const DEFAULT_LMSTUDIO_MODEL = "auto";
const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
const SUMMARY_MAX_CHARS = 8e3;
const SUMMARY_MAX_TOKENS = 480;
const TRANSCRIPT_MAX_CHARS = 12e3;
function getLlmSettings() {
  const db2 = getDatabase();
  const provider = getSetting(db2, "llm_provider") ?? "lmstudio";
  const openrouterModel = getSetting(db2, "openrouter_model") ?? DEFAULT_OPENROUTER_MODEL;
  const openrouterKey = getSetting(db2, "openrouter_api_key") ?? "";
  const lmstudioUrl = getSetting(db2, "lmstudio_url") ?? DEFAULT_LMSTUDIO_URL$1;
  const lmstudioModel = getSetting(db2, "lmstudio_model") ?? DEFAULT_LMSTUDIO_MODEL;
  return {
    provider,
    openrouter: {
      apiKeySet: Boolean(openrouterKey),
      model: openrouterModel
    },
    lmstudio: {
      baseUrl: lmstudioUrl,
      model: lmstudioModel
    }
  };
}
async function testLmStudio(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      signal: AbortSignal.timeout(5e3)
    });
    if (!response.ok) {
      return { available: false, error: `LM Studio returned ${response.status}` };
    }
    let data;
    try {
      data = await response.json();
    } catch {
      return { available: false, error: "LM Studio returned invalid JSON response" };
    }
    const available = !!(data && typeof data === "object" && "data" in data && Array.isArray(data.data) && data.data.length > 0);
    return { available, error: available ? void 0 : "No models loaded in LM Studio. Load a model first." };
  } catch (error2) {
    const message = error2 instanceof Error ? error2.message : "Unknown error";
    if (message.includes("fetch failed") || message.includes("ECONNREFUSED")) {
      return { available: false, error: "Cannot connect to LM Studio. Make sure LM Studio is running and the local server is started (check LM Studio → Local Server tab)." };
    }
    return { available: false, error: `LM Studio not reachable: ${message}` };
  }
}
async function testOpenRouter(apiKey) {
  if (!apiKey) {
    return { available: false, error: "OpenRouter API key is not set" };
  }
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!response.ok) {
      const text = await response.text();
      return { available: false, error: `OpenRouter error ${response.status}: ${text}` };
    }
    return { available: true };
  } catch (error2) {
    return { available: false, error: error2 instanceof Error ? error2.message : "OpenRouter not reachable" };
  }
}
function buildSummaryPrompt(input) {
  const summaryContext = [
    input.title ? `Title: ${input.title}` : null,
    input.description ? `Description: ${input.description}` : null
  ].filter(Boolean).join("\n");
  return {
    system: "You summarize video transcripts into clear, concise notes.",
    prompt: `${summaryContext}

Transcript:
${input.transcript}

Task: Summarize this video in 4-6 bullet points. Focus on key takeaways, avoid fluff, and keep it readable.`
  };
}
function buildTranscriptCleanupPrompt(transcript) {
  return {
    system: "You clean raw speech-to-text transcripts.",
    prompt: `Transcript:
${transcript}

Task: Clean up the transcript for readability. Fix punctuation, casing, and line breaks. Do not add new content. Return plain text only.`
  };
}
function registerLlmHandlers(smartTagging2) {
  const db2 = getDatabase();
  require$$1.ipcMain.handle("llm/get-settings", async () => {
    return { ok: true, settings: getLlmSettings() };
  });
  require$$1.ipcMain.handle("llm/update-settings", async (_event, payload) => {
    try {
      if (payload.provider) {
        setSetting(db2, "llm_provider", payload.provider);
      }
      if (payload.openrouterApiKey !== void 0) {
        setSetting(db2, "openrouter_api_key", payload.openrouterApiKey);
      }
      if (payload.openrouterModel !== void 0 && payload.openrouterModel !== null) {
        setSetting(db2, "openrouter_model", payload.openrouterModel);
      }
      if (payload.lmstudioBaseUrl !== void 0 && payload.lmstudioBaseUrl !== null) {
        setSetting(db2, "lmstudio_url", payload.lmstudioBaseUrl);
      }
      if (payload.lmstudioModel !== void 0 && payload.lmstudioModel !== null) {
        setSetting(db2, "lmstudio_model", payload.lmstudioModel);
      }
      if (smartTagging2) {
        const settings = getLlmSettings();
        smartTagging2.getLLMRefiner().configure({
          baseUrl: settings.lmstudio.baseUrl,
          modelName: settings.lmstudio.model ?? DEFAULT_LMSTUDIO_MODEL
        });
      }
      return { ok: true, settings: getLlmSettings() };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to update settings" };
    }
  });
  require$$1.ipcMain.handle("llm/test-connection", async (_event, provider) => {
    const settings = getLlmSettings();
    const target = provider ?? settings.provider;
    if (target === "openrouter") {
      const apiKey = getSetting(db2, "openrouter_api_key") ?? "";
      const result2 = await testOpenRouter(apiKey);
      return { ok: true, available: result2.available, error: result2.error };
    }
    const result = await testLmStudio(settings.lmstudio.baseUrl);
    return { ok: true, available: result.available, error: result.error };
  });
  require$$1.ipcMain.handle("llm/summarize-video", async (_event, payload) => {
    const videoId = payload?.videoId?.trim();
    if (!videoId) {
      return { ok: false, error: "missing_video" };
    }
    const video = db2.prepare("SELECT title, description, transcript FROM videos WHERE id = ?").get(videoId);
    if (!video) {
      return { ok: false, error: "video_not_found" };
    }
    if (!video.transcript || typeof video.transcript !== "string" || !video.transcript.trim()) {
      return { ok: false, error: "missing_transcript" };
    }
    const settings = getLlmSettings();
    const provider = settings.provider;
    const model = provider === "openrouter" ? settings.openrouter.model ?? DEFAULT_OPENROUTER_MODEL : settings.lmstudio.model ?? DEFAULT_LMSTUDIO_MODEL;
    const apiKey = provider === "openrouter" ? getSetting(db2, "openrouter_api_key") ?? "" : "";
    if (provider === "openrouter" && !apiKey) {
      return { ok: false, error: "missing_api_key" };
    }
    const transcript = video.transcript.length > SUMMARY_MAX_CHARS ? `${video.transcript.slice(0, SUMMARY_MAX_CHARS)}

[Truncated]` : video.transcript;
    const prompt = buildSummaryPrompt({
      title: video.title ?? null,
      description: video.description ?? null,
      transcript
    });
    try {
      const client = createLlmProvider(provider, {
        apiKey,
        baseUrl: provider === "lmstudio" ? settings.lmstudio.baseUrl : void 0
      });
      const summary = await client.complete({
        prompt: prompt.prompt,
        systemPrompt: prompt.system,
        model,
        maxTokens: SUMMARY_MAX_TOKENS
      });
      try {
        db2.prepare("UPDATE videos SET summary = ?, updated_at = ? WHERE id = ?").run(summary, (/* @__PURE__ */ new Date()).toISOString(), videoId);
      } catch (dbError) {
        console.error("Failed to save summary to database:", dbError);
      }
      return { ok: true, summary };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to generate summary." };
    }
  });
  require$$1.ipcMain.handle("llm/cleanup-transcript", async (_event, payload) => {
    const videoId = payload?.videoId?.trim();
    if (!videoId) {
      return { ok: false, error: "missing_video" };
    }
    const video = db2.prepare("SELECT transcript FROM videos WHERE id = ?").get(videoId);
    if (!video) {
      return { ok: false, error: "video_not_found" };
    }
    if (!video.transcript || typeof video.transcript !== "string" || !video.transcript.trim()) {
      return { ok: false, error: "missing_transcript" };
    }
    const settings = getLlmSettings();
    const provider = settings.provider;
    const model = provider === "openrouter" ? settings.openrouter.model ?? DEFAULT_OPENROUTER_MODEL : settings.lmstudio.model ?? DEFAULT_LMSTUDIO_MODEL;
    const apiKey = provider === "openrouter" ? getSetting(db2, "openrouter_api_key") ?? "" : "";
    if (provider === "openrouter" && !apiKey) {
      return { ok: false, error: "missing_api_key" };
    }
    const transcriptText = video.transcript.length > TRANSCRIPT_MAX_CHARS ? `${video.transcript.slice(0, TRANSCRIPT_MAX_CHARS)}

[Truncated]` : video.transcript;
    const prompt = buildTranscriptCleanupPrompt(transcriptText);
    try {
      const client = createLlmProvider(provider, {
        apiKey,
        baseUrl: provider === "lmstudio" ? settings.lmstudio.baseUrl : void 0
      });
      const cleaned = await client.complete({
        prompt: prompt.prompt,
        systemPrompt: prompt.system,
        model,
        maxTokens: SUMMARY_MAX_TOKENS
      });
      return { ok: true, transcript: cleaned };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to clean transcript." };
    }
  });
}
const DEFAULT_LMSTUDIO_URL = "http://localhost:1234/v1";
function registerSmartTaggingHandlers(smartTagging2) {
  require$$1.ipcMain.handle("smart-tagging:index-video", async (_event, params) => {
    return smartTagging2.indexVideo(params.videoId, params.videoPath);
  });
  require$$1.ipcMain.handle("smart-tagging:suggest-tags", async (_event, params) => {
    return smartTagging2.suggestTags(params.videoId, {
      topK: params.topK,
      useLLMRefinement: params.useLLMRefinement,
      videoTitle: params.videoTitle,
      videoDescription: params.videoDescription,
      userNotes: params.userNotes
    });
  });
  require$$1.ipcMain.handle("smart-tagging:apply-decision", async (_event, params) => {
    await smartTagging2.applyTagDecision(params.videoId, params.tagName, params.decision);
    return { success: true };
  });
  require$$1.ipcMain.handle("smart-tagging:add-tag", async (_event, params) => {
    try {
      smartTagging2.addUserTag(params.videoId, params.tagName, params.lock);
      return { success: true };
    } catch (error2) {
      return { success: false, error: String(error2) };
    }
  });
  require$$1.ipcMain.handle("smart-tagging:remove-tag", async (_event, params) => {
    return smartTagging2.removeTag(params.videoId, params.tagName, params.force);
  });
  require$$1.ipcMain.handle("smart-tagging:lock-tag", async (_event, params) => {
    try {
      smartTagging2.lockTag(params.videoId, params.tagName);
      return { success: true };
    } catch (error2) {
      return { success: false, error: String(error2) };
    }
  });
  require$$1.ipcMain.handle("smart-tagging:unlock-tag", async (_event, params) => {
    try {
      smartTagging2.unlockTag(params.videoId, params.tagName);
      return { success: true };
    } catch (error2) {
      return { success: false, error: String(error2) };
    }
  });
  require$$1.ipcMain.handle("smart-tagging:regenerate", async (_event, params) => {
    return smartTagging2.regenerateSuggestions(params.videoId);
  });
  require$$1.ipcMain.handle("smart-tagging:get-taxonomy", async () => {
    return smartTagging2.getTaxonomy();
  });
  require$$1.ipcMain.handle("smart-tagging:reload-taxonomy", async () => {
    return smartTagging2.reloadTaxonomy();
  });
  require$$1.ipcMain.handle("smart-tagging:get-video-tags", async (_event, params) => {
    return { tags: smartTagging2.getVideoTags(params.videoId) };
  });
  require$$1.ipcMain.handle("smart-tagging:is-indexed", async (_event, params) => {
    return smartTagging2.isVideoIndexed(params.videoId);
  });
  require$$1.ipcMain.handle("smart-tagging:cleanup", async (_event, params) => {
    await smartTagging2.cleanupVideo(params.videoId);
    return { success: true };
  });
  require$$1.ipcMain.handle("smart-tagging:llm-available", async () => {
    const db2 = getDatabase();
    const provider = getSetting(db2, "llm_provider") ?? "lmstudio";
    if (provider === "openrouter") {
      const apiKey = getSetting(db2, "openrouter_api_key");
      return { available: Boolean(apiKey) };
    }
    const baseUrl = getSetting(db2, "lmstudio_url") ?? DEFAULT_LMSTUDIO_URL;
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3)
      });
      if (!response.ok) {
        return { available: false };
      }
      const data = await response.json();
      return { available: Array.isArray(data.data) && data.data.length > 0 };
    } catch {
      return { available: false };
    }
  });
  require$$1.ipcMain.handle("smart-tagging:llm-models", async () => {
    const db2 = getDatabase();
    const baseUrl = getSetting(db2, "lmstudio_url") ?? DEFAULT_LMSTUDIO_URL;
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3)
      });
      if (!response.ok) {
        return { models: [] };
      }
      const data = await response.json();
      return { models: data.data?.map((m) => m.id) || [] };
    } catch {
      return { models: [] };
    }
  });
}
const DEFAULT_PRIVACY = {
  historyEnabled: true,
  showThumbnails: true,
  hiddenFolderEnabled: false,
  secureDeleteEnabled: false
};
const PRIVACY_PIN_KEY = "privacy_hidden_pin_hash";
function getBooleanSetting(database, key, fallback) {
  const value = getSetting(database, key);
  if (value === null) {
    return fallback;
  }
  return value === "1" || value.toLowerCase() === "true";
}
function setBooleanSetting(database, key, value) {
  setSetting(database, key, value ? "1" : "0");
}
function parseRateLimitMs(value) {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed);
}
function hashPin(pin) {
  return require$$1$1.createHash("sha256").update(pin).digest("hex");
}
function registerSettingsHandlers(deps = {}) {
  const db2 = getDatabase();
  require$$1.ipcMain.handle("settings/get-download-path", async () => {
    const path2 = getSetting(db2, "download_path") ?? getDownloadPath();
    return { ok: true, path: path2 };
  });
  require$$1.ipcMain.handle("settings/get-download-settings", async () => {
    const proxy = getSetting(db2, "download_proxy");
    const rateLimit = getSetting(db2, "download_rate_limit");
    const rateLimitMs = parseRateLimitMs(getSetting(db2, "download_rate_limit_ms"));
    const dedupeEnabled = getBooleanSetting(db2, "download_dedupe_enabled", true);
    return {
      ok: true,
      settings: {
        proxy: proxy && proxy.trim() ? proxy : null,
        rateLimit: rateLimit && rateLimit.trim() ? rateLimit : null,
        rateLimitMs,
        dedupeEnabled
      }
    };
  });
  require$$1.ipcMain.handle(
    "settings/update-download-settings",
    async (_event, payload) => {
      if (!payload) {
        return { ok: false, error: "missing_payload" };
      }
      if (payload.proxy !== void 0) {
        setSetting(db2, "download_proxy", payload.proxy?.trim() ?? "");
      }
      if (payload.rateLimit !== void 0) {
        setSetting(db2, "download_rate_limit", payload.rateLimit?.trim() ?? "");
      }
      if (payload.rateLimitMs !== void 0) {
        const safe = Number.isFinite(payload.rateLimitMs) && payload.rateLimitMs > 0 ? Math.round(payload.rateLimitMs) : 0;
        setSetting(db2, "download_rate_limit_ms", safe.toString());
      }
      if (typeof payload.dedupeEnabled === "boolean") {
        setBooleanSetting(db2, "download_dedupe_enabled", payload.dedupeEnabled);
      }
      const proxy = getSetting(db2, "download_proxy");
      const rateLimit = getSetting(db2, "download_rate_limit");
      const rateLimitMs = parseRateLimitMs(getSetting(db2, "download_rate_limit_ms"));
      const dedupeEnabled = getBooleanSetting(db2, "download_dedupe_enabled", true);
      return {
        ok: true,
        settings: {
          proxy: proxy && proxy.trim() ? proxy : null,
          rateLimit: rateLimit && rateLimit.trim() ? rateLimit : null,
          rateLimitMs,
          dedupeEnabled
        }
      };
    }
  );
  require$$1.ipcMain.handle("settings/select-download-path", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openDirectory", "createDirectory"]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const selectedPath = result.filePaths[0];
    setSetting(db2, "download_path", selectedPath);
    return { ok: true, path: selectedPath };
  });
  require$$1.ipcMain.handle("settings/get-ui-settings", async () => {
    const theme = getSetting(db2, "ui_theme") ?? "light";
    return { ok: true, settings: { theme } };
  });
  require$$1.ipcMain.handle("settings/update-ui-settings", async (_event, payload) => {
    if (!payload) {
      return { ok: false, error: "missing_payload" };
    }
    if (payload.theme) {
      const next = payload.theme === "dark" ? "dark" : "light";
      setSetting(db2, "ui_theme", next);
    }
    const theme = getSetting(db2, "ui_theme") ?? "light";
    return { ok: true, settings: { theme } };
  });
  require$$1.ipcMain.handle("settings/get-watch-folder", async () => {
    const enabled = getBooleanSetting(db2, "watch_folder_enabled", false);
    const path2 = getSetting(db2, "watch_folder_path");
    return { ok: true, settings: { enabled, path: path2 && path2.trim() ? path2 : null } };
  });
  require$$1.ipcMain.handle("settings/select-watch-folder", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openDirectory", "createDirectory"]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const selectedPath = result.filePaths[0];
    setSetting(db2, "watch_folder_path", selectedPath);
    return { ok: true, path: selectedPath };
  });
  require$$1.ipcMain.handle("settings/update-watch-folder", async (_event, payload) => {
    if (!payload) {
      return { ok: false, error: "missing_payload" };
    }
    if (typeof payload.enabled === "boolean") {
      setBooleanSetting(db2, "watch_folder_enabled", payload.enabled);
    }
    if (payload.path !== void 0) {
      setSetting(db2, "watch_folder_path", payload.path ?? "");
    }
    await deps.watchFolderService?.configure({
      enabled: typeof payload.enabled === "boolean" ? payload.enabled : void 0,
      path: payload.path !== void 0 ? payload.path ?? null : void 0
    });
    const enabled = getBooleanSetting(db2, "watch_folder_enabled", false);
    const path2 = getSetting(db2, "watch_folder_path");
    return { ok: true, settings: { enabled, path: path2 && path2.trim() ? path2 : null } };
  });
  require$$1.ipcMain.handle("settings/watch-folder-scan", async () => {
    await deps.watchFolderService?.scanNow();
    return { ok: true };
  });
  require$$1.ipcMain.handle("settings/get-whisper-model", async () => {
    const path2 = getSetting(db2, "whisper_model_path");
    return { ok: true, path: path2 };
  });
  require$$1.ipcMain.handle("settings/select-whisper-model", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openFile"],
      filters: [
        {
          name: "Whisper model",
          extensions: ["bin", "ggml", "gguf"]
        }
      ]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const selectedPath = result.filePaths[0];
    setSetting(db2, "whisper_model_path", selectedPath);
    return { ok: true, path: selectedPath };
  });
  require$$1.ipcMain.handle("settings/get-whisper-provider", async () => {
    const provider = getSetting(db2, "whisper_provider") ?? "bundled";
    const endpoint = getSetting(db2, "whisper_lmstudio_endpoint") ?? "http://localhost:1234/v1/audio/transcriptions";
    return { ok: true, provider, endpoint };
  });
  require$$1.ipcMain.handle("settings/set-whisper-provider", async (_event, payload) => {
    if (!payload || !payload.provider) {
      return { ok: false, error: "Invalid payload" };
    }
    setSetting(db2, "whisper_provider", payload.provider);
    if (payload.endpoint) {
      setSetting(db2, "whisper_lmstudio_endpoint", payload.endpoint);
    }
    return { ok: true };
  });
  require$$1.ipcMain.handle("settings/get-whisper-gpu", async () => {
    const currentPlatform = os$1.platform();
    const currentArch = os$1.arch();
    const isAppleSilicon = currentPlatform === "darwin" && currentArch === "arm64";
    let gpuAvailable = false;
    let gpuType = "none";
    let reason;
    if (isAppleSilicon) {
      gpuAvailable = true;
      gpuType = "metal";
    } else if (currentPlatform === "darwin") {
      reason = "GPU acceleration requires Apple Silicon (M1/M2/M3). Intel Macs use CPU only.";
    } else {
      reason = "GPU acceleration is not supported by bundled Whisper on this platform. Use LM Studio provider for GPU-accelerated transcription.";
    }
    const storedValue = getSetting(db2, "whisper_gpu_enabled");
    const enabled = storedValue !== null ? storedValue === "1" : gpuAvailable;
    return {
      ok: true,
      settings: {
        enabled: enabled && gpuAvailable,
        // Only enabled if available
        available: gpuAvailable,
        platform: currentPlatform,
        gpuType,
        reason
      }
    };
  });
  require$$1.ipcMain.handle("settings/set-whisper-gpu", async (_event, enabled) => {
    setBooleanSetting(db2, "whisper_gpu_enabled", enabled);
    return { ok: true };
  });
  require$$1.ipcMain.handle("settings/get-privacy", async () => {
    const pinHash = getSetting(db2, PRIVACY_PIN_KEY);
    return {
      ok: true,
      settings: {
        historyEnabled: getBooleanSetting(db2, "privacy_history_enabled", DEFAULT_PRIVACY.historyEnabled),
        showThumbnails: getBooleanSetting(db2, "privacy_show_thumbnails", DEFAULT_PRIVACY.showThumbnails),
        hiddenFolderEnabled: getBooleanSetting(db2, "privacy_hidden_folder_enabled", DEFAULT_PRIVACY.hiddenFolderEnabled),
        secureDeleteEnabled: getBooleanSetting(db2, "privacy_secure_delete_enabled", DEFAULT_PRIVACY.secureDeleteEnabled),
        pinSet: Boolean(pinHash)
      }
    };
  });
  require$$1.ipcMain.handle("settings/update-privacy", async (_event, payload) => {
    if (!payload) {
      return { ok: false, error: "missing_payload" };
    }
    if (typeof payload.historyEnabled === "boolean") {
      setBooleanSetting(db2, "privacy_history_enabled", payload.historyEnabled);
    }
    if (typeof payload.showThumbnails === "boolean") {
      setBooleanSetting(db2, "privacy_show_thumbnails", payload.showThumbnails);
    }
    if (typeof payload.hiddenFolderEnabled === "boolean") {
      setBooleanSetting(db2, "privacy_hidden_folder_enabled", payload.hiddenFolderEnabled);
    }
    if (typeof payload.secureDeleteEnabled === "boolean") {
      setBooleanSetting(db2, "privacy_secure_delete_enabled", payload.secureDeleteEnabled);
    }
    return {
      ok: true,
      settings: {
        historyEnabled: getBooleanSetting(db2, "privacy_history_enabled", DEFAULT_PRIVACY.historyEnabled),
        showThumbnails: getBooleanSetting(db2, "privacy_show_thumbnails", DEFAULT_PRIVACY.showThumbnails),
        hiddenFolderEnabled: getBooleanSetting(db2, "privacy_hidden_folder_enabled", DEFAULT_PRIVACY.hiddenFolderEnabled),
        secureDeleteEnabled: getBooleanSetting(db2, "privacy_secure_delete_enabled", DEFAULT_PRIVACY.secureDeleteEnabled),
        pinSet: Boolean(getSetting(db2, PRIVACY_PIN_KEY))
      }
    };
  });
  require$$1.ipcMain.handle("settings/set-privacy-pin", async (_event, pin) => {
    const trimmed = typeof pin === "string" ? pin.trim() : "";
    if (trimmed.length < 4) {
      return { ok: false, error: "Pin must be at least 4 characters." };
    }
    setSetting(db2, PRIVACY_PIN_KEY, hashPin(trimmed));
    return { ok: true };
  });
  require$$1.ipcMain.handle("settings/clear-privacy-pin", async () => {
    setSetting(db2, PRIVACY_PIN_KEY, "");
    return { ok: true };
  });
  require$$1.ipcMain.handle("settings/verify-privacy-pin", async (_event, pin) => {
    const stored = getSetting(db2, PRIVACY_PIN_KEY);
    if (!stored) {
      return { ok: true, valid: true };
    }
    const trimmed = typeof pin === "string" ? pin.trim() : "";
    if (!trimmed) {
      return { ok: true, valid: false };
    }
    const digest = hashPin(trimmed);
    return { ok: true, valid: digest === stored };
  });
}
class CookieService {
  constructor(sessionService, keychain) {
    this.sessionService = sessionService;
    this.keychain = keychain;
    this.logger = new Logger("CookieService");
  }
  async importCookies(request) {
    this.logger.info("cookie import requested", { platform: request.platform });
    const raw = await promises.readFile(request.filePath, "utf-8");
    const parsed = this.parseCookieFile(raw);
    if (!parsed.cookies.length) {
      throw new Error("No cookies found in the selected file.");
    }
    const expiresAt = this.findLatestExpiry(parsed.cookies);
    const payload = {
      format: parsed.format,
      source: "file",
      sourceFile: require$$0.basename(request.filePath),
      importedAt: (/* @__PURE__ */ new Date()).toISOString(),
      cookies: parsed.cookies
    };
    const encrypted = this.keychain.encryptToJson(JSON.stringify(payload));
    const sessionId = this.sessionService.createSession({
      platform: request.platform,
      accountName: request.accountName ?? null,
      cookies: encrypted,
      headers: null,
      expiresAt,
      setActive: true
    });
    return {
      sessionId,
      cookieCount: parsed.cookies.length,
      expiresAt,
      accountName: request.accountName ?? null,
      storage: this.keychain.isEncryptionAvailable() ? "secure" : "plain"
    };
  }
  parseCookieFile(contents) {
    const trimmed = contents.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        const cookies = this.normalizeJsonCookies(parsed);
        if (cookies.length) {
          return { format: "json", cookies };
        }
      } catch {
      }
    }
    return { format: "netscape", cookies: this.parseNetscapeCookies(contents) };
  }
  normalizeJsonCookies(parsed) {
    const cookies = [];
    const cookieArray = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && Array.isArray(parsed.cookies) ? parsed.cookies : [];
    for (const entry of cookieArray) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const record = entry;
      const name = typeof record.name === "string" ? record.name : null;
      const value = typeof record.value === "string" ? record.value : null;
      const domainRaw = typeof record.domain === "string" ? record.domain : "";
      const hostRaw = typeof record.host === "string" ? record.host : "";
      const domain = (domainRaw || hostRaw).trim();
      const path2 = typeof record.path === "string" ? record.path : "/";
      const hostOnly = typeof record.hostOnly === "boolean" ? record.hostOnly : null;
      if (!name || value === null) {
        continue;
      }
      if (!domain) {
        continue;
      }
      const expiresRaw = record.expirationDate ?? record.expires;
      const expires = this.normalizeExpiry(expiresRaw);
      const includeSubdomains = hostOnly === null ? domain.startsWith(".") : !hostOnly;
      cookies.push({
        domain,
        includeSubdomains,
        path: path2,
        secure: Boolean(record.secure),
        expires,
        name,
        value,
        httpOnly: Boolean(record.httpOnly)
      });
    }
    return cookies;
  }
  parseNetscapeCookies(contents) {
    const cookies = [];
    const lines = contents.split(/\r?\n/);
    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        continue;
      }
      const isHttpOnly = trimmed.startsWith("#HttpOnly_");
      const line = isHttpOnly ? trimmed.replace("#HttpOnly_", "") : trimmed;
      if (line.startsWith("#")) {
        continue;
      }
      let parts = line.split("	");
      let usedWhitespaceSplit = false;
      if (parts.length < 7) {
        parts = line.split(/\s+/);
        usedWhitespaceSplit = true;
      }
      if (parts.length < 7) {
        continue;
      }
      const [domain, includeSubdomains, path2, secure, expiresRaw, name, ...rest] = parts;
      const value = rest.join(usedWhitespaceSplit ? " " : "	");
      const expires = this.normalizeExpiry(expiresRaw);
      const includeSubdomainsFlag = includeSubdomains.toLowerCase() === "true";
      const secureFlag = secure.toLowerCase() === "true";
      cookies.push({
        domain,
        includeSubdomains: includeSubdomainsFlag,
        path: path2,
        secure: secureFlag,
        expires,
        name,
        value,
        httpOnly: isHttpOnly
      });
    }
    return cookies;
  }
  findLatestExpiry(cookies) {
    const latest = cookies.reduce((max, cookie) => {
      if (!cookie.expires) {
        return max;
      }
      return cookie.expires > max ? cookie.expires : max;
    }, 0);
    if (!latest) {
      return null;
    }
    const date = new Date(latest * 1e3);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  normalizeExpiry(value) {
    let numeric2 = null;
    if (typeof value === "number" && Number.isFinite(value)) {
      numeric2 = value;
    } else if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      numeric2 = Number.isFinite(parsed) ? parsed : null;
    }
    if (!numeric2 || numeric2 <= 0) {
      return null;
    }
    const seconds = numeric2 > 1e12 ? numeric2 / 1e3 : numeric2;
    return Math.trunc(seconds);
  }
}
class KeychainService {
  constructor() {
    this.logger = new Logger("KeychainService");
  }
  isEncryptionAvailable() {
    return require$$1.safeStorage.isEncryptionAvailable();
  }
  async storeSecret(key, value) {
    this.logger.info("keychain store requested", { key });
  }
  encryptToJson(value) {
    if (this.isEncryptionAvailable()) {
      const payload = require$$1.safeStorage.encryptString(value).toString("base64");
      return JSON.stringify({ scheme: "safeStorage", payload });
    }
    this.logger.warn("safeStorage unavailable; storing secrets in plain text");
    return JSON.stringify({ scheme: "plain", payload: value });
  }
  decryptFromJson(payload) {
    try {
      const parsed = JSON.parse(payload);
      if (parsed.scheme === "safeStorage") {
        const buffer = Buffer.from(parsed.payload, "base64");
        return require$$1.safeStorage.decryptString(buffer);
      }
      return parsed.payload;
    } catch (error2) {
      this.logger.warn("unable to decrypt payload", { error: error2 });
      return null;
    }
  }
}
class SessionService {
  constructor(db2) {
    this.db = db2;
    this.logger = new Logger("SessionService");
  }
  listSessions() {
    this.logger.info("session list requested");
    const rows = this.db.prepare(
      "SELECT id, platform, account_name, is_active, created_at, last_used_at, expires_at FROM auth_sessions ORDER BY created_at DESC"
    ).all();
    return rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      accountName: row.account_name,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      expiresAt: row.expires_at
    }));
  }
  createSession(params) {
    const platform2 = params.platform.trim().toLowerCase();
    const id = require$$1$1.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const shouldActivate = params.setActive !== false;
    if (shouldActivate) {
      this.db.prepare("UPDATE auth_sessions SET is_active = 0 WHERE lower(platform) = ?").run(platform2);
    }
    this.db.prepare(
      `INSERT INTO auth_sessions
        (id, platform, account_name, cookies_json, headers_json, is_active, expires_at, created_at, last_used_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      platform2,
      params.accountName ?? null,
      params.cookies,
      params.headers ?? null,
      shouldActivate ? 1 : 0,
      params.expiresAt ?? null,
      now,
      now
    );
    return id;
  }
  getActiveSession(platform2) {
    const normalized = platform2.trim().toLowerCase();
    const row = this.db.prepare(
      "SELECT id, platform, account_name, is_active, created_at, last_used_at, expires_at, cookies_json, headers_json FROM auth_sessions WHERE lower(platform) = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1"
    ).get(normalized);
    if (!row) {
      return null;
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
    };
  }
  markUsed(sessionId) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    this.db.prepare("UPDATE auth_sessions SET last_used_at = ? WHERE id = ?").run(now, sessionId);
  }
  setActive(sessionId) {
    const row = this.db.prepare("SELECT id, platform FROM auth_sessions WHERE id = ?").get(sessionId);
    if (!row) {
      return false;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const normalized = row.platform.trim().toLowerCase();
    this.db.prepare("UPDATE auth_sessions SET is_active = 0 WHERE lower(platform) = ?").run(normalized);
    const result = this.db.prepare("UPDATE auth_sessions SET is_active = 1, last_used_at = ? WHERE id = ?").run(now, sessionId);
    return result.changes > 0;
  }
  deleteSession(sessionId) {
    const result = this.db.prepare("DELETE FROM auth_sessions WHERE id = ?").run(sessionId);
    return result.changes > 0;
  }
}
function hashPassword(password) {
  return require$$1$1.createHash("sha256").update(password + "drapp_salt_2024").digest("hex");
}
function registerAuthHandlers() {
  const db2 = getDatabase();
  const sessionService = new SessionService(db2);
  const keychainService = new KeychainService();
  const cookieService = new CookieService(sessionService, keychainService);
  require$$1.ipcMain.handle("auth/select-cookie-file", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openFile"],
      filters: [
        { name: "Cookie files", extensions: ["txt", "json"] },
        { name: "All files", extensions: ["*"] }
      ]
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: result.filePaths[0] };
  });
  require$$1.ipcMain.handle("auth/import-cookies", async (_event, payload) => {
    const platform2 = payload?.platform?.trim().toLowerCase();
    const filePath = payload?.filePath?.trim();
    if (!platform2 || !filePath) {
      return { ok: false, error: "missing_payload" };
    }
    try {
      const result = await cookieService.importCookies({
        platform: platform2,
        filePath,
        accountName: payload.accountName ?? null
      });
      return { ok: true, ...result };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to import cookies." };
    }
  });
  require$$1.ipcMain.handle("auth/list-sessions", async () => {
    try {
      return { ok: true, sessions: sessionService.listSessions() };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to list sessions." };
    }
  });
  require$$1.ipcMain.handle("auth/set-active", async (_event, sessionId) => {
    if (!sessionId) {
      return { ok: false, error: "missing_session" };
    }
    try {
      const ok = sessionService.setActive(sessionId);
      return ok ? { ok: true } : { ok: false, error: "not_found" };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to update session." };
    }
  });
  require$$1.ipcMain.handle("auth/delete-session", async (_event, sessionId) => {
    if (!sessionId) {
      return { ok: false, error: "missing_session" };
    }
    try {
      const ok = sessionService.deleteSession(sessionId);
      return ok ? { ok: true } : { ok: false, error: "not_found" };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to delete session." };
    }
  });
  require$$1.ipcMain.handle("app/check-password-set", async () => {
    try {
      const passwordHash = getSetting(db2, "app_password_hash");
      const lockEnabled = getSetting(db2, "app_lock_enabled");
      return {
        ok: true,
        isSet: Boolean(passwordHash),
        isEnabled: lockEnabled === "true"
      };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Failed to check password" };
    }
  });
  require$$1.ipcMain.handle("app/set-password", async (_event, password) => {
    if (!password || password.length < 4) {
      return { ok: false, error: "Password must be at least 4 characters" };
    }
    try {
      const hash = hashPassword(password);
      setSetting(db2, "app_password_hash", hash);
      setSetting(db2, "app_lock_enabled", "true");
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Failed to set password" };
    }
  });
  require$$1.ipcMain.handle("app/verify-password", async (_event, password) => {
    if (!password) {
      return { ok: false, valid: false, error: "Password is required" };
    }
    try {
      const storedHash = getSetting(db2, "app_password_hash");
      if (!storedHash) {
        return { ok: true, valid: true };
      }
      const inputHash = hashPassword(password);
      const valid2 = storedHash === inputHash;
      return { ok: true, valid: valid2 };
    } catch (error2) {
      return { ok: false, valid: false, error: error2 instanceof Error ? error2.message : "Failed to verify password" };
    }
  });
  require$$1.ipcMain.handle("app/change-password", async (_event, payload) => {
    if (!payload.currentPassword || !payload.newPassword) {
      return { ok: false, error: "Both passwords are required" };
    }
    if (payload.newPassword.length < 4) {
      return { ok: false, error: "New password must be at least 4 characters" };
    }
    try {
      const storedHash = getSetting(db2, "app_password_hash");
      if (storedHash) {
        const currentHash = hashPassword(payload.currentPassword);
        if (storedHash !== currentHash) {
          return { ok: false, error: "Current password is incorrect" };
        }
      }
      const newHash = hashPassword(payload.newPassword);
      setSetting(db2, "app_password_hash", newHash);
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Failed to change password" };
    }
  });
  require$$1.ipcMain.handle("app/remove-password", async (_event, password) => {
    if (!password) {
      return { ok: false, error: "Password is required" };
    }
    try {
      const storedHash = getSetting(db2, "app_password_hash");
      if (storedHash) {
        const inputHash = hashPassword(password);
        if (storedHash !== inputHash) {
          return { ok: false, error: "Incorrect password" };
        }
      }
      setSetting(db2, "app_password_hash", "");
      setSetting(db2, "app_lock_enabled", "false");
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Failed to remove password" };
    }
  });
  require$$1.ipcMain.handle("app/toggle-lock", async (_event, enabled) => {
    try {
      const passwordHash = getSetting(db2, "app_password_hash");
      if (!passwordHash && enabled) {
        return { ok: false, error: "Set a password first" };
      }
      setSetting(db2, "app_lock_enabled", enabled ? "true" : "false");
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Failed to toggle lock" };
    }
  });
  require$$1.ipcMain.handle("app/reset-password", async () => {
    try {
      db2.exec("BEGIN TRANSACTION");
      try {
        db2.exec("DELETE FROM watch_history");
        db2.exec("DELETE FROM collection_videos");
        db2.exec("DELETE FROM collections");
        db2.exec("DELETE FROM private_items");
        db2.exec("DELETE FROM tag_events");
        db2.exec("DELETE FROM video_tags");
        db2.exec("DELETE FROM video_frames");
        db2.exec("DELETE FROM video_embeddings");
        db2.exec("DELETE FROM downloads");
        db2.exec("DELETE FROM jobs");
        db2.exec("DELETE FROM auth_sessions");
        db2.exec("DELETE FROM videos");
        db2.exec("DELETE FROM tags");
        db2.exec("DELETE FROM taxonomy_cache");
        db2.exec("DELETE FROM settings");
        db2.exec("COMMIT");
      } catch (innerError) {
        db2.exec("ROLLBACK");
        throw innerError;
      }
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Failed to reset password" };
    }
  });
}
const DOWNLOAD_URLS = {
  win32: {
    "yt-dlp": {
      url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe",
      archiveType: "exe"
    },
    ffmpeg: {
      url: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
      archiveType: "zip",
      pathInArchive: "ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe"
    },
    ffprobe: {
      url: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
      archiveType: "zip",
      pathInArchive: "ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe"
    },
    whisper: null,
    // Whisper.cpp requires manual setup - too complex for auto-download
    "faster-whisper": null
    // Python package - install via: pip install faster-whisper
  },
  darwin: {
    "yt-dlp": {
      url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos",
      archiveType: "exe"
    },
    ffmpeg: {
      url: "https://evermeet.cx/ffmpeg/getrelease/zip",
      archiveType: "zip",
      pathInArchive: "ffmpeg"
    },
    ffprobe: {
      url: "https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip",
      archiveType: "zip",
      pathInArchive: "ffprobe"
    },
    whisper: null,
    "faster-whisper": null
    // Python package - install via: pip install faster-whisper
  },
  linux: {
    "yt-dlp": {
      url: "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp",
      archiveType: "exe"
    },
    // BtbN provides static FFmpeg builds for Linux (same source as Windows builds)
    // These are fully static and include all common codecs (x264, x265, av1, etc.)
    ffmpeg: {
      url: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
      archiveType: "tar.xz",
      pathInArchive: "ffmpeg-master-latest-linux64-gpl/bin/ffmpeg"
    },
    ffprobe: {
      url: "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
      archiveType: "tar.xz",
      pathInArchive: "ffmpeg-master-latest-linux64-gpl/bin/ffprobe"
    },
    whisper: null,
    "faster-whisper": null
    // Python package - install via: pip install faster-whisper
  }
};
class BinaryDownloaderService {
  constructor() {
    this.downloadCache = /* @__PURE__ */ new Map();
    this.progressCallbacks = /* @__PURE__ */ new Set();
  }
  onProgress(callback) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }
  emitProgress(progress) {
    for (const callback of this.progressCallbacks) {
      callback(progress);
    }
  }
  async checkMissingBinaries() {
    const binaries = ["yt-dlp", "ffmpeg", "ffprobe", "whisper"];
    const missing = [];
    for (const name of binaries) {
      const path2 = resolveBundledBinary(name);
      if (!node_fs.existsSync(path2)) {
        missing.push(name);
      }
    }
    return missing;
  }
  async downloadMissingBinaries(onProgress) {
    const missing = await this.checkMissingBinaries();
    const results = [];
    const binDir = getBundledBinaryDir();
    await promises.mkdir(binDir, { recursive: true });
    missing.includes("ffmpeg") || missing.includes("ffprobe");
    const ffmpegDownloaded = /* @__PURE__ */ new Set();
    for (const binary2 of missing) {
      const info = DOWNLOAD_URLS[process.platform]?.[binary2];
      if (!info) {
        results.push({
          success: false,
          binary: binary2,
          error: `No download available for ${binary2} on ${process.platform}`
        });
        continue;
      }
      if (ffmpegDownloaded.has(binary2)) {
        continue;
      }
      try {
        onProgress?.({ binary: binary2, stage: "downloading", progress: 0 });
        this.emitProgress({ binary: binary2, stage: "downloading", progress: 0 });
        const result = await this.downloadBinary(binary2, info, (progress) => {
          onProgress?.({ binary: binary2, stage: "downloading", progress });
          this.emitProgress({ binary: binary2, stage: "downloading", progress });
        });
        if (binary2 === "ffmpeg" || binary2 === "ffprobe") {
          ffmpegDownloaded.add("ffmpeg");
          ffmpegDownloaded.add("ffprobe");
          const otherBinary = binary2 === "ffmpeg" ? "ffprobe" : "ffmpeg";
          if (missing.includes(otherBinary)) {
            const otherInfo = DOWNLOAD_URLS[process.platform]?.[otherBinary];
            if (otherInfo && result.archivePath) {
              await this.extractFromArchive(result.archivePath, otherBinary, otherInfo);
              results.push({ success: true, binary: otherBinary });
            }
          }
        }
        onProgress?.({ binary: binary2, stage: "done" });
        this.emitProgress({ binary: binary2, stage: "done" });
        results.push({ success: true, binary: binary2 });
      } catch (error2) {
        const errorMsg = error2 instanceof Error ? error2.message : "Unknown error";
        onProgress?.({ binary: binary2, stage: "error", error: errorMsg });
        this.emitProgress({ binary: binary2, stage: "error", error: errorMsg });
        results.push({ success: false, binary: binary2, error: errorMsg });
      }
    }
    return results;
  }
  async downloadBinary(binary2, info, onProgress) {
    const tempDir = require$$1.app.getPath("temp");
    const targetPath = resolveBundledBinary(binary2);
    if (info.archiveType === "exe") {
      await this.downloadFile(info.url, targetPath, onProgress);
      if (process.platform !== "win32") {
        await promises.chmod(targetPath, 493);
      }
      return {};
    }
    const archiveExtMap = {
      "zip": ".zip",
      "7z": ".7z",
      "tar.xz": ".tar.xz"
    };
    const archiveExt = archiveExtMap[info.archiveType] || ".zip";
    const archivePath = require$$0.join(tempDir, `drapp-${binary2}${archiveExt}`);
    const cacheKey = info.url;
    if (!this.downloadCache.has(cacheKey)) {
      this.downloadCache.set(
        cacheKey,
        this.downloadFile(info.url, archivePath, onProgress).then(() => archivePath)
      );
    }
    await this.downloadCache.get(cacheKey);
    await this.extractFromArchive(archivePath, binary2, info);
    return { archivePath };
  }
  async downloadFile(url, destPath, onProgress) {
    await promises.mkdir(require$$0.dirname(destPath), { recursive: true });
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    const contentLength = response.headers.get("content-length");
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let downloadedBytes = 0;
    const fileStream = node_fs.createWriteStream(destPath);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (totalBytes > 0 && onProgress) {
          onProgress(Math.round(downloadedBytes / totalBytes * 100));
        }
      }
    } finally {
      fileStream.close();
    }
  }
  async extractFromArchive(archivePath, binary2, info) {
    const targetPath = resolveBundledBinary(binary2);
    await promises.mkdir(require$$0.dirname(targetPath), { recursive: true });
    if (info.archiveType === "zip") {
      await this.extractFromZip(archivePath, info.pathInArchive, targetPath);
    } else if (info.archiveType === "tar.xz") {
      await this.extractFromTarXz(archivePath, info.pathInArchive, targetPath);
    }
    if (process.platform !== "win32") {
      await promises.chmod(targetPath, 493);
    }
  }
  async extractFromZip(zipPath, pathInArchive, targetPath) {
    if (process.platform === "win32") {
      await this.extractWithPowerShell(zipPath, pathInArchive, targetPath);
    } else {
      await this.extractWithUnzip(zipPath, pathInArchive, targetPath);
    }
  }
  async extractWithPowerShell(zipPath, pathInArchive, targetPath) {
    const tempExtractDir = require$$0.join(require$$1.app.getPath("temp"), `drapp-extract-${Date.now()}`);
    return new Promise((resolve, reject) => {
      const ps = require$$0$1.spawn("powershell", [
        "-NoProfile",
        "-Command",
        `
        $ErrorActionPreference = 'Stop'
        Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtractDir}' -Force
        $source = Join-Path '${tempExtractDir}' '${pathInArchive}'
        Copy-Item -Path $source -Destination '${targetPath}' -Force
        Remove-Item -Path '${tempExtractDir}' -Recurse -Force
        `
      ], { stdio: "pipe" });
      let stderr = "";
      ps.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      ps.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PowerShell extraction failed: ${stderr}`));
        }
      });
      ps.on("error", reject);
    });
  }
  async extractWithUnzip(zipPath, pathInArchive, targetPath) {
    const tempExtractDir = require$$0.join(require$$1.app.getPath("temp"), `drapp-extract-${Date.now()}`);
    return new Promise((resolve, reject) => {
      const unzip = require$$0$1.spawn("unzip", ["-o", zipPath, pathInArchive, "-d", tempExtractDir], {
        stdio: "pipe"
      });
      unzip.on("close", async (code) => {
        if (code === 0) {
          try {
            const extractedPath = require$$0.join(tempExtractDir, pathInArchive);
            await promises.rename(extractedPath, targetPath);
            resolve();
          } catch (error2) {
            reject(error2);
          }
        } else {
          reject(new Error(`unzip failed with code ${code}`));
        }
      });
      unzip.on("error", reject);
    });
  }
  /**
   * Extract a file from a tar.xz archive (used for Linux FFmpeg builds)
   * Uses the system 'tar' command which handles .xz decompression natively
   */
  async extractFromTarXz(tarPath, pathInArchive, targetPath) {
    const tempExtractDir = require$$0.join(require$$1.app.getPath("temp"), `drapp-extract-${Date.now()}`);
    await promises.mkdir(tempExtractDir, { recursive: true });
    return new Promise((resolve, reject) => {
      const tar = require$$0$1.spawn("tar", [
        "-xJf",
        tarPath,
        "-C",
        tempExtractDir,
        pathInArchive
      ], { stdio: "pipe" });
      let stderr = "";
      tar.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      tar.on("close", async (code) => {
        if (code === 0) {
          try {
            const extractedPath = require$$0.join(tempExtractDir, pathInArchive);
            await promises.rename(extractedPath, targetPath);
            const { rm } = await import("node:fs/promises");
            await rm(tempExtractDir, { recursive: true, force: true }).catch(() => {
            });
            resolve();
          } catch (error2) {
            reject(error2);
          }
        } else {
          reject(new Error(`tar extraction failed with code ${code}: ${stderr}`));
        }
      });
      tar.on("error", (error2) => {
        reject(new Error(`tar command failed: ${error2.message}. Please install tar or xz-utils.`));
      });
    });
  }
  async downloadSingleBinary(binary2) {
    const info = DOWNLOAD_URLS[process.platform]?.[binary2];
    if (!info) {
      return {
        success: false,
        binary: binary2,
        error: `No download available for ${binary2} on ${process.platform}`
      };
    }
    try {
      await this.downloadBinary(binary2, info);
      return { success: true, binary: binary2 };
    } catch (error2) {
      return {
        success: false,
        binary: binary2,
        error: error2 instanceof Error ? error2.message : "Unknown error"
      };
    }
  }
}
const binaryDownloaderService = new BinaryDownloaderService();
const VERSION_ARGS = {
  "yt-dlp": ["--version"],
  ffmpeg: ["-version"],
  ffprobe: ["-version"],
  whisper: ["-h"],
  "faster-whisper": ["--help"]
  // Python-based, installed via pip
};
function registerSystemHandlers() {
  require$$1.ipcMain.handle("system/binaries", async () => {
    const results = await Promise.all(
      Object.keys(VERSION_ARGS).map(async (name) => checkBinary(name))
    );
    return { ok: true, binaries: results };
  });
  require$$1.ipcMain.handle("system/open-binaries-folder", async () => {
    try {
      await require$$1.shell.openPath(getBundledBinaryDir());
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: errorMessage(error2) };
    }
  });
  require$$1.ipcMain.handle("system/repair-binaries", async () => {
    const repaired = [];
    const missing = [];
    const downloaded = [];
    const errors = [];
    for (const name of Object.keys(VERSION_ARGS)) {
      const path2 = resolveBundledBinary(name);
      if (!node_fs.existsSync(path2)) {
        missing.push(name);
        continue;
      }
      if (process.platform === "win32") {
        continue;
      }
      try {
        await promises.chmod(path2, 493);
        repaired.push(name);
      } catch (error2) {
        errors.push({ name, error: errorMessage(error2) });
      }
    }
    if (missing.length > 0) {
      const results = await binaryDownloaderService.downloadMissingBinaries();
      for (const result of results) {
        if (result.success) {
          downloaded.push(result.binary);
          const idx = missing.indexOf(result.binary);
          if (idx !== -1) {
            missing.splice(idx, 1);
          }
        } else if (result.error) {
          errors.push({ name: result.binary, error: result.error });
        }
      }
    }
    return { ok: true, repaired, downloaded, missing, errors };
  });
  require$$1.ipcMain.handle("system/download-binaries", async () => {
    const mainWindow2 = require$$1.BrowserWindow.getAllWindows()[0];
    const results = await binaryDownloaderService.downloadMissingBinaries((progress) => {
      if (mainWindow2) {
        mainWindow2.webContents.send("binary-download/progress", progress);
      }
    });
    return {
      ok: true,
      results,
      downloaded: results.filter((r) => r.success).map((r) => r.binary),
      failed: results.filter((r) => !r.success).map((r) => ({ binary: r.binary, error: r.error }))
    };
  });
  require$$1.ipcMain.handle("system/check-missing-binaries", async () => {
    const missing = await binaryDownloaderService.checkMissingBinaries();
    return { ok: true, missing };
  });
}
async function checkBinary(name) {
  const path2 = resolveBundledBinary(name);
  const exists = node_fs.existsSync(path2);
  const executable = exists ? isExecutable(path2) : false;
  if (!exists) {
    return { name, path: path2, exists, executable, version: null, error: "missing" };
  }
  if (!executable) {
    return { name, path: path2, exists, executable, version: null, error: "not_executable" };
  }
  try {
    const version = await getVersion(path2, VERSION_ARGS[name]);
    return { name, path: path2, exists, executable, version };
  } catch (error2) {
    return { name, path: path2, exists, executable, version: null, error: errorMessage(error2) };
  }
}
function isExecutable(path2) {
  if (process.platform === "win32") {
    return node_fs.existsSync(path2);
  }
  try {
    node_fs.accessSync(path2, node_fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
async function getVersion(path2, args) {
  return new Promise((resolve, reject) => {
    const child = require$$0$1.spawn(path2, args, { stdio: "pipe" });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", (error2) => {
      reject(error2);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`exit_code_${code ?? "unknown"}`));
        return;
      }
      const line = output.split("\n").find((entry) => entry.trim().length > 0);
      resolve(line ? line.trim() : null);
    });
  });
}
function errorMessage(error2) {
  return error2 instanceof Error ? error2.message : "unknown error";
}
class WhisperService {
  constructor() {
    this.logger = new Logger("WhisperService");
    this.cachedBackend = null;
  }
  /**
   * Get the best available whisper backend for this platform
   */
  getBackend() {
    if (!this.cachedBackend) {
      this.cachedBackend = detectBestWhisperBackend();
      this.logger.info("detected whisper backend", {
        backend: this.cachedBackend.backend,
        reason: this.cachedBackend.reason
      });
    }
    return this.cachedBackend;
  }
  /**
   * Check if any whisper backend is available
   */
  isAvailable() {
    return this.getBackend().backend !== "none";
  }
  async transcribe(request) {
    const backend = this.getBackend();
    this.logger.info("transcription requested", {
      audio: request.audioPath,
      backend: backend.backend,
      useGpu: request.useGpu ?? "default"
    });
    if (backend.backend === "none") {
      throw new Error(`No whisper backend available. ${backend.reason}`);
    }
    if (backend.backend === "faster-whisper") {
      return this.transcribeWithFasterWhisper(request, backend.command);
    }
    return this.transcribeWithWhisperCpp(request);
  }
  /**
   * Transcribe using whisper.cpp binary
   */
  async transcribeWithWhisperCpp(request) {
    const binaryPath = resolveBundledBinary("whisper");
    const outputDir = request.outputDir ?? require$$0.dirname(request.audioPath);
    const baseName = require$$0.parse(request.audioPath).name;
    const outputPrefix = require$$0.join(outputDir, baseName);
    const outputPath = `${outputPrefix}.txt`;
    try {
      node_fs.accessSync(binaryPath, node_fs.constants.X_OK);
    } catch {
      throw new Error(`whisper not executable at ${binaryPath}`);
    }
    node_fs.mkdirSync(outputDir, { recursive: true });
    await this.runProcess(
      binaryPath,
      this.buildWhisperCppArgs(request, outputPrefix),
      request.signal,
      request.onLog
    );
    if (!node_fs.existsSync(outputPath)) {
      throw new Error(`Transcription completed but output file not found: ${outputPath}`);
    }
    const transcript = node_fs.readFileSync(outputPath, "utf-8");
    return { transcript, outputPath };
  }
  /**
   * Transcribe using faster-whisper (Python-based)
   */
  async transcribeWithFasterWhisper(request, command) {
    if (command.length === 0) {
      throw new Error("faster-whisper command not configured");
    }
    const outputDir = request.outputDir ?? require$$0.dirname(request.audioPath);
    const baseName = require$$0.parse(request.audioPath).name;
    const outputPath = require$$0.join(outputDir, `${baseName}.txt`);
    node_fs.mkdirSync(outputDir, { recursive: true });
    const modelArg = this.resolveModelForFasterWhisper(request.modelPath, request.modelSize);
    const [cmd, ...baseArgs] = command;
    const args = [
      ...baseArgs,
      request.audioPath,
      "--model",
      modelArg,
      "--output_dir",
      outputDir,
      "--output_format",
      "txt"
    ];
    if (request.language) {
      args.push("--language", request.language);
    }
    if (request.useGpu === false) {
      args.push("--device", "cpu");
    }
    await this.runProcess(cmd, args, request.signal, request.onLog);
    if (!node_fs.existsSync(outputPath)) {
      throw new Error(`Transcription completed but output file not found: ${outputPath}`);
    }
    const transcript = node_fs.readFileSync(outputPath, "utf-8");
    return { transcript, outputPath };
  }
  /**
   * Build arguments for whisper.cpp
   */
  buildWhisperCppArgs(request, outputPrefix) {
    const args = [
      "-m",
      request.modelPath,
      "-f",
      request.audioPath,
      "-otxt",
      "-ovtt",
      "-of",
      outputPrefix
    ];
    if (request.language) {
      args.push("-l", request.language);
    }
    if (request.useGpu === false) {
      args.push("-ng");
    }
    return args;
  }
  /**
   * Resolve model argument for faster-whisper
   * Can be a model size name (tiny, base, small, medium, large-v3) or a path
   */
  resolveModelForFasterWhisper(modelPath, modelSize) {
    if (modelSize) {
      return modelSize;
    }
    const modelName = require$$0.basename(modelPath).toLowerCase();
    const sizePatterns = [
      { pattern: /large-v3/i, size: "large-v3" },
      { pattern: /large-v2/i, size: "large-v2" },
      { pattern: /large/i, size: "large" },
      { pattern: /medium/i, size: "medium" },
      { pattern: /small/i, size: "small" },
      { pattern: /base/i, size: "base" },
      { pattern: /tiny/i, size: "tiny" }
    ];
    for (const { pattern, size } of sizePatterns) {
      if (pattern.test(modelName)) {
        this.logger.info(`inferred model size '${size}' from path`);
        return size;
      }
    }
    if (node_fs.existsSync(modelPath)) {
      return modelPath;
    }
    this.logger.warn("could not infer model size, defaulting to base");
    return "base";
  }
  /**
   * Run a process with abort signal support
   */
  async runProcess(command, args, signal, onLog) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        const error2 = new Error("canceled");
        error2.name = "AbortError";
        reject(error2);
        return;
      }
      const child = require$$0$1.spawn(command, args, { stdio: "pipe" });
      let stderr = "";
      let settled = false;
      const finalize = (error2) => {
        if (settled) return;
        settled = true;
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        if (error2) {
          reject(error2);
        } else {
          resolve();
        }
      };
      const onAbort = () => {
        child.kill();
        const error2 = new Error("canceled");
        error2.name = "AbortError";
        finalize(error2);
      };
      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }
      child.stdout?.on("data", (chunk) => {
        const text = chunk.toString();
        onLog?.(text);
      });
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        onLog?.(text);
        stderr += text;
        if (stderr.length > 8e3) {
          stderr = stderr.slice(-8e3);
        }
      });
      child.on("error", (error2) => {
        finalize(error2);
      });
      child.on("close", (code) => {
        if (code === 0) {
          finalize();
        } else {
          finalize(new Error(stderr || `process exited with code ${code ?? "unknown"}`));
        }
      });
    });
  }
}
const ARCHIVAL_CRF_DEFAULTS = {
  hdr: {
    "8k": 30,
    // 8K HDR needs good quality, aggressive: 31 max
    "4k": 29,
    // Ultra-safe: 28, aggressive: 30 max
    "1440p": 28,
    // aggressive: 29 max
    "1080p": 28,
    // default 28, aggressive: 29 max
    "720p": 27,
    // aggressive: 28 max
    "480p": 27,
    "360p": 27,
    "240p": 26,
    // Lower CRF for very small resolutions to preserve detail
    "144p": 25
    // Very low res needs lower CRF to maintain any detail
  },
  sdr: {
    "8k": 31,
    // 8K SDR, aggressive: 32 max
    "4k": 30,
    // aggressive: 31 max
    "1440p": 31,
    // aggressive: 32 max
    "1080p": 29,
    // aggressive: 31-32 max
    "720p": 32,
    // default 32, aggressive: 34 max
    "480p": 34,
    // default 34
    "360p": 36,
    // default 36, aggressive: 37 max
    "240p": 38,
    // Higher CRF acceptable for very low resolution
    "144p": 40
    // Very low res, high CRF still looks acceptable
  }
};
const BITRATE_THRESHOLDS = {
  "8k": { low: 25e6, medium: 5e7 },
  // 25 Mbps / 50 Mbps
  "4k": { low: 8e6, medium: 15e6 },
  // 8 Mbps / 15 Mbps
  "1440p": { low: 4e6, medium: 8e6 },
  // 4 Mbps / 8 Mbps
  "1080p": { low: 25e5, medium: 5e6 },
  // 2.5 Mbps / 5 Mbps
  "720p": { low: 15e5, medium: 3e6 },
  // 1.5 Mbps / 3 Mbps
  "480p": { low: 8e5, medium: 15e5 },
  // 800 kbps / 1.5 Mbps
  "360p": { low: 4e5, medium: 8e5 },
  // 400 kbps / 800 kbps
  "240p": { low: 2e5, medium: 4e5 },
  // 200 kbps / 400 kbps
  "144p": { low: 1e5, medium: 2e5 }
  // 100 kbps / 200 kbps
};
function getBitrateAdjustedCrf(sourceInfo, baseCrf) {
  if (!sourceInfo.bitrate || sourceInfo.bitrate <= 0) {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
  const thresholds = BITRATE_THRESHOLDS[resolution];
  if (!thresholds) {
    return { adjustedCrf: baseCrf, adjustment: 0 };
  }
  const bitrateMbps = (sourceInfo.bitrate / 1e6).toFixed(1);
  if (sourceInfo.bitrate < thresholds.low) {
    const adjustment = 3;
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      // Cap at CRF 45
      adjustment,
      reason: `Low bitrate source (${bitrateMbps} Mbps) - raising CRF to avoid over-compression`
    };
  }
  if (sourceInfo.bitrate < thresholds.medium) {
    const adjustment = 1;
    return {
      adjustedCrf: Math.min(baseCrf + adjustment, 45),
      adjustment,
      reason: `Moderate bitrate source (${bitrateMbps} Mbps) - slight CRF adjustment`
    };
  }
  return { adjustedCrf: baseCrf, adjustment: 0 };
}
const DEFAULT_ARCHIVAL_CONFIG = {
  resolution: "source",
  colorMode: "auto",
  intelligentMode: true,
  // Auto-select optimal CRF based on source video
  codec: "av1",
  // Default to AV1 for best compression
  av1: {
    encoder: "libsvtav1",
    // Faster than libaom with excellent quality
    preset: 6,
    // SVT-AV1: 0-13, lower=slower/better. 6 is balanced
    keyframeInterval: 240,
    // ~8-10 seconds at 24-30fps
    sceneChangeDetection: true,
    // CRITICAL: prevents GOP crossing scene cuts
    filmGrainSynthesis: 10,
    // Helps with noisy footage, disable for screen recordings
    tune: 0,
    // VQ (visual quality) - best for archival viewing
    adaptiveQuantization: true,
    // Better detail in complex areas
    crf: 30,
    // Will be auto-adjusted based on resolution/HDR
    twoPass: false
    // Single-pass by default for faster encoding
  },
  h265: {
    encoder: "libx265",
    preset: "medium",
    // Balanced speed/quality for web delivery
    crf: 23,
    // Visually transparent for most content
    keyframeInterval: 250,
    // ~10 seconds, good for streaming
    bframes: 4,
    // Standard B-frame count for good compression
    twoPass: false
    // Single-pass by default for faster encoding
  },
  audioCopy: true,
  // Preserve original audio losslessly
  audioCodec: "aac",
  // AAC is best for H.265/MP4 web delivery
  audioBitrate: 160,
  // 160kbps for music, 128k for speech
  container: "mkv",
  // Best for AV1 + various audio formats
  preserveStructure: false,
  overwriteExisting: false,
  fillMode: false,
  deleteOriginal: false,
  // Safety: never auto-delete originals
  deleteOutputIfLarger: true,
  // Smart: delete output if it's larger than original
  extractThumbnail: false,
  // Disabled by default
  extractCaptions: false,
  // Disabled by default - uses Whisper for transcription
  threadLimit: 0
  // Use all available threads by default
};
({
  // Recommended: Good balance of quality and speed
  archive: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265
    }
  },
  // Maximum compression: Slower but smaller files (~3-5% smaller)
  "max-compression": {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265
    }
  },
  // Fast: Faster encoding, slightly larger files
  fast: {
    av1: {
      ...DEFAULT_ARCHIVAL_CONFIG.av1
    },
    h265: {
      ...DEFAULT_ARCHIVAL_CONFIG.h265
    }
  }
});
function getResolutionCategory(width, height) {
  if (!width || !height || width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
    return "1080p";
  }
  const pixels = Math.max(width, height);
  if (pixels >= 7680) return "8k";
  if (pixels >= 3840) return "4k";
  if (pixels >= 2560) return "1440p";
  if (pixels >= 1920) return "1080p";
  if (pixels >= 1280) return "720p";
  if (pixels >= 640) return "480p";
  if (pixels >= 360) return "360p";
  if (pixels >= 240) return "240p";
  return "144p";
}
function getOptimalCrf(sourceInfo, customMatrix, enableBitrateAdjustment = true) {
  const matrix = { ...ARCHIVAL_CRF_DEFAULTS, ...customMatrix };
  const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
  let baseCrf;
  if (sourceInfo.isHdr) {
    baseCrf = matrix.hdr[resolution] ?? matrix.hdr["1080p"];
  } else {
    baseCrf = matrix.sdr[resolution] ?? matrix.sdr["1080p"];
  }
  if (enableBitrateAdjustment && sourceInfo.bitrate) {
    const { adjustedCrf } = getBitrateAdjustedCrf(sourceInfo, baseCrf);
    return adjustedCrf;
  }
  return baseCrf;
}
function detectHdr(colorSpace, hdrFormat, bitDepth) {
  if (hdrFormat) {
    const hdrFormats = ["hdr10", "hdr10+", "hlg", "dolby vision", "dv", "pq"];
    if (hdrFormats.some((fmt) => hdrFormat.toLowerCase().includes(fmt))) {
      return true;
    }
  }
  if (colorSpace) {
    const hdrColorSpaces = ["bt2020", "rec2020", "smpte2084", "arib-std-b67"];
    if (hdrColorSpaces.some((cs) => colorSpace.toLowerCase().includes(cs))) {
      return true;
    }
  }
  if (bitDepth && bitDepth >= 10 && colorSpace?.toLowerCase().includes("2020")) {
    return true;
  }
  return false;
}
function classifyError(errorMessage2) {
  const lower = errorMessage2.toLowerCase();
  if (lower.includes("no space left") || lower.includes("disk full") || lower.includes("not enough space") || lower.includes("enospc")) {
    return "disk_full";
  }
  if (lower.includes("permission denied") || lower.includes("access denied") || lower.includes("eacces") || lower.includes("eperm")) {
    return "permission_denied";
  }
  if (lower.includes("no such file") || lower.includes("file not found") || lower.includes("enoent") || lower.includes("does not exist")) {
    return "file_not_found";
  }
  if (lower.includes("decoder") || lower.includes("codec not found") || lower.includes("unsupported codec") || lower.includes("unknown encoder")) {
    return "codec_unsupported";
  }
  if (lower.includes("invalid data") || lower.includes("corrupt") || lower.includes("moov atom not found") || lower.includes("invalid nal unit")) {
    return "corrupt_input";
  }
  if (lower.includes("encoder") || lower.includes("encoding") || lower.includes("svtav1") || lower.includes("libaom")) {
    return "encoder_error";
  }
  if (lower.includes("cancel") || lower.includes("abort") || lower.includes("killed")) {
    return "cancelled";
  }
  return "unknown";
}
function getH265Level(width, height) {
  const lumaSamples = width * height;
  if (lumaSamples > 8912896) {
    return 62;
  } else if (lumaSamples > 2228224) {
    return 51;
  } else if (lumaSamples > 983040) {
    return 41;
  }
  return 40;
}
function buildArchivalFFmpegArgs(inputPath, outputPath, config, sourceInfo, cpuCapabilities) {
  if (config.codec === "h265") {
    return buildH265FFmpegArgs(inputPath, outputPath, config, sourceInfo, cpuCapabilities);
  }
  return buildAv1FFmpegArgs(inputPath, outputPath, config, sourceInfo);
}
function isTwoPassEnabled(config) {
  if (config.codec === "h265") {
    return config.h265.twoPass === true;
  }
  if (config.av1.encoder === "libaom-av1") {
    return config.av1.twoPass === true;
  }
  return false;
}
function buildTwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogDir, cpuCapabilities) {
  const { basename, join } = require("node:path");
  const inputName = basename(inputPath, require("node:path").extname(inputPath));
  const passLogFile = join(passLogDir, `${inputName}-pass`);
  if (config.codec === "h265") {
    return buildH265TwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogFile, cpuCapabilities);
  }
  return buildAv1TwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogFile);
}
function buildAv1TwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogFile) {
  const options = config.av1;
  const encoder = options.encoder;
  const effectiveCrf = config.intelligentMode ? getOptimalCrf(sourceInfo) : options.crf;
  const pass1 = [];
  pass1.push("-i", inputPath);
  if (config.threadLimit > 0) {
    pass1.push("-threads", String(config.threadLimit));
  }
  pass1.push("-c:v", encoder);
  pass1.push("-crf", effectiveCrf.toString());
  if (encoder === "libaom-av1") {
    pass1.push("-cpu-used", options.preset.toString());
    pass1.push(...buildLibaomParams(options, sourceInfo));
    pass1.push("-pass", "1");
    pass1.push("-passlogfile", passLogFile);
  }
  if (sourceInfo.isHdr) {
    pass1.push(...buildHdrArgs(sourceInfo));
  } else {
    pass1.push("-pix_fmt", "yuv420p");
  }
  pass1.push("-an");
  pass1.push("-f", "null");
  pass1.push("-y");
  pass1.push(process.platform === "win32" ? "NUL" : "/dev/null");
  const pass2 = [];
  pass2.push("-i", inputPath);
  if (config.threadLimit > 0) {
    pass2.push("-threads", String(config.threadLimit));
  }
  pass2.push("-c:v", encoder);
  pass2.push("-crf", effectiveCrf.toString());
  if (encoder === "libaom-av1") {
    pass2.push("-cpu-used", options.preset.toString());
    pass2.push(...buildLibaomParams(options, sourceInfo));
    pass2.push("-pass", "2");
    pass2.push("-passlogfile", passLogFile);
  }
  if (sourceInfo.isHdr) {
    pass2.push(...buildHdrArgs(sourceInfo));
  } else {
    pass2.push("-pix_fmt", "yuv420p");
  }
  const needsWebmAudioReencode = config.container === "webm" && config.audioCopy && !isWebmCompatibleAudio(sourceInfo.audioCodec);
  const needsMp4AudioReencode = config.container === "mp4" && config.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsWebmAudioReencode) {
    pass2.push("-c:a", "libopus");
    pass2.push("-b:a", `${config.audioBitrate ?? 128}k`);
    pass2.push("-ar", "48000");
  } else if (needsMp4AudioReencode) {
    pass2.push("-c:a", "aac");
    pass2.push("-b:a", `${config.audioBitrate ?? 192}k`);
  } else if (config.audioCopy) {
    pass2.push("-c:a", "copy");
  } else {
    pass2.push(...buildAudioArgs(config));
  }
  pass2.push("-map", "0:v:0");
  pass2.push("-map", "0:a?");
  if (config.container === "mp4") {
    pass2.push("-movflags", "+faststart");
  }
  pass2.push("-y");
  pass2.push(outputPath);
  return { pass1, pass2, passLogFile };
}
function buildH265TwoPassArgs(inputPath, outputPath, config, sourceInfo, passLogFile, cpuCapabilities) {
  const options = config.h265;
  let effectiveCrf;
  if (config.intelligentMode) {
    const av1OptimalCrf = getOptimalCrf(sourceInfo);
    effectiveCrf = Math.max(18, Math.min(28, av1OptimalCrf - 7));
  } else {
    effectiveCrf = options.crf;
  }
  const pass1 = [];
  pass1.push("-i", inputPath);
  if (config.threadLimit > 0) {
    pass1.push("-threads", String(config.threadLimit));
  }
  pass1.push("-c:v", options.encoder);
  pass1.push("-crf", effectiveCrf.toString());
  pass1.push("-preset", options.preset);
  const x265ParamsPass1 = buildX265ParamsWithPass(options, sourceInfo, 1, passLogFile, cpuCapabilities);
  if (x265ParamsPass1) {
    pass1.push("-x265-params", x265ParamsPass1);
  }
  if (options.tune) {
    pass1.push("-tune", options.tune);
  }
  if (sourceInfo.isHdr) {
    pass1.push(...buildHdrArgsH265(sourceInfo));
  } else {
    pass1.push("-pix_fmt", "yuv420p");
  }
  pass1.push("-an");
  pass1.push("-f", "null");
  pass1.push("-y");
  pass1.push(process.platform === "win32" ? "NUL" : "/dev/null");
  const pass2 = [];
  pass2.push("-i", inputPath);
  if (config.threadLimit > 0) {
    pass2.push("-threads", String(config.threadLimit));
  }
  pass2.push("-c:v", options.encoder);
  pass2.push("-crf", effectiveCrf.toString());
  pass2.push("-preset", options.preset);
  const x265ParamsPass2 = buildX265ParamsWithPass(options, sourceInfo, 2, passLogFile, cpuCapabilities);
  if (x265ParamsPass2) {
    pass2.push("-x265-params", x265ParamsPass2);
  }
  if (options.tune) {
    pass2.push("-tune", options.tune);
  }
  if (sourceInfo.isHdr) {
    pass2.push(...buildHdrArgsH265(sourceInfo));
  } else {
    pass2.push("-pix_fmt", "yuv420p");
  }
  const needsMp4AudioReencode = config.container === "mp4" && config.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsMp4AudioReencode) {
    pass2.push("-c:a", "aac");
    pass2.push("-b:a", `${config.audioBitrate ?? 192}k`);
  } else if (config.audioCopy) {
    pass2.push("-c:a", "copy");
  } else {
    pass2.push(...buildAudioArgs(config));
  }
  pass2.push("-map", "0:v:0");
  pass2.push("-map", "0:a?");
  if (config.container === "mp4") {
    pass2.push("-movflags", "+faststart");
    pass2.push("-tag:v", "hvc1");
  }
  pass2.push("-y");
  pass2.push(outputPath);
  return { pass1, pass2, passLogFile };
}
function buildX265ParamsWithPass(options, sourceInfo, passNumber, statsFile, cpuCapabilities) {
  const params = [];
  params.push(`pass=${passNumber}`);
  params.push(`stats=${statsFile}.log`);
  const vbvMaxrate = estimateVbvMaxrate(sourceInfo.width, sourceInfo.height, sourceInfo.frameRate);
  params.push(`vbv-maxrate=${vbvMaxrate}`);
  params.push(`vbv-bufsize=${vbvMaxrate * 2}`);
  params.push(`keyint=${options.keyframeInterval}`);
  params.push(`min-keyint=${Math.min(options.keyframeInterval, 25)}`);
  params.push(`bframes=${options.bframes}`);
  params.push("scenecut=40");
  params.push("ref=4");
  params.push("rc-lookahead=40");
  params.push("sao=1");
  if (sourceInfo.isHdr) {
    params.push("hdr10=1");
    params.push("hdr10-opt=1");
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay);
    if (masterDisplayStr) {
      params.push(`master-display=${masterDisplayStr}`);
    }
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel);
    if (maxCllStr) {
      params.push(`max-cll=${maxCllStr}`);
    }
  }
  params.push("aq-mode=3");
  const level = getH265Level(sourceInfo.width, sourceInfo.height);
  params.push(`level-idc=${level}`);
  if (cpuCapabilities?.avx512) {
    params.push("asm=avx512");
  }
  return params.join(":");
}
function estimateVbvMaxrate(width, height, frameRate) {
  const pixels = width * height;
  const fps = frameRate || 30;
  let baseBitrate;
  if (pixels >= 3840 * 2160) {
    baseBitrate = 4e4;
  } else if (pixels >= 2560 * 1440) {
    baseBitrate = 2e4;
  } else if (pixels >= 1920 * 1080) {
    baseBitrate = 12e3;
  } else if (pixels >= 1280 * 720) {
    baseBitrate = 8e3;
  } else {
    baseBitrate = 4e3;
  }
  if (fps > 30) {
    baseBitrate = Math.round(baseBitrate * (fps / 30));
  }
  return baseBitrate;
}
function buildAv1FFmpegArgs(inputPath, outputPath, config, sourceInfo) {
  const args = [];
  args.push("-i", inputPath);
  if (config.threadLimit > 0) {
    args.push("-threads", String(config.threadLimit));
  }
  const encoder = config.av1.encoder;
  args.push("-c:v", encoder);
  const effectiveCrf = config.intelligentMode ? getOptimalCrf(sourceInfo) : config.av1.crf;
  args.push("-crf", effectiveCrf.toString());
  if (encoder === "libsvtav1") {
    args.push("-preset", config.av1.preset.toString());
    const svtParams = buildSvtAv1Params(config.av1, sourceInfo);
    if (svtParams) {
      args.push("-svtav1-params", svtParams);
    }
  } else {
    args.push("-cpu-used", config.av1.preset.toString());
    args.push(...buildLibaomParams(config.av1, sourceInfo));
  }
  if (sourceInfo.isHdr) {
    args.push(...buildHdrArgs(sourceInfo));
  } else {
    args.push("-pix_fmt", "yuv420p");
  }
  const needsWebmAudioReencode = config.container === "webm" && config.audioCopy && !isWebmCompatibleAudio(sourceInfo.audioCodec);
  const needsMp4AudioReencode = config.container === "mp4" && config.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsWebmAudioReencode) {
    args.push("-c:a", "libopus");
    args.push("-b:a", `${config.audioBitrate ?? 128}k`);
    args.push("-ar", "48000");
  } else if (needsMp4AudioReencode) {
    args.push("-c:a", "aac");
    args.push("-b:a", `${config.audioBitrate ?? 192}k`);
  } else if (config.audioCopy) {
    args.push("-c:a", "copy");
  } else {
    args.push(...buildAudioArgs(config));
  }
  args.push("-map", "0:v:0");
  args.push("-map", "0:a?");
  if (config.container === "mp4") {
    args.push("-movflags", "+faststart");
  }
  args.push("-y");
  args.push(outputPath);
  return args;
}
function buildH265FFmpegArgs(inputPath, outputPath, config, sourceInfo, cpuCapabilities) {
  const args = [];
  args.push("-i", inputPath);
  if (config.threadLimit > 0) {
    args.push("-threads", String(config.threadLimit));
  }
  args.push("-c:v", config.h265.encoder);
  let effectiveCrf;
  if (config.intelligentMode) {
    const av1OptimalCrf = getOptimalCrf(sourceInfo);
    effectiveCrf = Math.max(18, Math.min(28, av1OptimalCrf - 7));
  } else {
    effectiveCrf = config.h265.crf;
  }
  args.push("-crf", effectiveCrf.toString());
  args.push("-preset", config.h265.preset);
  const x265Params = buildX265Params(config.h265, sourceInfo, cpuCapabilities);
  if (x265Params) {
    args.push("-x265-params", x265Params);
  }
  if (config.h265.tune) {
    args.push("-tune", config.h265.tune);
  }
  if (sourceInfo.isHdr) {
    args.push(...buildHdrArgsH265(sourceInfo));
  } else {
    args.push("-pix_fmt", "yuv420p");
  }
  const needsMp4AudioReencode = config.container === "mp4" && config.audioCopy && isPcmAudio(sourceInfo.audioCodec);
  if (needsMp4AudioReencode) {
    args.push("-c:a", "aac");
    args.push("-b:a", `${config.audioBitrate ?? 192}k`);
  } else if (config.audioCopy) {
    args.push("-c:a", "copy");
  } else {
    args.push(...buildAudioArgs(config));
  }
  args.push("-map", "0:v:0");
  args.push("-map", "0:a?");
  if (config.container === "mp4") {
    args.push("-movflags", "+faststart");
  }
  if (config.container === "mp4") {
    args.push("-tag:v", "hvc1");
  }
  args.push("-y");
  args.push(outputPath);
  return args;
}
function buildLibaomParams(options, sourceInfo) {
  const args = [];
  args.push("-g", options.keyframeInterval.toString());
  if (options.sceneChangeDetection) {
    args.push("-sc_threshold", "40");
  } else {
    args.push("-sc_threshold", "0");
  }
  if (sourceInfo.width >= 1920) {
    args.push("-tile-columns", "2");
    args.push("-tile-rows", "1");
  }
  args.push("-row-mt", "1");
  if (options.adaptiveQuantization) {
    args.push("-aq-mode", "1");
  }
  if (sourceInfo.isHdr) {
    args.push("-enable-cdef", "1");
  }
  args.push("-usage", "good");
  args.push("-lag-in-frames", "48");
  args.push("-auto-alt-ref", "1");
  return args;
}
function buildSvtAv1Params(options, sourceInfo) {
  const params = [];
  params.push(`keyint=${options.keyframeInterval}`);
  if (options.sceneChangeDetection) {
    params.push("scd=1");
  } else {
    params.push("scd=0");
  }
  if (options.filmGrainSynthesis > 0) {
    params.push(`film-grain=${options.filmGrainSynthesis}`);
    params.push("film-grain-denoise=1");
  }
  params.push(`tune=${options.tune}`);
  if (options.adaptiveQuantization) {
    params.push("enable-qm=1");
    params.push("aq-mode=2");
  }
  params.push("lookahead=120");
  if (sourceInfo.isHdr) {
    params.push("enable-hdr=1");
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay);
    if (masterDisplayStr) {
      params.push(`mastering-display=${masterDisplayStr}`);
    }
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel);
    if (maxCllStr) {
      params.push(`content-light=${maxCllStr}`);
    }
  }
  params.push("fast-decode=0");
  params.push("enable-tf=1");
  return params.join(":");
}
function buildX265Params(options, sourceInfo, cpuCapabilities) {
  const params = [];
  params.push(`keyint=${options.keyframeInterval}`);
  params.push(`min-keyint=${Math.min(options.keyframeInterval, 25)}`);
  params.push(`bframes=${options.bframes}`);
  params.push("scenecut=40");
  params.push("ref=4");
  params.push("rc-lookahead=40");
  params.push("sao=1");
  if (sourceInfo.isHdr) {
    params.push("hdr10=1");
    params.push("hdr10-opt=1");
    const masterDisplayStr = buildMasterDisplayString(sourceInfo.masteringDisplay);
    if (masterDisplayStr) {
      params.push(`master-display=${masterDisplayStr}`);
    }
    const maxCllStr = buildMaxCllString(sourceInfo.contentLightLevel);
    if (maxCllStr) {
      params.push(`max-cll=${maxCllStr}`);
    }
  }
  params.push("aq-mode=3");
  const level = getH265Level(sourceInfo.width, sourceInfo.height);
  params.push(`level-idc=${level}`);
  if (cpuCapabilities?.avx512) {
    params.push("asm=avx512");
  }
  return params.join(":");
}
function buildMasterDisplayString(metadata) {
  if (!metadata) return null;
  if (!metadata.greenX || !metadata.blueX || !metadata.redX) return null;
  const maxL = Math.round(metadata.maxLuminance * 1e4);
  const minL = Math.round(metadata.minLuminance * 1e4);
  return `G(${metadata.greenX},${metadata.greenY})B(${metadata.blueX},${metadata.blueY})R(${metadata.redX},${metadata.redY})WP(${metadata.whitePointX},${metadata.whitePointY})L(${maxL},${minL})`;
}
function buildMaxCllString(metadata) {
  if (!metadata) return null;
  if (metadata.maxCll === 0 && metadata.maxFall === 0) return null;
  return `${metadata.maxCll},${metadata.maxFall}`;
}
function buildHdrArgsH265(sourceInfo) {
  const args = [];
  args.push("-pix_fmt", "yuv420p10le");
  if (sourceInfo.colorPrimaries || sourceInfo.colorTransfer || sourceInfo.colorMatrix) {
    if (sourceInfo.colorPrimaries) {
      args.push("-color_primaries", sourceInfo.colorPrimaries);
    }
    if (sourceInfo.colorTransfer) {
      args.push("-color_trc", sourceInfo.colorTransfer);
    }
    if (sourceInfo.colorMatrix) {
      args.push("-colorspace", sourceInfo.colorMatrix);
    }
  } else if (sourceInfo.colorSpace) {
    const colorParams = parseColorSpace(sourceInfo.colorSpace);
    if (colorParams.primaries) {
      args.push("-color_primaries", colorParams.primaries);
    }
    if (colorParams.transfer) {
      args.push("-color_trc", colorParams.transfer);
    }
    if (colorParams.matrix) {
      args.push("-colorspace", colorParams.matrix);
    }
  } else {
    args.push("-color_primaries", "bt2020");
    args.push("-color_trc", "smpte2084");
    args.push("-colorspace", "bt2020nc");
  }
  return args;
}
function buildHdrArgs(sourceInfo) {
  const args = [];
  args.push("-pix_fmt", "yuv420p10le");
  if (sourceInfo.colorPrimaries || sourceInfo.colorTransfer || sourceInfo.colorMatrix) {
    if (sourceInfo.colorPrimaries) {
      args.push("-color_primaries", sourceInfo.colorPrimaries);
    }
    if (sourceInfo.colorTransfer) {
      args.push("-color_trc", sourceInfo.colorTransfer);
    }
    if (sourceInfo.colorMatrix) {
      args.push("-colorspace", sourceInfo.colorMatrix);
    }
  } else if (sourceInfo.colorSpace) {
    const colorParams = parseColorSpace(sourceInfo.colorSpace);
    if (colorParams.primaries) {
      args.push("-color_primaries", colorParams.primaries);
    }
    if (colorParams.transfer) {
      args.push("-color_trc", colorParams.transfer);
    }
    if (colorParams.matrix) {
      args.push("-colorspace", colorParams.matrix);
    }
  } else {
    args.push("-color_primaries", "bt2020");
    args.push("-color_trc", "smpte2084");
    args.push("-colorspace", "bt2020nc");
  }
  return args;
}
function parseColorSpace(colorSpace) {
  const lower = colorSpace.toLowerCase();
  if (lower.includes("bt2020") || lower.includes("rec2020") || lower.includes("2020")) {
    return {
      primaries: "bt2020",
      transfer: lower.includes("hlg") ? "arib-std-b67" : "smpte2084",
      matrix: "bt2020nc"
    };
  }
  if (lower.includes("bt709") || lower.includes("rec709") || lower.includes("709")) {
    return {
      primaries: "bt709",
      transfer: "bt709",
      matrix: "bt709"
    };
  }
  if (lower.includes("pq") || lower.includes("smpte2084") || lower.includes("2084")) {
    return {
      primaries: "bt2020",
      transfer: "smpte2084",
      matrix: "bt2020nc"
    };
  }
  if (lower.includes("hlg") || lower.includes("arib") || lower.includes("b67")) {
    return {
      primaries: "bt2020",
      transfer: "arib-std-b67",
      matrix: "bt2020nc"
    };
  }
  return {};
}
function isWebmCompatibleAudio(audioCodec) {
  if (!audioCodec) return false;
  const codec = audioCodec.toLowerCase();
  return codec === "opus" || codec === "vorbis";
}
function isPcmAudio(audioCodec) {
  if (!audioCodec) return false;
  const codec = audioCodec.toLowerCase();
  return codec.startsWith("pcm_");
}
function buildAudioArgs(config) {
  const args = [];
  switch (config.audioCodec) {
    case "opus":
      args.push("-c:a", "libopus");
      args.push("-b:a", `${config.audioBitrate ?? 128}k`);
      args.push("-ar", "48000");
      break;
    case "flac":
      args.push("-c:a", "flac");
      break;
    case "aac":
      args.push("-c:a", "aac");
      args.push("-b:a", `${config.audioBitrate ?? 192}k`);
      break;
    default:
      args.push("-c:a", "copy");
  }
  return args;
}
function describeArchivalSettings(config, sourceInfo) {
  const lines = [];
  lines.push(`Codec: ${config.codec === "h265" ? "H.265/HEVC" : "AV1"}`);
  if (config.codec === "h265") {
    lines.push(`Encoder: libx265`);
    lines.push(`Preset: ${config.h265.preset}`);
    if (sourceInfo) {
      const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
      lines.push(`Resolution: ${sourceInfo.width}x${sourceInfo.height} (${resolution})`);
      lines.push(`CRF: ${config.h265.crf}`);
      lines.push(`Frame Rate: ${sourceInfo.frameRate.toFixed(2)} fps`);
      lines.push(`Color: ${sourceInfo.isHdr ? "HDR (10-bit)" : "SDR (8-bit)"}`);
    } else {
      lines.push(`CRF: ${config.h265.crf}`);
    }
    lines.push(`GOP Size: ${config.h265.keyframeInterval} frames`);
    lines.push(`B-frames: ${config.h265.bframes}`);
    if (config.h265.tune) {
      lines.push(`Tune: ${config.h265.tune}`);
    }
  } else {
    const encoder = config.av1.encoder;
    const encoderName = encoder === "libsvtav1" ? "SVT-AV1 (libsvtav1)" : "libaom-av1";
    lines.push(`Encoder: ${encoderName}`);
    lines.push(`Preset: ${config.av1.preset} (${describePreset(config.av1.preset, encoder)})`);
    if (sourceInfo) {
      const effectiveCrf = getOptimalCrf(sourceInfo);
      const resolution = getResolutionCategory(sourceInfo.width, sourceInfo.height);
      lines.push(`Resolution: ${sourceInfo.width}x${sourceInfo.height} (${resolution})`);
      lines.push(`CRF: ${effectiveCrf} (${sourceInfo.isHdr ? "HDR" : "SDR"} profile)`);
      lines.push(`Frame Rate: ${sourceInfo.frameRate.toFixed(2)} fps`);
      lines.push(`Color: ${sourceInfo.isHdr ? "HDR (10-bit)" : "SDR (8-bit)"}`);
    } else {
      lines.push(`CRF: ${config.av1.crf} (auto-adjusted per video)`);
    }
    lines.push(`GOP Size: ${config.av1.keyframeInterval} frames (scene-aware)`);
    if (encoder === "libsvtav1") {
      lines.push(`Film Grain: ${config.av1.filmGrainSynthesis > 0 ? `Level ${config.av1.filmGrainSynthesis}` : "Disabled"}`);
    }
  }
  let audioDesc;
  if (config.audioCopy) {
    const needsWebmReencode = config.container === "webm" && sourceInfo && !isWebmCompatibleAudio(sourceInfo.audioCodec);
    const needsMp4Reencode = config.container === "mp4" && sourceInfo && isPcmAudio(sourceInfo.audioCodec);
    if (needsWebmReencode) {
      audioDesc = `Opus (re-encoded for WebM, source: ${sourceInfo.audioCodec || "unknown"})`;
    } else if (needsMp4Reencode) {
      audioDesc = `AAC (re-encoded for MP4, source: ${sourceInfo.audioCodec || "PCM"})`;
    } else {
      audioDesc = "Copy (lossless)";
    }
  } else {
    audioDesc = config.audioCodec?.toUpperCase() ?? "Copy";
  }
  lines.push(`Audio: ${audioDesc}`);
  lines.push(`Container: ${config.container.toUpperCase()}`);
  return lines.join("\n");
}
function describePreset(preset, encoder) {
  if (encoder === "libsvtav1") {
    if (preset <= 2) return "Very Slow - Maximum Quality";
    if (preset <= 4) return "Slow - High Quality";
    if (preset <= 6) return "Balanced Quality/Speed";
    if (preset <= 8) return "Fast - Good Quality";
    if (preset <= 10) return "Very Fast - Acceptable Quality";
    return "Ultra Fast - Lower Quality";
  } else {
    if (preset <= 1) return "Very Slow - Maximum Quality";
    if (preset <= 3) return "Slow - High Quality";
    if (preset <= 5) return "Balanced Quality/Speed";
    if (preset <= 6) return "Fast - Good Quality";
    return "Very Fast - Acceptable Quality";
  }
}
function estimateArchivalFileSize(sourceInfo, crf) {
  const baseBitrateKbps = 2500;
  const pixels = sourceInfo.width * sourceInfo.height;
  const basePixels = 1920 * 1080;
  const resolutionFactor = pixels / basePixels;
  const baseFps = 30;
  const fpsFactor = sourceInfo.frameRate / baseFps;
  const crfDiff = crf - 30;
  const crfFactor = Math.pow(0.87, crfDiff);
  const hdrFactor = sourceInfo.isHdr ? 1.2 : 1;
  const estimatedBitrateKbps = baseBitrateKbps * resolutionFactor * fpsFactor * crfFactor * hdrFactor;
  const durationSeconds = sourceInfo.duration;
  const estimatedBits = estimatedBitrateKbps * 1e3 * durationSeconds;
  const estimatedMB = estimatedBits / 8 / 1024 / 1024;
  return {
    minMB: Math.round(estimatedMB * 0.6),
    maxMB: Math.round(estimatedMB * 1.5),
    estimatedMB: Math.round(estimatedMB)
  };
}
const logger = new Logger("EncoderDetector");
let cachedEncoderInfo = null;
async function detectAv1Encoders() {
  if (cachedEncoderInfo) {
    return cachedEncoderInfo;
  }
  const ffmpegPath = resolveBundledBinary("ffmpeg");
  const available = [];
  const h265Available = [];
  try {
    const encoders = await getEncoderList(ffmpegPath);
    if (encoders.includes("libaom-av1")) {
      available.push("libaom-av1");
    }
    if (encoders.includes("libsvtav1")) {
      available.push("libsvtav1");
    }
    if (encoders.includes("libx265")) {
      h265Available.push("libx265");
    }
  } catch {
  }
  let recommended = null;
  if (available.includes("libsvtav1")) {
    recommended = "libsvtav1";
  } else if (available.includes("libaom-av1")) {
    recommended = "libaom-av1";
  }
  const canUpgrade = !available.includes("libsvtav1") && (process.platform === "darwin" || process.platform === "win32");
  cachedEncoderInfo = {
    available,
    recommended,
    hasAv1Support: available.length > 0,
    h265Available,
    hasH265Support: h265Available.length > 0,
    canUpgrade
  };
  return cachedEncoderInfo;
}
async function getBestEncoder(preferred) {
  const info = await detectAv1Encoders();
  if (!info.hasAv1Support) {
    return null;
  }
  if (preferred && info.available.includes(preferred)) {
    return preferred;
  }
  return info.recommended;
}
function clearEncoderCache() {
  cachedEncoderInfo = null;
}
function getEncoderList(ffmpegPath) {
  return new Promise((resolve, reject) => {
    const proc = require$$0$1.spawn(ffmpegPath, ["-encoders", "-hide_banner"]);
    let stdout = "";
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}`));
        return;
      }
      const encoders = [];
      const lines = stdout.split("\n");
      for (const line of lines) {
        const match = line.match(/^\s*V[.\w]+\s+(\S+)/);
        if (match) {
          encoders.push(match[1]);
        }
      }
      resolve(encoders);
    });
    proc.on("error", reject);
  });
}
const FFMPEG_DOWNLOAD_URLS = {
  // macOS arm64 (Apple Silicon) - evermeet.cx builds include SVT-AV1
  "darwin-arm64": {
    url: "https://evermeet.cx/ffmpeg/ffmpeg-7.1.1.zip",
    type: "zip"
  },
  // macOS x64 (Intel)
  "darwin-x64": {
    url: "https://evermeet.cx/ffmpeg/ffmpeg-7.1.1.zip",
    type: "zip"
  },
  // Windows x64 - gyan.dev builds include SVT-AV1
  "win32-x64": {
    url: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
    type: "zip"
  }
};
async function upgradeFFmpeg(onProgress) {
  const platform2 = process.platform;
  const arch = process.arch;
  const key = `${platform2}-${arch}`;
  const downloadInfo = FFMPEG_DOWNLOAD_URLS[key];
  if (!downloadInfo) {
    return {
      success: false,
      error: `No FFmpeg upgrade available for ${platform2}-${arch}`
    };
  }
  const binaryDir = getBundledBinaryDir();
  const ffmpegPath = resolveBundledBinary("ffmpeg");
  const backupPath = `${ffmpegPath}.backup`;
  const tempDir = require$$0.join(binaryDir, ".ffmpeg-upgrade-temp");
  try {
    await promises.mkdir(tempDir, { recursive: true });
    onProgress?.({ stage: "downloading", progress: 0 });
    logger.info("Downloading enhanced FFmpeg", { url: downloadInfo.url });
    const downloadPath = require$$0.join(tempDir, `ffmpeg-download.${downloadInfo.type}`);
    await downloadFile(downloadInfo.url, downloadPath, (progress) => {
      onProgress?.({ stage: "downloading", progress });
    });
    onProgress?.({ stage: "extracting" });
    logger.info("Extracting FFmpeg");
    const extractedBinary = await extractFFmpeg(downloadPath, tempDir, downloadInfo.type, platform2);
    if (!extractedBinary) {
      throw new Error("Failed to find FFmpeg binary in downloaded archive");
    }
    onProgress?.({ stage: "installing" });
    logger.info("Installing enhanced FFmpeg");
    if (node_fs.existsSync(ffmpegPath)) {
      await promises.rename(ffmpegPath, backupPath);
    }
    await promises.rename(extractedBinary, ffmpegPath);
    if (platform2 !== "win32") {
      await promises.chmod(ffmpegPath, 493);
    }
    onProgress?.({ stage: "verifying" });
    logger.info("Verifying new FFmpeg");
    clearEncoderCache();
    const newInfo = await detectAv1Encoders();
    if (!newInfo.available.includes("libsvtav1")) {
      logger.warn("New FFmpeg does not have SVT-AV1, restoring backup");
      if (node_fs.existsSync(backupPath)) {
        await promises.rm(ffmpegPath, { force: true });
        await promises.rename(backupPath, ffmpegPath);
      }
      throw new Error("Downloaded FFmpeg does not include SVT-AV1 encoder");
    }
    if (node_fs.existsSync(backupPath)) {
      await promises.rm(backupPath, { force: true });
    }
    await promises.rm(tempDir, { recursive: true, force: true });
    onProgress?.({ stage: "complete" });
    logger.info("FFmpeg upgrade complete", { encoders: newInfo.available });
    return { success: true };
  } catch (error2) {
    const message = error2 instanceof Error ? error2.message : "Unknown error";
    logger.error("FFmpeg upgrade failed", { error: message });
    if (node_fs.existsSync(backupPath)) {
      try {
        await promises.rm(ffmpegPath, { force: true });
        await promises.rename(backupPath, ffmpegPath);
      } catch {
      }
    }
    try {
      await promises.rm(tempDir, { recursive: true, force: true });
    } catch {
    }
    onProgress?.({ stage: "error", error: message });
    return { success: false, error: message };
  }
}
async function downloadFile(url, destPath, onProgress) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Drapp/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const contentLength = Number(response.headers.get("content-length") || 0);
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }
  const writer = node_fs.createWriteStream(destPath);
  let downloadedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      writer.write(Buffer.from(value));
      downloadedBytes += value.length;
      if (contentLength > 0) {
        onProgress?.(Math.round(downloadedBytes / contentLength * 100));
      }
    }
  } finally {
    writer.end();
    await new Promise((resolve) => writer.on("finish", resolve));
  }
}
async function extractFFmpeg(archivePath, tempDir, type2, platform2) {
  const binaryName = platform2 === "win32" ? "ffmpeg.exe" : "ffmpeg";
  if (type2 === "zip") {
    const extractDir = require$$0.join(tempDir, "extracted");
    await promises.mkdir(extractDir, { recursive: true });
    await new Promise((resolve, reject) => {
      let proc;
      if (platform2 === "win32") {
        proc = require$$0$1.spawn("powershell", [
          "-Command",
          `Expand-Archive -Path "${archivePath}" -DestinationPath "${extractDir}" -Force`
        ]);
      } else {
        proc = require$$0$1.spawn("unzip", ["-o", archivePath, "-d", extractDir]);
      }
      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Extraction failed with code ${code}`));
        }
      });
      proc.on("error", reject);
    });
    return findBinaryInDir(extractDir, binaryName);
  }
  return null;
}
async function findBinaryInDir(dir, binaryName) {
  const { readdir, stat: stat2 } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = require$$0.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = await findBinaryInDir(fullPath, binaryName);
      if (found) return found;
    } else if (entry.name === binaryName || entry.name.toLowerCase() === binaryName.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}
const STATE_FILE_NAME = "archival-queue-state.json";
const CURRENT_VERSION = 1;
class ArchivalStatePersistence {
  // 30 seconds for periodic saves during encoding
  constructor() {
    this.logger = new Logger("ArchivalStatePersistence");
    this.saveDebounceTimer = null;
    this.saveDebounceMs = 3e4;
    this.statePath = require$$0.join(require$$1.app.getPath("userData"), STATE_FILE_NAME);
  }
  /**
   * Save state to disk immediately
   */
  async saveState(state) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    try {
      const stateWithMeta = {
        ...state,
        version: CURRENT_VERSION,
        savedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await promises.writeFile(this.statePath, JSON.stringify(stateWithMeta, null, 2), "utf-8");
      this.logger.debug("State saved", { itemCount: state.job.items.length });
    } catch (error2) {
      this.logger.error("Failed to save state", { error: error2 });
      throw error2;
    }
  }
  /**
   * Schedule a debounced save (used during encoding for periodic saves)
   * The save will be executed after saveDebounceMs unless another save is triggered
   */
  scheduleSave(state) {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveDebounceTimer = null;
      void this.saveState(state);
    }, this.saveDebounceMs);
  }
  /**
   * Cancel any pending debounced save
   */
  cancelPendingSave() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
  }
  /**
   * Load state from disk
   * Returns null if no state file exists or if it's corrupted
   */
  async loadState() {
    try {
      const content = await promises.readFile(this.statePath, "utf-8");
      const state = JSON.parse(content);
      if (state.version !== CURRENT_VERSION) {
        this.logger.warn("State file version mismatch, discarding", {
          fileVersion: state.version,
          currentVersion: CURRENT_VERSION
        });
        await this.clearState();
        return null;
      }
      if (!state.job || !state.job.id || !Array.isArray(state.job.items)) {
        this.logger.warn("State file is corrupted, discarding");
        await this.clearState();
        return null;
      }
      this.logger.info("State loaded", {
        jobId: state.job.id,
        itemCount: state.job.items.length,
        savedAt: state.savedAt
      });
      return state;
    } catch (error2) {
      if (error2.code === "ENOENT") {
        return null;
      }
      this.logger.warn("Failed to load state", { error: error2 });
      return null;
    }
  }
  /**
   * Clear state file from disk
   */
  async clearState() {
    this.cancelPendingSave();
    try {
      await promises.unlink(this.statePath);
      this.logger.debug("State file cleared");
    } catch (error2) {
      if (error2.code !== "ENOENT") {
        this.logger.warn("Failed to clear state", { error: error2 });
      }
    }
  }
  /**
   * Check if a persisted state file exists
   */
  async hasPersistedState() {
    try {
      await promises.access(this.statePath);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get the path to the state file (for debugging/logging)
   */
  getStatePath() {
    return this.statePath;
  }
}
const execAsync = require$$0$2.promisify(require$$0$1.exec);
class ArchivalService {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.logger = new Logger("ArchivalService");
    this.metadata = new MetadataService();
    this.whisperService = new WhisperService();
    this.persistence = new ArchivalStatePersistence();
    this.activeJob = null;
    this.activeProcess = null;
    this.abortController = null;
    this.fillModeSeenOutputs = null;
    this.isPaused = false;
    this.currentEncodingItemId = null;
    this.encodingStartTime = 0;
    this.speedSamples = [];
    this.maxSpeedSamples = 10;
    this.cpuCapabilities = null;
    this.cpuCapabilitiesDetected = false;
    this.whisperModelPathGetter = null;
    this.whisperProviderGetter = null;
    this.whisperGpuEnabledGetter = null;
  }
  /**
   * Detect and cache CPU SIMD capabilities
   * Called lazily on first encoding job
   */
  async ensureCpuCapabilities() {
    if (this.cpuCapabilitiesDetected) {
      return this.cpuCapabilities;
    }
    try {
      this.cpuCapabilities = await detectCPUSIMDCapabilities();
      this.cpuCapabilitiesDetected = true;
      if (this.cpuCapabilities) {
        this.logger.info("CPU capabilities detected", {
          architecture: this.cpuCapabilities.architecture,
          avx512: this.cpuCapabilities.avx512,
          avx2: this.cpuCapabilities.avx2,
          neon: this.cpuCapabilities.neon,
          sve: this.cpuCapabilities.sve,
          model: this.cpuCapabilities.cpuModel
        });
      }
    } catch (error2) {
      this.logger.warn("Failed to detect CPU capabilities", { error: error2 });
      this.cpuCapabilitiesDetected = true;
    }
    return this.cpuCapabilities;
  }
  /**
   * Set the function to get the Whisper model path from settings
   * This is called from the IPC handler to inject the settings getter
   */
  setWhisperModelPathGetter(getter) {
    this.whisperModelPathGetter = getter;
  }
  /**
   * Set the function to get the Whisper provider settings
   * This is called from the IPC handler to inject the settings getter
   */
  setWhisperProviderGetter(getter) {
    this.whisperProviderGetter = getter;
  }
  /**
   * Set the function to get the Whisper GPU enabled setting
   * GPU acceleration is only available on Apple Silicon (Metal)
   */
  setWhisperGpuEnabledGetter(getter) {
    this.whisperGpuEnabledGetter = getter;
  }
  /**
   * Get available AV1 encoders
   * Useful for UI to show available options
   */
  async getAvailableEncoders() {
    return detectAv1Encoders();
  }
  /**
   * Check if there's enough disk space for the encoding job
   * Returns estimated required space and available space
   */
  async checkDiskSpace(outputDir, inputPaths) {
    let totalInputSize = 0;
    for (const inputPath of inputPaths) {
      try {
        const inputStat = await promises.stat(inputPath);
        totalInputSize += inputStat.size;
      } catch {
      }
    }
    const estimatedOutputSize = Math.ceil(totalInputSize * 0.7);
    const safetyMargin = Math.ceil(estimatedOutputSize * 0.1);
    const requiredSpace = estimatedOutputSize + safetyMargin;
    try {
      const freeSpace = await this.getFreeDiskSpace(outputDir);
      return {
        ok: freeSpace >= requiredSpace,
        requiredBytes: requiredSpace,
        availableBytes: freeSpace,
        safetyMarginBytes: safetyMargin
      };
    } catch (error2) {
      this.logger.warn("Could not check disk space", { error: error2 });
      return {
        ok: true,
        requiredBytes: requiredSpace,
        availableBytes: Number.MAX_SAFE_INTEGER,
        safetyMarginBytes: safetyMargin
      };
    }
  }
  /**
   * Get free disk space for a given path
   * Uses platform-specific commands
   */
  async getFreeDiskSpace(dirPath) {
    const os2 = os$1.platform();
    if (os2 === "win32") {
      const driveMatch = dirPath.match(/^([A-Za-z]):/);
      const isUncPath = dirPath.startsWith("\\\\");
      if (driveMatch) {
        const driveLetter = driveMatch[1];
        try {
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive ${driveLetter}).Free"`,
            { timeout: 5e3 }
          );
          const freeBytes = parseInt(stdout.trim(), 10);
          if (!isNaN(freeBytes)) {
            return freeBytes;
          }
        } catch {
          try {
            const { stdout } = await execAsync(
              `wmic logicaldisk where "DeviceID='${driveLetter}:'" get FreeSpace /value`,
              { timeout: 5e3 }
            );
            const match = stdout.match(/FreeSpace=(\d+)/);
            if (match) {
              return parseInt(match[1], 10);
            }
          } catch {
          }
        }
      } else if (isUncPath) {
        try {
          const escapedPath = dirPath.replace(/\\/g, "\\\\");
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { '${escapedPath}'.StartsWith($_.Root) } | Select-Object -First 1).Free"`,
            { timeout: 5e3 }
          );
          const freeBytes = parseInt(stdout.trim(), 10);
          if (!isNaN(freeBytes)) {
            return freeBytes;
          }
        } catch {
        }
      } else {
        try {
          const { stdout } = await execAsync(
            `powershell -Command "(Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Name -eq (Get-Location).Drive.Name } | Select-Object -First 1).Free"`,
            { timeout: 5e3 }
          );
          const freeBytes = parseInt(stdout.trim(), 10);
          if (!isNaN(freeBytes)) {
            return freeBytes;
          }
        } catch {
        }
      }
    } else {
      try {
        const { stdout } = await execAsync(`df -k "${dirPath}" | tail -1`, { timeout: 5e3 });
        const parts = stdout.trim().split(/\s+/);
        const freeKB = parseInt(parts[3], 10);
        if (!isNaN(freeKB)) {
          return freeKB * 1024;
        }
      } catch {
      }
    }
    throw new Error("Could not determine free disk space");
  }
  /**
   * Start a batch archival job
   */
  async startBatch(inputPaths, outputDir, configOverrides, folderRoot, relativePaths) {
    if (this.activeJob && this.activeJob.status === "running") {
      throw new Error("Another archival job is already running");
    }
    await this.persistence.clearState();
    if (!inputPaths || inputPaths.length === 0) {
      throw new Error("No input files provided");
    }
    if (!outputDir || outputDir.trim() === "") {
      throw new Error("No output directory provided");
    }
    try {
      await promises.mkdir(outputDir, { recursive: true });
    } catch (error2) {
      throw new Error(`Failed to create output directory: ${outputDir}`);
    }
    const diskCheck = await this.checkDiskSpace(outputDir, inputPaths);
    if (!diskCheck.ok) {
      const requiredGB = (diskCheck.requiredBytes / (1024 * 1024 * 1024)).toFixed(1);
      const availableGB = (diskCheck.availableBytes / (1024 * 1024 * 1024)).toFixed(1);
      throw new Error(
        `Not enough disk space. Need approximately ${requiredGB} GB but only ${availableGB} GB available.`
      );
    }
    const config = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...configOverrides,
      outputDir
    };
    if (config.fillMode) {
      config.overwriteExisting = false;
    }
    this.fillModeSeenOutputs = config.fillMode ? /* @__PURE__ */ new Set() : null;
    const bestEncoder = await getBestEncoder(config.av1.encoder);
    if (!bestEncoder) {
      throw new Error(
        "No AV1 encoder available. The bundled FFmpeg does not support libaom-av1 or libsvtav1."
      );
    }
    if (bestEncoder !== config.av1.encoder) {
      this.logger.info(`Encoder ${config.av1.encoder} not available, using ${bestEncoder}`);
      config.av1 = { ...config.av1, encoder: bestEncoder };
    }
    const batchId = require$$1$1.randomUUID();
    const items = inputPaths.map((inputPath, index) => ({
      id: require$$1$1.randomUUID(),
      inputPath,
      outputPath: this.buildOutputPath(
        inputPath,
        outputDir,
        config,
        relativePaths?.[index]
      ),
      status: "queued",
      progress: 0
    }));
    if (!config.fillMode) {
      this.deduplicateOutputPaths(items);
    }
    this.activeJob = {
      id: batchId,
      items,
      config,
      status: "pending",
      totalItems: items.length,
      completedItems: 0,
      failedItems: 0,
      skippedItems: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      // Initialize batch-level tracking
      totalDurationSeconds: 0,
      processedDurationSeconds: 0,
      batchEtaSeconds: void 0,
      averageSpeed: void 0,
      estimatedTotalOutputBytes: diskCheck.requiredBytes,
      actualOutputBytes: 0
    };
    this.speedSamples = [];
    void this.processQueue();
    return this.activeJob;
  }
  /**
   * Get current job status
   */
  getStatus() {
    return this.activeJob;
  }
  /**
   * Cancel the active batch job
   */
  cancel() {
    if (!this.activeJob || this.activeJob.status !== "running") {
      return false;
    }
    this.abortController?.abort();
    this.activeJob.status = "cancelled";
    if (this.activeProcess) {
      if (os$1.platform() === "win32") {
        this.activeProcess.kill();
      } else {
        this.activeProcess.kill("SIGTERM");
      }
      this.activeProcess = null;
    }
    void this.persistence.clearState();
    return true;
  }
  /**
   * Pause the active batch job immediately
   * Kills the current FFmpeg process and saves state for later resume
   */
  async pause() {
    if (!this.activeJob || this.activeJob.status !== "running") {
      return false;
    }
    this.logger.info("Pausing encoding job", { jobId: this.activeJob.id });
    this.isPaused = true;
    if (this.activeProcess) {
      if (os$1.platform() === "win32") {
        this.activeProcess.kill();
      } else {
        this.activeProcess.kill("SIGTERM");
      }
      this.activeProcess = null;
    }
    if (this.currentEncodingItemId) {
      const currentItem = this.activeJob.items.find((i) => i.id === this.currentEncodingItemId);
      if (currentItem && currentItem.status === "encoding") {
        await this.cleanupPartialOutput(currentItem.outputPath);
        currentItem.status = "queued";
        currentItem.progress = 0;
        currentItem.startedAt = void 0;
        currentItem.encodingSpeed = void 0;
        currentItem.etaSeconds = void 0;
        currentItem.elapsedSeconds = void 0;
      }
    }
    await this.saveCurrentState();
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: "",
      kind: "queue_paused",
      queueState: "paused"
    });
    this.logger.info("Encoding job paused", { jobId: this.activeJob.id });
    return true;
  }
  /**
   * Resume a paused batch job
   */
  async resume() {
    if (!this.activeJob || !this.isPaused) {
      return false;
    }
    this.logger.info("Resuming encoding job", { jobId: this.activeJob.id });
    this.isPaused = false;
    const remainingInputPaths = this.activeJob.items.filter((i) => i.status === "queued").map((i) => i.inputPath);
    if (remainingInputPaths.length > 0) {
      const diskCheck = await this.checkDiskSpace(this.activeJob.config.outputDir, remainingInputPaths);
      if (!diskCheck.ok) {
        this.logger.error("Not enough disk space to resume", { diskCheck });
        this.isPaused = true;
        throw new Error("Not enough disk space to resume encoding");
      }
    }
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: "",
      kind: "queue_resumed",
      queueState: "running"
    });
    void this.processQueue();
    return true;
  }
  /**
   * Check if a job is currently paused
   */
  getIsPaused() {
    return this.isPaused;
  }
  /**
   * Check if there's a recoverable state from a previous crash or exit
   * Returns null if there's already an active job (nothing to recover)
   */
  async checkForRecovery() {
    if (this.activeJob && (this.activeJob.status === "running" || this.isPaused)) {
      return null;
    }
    try {
      const state = await this.persistence.loadState();
      if (state && state.job.status === "running") {
        this.logger.info("Found recoverable job state", {
          jobId: state.job.id,
          totalItems: state.job.totalItems,
          completedItems: state.job.completedItems,
          savedAt: state.savedAt
        });
        return state;
      }
      return null;
    } catch (error2) {
      this.logger.warn("Failed to check for recovery state", { error: error2 });
      return null;
    }
  }
  /**
   * Resume from a recovered state after crash/restart
   * Validates files and restarts the queue
   */
  async resumeFromRecovery(state) {
    if (this.activeJob && this.activeJob.status === "running") {
      throw new Error("Another archival job is already running");
    }
    this.logger.info("Resuming from recovery state", { jobId: state.job.id });
    this.activeJob = state.job;
    for (const item of this.activeJob.items) {
      if (item.status === "encoding" || item.status === "analyzing") {
        await this.cleanupPartialOutput(item.outputPath);
        item.status = "queued";
        item.progress = 0;
        item.startedAt = void 0;
        item.encodingSpeed = void 0;
        item.etaSeconds = void 0;
        item.elapsedSeconds = void 0;
      }
      if (item.status === "queued") {
        try {
          await promises.access(item.inputPath);
        } catch {
          item.status = "failed";
          item.error = "Source file no longer exists";
          item.errorType = "file_not_found";
          item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
          this.activeJob.failedItems++;
          this.logger.warn("Source file missing during recovery", { inputPath: item.inputPath });
        }
      }
    }
    if (state.twoPassState) {
      try {
        await promises.rm(state.twoPassState.passLogDir, { recursive: true, force: true });
        this.logger.debug("Cleaned up two-pass log files", { dir: state.twoPassState.passLogDir });
      } catch {
      }
    }
    this.speedSamples = [];
    this.isPaused = false;
    try {
      await promises.access(this.activeJob.config.outputDir);
    } catch {
      this.activeJob = null;
      throw new Error("Output directory no longer exists or is not accessible");
    }
    const remainingInputPaths = this.activeJob.items.filter((i) => i.status === "queued").map((i) => i.inputPath);
    if (remainingInputPaths.length > 0) {
      const diskCheck = await this.checkDiskSpace(this.activeJob.config.outputDir, remainingInputPaths);
      if (!diskCheck.ok) {
        this.activeJob = null;
        throw new Error("Not enough disk space to resume encoding");
      }
    }
    void this.processQueue();
    return this.activeJob;
  }
  /**
   * Discard a recovered state and clean up
   */
  async discardRecovery(state) {
    this.logger.info("Discarding recovery state", { jobId: state.job.id });
    for (const item of state.job.items) {
      if (item.status === "encoding" || item.status === "analyzing") {
        await this.cleanupPartialOutput(item.outputPath);
      }
    }
    if (state.twoPassState) {
      try {
        await promises.rm(state.twoPassState.passLogDir, { recursive: true, force: true });
      } catch {
      }
    }
    await this.persistence.clearState();
    this.logger.info("Recovery state discarded");
  }
  /**
   * Check if there's an active job (running or paused)
   */
  hasActiveJob() {
    return this.activeJob !== null && (this.activeJob.status === "running" || this.isPaused);
  }
  /**
   * Save current state for graceful shutdown or crash recovery
   */
  async saveCurrentState() {
    if (!this.activeJob) return;
    const state = {
      version: 1,
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      job: this.activeJob,
      currentItemId: this.currentEncodingItemId
    };
    await this.persistence.saveState(state);
    this.logger.debug("State saved", { jobId: this.activeJob.id });
  }
  /**
   * Preview the FFmpeg command for a single file
   */
  async previewCommand(inputPath, outputDir, configOverrides) {
    const config = {
      ...DEFAULT_ARCHIVAL_CONFIG,
      ...configOverrides,
      outputDir
    };
    const sourceInfo = await this.analyzeVideo(inputPath);
    const outputPath = this.buildOutputPath(inputPath, outputDir, config);
    const command = buildArchivalFFmpegArgs(inputPath, outputPath, config, sourceInfo);
    const description = describeArchivalSettings(config, sourceInfo);
    return { command, description, sourceInfo };
  }
  /**
   * Get estimated output size for a video
   */
  async estimateSize(inputPath) {
    const sourceInfo = await this.analyzeVideo(inputPath);
    const effectiveCrf = getOptimalCrf(sourceInfo);
    const estimate = estimateArchivalFileSize(sourceInfo, effectiveCrf);
    return {
      sourceInfo,
      effectiveCrf,
      ...estimate
    };
  }
  /**
   * Get batch info including total duration and existing files count
   * Used for pre-flight checks before starting encoding
   */
  async getBatchInfo(inputPaths, outputDir) {
    let totalDurationSeconds = 0;
    let totalInputBytes = 0;
    let existingCount = 0;
    const containerExtensions = ["mkv", "mp4", "webm"];
    for (const inputPath of inputPaths) {
      try {
        const inputStat = await promises.stat(inputPath);
        totalInputBytes += inputStat.size;
        const meta = await this.metadata.extract({ filePath: inputPath });
        if (meta.duration) {
          totalDurationSeconds += meta.duration;
        }
        const inputName = require$$0.basename(inputPath, require$$0.extname(inputPath));
        for (const ext of containerExtensions) {
          const outputPath = require$$0.join(outputDir, `${inputName}.${ext}`);
          try {
            await promises.access(outputPath);
            existingCount++;
            break;
          } catch {
          }
        }
      } catch {
      }
    }
    return {
      totalDurationSeconds,
      totalInputBytes,
      existingCount
    };
  }
  /**
   * Process the job queue
   */
  async processQueue() {
    if (!this.activeJob) return;
    this.activeJob.status = "running";
    if (!this.activeJob.startedAt) {
      this.activeJob.startedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.abortController = new AbortController();
    for (const item of this.activeJob.items) {
      if (item.status === "completed" || item.status === "failed" || item.status === "skipped") {
        continue;
      }
      if (this.isPaused) {
        this.logger.info("Queue paused, stopping processing");
        this.abortController = null;
        return;
      }
      if (this.abortController.signal.aborted) {
        item.status = "cancelled";
        continue;
      }
      this.currentEncodingItemId = item.id;
      await this.saveCurrentState();
      try {
        await this.processItem(item);
      } catch (error2) {
        this.logger.error("Failed to process item", {
          itemId: item.id,
          error: error2 instanceof Error ? error2.message : "Unknown error"
        });
      }
      await this.saveCurrentState();
    }
    this.currentEncodingItemId = null;
    const finalStatus = this.abortController.signal.aborted ? "cancelled" : "completed";
    this.activeJob.status = finalStatus;
    this.activeJob.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: "",
      kind: "batch_complete",
      // Include final stats for UI
      processedItems: this.activeJob.completedItems,
      totalItems: this.activeJob.totalItems
    });
    await this.persistence.clearState();
    this.abortController = null;
    this.fillModeSeenOutputs = null;
    this.isPaused = false;
  }
  /**
   * Process a single item in the batch
   */
  async processItem(item) {
    if (!this.activeJob) return;
    item.status = "analyzing";
    item.startedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: item.id,
      kind: "item_start",
      status: "analyzing"
    });
    try {
      if (this.activeJob.config.fillMode) {
        const shouldSkip = await this.shouldSkipForFillMode(item.outputPath);
        if (shouldSkip) {
          this.logger.info("Skipping due to name conflict (fill mode)", {
            outputPath: item.outputPath
          });
          this.markItemSkipped(item);
          return;
        }
      }
      await promises.access(item.inputPath);
      const inputStat = await promises.stat(item.inputPath);
      item.inputSize = inputStat.size;
      const sourceInfo = await this.analyzeVideo(item.inputPath);
      item.sourceInfo = sourceInfo;
      item.effectiveCrf = getOptimalCrf(sourceInfo);
      if (!this.activeJob.config.overwriteExisting) {
        try {
          await promises.access(item.outputPath);
          this.logger.info("Skipping existing output", { outputPath: item.outputPath });
          this.markItemSkipped(item);
          return;
        } catch {
        }
      }
      await promises.mkdir(require$$0.dirname(item.outputPath), { recursive: true });
      item.status = "encoding";
      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: "item_progress",
        progress: 0,
        status: "encoding",
        sourceInfo,
        effectiveCrf: item.effectiveCrf
      });
      await this.encodeVideo(item, sourceInfo);
      const outputStat = await promises.stat(item.outputPath);
      item.outputSize = outputStat.size;
      item.compressionRatio = item.inputSize ? item.inputSize / item.outputSize : void 0;
      const outputLarger = item.inputSize && item.outputSize > item.inputSize;
      if (outputLarger && this.activeJob.config.deleteOutputIfLarger) {
        await this.cleanupPartialOutput(item.outputPath);
        item.status = "skipped";
        item.error = `Output (${this.formatBytes(item.outputSize)}) larger than input (${this.formatBytes(item.inputSize)})`;
        item.errorType = "output_larger";
        item.outputDeleted = true;
        item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
        this.activeJob.skippedItems++;
        this.emitEvent({
          batchId: this.activeJob.id,
          itemId: item.id,
          kind: "item_complete",
          progress: 100,
          status: "skipped",
          error: item.error,
          errorType: "output_larger",
          outputSize: item.outputSize,
          compressionRatio: item.compressionRatio
        });
        this.logger.info("Skipped - output larger than input", {
          input: require$$0.basename(item.inputPath),
          inputSize: item.inputSize,
          outputSize: item.outputSize
        });
        return;
      }
      if (this.activeJob) {
        this.activeJob.actualOutputBytes = (this.activeJob.actualOutputBytes ?? 0) + item.outputSize;
        if (sourceInfo.duration) {
          this.activeJob.processedDurationSeconds = (this.activeJob.processedDurationSeconds ?? 0) + sourceInfo.duration;
        }
      }
      if (this.activeJob.config.extractThumbnail) {
        try {
          const thumbnailPath = await this.extractThumbnail(
            item.outputPath,
            sourceInfo,
            this.activeJob.config.thumbnailTimestamp
          );
          item.thumbnailPath = thumbnailPath;
        } catch (thumbnailError) {
          this.logger.warn("Thumbnail extraction failed, continuing without thumbnail", {
            input: item.inputPath,
            error: thumbnailError instanceof Error ? thumbnailError.message : "Unknown error"
          });
        }
      }
      if (this.activeJob.config.extractCaptions) {
        try {
          const captionPath = await this.extractCaptions(
            item.outputPath,
            this.activeJob.config.captionLanguage
          );
          item.captionPath = captionPath;
        } catch (captionError) {
          this.logger.warn("Caption extraction failed, continuing without captions", {
            input: item.inputPath,
            error: captionError instanceof Error ? captionError.message : "Unknown error"
          });
        }
      }
      if (this.activeJob.config.deleteOriginal) {
        try {
          await promises.unlink(item.inputPath);
          item.originalDeleted = true;
          this.logger.info("Deleted original file", { inputPath: item.inputPath });
        } catch (deleteError) {
          this.logger.warn("Failed to delete original file", {
            inputPath: item.inputPath,
            error: deleteError instanceof Error ? deleteError.message : "Unknown error"
          });
        }
      }
      item.status = "completed";
      item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      item.progress = 100;
      this.activeJob.completedItems++;
      const warningMsg = outputLarger ? ` (WARNING: output larger than input)` : "";
      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: "item_complete",
        progress: 100,
        status: "completed",
        outputSize: item.outputSize,
        compressionRatio: item.compressionRatio,
        thumbnailPath: item.thumbnailPath,
        captionPath: item.captionPath
      });
      this.logger.info(`Completed archival encoding${warningMsg}`, {
        input: require$$0.basename(item.inputPath),
        output: require$$0.basename(item.outputPath),
        ratio: item.compressionRatio?.toFixed(2),
        outputLarger
      });
    } catch (error2) {
      const message = error2 instanceof Error ? error2.message : "Unknown error";
      const errorType = error2.errorType ?? classifyError(message);
      item.status = "failed";
      item.error = message;
      item.errorType = errorType;
      item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.activeJob.failedItems++;
      this.emitEvent({
        batchId: this.activeJob.id,
        itemId: item.id,
        kind: "item_error",
        status: "failed",
        error: message,
        errorType
      });
      this.logger.error("Failed to encode", {
        input: item.inputPath,
        error: message,
        errorType
      });
    }
  }
  /**
   * Analyze video to get source info
   */
  async analyzeVideo(filePath) {
    const meta = await this.metadata.extract({ filePath });
    const extendedMeta = await this.getExtendedMetadata(filePath);
    const isHdr = detectHdr(
      extendedMeta.colorSpace,
      extendedMeta.hdrFormat,
      extendedMeta.bitDepth
    );
    const container = require$$0.extname(filePath).toLowerCase().replace(".", "") || void 0;
    return {
      width: meta.width ?? 1920,
      height: meta.height ?? 1080,
      frameRate: meta.fps ?? 30,
      duration: meta.duration ?? 0,
      bitDepth: extendedMeta.bitDepth,
      colorSpace: extendedMeta.colorSpace,
      hdrFormat: extendedMeta.hdrFormat,
      isHdr,
      bitrate: meta.bitrate ?? void 0,
      videoCodec: extendedMeta.videoCodec,
      audioCodec: extendedMeta.audioCodec,
      container,
      // HDR10 static metadata
      masteringDisplay: extendedMeta.masteringDisplay,
      contentLightLevel: extendedMeta.contentLightLevel,
      // Individual color components for precise encoder configuration
      colorPrimaries: extendedMeta.colorPrimaries,
      colorTransfer: extendedMeta.colorTransfer,
      colorMatrix: extendedMeta.colorMatrix
    };
  }
  /**
   * Get extended metadata including HDR info, HDR10 static metadata, and audio codec
   */
  async getExtendedMetadata(filePath) {
    const ffprobePath = resolveBundledBinary("ffprobe");
    return new Promise((resolve) => {
      const proc = require$$0$1.spawn(ffprobePath, [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        "-show_frames",
        "-read_intervals",
        "%+#1",
        // Read first frame for side_data
        filePath
      ]);
      let stdout = "";
      proc.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      proc.on("close", () => {
        try {
          const parsed = JSON.parse(stdout);
          const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
          const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");
          if (!videoStream) {
            resolve({ audioCodec: audioStream?.codec_name, videoCodec: void 0 });
            return;
          }
          const videoCodec = videoStream.codec_name;
          const bitDepth = videoStream.bits_per_raw_sample ? parseInt(videoStream.bits_per_raw_sample, 10) : void 0;
          const colorPrimaries = videoStream.color_primaries;
          const colorTransfer = videoStream.color_transfer;
          const colorMatrix = videoStream.color_space;
          const colorParts = [colorPrimaries, colorTransfer, colorMatrix].filter(Boolean);
          const colorSpace = colorParts.length > 0 ? colorParts.join("/") : void 0;
          let hdrFormat = null;
          let masteringDisplay;
          let contentLightLevel;
          const allSideData = [
            ...videoStream.side_data_list || [],
            ...parsed.frames?.[0]?.side_data_list || []
          ];
          for (const sideData of allSideData) {
            const sideDataType = sideData.side_data_type?.toLowerCase() || "";
            if (sideDataType.includes("mastering display") || sideDataType.includes("hdr")) {
              if (!hdrFormat) hdrFormat = "HDR10";
              if (sideData.red_x && sideData.green_x && sideData.blue_x) {
                const parseCoord = (val) => {
                  if (!val) return 0;
                  if (val.includes("/")) {
                    const [num, den] = val.split("/");
                    return Math.round(parseInt(num, 10) / parseInt(den, 10) * 5e4);
                  }
                  return parseInt(val, 10);
                };
                const parseLuminance = (val) => {
                  if (!val) return 0;
                  if (val.includes("/")) {
                    const [num, den] = val.split("/");
                    return parseInt(num, 10) / parseInt(den, 10);
                  }
                  return parseFloat(val);
                };
                masteringDisplay = {
                  redX: parseCoord(sideData.red_x),
                  redY: parseCoord(sideData.red_y),
                  greenX: parseCoord(sideData.green_x),
                  greenY: parseCoord(sideData.green_y),
                  blueX: parseCoord(sideData.blue_x),
                  blueY: parseCoord(sideData.blue_y),
                  whitePointX: parseCoord(sideData.white_point_x),
                  whitePointY: parseCoord(sideData.white_point_y),
                  maxLuminance: parseLuminance(sideData.max_luminance),
                  minLuminance: parseLuminance(sideData.min_luminance)
                };
              }
            }
            if (sideDataType.includes("content light level")) {
              if (sideData.max_content !== void 0 && sideData.max_average !== void 0) {
                contentLightLevel = {
                  maxCll: sideData.max_content,
                  maxFall: sideData.max_average
                };
              }
            }
            if (sideDataType.includes("dolby")) {
              hdrFormat = "Dolby Vision";
            }
          }
          if (!hdrFormat && colorTransfer) {
            const transfer = colorTransfer.toLowerCase();
            if (transfer.includes("smpte2084") || transfer.includes("pq")) {
              hdrFormat = "HDR10";
            } else if (transfer.includes("arib-std-b67") || transfer.includes("hlg")) {
              hdrFormat = "HLG";
            }
          }
          const audioCodec = audioStream?.codec_name;
          resolve({
            bitDepth,
            colorSpace,
            hdrFormat,
            videoCodec,
            audioCodec,
            colorPrimaries,
            colorTransfer,
            colorMatrix,
            masteringDisplay,
            contentLightLevel
          });
        } catch {
          resolve({});
        }
      });
      proc.on("error", () => resolve({}));
    });
  }
  /**
   * Encode video using FFmpeg with SVT-AV1 or H.265
   * Supports both single-pass and two-pass encoding
   */
  async encodeVideo(item, sourceInfo) {
    if (!this.activeJob) {
      throw new Error("No active job");
    }
    const config = this.activeJob.config;
    const cpuCapabilities = await this.ensureCpuCapabilities();
    if (isTwoPassEnabled(config)) {
      await this.encodeTwoPass(item, sourceInfo, cpuCapabilities);
    } else {
      await this.encodeSinglePass(item, sourceInfo, cpuCapabilities);
    }
  }
  /**
   * Perform two-pass encoding
   */
  async encodeTwoPass(item, sourceInfo, cpuCapabilities) {
    if (!this.activeJob) {
      throw new Error("No active job");
    }
    const config = this.activeJob.config;
    const batchId = this.activeJob.id;
    const passLogDir = require$$0.join(require$$0.dirname(item.outputPath), ".pass-logs");
    await promises.mkdir(passLogDir, { recursive: true });
    try {
      const twoPassArgs = buildTwoPassArgs(
        item.inputPath,
        item.outputPath,
        config,
        sourceInfo,
        passLogDir,
        cpuCapabilities
      );
      this.logger.info("Starting two-pass encoding - Pass 1", { input: require$$0.basename(item.inputPath) });
      this.emitEvent({
        batchId,
        itemId: item.id,
        kind: "item_progress",
        progress: 0,
        status: "encoding"
      });
      await this.runFFmpegPass(item, sourceInfo, twoPassArgs.pass1, 1, batchId);
      if (this.abortController?.signal.aborted) {
        throw new Error("Encoding cancelled");
      }
      this.logger.info("Starting two-pass encoding - Pass 2", { input: require$$0.basename(item.inputPath) });
      await this.runFFmpegPass(item, sourceInfo, twoPassArgs.pass2, 2, batchId);
    } finally {
      try {
        await promises.rm(passLogDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
  /**
   * Run a single FFmpeg pass (for two-pass encoding)
   */
  runFFmpegPass(item, sourceInfo, args, passNumber, batchId) {
    return new Promise((resolve, reject) => {
      const ffmpegPath = resolveBundledBinary("ffmpeg");
      const fullArgs = ["-progress", "pipe:1", "-nostats", ...args];
      const isPass2 = passNumber === 2;
      const outputPath = isPass2 ? item.outputPath : null;
      this.logger.debug(`Starting FFmpeg pass ${passNumber}`, { args: fullArgs.join(" ") });
      const proc = require$$0$1.spawn(ffmpegPath, fullArgs, { stdio: ["ignore", "pipe", "pipe"] });
      this.activeProcess = proc;
      const startTime = Date.now();
      const durationMs = (sourceInfo.duration ?? 0) * 1e3;
      sourceInfo.duration ?? 0;
      let lastProgressUpdate = 0;
      proc.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        let encodedTimeMs = null;
        for (const line of lines) {
          if (line.startsWith("out_time_ms=")) {
            const timeMs = parseInt(line.split("=")[1], 10);
            if (!isNaN(timeMs)) {
              encodedTimeMs = timeMs;
            }
          }
          if (line.startsWith("out_time=")) {
            const timeStr = line.split("=")[1];
            const timeMs = this.parseTimeToMs(timeStr);
            if (timeMs !== null) {
              encodedTimeMs = timeMs;
            }
          }
        }
        if (encodedTimeMs !== null) {
          const now = Date.now();
          const elapsedMs = now - startTime;
          const elapsedSeconds = elapsedMs / 1e3;
          let passProgress;
          if (durationMs > 0) {
            passProgress = Math.min(99, Math.max(0, Math.round(encodedTimeMs / durationMs * 100)));
          } else {
            passProgress = Math.min(99, Math.round(elapsedSeconds / 60));
          }
          const overallProgress = passNumber === 1 ? Math.round(passProgress / 2) : 50 + Math.round(passProgress / 2);
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now;
            item.progress = overallProgress;
            this.emitEvent({
              batchId,
              itemId: item.id,
              kind: "item_progress",
              progress: overallProgress,
              status: "encoding",
              elapsedSeconds
            });
          }
        }
      });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (stderr.length > 8192) {
          stderr = stderr.slice(-8192);
        }
      });
      proc.on("close", (code) => {
        this.activeProcess = null;
        if (code === 0) {
          resolve();
        } else if (this.abortController?.signal.aborted) {
          if (outputPath) {
            void this.cleanupPartialOutput(outputPath);
          }
          const error2 = new Error("Encoding cancelled");
          error2.errorType = "cancelled";
          reject(error2);
        } else {
          if (outputPath) {
            void this.cleanupPartialOutput(outputPath);
          }
          const errorPatterns = [
            /Error[^\n]*/i,
            /error[^\n]*/i,
            /Invalid[^\n]*/i
          ];
          let errorMsg = `FFmpeg pass ${passNumber} exited with code ${code}`;
          for (const pattern of errorPatterns) {
            const match = stderr.match(pattern);
            if (match) {
              errorMsg = match[0].trim();
              break;
            }
          }
          const errorType = classifyError(stderr || errorMsg);
          const error2 = new Error(errorMsg);
          error2.errorType = errorType;
          reject(error2);
        }
      });
      proc.on("error", (error2) => {
        this.activeProcess = null;
        if (outputPath) {
          void this.cleanupPartialOutput(outputPath);
        }
        const typedError = error2;
        typedError.errorType = classifyError(error2.message);
        reject(typedError);
      });
      const abortHandler = () => {
        if (os$1.platform() === "win32") {
          proc.kill();
        } else {
          proc.kill("SIGTERM");
        }
      };
      if (this.abortController) {
        this.abortController.signal.addEventListener("abort", abortHandler, { once: true });
      }
    });
  }
  /**
   * Perform single-pass encoding (original implementation)
   */
  encodeSinglePass(item, sourceInfo, cpuCapabilities) {
    return new Promise((resolve, reject) => {
      if (!this.activeJob) {
        reject(new Error("No active job"));
        return;
      }
      const ffmpegPath = resolveBundledBinary("ffmpeg");
      const batchId = this.activeJob.id;
      const args = buildArchivalFFmpegArgs(
        item.inputPath,
        item.outputPath,
        this.activeJob.config,
        sourceInfo,
        cpuCapabilities
      );
      args.unshift("-progress", "pipe:1", "-nostats");
      this.logger.debug("Starting FFmpeg", { args: args.join(" ") });
      const proc = require$$0$1.spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
      this.activeProcess = proc;
      this.encodingStartTime = Date.now();
      const durationMs = (sourceInfo.duration ?? 0) * 1e3;
      const durationSeconds = sourceInfo.duration ?? 0;
      let lastProgressUpdate = 0;
      proc.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        let encodedTimeMs = null;
        for (const line of lines) {
          if (line.startsWith("out_time_ms=")) {
            const timeMs = parseInt(line.split("=")[1], 10);
            if (!isNaN(timeMs)) {
              encodedTimeMs = timeMs;
            }
          }
          if (line.startsWith("out_time=")) {
            const timeStr = line.split("=")[1];
            const timeMs = this.parseTimeToMs(timeStr);
            if (timeMs !== null) {
              encodedTimeMs = timeMs;
            }
          }
        }
        if (encodedTimeMs !== null) {
          const now = Date.now();
          const elapsedMs = now - this.encodingStartTime;
          const elapsedSeconds = elapsedMs / 1e3;
          let progress;
          if (durationMs > 0) {
            progress = Math.min(99, Math.max(0, Math.round(encodedTimeMs / durationMs * 100)));
          } else {
            progress = Math.min(99, Math.round(elapsedSeconds / 60));
          }
          const encodedSeconds = encodedTimeMs / 1e3;
          let speed = 0;
          if (elapsedSeconds > 0) {
            speed = encodedSeconds / elapsedSeconds;
            this.speedSamples.push(speed);
            if (this.speedSamples.length > this.maxSpeedSamples) {
              this.speedSamples.shift();
            }
          }
          const avgSpeed = this.speedSamples.length > 0 ? this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length : speed;
          let itemEtaSeconds;
          if (durationSeconds > 0 && avgSpeed > 0) {
            const remainingSeconds = durationSeconds - encodedSeconds;
            itemEtaSeconds = remainingSeconds / avgSpeed;
          }
          let batchEtaSeconds;
          if (this.activeJob && avgSpeed > 0) {
            const currentItemRemaining = durationSeconds > 0 ? Math.max(0, durationSeconds - encodedSeconds) : 0;
            let remainingItemsDuration = 0;
            let knownDurations = [];
            let unknownCount = 0;
            for (const i of this.activeJob.items) {
              if (i.status === "queued") {
                if (i.sourceInfo?.duration) {
                  remainingItemsDuration += i.sourceInfo.duration;
                  knownDurations.push(i.sourceInfo.duration);
                } else {
                  unknownCount++;
                }
              }
            }
            if (unknownCount > 0) {
              const avgDuration = knownDurations.length > 0 ? knownDurations.reduce((a, b) => a + b, 0) / knownDurations.length : durationSeconds > 0 ? durationSeconds : 300;
              remainingItemsDuration += avgDuration * unknownCount;
            }
            const totalRemainingDuration = currentItemRemaining + remainingItemsDuration;
            batchEtaSeconds = totalRemainingDuration / avgSpeed;
          }
          item.progress = progress;
          item.encodingSpeed = avgSpeed;
          item.etaSeconds = itemEtaSeconds;
          item.elapsedSeconds = elapsedSeconds;
          if (this.activeJob) {
            this.activeJob.averageSpeed = avgSpeed;
            this.activeJob.batchEtaSeconds = batchEtaSeconds;
          }
          if (now - lastProgressUpdate > 500) {
            lastProgressUpdate = now;
            const processedItems = this.activeJob?.completedItems ?? 0;
            const totalItems = Math.max(1, this.activeJob?.totalItems ?? 1);
            const batchProgress = Math.round(
              (processedItems + progress / 100) / totalItems * 100
            );
            this.emitEvent({
              batchId,
              itemId: item.id,
              kind: "item_progress",
              progress,
              status: "encoding",
              encodingSpeed: avgSpeed,
              itemEtaSeconds,
              batchEtaSeconds,
              elapsedSeconds,
              batchProgress,
              processedItems,
              totalItems
            });
          }
        }
      });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (stderr.length <= 8192) {
          this.logger.debug("FFmpeg stderr", { chunk: chunk.trim() });
        }
        if (stderr.length > 8192) {
          stderr = stderr.slice(-8192);
        }
      });
      proc.on("close", (code) => {
        this.activeProcess = null;
        if (code === 0) {
          resolve();
        } else if (this.abortController?.signal.aborted) {
          void this.cleanupPartialOutput(item.outputPath);
          const error2 = new Error("Encoding cancelled");
          error2.errorType = "cancelled";
          reject(error2);
        } else {
          void this.cleanupPartialOutput(item.outputPath);
          this.logger.error("FFmpeg encoding failed", {
            input: item.inputPath,
            exitCode: code,
            stderr: stderr.slice(-2048)
            // Last 2KB in log
          });
          const errorPatterns = [
            /Error[^\n]*/i,
            /error[^\n]*/i,
            /Invalid[^\n]*/i,
            /No space[^\n]*/i,
            /Unknown encoder[^\n]*/i,
            /Encoder .* not found[^\n]*/i,
            /Option .* not found[^\n]*/i,
            /Unrecognized option[^\n]*/i,
            /Could not[^\n]*/i,
            /Cannot[^\n]*/i
          ];
          let errorMsg = `FFmpeg exited with code ${code}`;
          for (const pattern of errorPatterns) {
            const match = stderr.match(pattern);
            if (match) {
              errorMsg = match[0].trim();
              break;
            }
          }
          const stderrLines = stderr.trim().split("\n").filter((l) => l.trim());
          const lastLines = stderrLines.slice(-3).join(" | ");
          if (lastLines && !errorMsg.includes(lastLines.slice(0, 50))) {
            errorMsg = `${errorMsg} - ${lastLines.slice(0, 200)}`;
          }
          const errorType = classifyError(stderr || errorMsg);
          const error2 = new Error(errorMsg);
          error2.errorType = errorType;
          reject(error2);
        }
      });
      proc.on("error", (error2) => {
        this.activeProcess = null;
        void this.cleanupPartialOutput(item.outputPath);
        const typedError = error2;
        typedError.errorType = classifyError(error2.message);
        reject(typedError);
      });
      const abortHandler = () => {
        if (os$1.platform() === "win32") {
          proc.kill();
        } else {
          proc.kill("SIGTERM");
        }
      };
      if (this.abortController) {
        this.abortController.signal.addEventListener("abort", abortHandler, { once: true });
      }
    });
  }
  /**
   * Determine whether an item should be skipped in fill mode.
   * Fill mode avoids output name conflicts by skipping items that would collide.
   */
  async shouldSkipForFillMode(outputPath) {
    if (!this.activeJob?.config.fillMode) return false;
    if (!this.fillModeSeenOutputs) {
      this.fillModeSeenOutputs = /* @__PURE__ */ new Set();
    }
    const normalizedOutput = this.normalizeOutputPath(outputPath);
    if (this.fillModeSeenOutputs.has(normalizedOutput)) {
      return true;
    }
    try {
      await promises.access(outputPath);
      this.fillModeSeenOutputs.add(normalizedOutput);
      return true;
    } catch {
    }
    this.fillModeSeenOutputs.add(normalizedOutput);
    return false;
  }
  /**
   * Mark an item as skipped and emit a completion event.
   */
  markItemSkipped(item) {
    if (!this.activeJob) return;
    item.status = "skipped";
    item.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.activeJob.skippedItems++;
    this.emitEvent({
      batchId: this.activeJob.id,
      itemId: item.id,
      kind: "item_complete",
      progress: 100,
      status: "skipped"
    });
  }
  normalizeOutputPath(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    return os$1.platform() === "win32" ? normalized.toLowerCase() : normalized;
  }
  /**
   * Clean up partial output file on error/cancel
   */
  async cleanupPartialOutput(outputPath) {
    try {
      await promises.unlink(outputPath);
      this.logger.debug("Cleaned up partial output", { outputPath });
    } catch {
    }
  }
  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  /**
   * Parse time string (HH:MM:SS.mmm or HH:MM:SS) to milliseconds
   */
  parseTimeToMs(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return null;
    const matchWithMs = timeStr.match(/(\d+):(\d+):(\d+)\.(\d+)/);
    if (matchWithMs) {
      const hours = parseInt(matchWithMs[1], 10);
      const minutes = parseInt(matchWithMs[2], 10);
      const seconds = parseInt(matchWithMs[3], 10);
      const ms2 = parseInt(matchWithMs[4].padEnd(3, "0").slice(0, 3), 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1e3 + ms2;
    }
    const matchNoMs = timeStr.match(/(\d+):(\d+):(\d+)/);
    if (matchNoMs) {
      const hours = parseInt(matchNoMs[1], 10);
      const minutes = parseInt(matchNoMs[2], 10);
      const seconds = parseInt(matchNoMs[3], 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1e3;
    }
    return null;
  }
  /**
   * Build output path for a video, handling duplicates
   * Also handles the case where input and output would be the same file
   */
  buildOutputPath(inputPath, outputDir, config, relativePath) {
    const inputName = require$$0.basename(inputPath, require$$0.extname(inputPath));
    const extension = config.container;
    let outputPath;
    if (config.preserveStructure && relativePath) {
      const relativeDir = require$$0.dirname(relativePath);
      if (relativeDir && relativeDir !== ".") {
        outputPath = require$$0.join(outputDir, relativeDir, `${inputName}.${extension}`);
      } else {
        outputPath = require$$0.join(outputDir, `${inputName}.${extension}`);
      }
    } else {
      outputPath = require$$0.join(outputDir, `${inputName}.${extension}`);
    }
    const normalizedInput = inputPath.toLowerCase().replace(/\\/g, "/");
    const normalizedOutput = outputPath.toLowerCase().replace(/\\/g, "/");
    if (normalizedInput === normalizedOutput) {
      const codecSuffix = config.codec === "h265" ? ".hevc" : ".av1";
      outputPath = require$$0.join(
        require$$0.dirname(outputPath),
        `${inputName}${codecSuffix}.${extension}`
      );
    }
    return outputPath;
  }
  /**
   * Deduplicate output paths to handle files with same name from different folders
   * Uses a set to track all used paths and finds unique suffixes
   */
  deduplicateOutputPaths(items) {
    const usedPaths = /* @__PURE__ */ new Set();
    for (const item of items) {
      let outputPath = item.outputPath;
      let counter = 1;
      while (usedPaths.has(outputPath)) {
        const ext = require$$0.extname(item.outputPath);
        const base = item.outputPath.slice(0, -ext.length);
        outputPath = `${base}_${counter}${ext}`;
        counter++;
      }
      item.outputPath = outputPath;
      usedPaths.add(outputPath);
    }
  }
  /**
   * Extract a thumbnail from the encoded video
   */
  async extractThumbnail(videoPath, sourceInfo, thumbnailTimestamp) {
    if (this.abortController?.signal.aborted) {
      throw new Error("Thumbnail extraction cancelled");
    }
    const ffmpegPath = resolveBundledBinary("ffmpeg");
    const duration = sourceInfo.duration ?? 10;
    let timestampSec;
    if (thumbnailTimestamp !== void 0) {
      timestampSec = Math.min(thumbnailTimestamp, Math.max(0, duration - 0.1));
    } else {
      timestampSec = Math.min(Math.max(0.5, duration * 0.1), Math.max(0, duration - 0.1));
    }
    const videoDir = require$$0.dirname(videoPath);
    const videoName = require$$0.basename(videoPath, require$$0.extname(videoPath));
    const thumbnailPath = require$$0.join(videoDir, `${videoName}.jpg`);
    return new Promise((resolve, reject) => {
      const args = [
        "-ss",
        String(timestampSec),
        "-i",
        videoPath,
        "-vf",
        "scale='min(480,iw)':-2",
        "-vframes",
        "1",
        "-q:v",
        "5",
        "-y",
        thumbnailPath
      ];
      this.logger.debug("Extracting thumbnail", { videoPath, thumbnailPath, timestampSec });
      const proc = require$$0$1.spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      const abortHandler = () => {
        proc.kill();
        void promises.unlink(thumbnailPath).catch(() => {
        });
      };
      this.abortController?.signal.addEventListener("abort", abortHandler, { once: true });
      proc.on("close", async (code) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        if (this.abortController?.signal.aborted) {
          await promises.unlink(thumbnailPath).catch(() => {
          });
          reject(new Error("Thumbnail extraction cancelled"));
          return;
        }
        if (code === 0) {
          this.logger.info("Thumbnail extracted", { thumbnailPath });
          resolve(thumbnailPath);
        } else {
          await promises.unlink(thumbnailPath).catch(() => {
          });
          this.logger.warn("Thumbnail extraction failed", { code, stderr: stderr.slice(-500) });
          reject(new Error(`Thumbnail extraction failed with code ${code}`));
        }
      });
      proc.on("error", async (error2) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        await promises.unlink(thumbnailPath).catch(() => {
        });
        this.logger.warn("Thumbnail extraction error", { error: error2.message });
        reject(error2);
      });
    });
  }
  /**
   * Extract captions from video using Whisper (bundled or LM Studio)
   * Extracts audio, runs transcription, produces VTT subtitles
   */
  async extractCaptions(videoPath, language) {
    if (this.abortController?.signal.aborted) {
      throw new Error("Caption extraction cancelled");
    }
    const providerSettings = this.whisperProviderGetter?.() ?? { provider: "bundled", endpoint: "" };
    const useLmStudio = providerSettings.provider === "lmstudio";
    if (!useLmStudio) {
      const modelPath = this.whisperModelPathGetter?.();
      if (!modelPath) {
        throw new Error("Whisper model not configured. Please select a model in Settings.");
      }
      try {
        await promises.access(modelPath);
      } catch {
        throw new Error(`Whisper model not found at: ${modelPath}`);
      }
    }
    const ffmpegPath = resolveBundledBinary("ffmpeg");
    const videoDir = require$$0.dirname(videoPath);
    const videoName = require$$0.parse(videoPath).name;
    const tempAudioName = `${videoName}_whisper_temp`;
    const audioPath = require$$0.join(videoDir, `${tempAudioName}.wav`);
    const vttOutputPath = require$$0.join(videoDir, `${tempAudioName}.vtt`);
    const txtOutputPath = require$$0.join(videoDir, `${tempAudioName}.txt`);
    const finalVttPath = require$$0.join(videoDir, `${videoName}.vtt`);
    this.logger.info("Starting caption extraction", {
      videoPath,
      language,
      provider: useLmStudio ? "lmstudio" : "bundled"
    });
    try {
      await this.extractAudioForWhisper(videoPath, audioPath, ffmpegPath);
      if (useLmStudio) {
        await this.transcribeWithLmStudio(audioPath, finalVttPath, providerSettings.endpoint, language);
        this.logger.info("Caption extraction completed (LM Studio)", { vttPath: finalVttPath });
        return finalVttPath;
      } else {
        const modelPath = this.whisperModelPathGetter?.();
        const useGpu = this.whisperGpuEnabledGetter?.() ?? true;
        this.logger.info("Running Whisper transcription", { audioPath, modelPath, useGpu });
        await this.whisperService.transcribe({
          audioPath,
          modelPath,
          outputDir: videoDir,
          language: language || void 0,
          signal: this.abortController?.signal,
          useGpu,
          onLog: (chunk) => {
            this.logger.debug("Whisper output", { chunk: chunk.trim() });
          }
        });
        try {
          await promises.unlink(finalVttPath).catch(() => {
          });
          await promises.rename(vttOutputPath, finalVttPath);
        } catch (renameError) {
          this.logger.warn("Failed to rename VTT file, using temp name", {
            from: vttOutputPath,
            to: finalVttPath,
            error: renameError instanceof Error ? renameError.message : "Unknown"
          });
          this.logger.info("Caption extraction completed", { vttPath: vttOutputPath });
          return vttOutputPath;
        }
        this.logger.info("Caption extraction completed", { vttPath: finalVttPath });
        return finalVttPath;
      }
    } finally {
      await promises.unlink(audioPath).catch(() => {
      });
      await promises.unlink(txtOutputPath).catch(() => {
      });
    }
  }
  /**
   * Extract audio from video to WAV format for Whisper transcription
   */
  async extractAudioForWhisper(videoPath, audioPath, ffmpegPath) {
    return new Promise((resolve, reject) => {
      const args = [
        "-i",
        videoPath,
        "-vn",
        // No video
        "-acodec",
        "pcm_s16le",
        // 16-bit PCM
        "-ar",
        "16000",
        // 16kHz sample rate (required by Whisper)
        "-ac",
        "1",
        // Mono
        "-y",
        // Overwrite
        audioPath
      ];
      this.logger.debug("Extracting audio for transcription", { args: args.join(" ") });
      const proc = require$$0$1.spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      const abortHandler = () => {
        proc.kill();
        void promises.unlink(audioPath).catch(() => {
        });
      };
      this.abortController?.signal.addEventListener("abort", abortHandler, { once: true });
      proc.on("close", (code) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        if (this.abortController?.signal.aborted) {
          void promises.unlink(audioPath).catch(() => {
          });
          reject(new Error("Caption extraction cancelled"));
          return;
        }
        if (code === 0) {
          resolve();
        } else {
          void promises.unlink(audioPath).catch(() => {
          });
          if (stderr.includes("does not contain any stream") || stderr.includes("Output file is empty")) {
            reject(new Error("Video has no audio stream"));
          } else {
            reject(new Error(`Audio extraction failed with code ${code}`));
          }
        }
      });
      proc.on("error", (error2) => {
        this.abortController?.signal.removeEventListener("abort", abortHandler);
        void promises.unlink(audioPath).catch(() => {
        });
        reject(error2);
      });
    });
  }
  /**
   * Transcribe audio using LM Studio's OpenAI-compatible API
   * Sends audio to the /v1/audio/transcriptions endpoint
   */
  async transcribeWithLmStudio(audioPath, outputVttPath, endpoint, language) {
    const { readFile: readFile2, writeFile: writeFile2 } = await import("node:fs/promises");
    this.logger.info("Transcribing with LM Studio", { endpoint, audioPath });
    const audioData = await readFile2(audioPath);
    const audioBlob = new Blob([audioData], { type: "audio/wav" });
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("response_format", "vtt");
    if (language) {
      formData.append("language", language);
    }
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      signal: this.abortController?.signal
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`LM Studio transcription failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const vttContent = await response.text();
    await writeFile2(outputVttPath, vttContent, "utf-8");
    this.logger.info("LM Studio transcription completed", { outputVttPath });
  }
  /**
   * Emit progress event
   */
  emitEvent(event) {
    this.onEvent?.(event);
  }
}
const VIDEO_EXTENSIONS = /* @__PURE__ */ new Set([
  ".mp4",
  ".mkv",
  ".mov",
  ".webm",
  ".avi",
  ".m4v",
  ".ts",
  ".mts",
  ".m2ts",
  ".flv",
  ".wmv"
]);
const IGNORED_DIRS = /* @__PURE__ */ new Set([".drapp", ".git", "node_modules", "$RECYCLE.BIN", "System Volume Information"]);
async function findVideoFilesRecursively(rootPath, basePath = rootPath) {
  const files = [];
  async function walk(dir) {
    try {
      const entries = await promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = require$$0.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) {
            continue;
          }
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = require$$0.extname(entry.name).toLowerCase();
          if (VIDEO_EXTENSIONS.has(ext)) {
            files.push({
              absolutePath: fullPath,
              relativePath: require$$0.relative(basePath, fullPath)
            });
          }
        }
      }
    } catch {
    }
  }
  await walk(rootPath);
  return files;
}
let archivalService = null;
function getArchivalService() {
  return archivalService;
}
function getMainWindow() {
  const windows = require$$1.BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}
function emitArchivalEvent(event) {
  const mainWindow2 = getMainWindow();
  if (mainWindow2) {
    mainWindow2.webContents.send("archival/event", event);
  }
}
function getService() {
  if (!archivalService) {
    archivalService = new ArchivalService(emitArchivalEvent);
    archivalService.setWhisperModelPathGetter(() => {
      const db2 = getDatabase();
      return getSetting(db2, "whisper_model_path");
    });
    archivalService.setWhisperProviderGetter(() => {
      const db2 = getDatabase();
      const provider = getSetting(db2, "whisper_provider") ?? "bundled";
      const endpoint = getSetting(db2, "whisper_lmstudio_endpoint") ?? "http://localhost:1234/v1/audio/transcriptions";
      return { provider, endpoint };
    });
    archivalService.setWhisperGpuEnabledGetter(() => {
      const db2 = getDatabase();
      const value = getSetting(db2, "whisper_gpu_enabled");
      return value !== null ? value === "1" : true;
    });
  }
  return archivalService;
}
function registerArchivalHandlers() {
  require$$1.ipcMain.handle("archival/select-files", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Video files",
          extensions: ["mp4", "mkv", "mov", "webm", "avi", "m4v", "ts", "mts", "m2ts", "flv", "wmv"]
        }
      ],
      title: "Select Videos for Archival Processing"
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, paths: result.filePaths };
  });
  require$$1.ipcMain.handle("archival/select-output-dir", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openDirectory", "createDirectory"],
      title: "Select Output Directory for Archived Videos"
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    return { ok: true, path: result.filePaths[0] };
  });
  require$$1.ipcMain.handle("archival/select-folder", async () => {
    const focusedWindow = require$$1.BrowserWindow.getFocusedWindow();
    const dialogOptions = {
      properties: ["openDirectory"],
      title: "Select Folder for Archival Processing"
    };
    const result = focusedWindow ? await require$$1.dialog.showOpenDialog(focusedWindow, dialogOptions) : await require$$1.dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, canceled: true };
    }
    const folderPath = result.filePaths[0];
    try {
      const videoFiles = await findVideoFilesRecursively(folderPath);
      if (videoFiles.length === 0) {
        return { ok: false, error: "No video files found in the selected folder" };
      }
      videoFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
      return {
        ok: true,
        folderPath,
        paths: videoFiles.map((f) => f.absolutePath),
        fileInfo: videoFiles
      };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to scan folder"
      };
    }
  });
  require$$1.ipcMain.handle("archival/get-default-config", async () => {
    return {
      ok: true,
      config: DEFAULT_ARCHIVAL_CONFIG
    };
  });
  require$$1.ipcMain.handle("archival/detect-encoders", async () => {
    try {
      const encoderInfo = await detectAv1Encoders();
      return { ok: true, encoderInfo };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to detect encoders"
      };
    }
  });
  require$$1.ipcMain.handle("archival/upgrade-ffmpeg", async () => {
    try {
      const mainWindow2 = getMainWindow();
      const result = await upgradeFFmpeg((progress) => {
        if (mainWindow2) {
          mainWindow2.webContents.send("archival/upgrade-progress", progress);
        }
      });
      if (!result.success) {
        return { ok: false, error: result.error };
      }
      const encoderInfo = await detectAv1Encoders();
      return { ok: true, encoderInfo };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to upgrade FFmpeg"
      };
    }
  });
  require$$1.ipcMain.handle(
    "archival/start-batch",
    async (_event, request) => {
      const { inputPaths, outputDir, config, folderRoot, relativePaths } = request;
      if (!inputPaths || inputPaths.length === 0) {
        return { ok: false, error: "No input files specified" };
      }
      if (!outputDir) {
        return { ok: false, error: "No output directory specified" };
      }
      try {
        const service = getService();
        const job = await service.startBatch(inputPaths, outputDir, config, folderRoot, relativePaths);
        return { ok: true, job };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to start archival batch"
        };
      }
    }
  );
  require$$1.ipcMain.handle("archival/get-status", async () => {
    const service = getService();
    const job = service.getStatus();
    return { ok: true, job };
  });
  require$$1.ipcMain.handle("archival/cancel", async () => {
    const service = getService();
    const canceled = service.cancel();
    return { ok: true, canceled };
  });
  require$$1.ipcMain.handle("archival/pause", async () => {
    try {
      const service = getService();
      const paused = await service.pause();
      return { ok: true, paused };
    } catch (error2) {
      return {
        ok: false,
        paused: false,
        error: error2 instanceof Error ? error2.message : "Failed to pause"
      };
    }
  });
  require$$1.ipcMain.handle("archival/resume", async () => {
    try {
      const service = getService();
      const resumed = await service.resume();
      return { ok: true, resumed };
    } catch (error2) {
      return {
        ok: false,
        resumed: false,
        error: error2 instanceof Error ? error2.message : "Failed to resume"
      };
    }
  });
  require$$1.ipcMain.handle("archival/check-recovery", async () => {
    try {
      const service = getService();
      const state = await service.checkForRecovery();
      if (state) {
        return {
          ok: true,
          hasRecovery: true,
          recoveryInfo: {
            jobId: state.job.id,
            totalItems: state.job.totalItems,
            completedItems: state.job.completedItems,
            failedItems: state.job.failedItems,
            savedAt: state.savedAt
          }
        };
      }
      return { ok: true, hasRecovery: false };
    } catch (error2) {
      return { ok: false, hasRecovery: false };
    }
  });
  require$$1.ipcMain.handle("archival/resume-recovery", async () => {
    try {
      const service = getService();
      const state = await service.checkForRecovery();
      if (!state) {
        return { ok: false, error: "No recovery state found" };
      }
      const job = await service.resumeFromRecovery(state);
      return { ok: true, job };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to resume from recovery"
      };
    }
  });
  require$$1.ipcMain.handle("archival/discard-recovery", async () => {
    try {
      const service = getService();
      const state = await service.checkForRecovery();
      if (state) {
        await service.discardRecovery(state);
      }
      return { ok: true };
    } catch (error2) {
      return {
        ok: false,
        error: error2 instanceof Error ? error2.message : "Failed to discard recovery"
      };
    }
  });
  require$$1.ipcMain.handle("archival/get-pause-state", async () => {
    const service = getService();
    return { ok: true, isPaused: service.getIsPaused() };
  });
  require$$1.ipcMain.handle(
    "archival/preview-command",
    async (_event, request) => {
      const { inputPath, outputDir, config } = request;
      if (!inputPath || !outputDir) {
        return { ok: false, error: "Missing input path or output directory" };
      }
      try {
        const service = getService();
        const result = await service.previewCommand(inputPath, outputDir, config);
        return {
          ok: true,
          command: result.command,
          description: result.description,
          sourceInfo: result.sourceInfo
        };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to preview command"
        };
      }
    }
  );
  require$$1.ipcMain.handle(
    "archival/estimate-size",
    async (_event, inputPath) => {
      if (!inputPath) {
        return { ok: false, error: "Missing input path" };
      }
      try {
        const service = getService();
        const result = await service.estimateSize(inputPath);
        return { ok: true, ...result };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to estimate size"
        };
      }
    }
  );
  require$$1.ipcMain.handle(
    "archival/get-batch-info",
    async (_event, request) => {
      const { inputPaths, outputDir } = request;
      if (!inputPaths || inputPaths.length === 0) {
        return { ok: false, error: "No input files specified" };
      }
      if (!outputDir) {
        return { ok: false, error: "No output directory specified" };
      }
      try {
        const service = getService();
        const diskCheck = await service.checkDiskSpace(outputDir, inputPaths);
        const batchInfo = await service.getBatchInfo(inputPaths, outputDir);
        return {
          ok: true,
          totalDurationSeconds: batchInfo.totalDurationSeconds,
          totalInputBytes: batchInfo.totalInputBytes,
          estimatedOutputBytes: diskCheck.requiredBytes,
          availableBytes: diskCheck.availableBytes,
          hasEnoughSpace: diskCheck.ok,
          existingCount: batchInfo.existingCount
        };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to get batch info"
        };
      }
    }
  );
  require$$1.ipcMain.handle(
    "archival/analyze-video",
    async (_event, inputPath) => {
      if (!inputPath) {
        return { ok: false, error: "Missing input path" };
      }
      try {
        const service = getService();
        const result = await service.estimateSize(inputPath);
        let resolution;
        const maxDim = Math.max(result.sourceInfo.width, result.sourceInfo.height);
        if (maxDim >= 3840) resolution = "4K";
        else if (maxDim >= 2560) resolution = "1440p";
        else if (maxDim >= 1920) resolution = "1080p";
        else if (maxDim >= 1280) resolution = "720p";
        else if (maxDim >= 854) resolution = "480p";
        else resolution = "360p";
        return {
          ok: true,
          sourceInfo: result.sourceInfo,
          effectiveCrf: result.effectiveCrf,
          isHdr: result.sourceInfo.isHdr,
          resolution
        };
      } catch (error2) {
        return {
          ok: false,
          error: error2 instanceof Error ? error2.message : "Failed to analyze video"
        };
      }
    }
  );
}
function registerIpcHandlers(deps = {}) {
  const logger2 = new Logger("RendererError");
  const logFile = require$$0.join(require$$1.app.getPath("userData"), "renderer-errors.log");
  require$$1.ipcMain.handle("app/ping", () => "pong");
  require$$1.ipcMain.handle("app/copy-to-clipboard", (_event, text) => {
    try {
      require$$1.clipboard.writeText(text ?? "");
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to copy to clipboard." };
    }
  });
  require$$1.ipcMain.handle("app/reveal-path", (_event, filePath) => {
    if (!filePath) {
      return { ok: false, error: "missing_path" };
    }
    try {
      require$$1.shell.showItemInFolder(filePath);
      return { ok: true };
    } catch (error2) {
      return { ok: false, error: error2 instanceof Error ? error2.message : "Unable to reveal path." };
    }
  });
  require$$1.ipcMain.handle("app/log-client-error", async (_event, payload) => {
    const message = payload?.message?.trim();
    if (!message) {
      return { ok: false, error: "missing_message" };
    }
    const entry = {
      message,
      stack: payload?.stack ?? null,
      source: payload?.source ?? "renderer",
      level: payload?.level ?? "error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    logger2.error(entry.message, { source: entry.source, level: entry.level });
    try {
      await promises.appendFile(logFile, `${JSON.stringify(entry)}
`, "utf-8");
    } catch {
    }
    return { ok: true };
  });
  registerDownloadHandlers({ downloadWorker: deps.downloadWorker });
  registerAuthHandlers();
  registerSettingsHandlers({ watchFolderService: deps.watchFolderService });
  registerSystemHandlers();
  registerLibraryHandlers();
  registerProcessingHandlers({
    transcodeWorker: deps.transcodeWorker,
    transcriptionWorker: deps.transcriptionWorker
  });
  registerLlmHandlers(deps.smartTagging);
  if (deps.smartTagging) {
    registerSmartTaggingHandlers(deps.smartTagging);
  }
  registerArchivalHandlers();
}
class YtDlpService {
  constructor() {
    this.logger = new Logger("YtDlpService");
  }
  async download(request) {
    const outputTemplate = request.outputPath ?? require$$0.join(getDownloadPath(), "%(title)s.%(ext)s");
    const binaryPath = resolveBundledBinary("yt-dlp");
    let outputPath = null;
    try {
      node_fs.accessSync(binaryPath, node_fs.constants.X_OK);
    } catch (error2) {
      throw new Error(`yt-dlp not executable at ${binaryPath}`);
    }
    this.logger.info("download requested", { url: request.url, output: outputTemplate });
    await new Promise((resolve, reject) => {
      if (request.signal?.aborted) {
        const error2 = new Error("canceled");
        error2.name = "AbortError";
        reject(error2);
        return;
      }
      const args = ["--no-playlist", "--newline", "-o", outputTemplate];
      if (request.cookiesPath) {
        args.push("--cookies", request.cookiesPath);
      }
      if (request.proxy) {
        args.push("--proxy", request.proxy);
      }
      if (request.rateLimit) {
        args.push("--limit-rate", request.rateLimit);
      }
      if (request.headers) {
        for (const [key, value] of Object.entries(request.headers)) {
          if (!key || typeof value !== "string") {
            continue;
          }
          args.push("--add-header", `${key}: ${value}`);
        }
      }
      args.push(request.url);
      const child = require$$0$1.spawn(binaryPath, args, { stdio: "pipe" });
      let stderr = "";
      let stdoutBuffer = "";
      let stderrBuffer = "";
      let settled = false;
      const handleLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return;
        }
        const destination = this.extractDestination(trimmed);
        if (destination) {
          outputPath = destination;
          request.onDestination?.(destination);
        }
        if (trimmed.startsWith("[download]")) {
          const percentMatch = trimmed.match(/(\d+(?:\.\d+)?)%/);
          const speedMatch = trimmed.match(/at\s+([0-9A-Za-z._-]+)\/s/i);
          const etaMatch = trimmed.match(/ETA\s+([0-9:]+)/i);
          const percent = percentMatch ? Number.parseFloat(percentMatch[1]) : null;
          if (percentMatch || speedMatch || etaMatch) {
            request.onProgress?.({
              percent: Number.isFinite(percent) ? percent : null,
              speed: speedMatch?.[1],
              eta: etaMatch?.[1]
            });
          }
        }
      };
      const finalize = (error2) => {
        if (settled) {
          return;
        }
        settled = true;
        if (request.signal) {
          request.signal.removeEventListener("abort", onAbort);
        }
        if (error2) {
          reject(error2);
        } else {
          resolve();
        }
      };
      const onAbort = () => {
        child.kill();
        const error2 = new Error("canceled");
        error2.name = "AbortError";
        finalize(error2);
      };
      if (request.signal) {
        request.signal.addEventListener("abort", onAbort, { once: true });
      }
      const handleChunk = (chunk, buffer, collectError) => {
        const text = chunk.toString();
        if (collectError) {
          stderr += text;
          if (stderr.length > 8e3) {
            stderr = stderr.slice(-8e3);
          }
        }
        const combined = buffer + text;
        const lines = combined.split("\n");
        const remainder = lines.pop() ?? "";
        lines.forEach(handleLine);
        return remainder;
      };
      child.stdout.on("data", (chunk) => {
        stdoutBuffer = handleChunk(chunk, stdoutBuffer, false);
      });
      child.stderr.on("data", (chunk) => {
        stderrBuffer = handleChunk(chunk, stderrBuffer, true);
      });
      child.on("error", (error2) => {
        finalize(error2);
      });
      child.on("close", (code) => {
        if (stdoutBuffer.trim()) {
          handleLine(stdoutBuffer);
        }
        if (stderrBuffer.trim()) {
          handleLine(stderrBuffer);
        }
        if (code === 0) {
          finalize();
        } else {
          finalize(new Error(stderr || `yt-dlp exited with code ${code ?? "unknown"}`));
        }
      });
    });
    return {
      outputPath,
      fileName: outputPath ? require$$0.basename(outputPath) : null
    };
  }
  extractDestination(line) {
    const destinationMatch = line.match(/Destination:\s(.+)$/);
    if (destinationMatch) {
      return destinationMatch[1].trim().replace(/^"|"$/g, "");
    }
    const mergeMatch = line.match(/Merging formats into\s+"(.+)"$/);
    if (mergeMatch) {
      return mergeMatch[1].trim();
    }
    return null;
  }
}
class TaxonomyService {
  constructor(taxonomyPath) {
    this.config = null;
    this.fileWatcher = null;
    this.taxonomyPath = taxonomyPath;
  }
  async load() {
    const content = await promises.readFile(this.taxonomyPath, "utf-8");
    this.config = this.parse(content);
    return this.config;
  }
  parse(content) {
    const lines = content.split("\n");
    let defaultMinConf = 0.65;
    let lowConfidencePolicy = "suggest";
    const sections = /* @__PURE__ */ new Map();
    const allTags = /* @__PURE__ */ new Map();
    let currentSectionName = "Uncategorized";
    let currentSectionMinConf = defaultMinConf;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      if (line.startsWith("@default_min_conf")) {
        const match = line.match(/@default_min_conf\s*=\s*([\d.]+)/);
        if (match) {
          defaultMinConf = parseFloat(match[1]);
          currentSectionMinConf = defaultMinConf;
        }
        continue;
      }
      if (line.startsWith("@low_confidence_policy")) {
        const match = line.match(/@low_confidence_policy\s*=\s*(\w+)/);
        if (match) {
          const policy = match[1].toLowerCase();
          if (policy === "omit" || policy === "suggest" || policy === "ask") {
            lowConfidencePolicy = policy;
          }
        }
        continue;
      }
      if (line.startsWith("[") && line.includes("]")) {
        const match = line.match(/\[([^\]]+)\]/);
        if (match) {
          currentSectionName = match[1].trim();
          currentSectionMinConf = defaultMinConf;
          if (!sections.has(currentSectionName)) {
            sections.set(currentSectionName, {
              name: currentSectionName,
              minConfidence: currentSectionMinConf,
              tags: []
            });
          }
        }
        continue;
      }
      if (line.startsWith("@min_conf")) {
        const match = line.match(/@min_conf\s*=\s*([\d.]+)/);
        if (match) {
          currentSectionMinConf = parseFloat(match[1]);
          const section = sections.get(currentSectionName);
          if (section) {
            section.minConfidence = currentSectionMinConf;
          }
        }
        continue;
      }
      if (line.startsWith("@")) continue;
      const parts = line.split("|");
      const tagPart = parts[0].trim();
      if (!tagPart || tagPart.includes("=") || tagPart.includes("[")) continue;
      const tagName = this.normalizeTagName(tagPart);
      if (!tagName || tagName.length === 0) continue;
      let tagMinConf = currentSectionMinConf;
      for (let i = 1; i < parts.length; i++) {
        const opt = parts[i].trim();
        const optMatch = opt.match(/min_conf\s*=\s*([\d.]+)/);
        if (optMatch) {
          tagMinConf = parseFloat(optMatch[1]);
        }
      }
      const tag = {
        name: tagName,
        section: currentSectionName,
        minConfidence: tagMinConf
      };
      if (!sections.has(currentSectionName)) {
        sections.set(currentSectionName, {
          name: currentSectionName,
          minConfidence: currentSectionMinConf,
          tags: []
        });
      }
      sections.get(currentSectionName).tags.push(tag);
      allTags.set(tagName, tag);
    }
    this.config = { defaultMinConf, lowConfidencePolicy, sections, allTags };
    return this.config;
  }
  normalizeTagName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  getConfig() {
    if (!this.config) {
      throw new Error("Taxonomy not loaded. Call load() first.");
    }
    return this.config;
  }
  isValidTag(tagName) {
    if (!this.config) return false;
    return this.config.allTags.has(this.normalizeTagName(tagName));
  }
  getTagConfig(tagName) {
    if (!this.config) return void 0;
    return this.config.allTags.get(this.normalizeTagName(tagName));
  }
  getAllowedTags() {
    if (!this.config) return [];
    return Array.from(this.config.allTags.keys());
  }
  getTagsBySection() {
    if (!this.config) return /* @__PURE__ */ new Map();
    const result = /* @__PURE__ */ new Map();
    for (const [sectionName, section] of this.config.sections) {
      result.set(sectionName, section.tags.map((t2) => t2.name));
    }
    return result;
  }
  getSections() {
    if (!this.config) return [];
    return Array.from(this.config.sections.keys());
  }
  getTagCount() {
    return this.config?.allTags.size ?? 0;
  }
  getLowConfidencePolicy() {
    return this.config?.lowConfidencePolicy ?? "suggest";
  }
  getDefaultMinConf() {
    return this.config?.defaultMinConf ?? 0.65;
  }
  // Watch for file changes and reload
  async watchForChanges(onChange) {
    try {
      const watcher = promises.watch(this.taxonomyPath);
      for await (const event of watcher) {
        if (event.eventType === "change") {
          try {
            await this.load();
            onChange();
          } catch (error2) {
            console.error("Failed to reload taxonomy:", error2);
          }
        }
      }
    } catch (error2) {
      console.error("Failed to watch taxonomy file:", error2);
    }
  }
  stopWatching() {
  }
  // Serialize to a plain object for IPC
  toJSON() {
    const sections = {};
    for (const [name, tags] of this.getTagsBySection()) {
      sections[name] = tags;
    }
    return {
      sections,
      config: {
        defaultMinConf: this.getDefaultMinConf(),
        policy: this.getLowConfidencePolicy()
      }
    };
  }
}
class EmbeddingService {
  constructor(db2, config = {}) {
    this.session = null;
    this.initialized = false;
    this.db = db2;
    this.config = {
      modelPath: require$$0.join(require$$1.app.getPath("userData"), "models", "clip-vit-base-patch32.onnx"),
      modelName: "clip-vit-base-patch32",
      dimensions: 512,
      batchSize: 8,
      ...config
    };
  }
  async initialize() {
    if (this.initialized) return;
    if (!node_fs.existsSync(this.config.modelPath)) {
      console.warn(
        `CLIP model not found at ${this.config.modelPath}. Embedding features will be disabled until model is installed.`
      );
      return;
    }
    try {
      const ort = await Promise.resolve().then(() => require("./index-DFybGk0c.cjs")).then((n) => n.index);
      this.session = await ort.InferenceSession.create(this.config.modelPath);
      this.initialized = true;
      console.log("CLIP embedding model loaded successfully");
    } catch (error2) {
      console.warn("Failed to load CLIP model:", error2);
      console.warn("Embedding features will be disabled.");
    }
  }
  isAvailable() {
    return this.initialized && this.session !== null;
  }
  getModelVersion() {
    return this.config.modelName;
  }
  getDimensions() {
    return this.config.dimensions;
  }
  async embedFrame(imagePath) {
    if (!this.isAvailable()) {
      throw new Error("Embedding model not initialized");
    }
    const tensor = await this.preprocessImage(imagePath);
    await Promise.resolve().then(() => require("./index-DFybGk0c.cjs")).then((n) => n.index);
    const session = this.session;
    const results = await session.run({ input: tensor });
    const outputKey = Object.keys(results)[0];
    return new Float32Array(results[outputKey].data);
  }
  async embedFrames(frames) {
    if (!this.isAvailable()) {
      throw new Error("Embedding model not initialized");
    }
    const embeddings = /* @__PURE__ */ new Map();
    for (let i = 0; i < frames.length; i += this.config.batchSize) {
      const batch = frames.slice(i, i + this.config.batchSize);
      for (const frame of batch) {
        try {
          const embedding = await this.embedFrame(frame.filePath);
          embeddings.set(frame.index, embedding);
        } catch (error2) {
          console.warn(`Failed to embed frame ${frame.index}:`, error2);
        }
      }
    }
    return embeddings;
  }
  async preprocessImage(imagePath) {
    const sharp = (await Promise.resolve().then(() => require("./index-Dng7T4Yr.cjs")).then((n) => n.index)).default;
    const imageBuffer = await sharp(imagePath).resize(224, 224, { fit: "cover" }).removeAlpha().raw().toBuffer();
    const floatData = new Float32Array(3 * 224 * 224);
    const mean = [0.48145466, 0.4578275, 0.40821073];
    const std = [0.26862954, 0.26130258, 0.27577711];
    for (let i = 0; i < 224 * 224; i++) {
      floatData[i] = (imageBuffer[i * 3] / 255 - mean[0]) / std[0];
      floatData[224 * 224 + i] = (imageBuffer[i * 3 + 1] / 255 - mean[1]) / std[1];
      floatData[2 * 224 * 224 + i] = (imageBuffer[i * 3 + 2] / 255 - mean[2]) / std[2];
    }
    const ort = await Promise.resolve().then(() => require("./index-DFybGk0c.cjs")).then((n) => n.index);
    return new ort.Tensor("float32", floatData, [1, 3, 224, 224]);
  }
  computeAggregatedEmbedding(frameEmbeddings) {
    if (frameEmbeddings.length === 0) {
      throw new Error("No embeddings to aggregate");
    }
    const dimensions = frameEmbeddings[0].length;
    const aggregated = new Float32Array(dimensions);
    for (const embedding of frameEmbeddings) {
      for (let i = 0; i < dimensions; i++) {
        aggregated[i] += embedding[i];
      }
    }
    for (let i = 0; i < dimensions; i++) {
      aggregated[i] /= frameEmbeddings.length;
    }
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += aggregated[i] * aggregated[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        aggregated[i] /= norm;
      }
    }
    return aggregated;
  }
  // Database operations
  storeFrameEmbedding(videoId, frameIndex, timestampMs, filePath, embedding) {
    const id = `${videoId}_frame_${frameIndex}`;
    const embeddingBuffer = Buffer.from(embedding.buffer);
    this.db.prepare(`
      INSERT OR REPLACE INTO video_frames
      (id, video_id, frame_index, timestamp_ms, file_path, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, videoId, frameIndex, timestampMs, filePath, embeddingBuffer);
  }
  storeVideoEmbedding(videoId, embedding, frameCount) {
    const embeddingBuffer = Buffer.from(embedding.buffer);
    this.db.prepare(`
      INSERT OR REPLACE INTO video_embeddings
      (video_id, embedding, frame_count, model_version, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(videoId, embeddingBuffer, frameCount, this.config.modelName);
  }
  getVideoEmbedding(videoId) {
    const row = this.db.prepare(
      "SELECT embedding FROM video_embeddings WHERE video_id = ?"
    ).get(videoId);
    if (!row) return null;
    return new Float32Array(
      row.embedding.buffer.slice(
        row.embedding.byteOffset,
        row.embedding.byteOffset + row.embedding.byteLength
      )
    );
  }
  getAllVideoEmbeddings() {
    const rows = this.db.prepare(
      "SELECT video_id, embedding FROM video_embeddings"
    ).all();
    const result = /* @__PURE__ */ new Map();
    for (const row of rows) {
      result.set(
        row.video_id,
        new Float32Array(
          row.embedding.buffer.slice(
            row.embedding.byteOffset,
            row.embedding.byteOffset + row.embedding.byteLength
          )
        )
      );
    }
    return result;
  }
  getFrameEmbeddings(videoId) {
    const rows = this.db.prepare(
      "SELECT frame_index, embedding FROM video_frames WHERE video_id = ? ORDER BY frame_index"
    ).all(videoId);
    const result = /* @__PURE__ */ new Map();
    for (const row of rows) {
      result.set(
        row.frame_index,
        new Float32Array(
          row.embedding.buffer.slice(
            row.embedding.byteOffset,
            row.embedding.byteOffset + row.embedding.byteLength
          )
        )
      );
    }
    return result;
  }
  isVideoIndexed(videoId) {
    const row = this.db.prepare(
      "SELECT frame_count FROM video_embeddings WHERE video_id = ?"
    ).get(videoId);
    return {
      indexed: !!row,
      frameCount: row?.frame_count ?? null
    };
  }
  deleteVideoEmbeddings(videoId) {
    this.db.prepare("DELETE FROM video_frames WHERE video_id = ?").run(videoId);
    this.db.prepare("DELETE FROM video_embeddings WHERE video_id = ?").run(videoId);
  }
  getEmbeddingCount() {
    const row = this.db.prepare("SELECT COUNT(*) as count FROM video_embeddings").get();
    return row.count;
  }
}
class SimilarityService {
  constructor(db2, embeddingService) {
    this.db = db2;
    this.embeddingService = embeddingService;
  }
  /**
   * Compute cosine similarity between two normalized vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    return dot / denominator;
  }
  /**
   * Find the most similar videos to a target video
   */
  async findSimilarVideos(targetVideoId, topK = 10, minSimilarity = 0.3) {
    const targetEmbedding = this.embeddingService.getVideoEmbedding(targetVideoId);
    if (!targetEmbedding) {
      throw new Error(`No embedding found for video ${targetVideoId}`);
    }
    const allEmbeddings = this.embeddingService.getAllVideoEmbeddings();
    const similarities = [];
    for (const [videoId, embedding] of allEmbeddings) {
      if (videoId === targetVideoId) continue;
      const similarity = this.cosineSimilarity(targetEmbedding, embedding);
      if (similarity >= minSimilarity) {
        similarities.push({ videoId, similarity });
      }
    }
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilar = similarities.slice(0, topK);
    const results = [];
    for (const { videoId, similarity } of topSimilar) {
      const tags = this.getVideoTags(videoId);
      const title = this.getVideoTitle(videoId);
      results.push({
        videoId,
        title,
        similarity,
        tags
      });
    }
    return results;
  }
  /**
   * Find similar videos using a raw embedding (for videos not yet in DB)
   */
  async findSimilarByEmbedding(embedding, topK = 10, minSimilarity = 0.3, excludeVideoId) {
    const allEmbeddings = this.embeddingService.getAllVideoEmbeddings();
    const similarities = [];
    for (const [videoId, storedEmbedding] of allEmbeddings) {
      if (excludeVideoId && videoId === excludeVideoId) continue;
      const similarity = this.cosineSimilarity(embedding, storedEmbedding);
      if (similarity >= minSimilarity) {
        similarities.push({ videoId, similarity });
      }
    }
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilar = similarities.slice(0, topK);
    const results = [];
    for (const { videoId, similarity } of topSimilar) {
      const tags = this.getVideoTags(videoId);
      const title = this.getVideoTitle(videoId);
      results.push({
        videoId,
        title,
        similarity,
        tags
      });
    }
    return results;
  }
  /**
   * Get tags for a video
   */
  getVideoTags(videoId) {
    const rows = this.db.prepare(`
      SELECT t.name, vt.confidence, vt.is_locked
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ?
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(videoId);
    return rows.map((row) => ({
      name: row.name,
      confidence: row.confidence,
      isLocked: row.is_locked === 1
    }));
  }
  /**
   * Get video title
   */
  getVideoTitle(videoId) {
    const row = this.db.prepare(
      "SELECT title FROM videos WHERE id = ?"
    ).get(videoId);
    return row?.title ?? void 0;
  }
  /**
   * Get videos that have at least one tag from a list
   */
  getVideosWithTags(tagNames) {
    if (tagNames.length === 0) return [];
    const placeholders = tagNames.map(() => "?").join(", ");
    const rows = this.db.prepare(`
      SELECT DISTINCT vt.video_id
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE t.name IN (${placeholders})
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(...tagNames);
    return rows.map((row) => row.video_id);
  }
  /**
   * Get videos that have embeddings
   */
  getIndexedVideoIds() {
    const rows = this.db.prepare(
      "SELECT video_id FROM video_embeddings"
    ).all();
    return rows.map((row) => row.video_id);
  }
  /**
   * Get count of indexed videos
   */
  getIndexedCount() {
    const row = this.db.prepare(
      "SELECT COUNT(*) as count FROM video_embeddings"
    ).get();
    return row.count;
  }
  /**
   * Calculate average similarity between a video and a group of videos
   */
  async getAverageSimilarity(videoId, otherVideoIds) {
    if (otherVideoIds.length === 0) return 0;
    const targetEmbedding = this.embeddingService.getVideoEmbedding(videoId);
    if (!targetEmbedding) return 0;
    let totalSimilarity = 0;
    let count = 0;
    for (const otherId of otherVideoIds) {
      const otherEmbedding = this.embeddingService.getVideoEmbedding(otherId);
      if (otherEmbedding) {
        totalSimilarity += this.cosineSimilarity(targetEmbedding, otherEmbedding);
        count++;
      }
    }
    return count > 0 ? totalSimilarity / count : 0;
  }
}
class NeighborVotingService {
  constructor(taxonomyService, similarityService) {
    this.taxonomyService = taxonomyService;
    this.similarityService = similarityService;
  }
  /**
   * Generate tag candidates using weighted neighbor voting
   *
   * For each tag in the taxonomy:
   *   confidence(tag) = sum(similarity_i * has_tag_i) / sum(similarity_i)
   *
   * where has_tag_i is 1 if neighbor i has the tag, 0 otherwise
   */
  async generateCandidates(targetVideoId, topK = 10) {
    const similarVideos = await this.similarityService.findSimilarVideos(targetVideoId, topK);
    if (similarVideos.length === 0) {
      return [];
    }
    return this.computeVotes(similarVideos);
  }
  /**
   * Generate candidates from a list of similar videos (for when we already have them)
   */
  computeVotes(similarVideos) {
    if (similarVideos.length === 0) {
      return [];
    }
    const tagVotes = /* @__PURE__ */ new Map();
    const allowedTags = new Set(this.taxonomyService.getAllowedTags());
    for (const tagName of allowedTags) {
      tagVotes.set(tagName, {
        weightedSum: 0,
        totalWeight: 0,
        contributors: []
      });
    }
    for (const video of similarVideos) {
      const videoTagNames = new Set(video.tags.map((t2) => t2.name));
      for (const tagName of allowedTags) {
        const votes = tagVotes.get(tagName);
        if (videoTagNames.has(tagName)) {
          votes.weightedSum += video.similarity;
          votes.contributors.push({
            videoId: video.videoId,
            similarity: video.similarity
          });
        }
        votes.totalWeight += video.similarity;
      }
    }
    const candidates = [];
    for (const [tagName, votes] of tagVotes) {
      if (votes.contributors.length === 0) continue;
      if (votes.totalWeight === 0) continue;
      const confidence = votes.weightedSum / votes.totalWeight;
      const tagConfig = this.taxonomyService.getTagConfig(tagName);
      if (!tagConfig) continue;
      candidates.push({
        tagName,
        section: tagConfig.section,
        confidence,
        contributors: votes.contributors
      });
    }
    candidates.sort((a, b) => b.confidence - a.confidence);
    return candidates;
  }
  /**
   * Generate candidates from similar videos found by embedding
   */
  async generateCandidatesFromEmbedding(embedding, topK = 10, excludeVideoId) {
    const similarVideos = await this.similarityService.findSimilarByEmbedding(
      embedding,
      topK,
      0.3,
      // minSimilarity
      excludeVideoId
    );
    return this.computeVotes(similarVideos);
  }
  /**
   * Get tag distribution across similar videos
   */
  getTagDistribution(similarVideos) {
    const distribution = /* @__PURE__ */ new Map();
    for (const video of similarVideos) {
      for (const tag of video.tags) {
        const existing = distribution.get(tag.name) || {
          count: 0,
          totalSimilarity: 0,
          videos: []
        };
        existing.count++;
        existing.totalSimilarity += video.similarity;
        existing.videos.push(video.videoId);
        distribution.set(tag.name, existing);
      }
    }
    const result = /* @__PURE__ */ new Map();
    for (const [tag, data] of distribution) {
      result.set(tag, {
        count: data.count,
        avgSimilarity: data.totalSimilarity / data.count,
        videos: data.videos
      });
    }
    return result;
  }
}
class ConfidenceService {
  constructor(taxonomyService) {
    this.taxonomyService = taxonomyService;
  }
  /**
   * Apply confidence thresholds to tag candidates
   *
   * For each candidate:
   * - If confidence >= tag's minConfidence → accepted
   * - If confidence < minConfidence → handled by policy (omit/suggest/ask)
   */
  applyThresholds(candidates) {
    const config = this.taxonomyService.getConfig();
    const policy = config.lowConfidencePolicy;
    const accepted = [];
    const suggestedLowConfidence = [];
    const needsReview = [];
    for (const candidate of candidates) {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName);
      if (!tagConfig) {
        continue;
      }
      const threshold = tagConfig.minConfidence;
      if (candidate.confidence >= threshold) {
        accepted.push(candidate);
      } else {
        switch (policy) {
          case "omit":
            break;
          case "suggest":
            suggestedLowConfidence.push(candidate);
            break;
          case "ask":
            needsReview.push(candidate);
            break;
        }
      }
    }
    return { accepted, suggestedLowConfidence, needsReview };
  }
  /**
   * Filter candidates to only those meeting a minimum confidence
   */
  filterByMinConfidence(candidates, minConfidence) {
    return candidates.filter((c) => c.confidence >= minConfidence);
  }
  /**
   * Get candidates grouped by whether they meet their thresholds
   */
  categorize(candidates) {
    const aboveThreshold = [];
    const belowThreshold = [];
    const unknown = [];
    for (const candidate of candidates) {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName);
      if (!tagConfig) {
        unknown.push(candidate);
        continue;
      }
      if (candidate.confidence >= tagConfig.minConfidence) {
        aboveThreshold.push(candidate);
      } else {
        belowThreshold.push(candidate);
      }
    }
    return { aboveThreshold, belowThreshold, unknown };
  }
  /**
   * Calculate how much above/below threshold each candidate is
   */
  getThresholdDeltas(candidates) {
    return candidates.map((candidate) => {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName);
      const threshold = tagConfig?.minConfidence ?? this.taxonomyService.getDefaultMinConf();
      return {
        candidate,
        threshold,
        delta: candidate.confidence - threshold,
        meetsThreshold: candidate.confidence >= threshold
      };
    });
  }
  /**
   * Get the top N candidates that meet their thresholds
   */
  getTopAccepted(candidates, limit) {
    const { accepted } = this.applyThresholds(candidates);
    return accepted.slice(0, limit);
  }
  /**
   * Check if a specific confidence value meets the threshold for a tag
   */
  meetsThreshold(tagName, confidence) {
    const tagConfig = this.taxonomyService.getTagConfig(tagName);
    if (!tagConfig) return false;
    return confidence >= tagConfig.minConfidence;
  }
  /**
   * Get the threshold for a specific tag
   */
  getThreshold(tagName) {
    const tagConfig = this.taxonomyService.getTagConfig(tagName);
    return tagConfig?.minConfidence ?? this.taxonomyService.getDefaultMinConf();
  }
}
class LLMRefinerService {
  constructor(config = {}) {
    this.config = {
      baseUrl: "http://localhost:1234/v1",
      modelName: "auto",
      timeout: 3e4,
      ...config
    };
  }
  /**
   * Check if LM Studio is available
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3)
      });
      if (!response.ok) return false;
      const data = await response.json();
      return Array.isArray(data.data) && data.data.length > 0;
    } catch {
      return false;
    }
  }
  /**
   * Get available models from LM Studio
   */
  async getAvailableModels() {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        method: "GET",
        signal: AbortSignal.timeout(5e3)
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data?.map((m) => m.id) || [];
    } catch {
      return [];
    }
  }
  /**
   * Refine tag candidates using the local LLM
   */
  async refine(input) {
    const systemPrompt = this.buildSystemPrompt(input);
    const userPrompt = this.buildUserPrompt(input);
    let response;
    try {
      response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]);
    } catch (error2) {
      console.error("LLM chat failed:", error2);
      throw error2;
    }
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch {
      console.warn("Invalid JSON from LLM, retrying...");
      try {
        response = await this.chat([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          { role: "assistant", content: response },
          {
            role: "user",
            content: "Your response was not valid JSON. Please respond with ONLY a valid JSON object matching the required schema. No markdown, no explanation, just the JSON."
          }
        ]);
        parsed = JSON.parse(response);
      } catch (retryError) {
        console.error("LLM retry failed:", retryError);
        throw new Error("Failed to get valid JSON from LLM after retry");
      }
    }
    return this.validateOutput(parsed, input.allowedTags);
  }
  async chat(messages) {
    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.config.modelName === "auto" ? void 0 : this.config.modelName,
        messages,
        temperature: 0.1,
        // Low temperature for determinism
        max_tokens: 2e3
      }),
      signal: AbortSignal.timeout(this.config.timeout)
    });
    if (!response.ok) {
      const error2 = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${error2}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }
    return content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  buildSystemPrompt(input) {
    const taxonomyLines = [];
    for (const [section, tags] of input.taxonomyBySection) {
      taxonomyLines.push(`[${section}]`);
      taxonomyLines.push(tags.join(", "));
      taxonomyLines.push("");
    }
    return `You are a tag refinement assistant for a video library application.

Your job is to:
1. Review tag candidates generated from similar video analysis
2. Resolve any conflicts or redundancies between tags
3. Map synonyms to canonical tags from the allowed taxonomy
4. Provide brief reasons for significant decisions

CRITICAL RULES:
- You may ONLY output tags that exist in the allowed taxonomy below
- You must NEVER invent new tags or use variations not in the list
- You must NEVER infer sensitive attributes (age, ethnicity, identity, etc.)
- Be deterministic and consistent
- When in doubt, drop the tag rather than guess

ALLOWED TAXONOMY:
${taxonomyLines.join("\n")}

OUTPUT FORMAT (strict JSON, no markdown):
{
  "refined_tags": [
    { "tag_name": "exact-tag-from-taxonomy", "section": "section-name", "confidence": 0.85, "reason": "optional explanation" }
  ],
  "dropped_tags": [
    { "tag_name": "original-tag", "reason": "why it was dropped" }
  ]
}

IMPORTANT: Respond with ONLY the JSON object. No markdown code blocks, no explanation text, just the raw JSON.`;
  }
  buildUserPrompt(input) {
    const candidatesLines = input.candidates.slice(0, 20).map((c) => `- ${c.tagName} (${c.section}): confidence=${c.confidence.toFixed(3)}`).join("\n");
    const similarLines = input.similarVideos.slice(0, 5).map((v) => {
      const tagList = v.tags.map((t2) => t2.name).join(", ");
      return `- "${v.title || v.videoId}" (sim=${v.similarity.toFixed(3)}): [${tagList}]`;
    }).join("\n");
    let prompt = `Refine these tag candidates for a video:

TAG CANDIDATES (from neighbor voting):
${candidatesLines}

SIMILAR VIDEOS USED:
${similarLines}
`;
    if (input.videoTitle) {
      prompt += `
VIDEO TITLE: ${input.videoTitle}`;
    }
    if (input.videoDescription) {
      const desc = input.videoDescription.slice(0, 500);
      prompt += `
VIDEO DESCRIPTION: ${desc}${input.videoDescription.length > 500 ? "..." : ""}`;
    }
    if (input.userNotes) {
      prompt += `
USER NOTES: ${input.userNotes}`;
    }
    prompt += `

Respond with ONLY the JSON object.`;
    return prompt;
  }
  validateOutput(parsed, allowedTags) {
    const allowedSet = new Set(allowedTags.map((t2) => t2.toLowerCase()));
    const refinedTags = [];
    const droppedTags = [];
    if (!parsed || typeof parsed !== "object") {
      return { refinedTags: [], droppedTags: [] };
    }
    const data = parsed;
    const rawRefined = Array.isArray(data.refined_tags) ? data.refined_tags : [];
    for (const tag of rawRefined) {
      if (!tag || typeof tag !== "object") continue;
      const tagObj = tag;
      const rawName = tagObj.tag_name;
      if (typeof rawName !== "string") continue;
      const normalizedName = rawName.toLowerCase().trim().replace(/\s+/g, "-");
      if (!allowedSet.has(normalizedName)) {
        console.warn(`LLM produced unknown tag: ${rawName}`);
        droppedTags.push({
          tagName: rawName,
          reason: "Not in allowed taxonomy"
        });
        continue;
      }
      refinedTags.push({
        tagName: normalizedName,
        section: typeof tagObj.section === "string" ? tagObj.section : "Unknown",
        confidence: Math.min(1, Math.max(0, typeof tagObj.confidence === "number" ? tagObj.confidence : 0)),
        reason: typeof tagObj.reason === "string" ? tagObj.reason : void 0
      });
    }
    const rawDropped = Array.isArray(data.dropped_tags) ? data.dropped_tags : [];
    for (const tag of rawDropped) {
      if (!tag || typeof tag !== "object") continue;
      const tagObj = tag;
      if (typeof tagObj.tag_name === "string") {
        droppedTags.push({
          tagName: tagObj.tag_name,
          reason: typeof tagObj.reason === "string" ? tagObj.reason : "Dropped by LLM"
        });
      }
    }
    return { refinedTags, droppedTags };
  }
  /**
   * Update LLM configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
  }
  getConfig() {
    return { ...this.config };
  }
}
class SmartTaggingService {
  constructor(db2, config = {}) {
    this.initialized = false;
    this.db = db2;
    const defaultConfig = {
      enabled: true,
      maxFramesPerVideo: 30,
      sceneChangeThreshold: 0.3,
      topKNeighbors: 10,
      minSimilarity: 0.3,
      useLLMRefinement: true,
      lmStudioUrl: "http://localhost:1234/v1",
      lmStudioModel: "auto",
      embeddingModel: "clip-vit-base-patch32",
      autoSuggestOnImport: false,
      autoIndexOnImport: true,
      taxonomyPath: require$$0.join(require$$1.app.getPath("userData"), "tags.txt")
    };
    this.config = { ...defaultConfig, ...config };
    this.taxonomyService = new TaxonomyService(this.config.taxonomyPath);
    this.frameExtractor = new FrameExtractorService();
    this.embeddingService = new EmbeddingService(db2, {
      modelName: this.config.embeddingModel
    });
    this.similarityService = new SimilarityService(db2, this.embeddingService);
    this.neighborVoting = new NeighborVotingService(this.taxonomyService, this.similarityService);
    this.confidenceService = new ConfidenceService(this.taxonomyService);
    this.llmRefiner = new LLMRefinerService({
      baseUrl: this.config.lmStudioUrl,
      modelName: this.config.lmStudioModel
    });
  }
  async initialize() {
    if (this.initialized) return;
    try {
      await this.taxonomyService.load();
      console.log(`Loaded taxonomy with ${this.taxonomyService.getTagCount()} tags`);
    } catch (error2) {
      console.warn("Failed to load taxonomy:", error2);
    }
    try {
      await this.embeddingService.initialize();
    } catch (error2) {
      console.warn("Failed to initialize embedding service:", error2);
    }
    this.initialized = true;
  }
  /**
   * Index a video: extract frames, compute embeddings, store
   */
  async indexVideo(videoId, videoPath) {
    if (!this.config.enabled) {
      return { success: false, frameCount: 0 };
    }
    try {
      const frames = await this.frameExtractor.extractFrames(videoPath, videoId, {
        maxFrames: this.config.maxFramesPerVideo,
        sceneChangeThreshold: this.config.sceneChangeThreshold
      });
      if (frames.length === 0) {
        console.warn(`No frames extracted for video ${videoId}`);
        return { success: false, frameCount: 0 };
      }
      if (!this.embeddingService.isAvailable()) {
        console.warn("Embedding service not available, skipping embedding");
        return { success: true, frameCount: frames.length };
      }
      const embeddings = await this.embeddingService.embedFrames(frames);
      for (const frame of frames) {
        const embedding = embeddings.get(frame.index);
        if (embedding) {
          this.embeddingService.storeFrameEmbedding(
            videoId,
            frame.index,
            frame.timestampMs,
            frame.filePath,
            embedding
          );
        }
      }
      const allEmbeddings = Array.from(embeddings.values());
      if (allEmbeddings.length > 0) {
        const aggregated = this.embeddingService.computeAggregatedEmbedding(allEmbeddings);
        this.embeddingService.storeVideoEmbedding(videoId, aggregated, frames.length);
      }
      return { success: true, frameCount: frames.length };
    } catch (error2) {
      console.error(`Failed to index video ${videoId}:`, error2);
      return { success: false, frameCount: 0 };
    }
  }
  /**
   * Suggest tags for a video based on similar tagged videos
   */
  async suggestTags(videoId, options = {}) {
    const {
      topK = this.config.topKNeighbors,
      useLLMRefinement = this.config.useLLMRefinement,
      videoTitle,
      videoDescription,
      userNotes
    } = options;
    const candidates = await this.neighborVoting.generateCandidates(videoId, topK);
    const similarVideos = await this.similarityService.findSimilarVideos(videoId, topK);
    let finalCandidates = candidates;
    let llmRefined = false;
    if (useLLMRefinement && await this.llmRefiner.isAvailable()) {
      try {
        const refined = await this.llmRefiner.refine({
          videoTitle,
          videoDescription,
          userNotes,
          candidates,
          similarVideos,
          allowedTags: this.taxonomyService.getAllowedTags(),
          taxonomyBySection: this.taxonomyService.getTagsBySection()
        });
        finalCandidates = refined.refinedTags.map((t2) => {
          const originalCandidate = candidates.find((c) => c.tagName === t2.tagName);
          return {
            tagName: t2.tagName,
            section: t2.section,
            confidence: t2.confidence,
            contributors: originalCandidate?.contributors || [],
            reason: t2.reason
          };
        });
        llmRefined = true;
      } catch (error2) {
        console.warn("LLM refinement failed, using raw candidates:", error2);
      }
    }
    const { accepted, suggestedLowConfidence, needsReview } = this.confidenceService.applyThresholds(finalCandidates);
    return {
      accepted: accepted.map((c) => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence,
        reason: c.reason
      })),
      suggestedLowConfidence: suggestedLowConfidence.map((c) => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence
      })),
      needsReview: needsReview.map((c) => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence
      })),
      evidence: {
        similarVideos: similarVideos.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          similarity: v.similarity,
          tags: v.tags.map((t2) => t2.name)
        })),
        candidatesGenerated: candidates.length,
        llmRefined
      }
    };
  }
  /**
   * Apply user's tag decision (accept/reject a suggestion)
   */
  async applyTagDecision(videoId, tagName, decision) {
    const tag = this.getOrCreateTag(tagName);
    if (decision === "accept") {
      const id = `${videoId}_${tag.id}`;
      this.db.prepare(`
        INSERT OR REPLACE INTO video_tags
        (id, video_id, tag_id, source, suggestion_state, updated_at)
        VALUES (?, ?, ?, 'suggested', 'accepted', CURRENT_TIMESTAMP)
      `).run(id, videoId, tag.id);
    }
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, ?, 'user')
    `).run(videoId, tag.id, decision);
  }
  /**
   * Add a user tag manually
   * Supports both taxonomy tags and custom user-defined tags
   */
  addUserTag(videoId, tagName, lock = false) {
    const isFromTaxonomy = this.taxonomyService.isValidTag(tagName);
    const tag = isFromTaxonomy ? this.getOrCreateTag(tagName) : this.getOrCreateCustomTag(tagName);
    const id = `${videoId}_${tag.id}`;
    this.db.prepare(`
      INSERT OR REPLACE INTO video_tags
      (id, video_id, tag_id, source, is_locked, locked_at, suggestion_state, updated_at)
      VALUES (?, ?, ?, 'user', ?, ?, NULL, CURRENT_TIMESTAMP)
    `).run(
      id,
      videoId,
      tag.id,
      lock ? 1 : 0,
      lock ? (/* @__PURE__ */ new Date()).toISOString() : null
    );
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'add', 'user')
    `).run(videoId, tag.id);
  }
  /**
   * Lock a tag (protected from regeneration)
   */
  lockTag(videoId, tagName) {
    const tag = this.getTag(tagName);
    if (!tag) {
      throw new Error(`Tag "${tagName}" not found`);
    }
    this.db.prepare(`
      UPDATE video_tags
      SET is_locked = 1, locked_at = CURRENT_TIMESTAMP, locked_by = 'user'
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id);
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'lock', 'user')
    `).run(videoId, tag.id);
  }
  /**
   * Unlock a tag
   */
  unlockTag(videoId, tagName) {
    const tag = this.getTag(tagName);
    if (!tag) {
      throw new Error(`Tag "${tagName}" not found`);
    }
    this.db.prepare(`
      UPDATE video_tags
      SET is_locked = 0, locked_at = NULL, locked_by = NULL
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id);
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'unlock', 'user')
    `).run(videoId, tag.id);
  }
  /**
   * Remove a tag (respects locks)
   */
  removeTag(videoId, tagName, force = false) {
    const tag = this.getTag(tagName);
    if (!tag) {
      return { success: false, wasLocked: false };
    }
    const existing = this.db.prepare(`
      SELECT is_locked FROM video_tags
      WHERE video_id = ? AND tag_id = ?
    `).get(videoId, tag.id);
    const wasLocked = existing?.is_locked === 1;
    if (wasLocked && !force) {
      return { success: false, wasLocked: true };
    }
    this.db.prepare(`
      DELETE FROM video_tags
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id);
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'remove', 'user')
    `).run(videoId, tag.id);
    return { success: true, wasLocked };
  }
  /**
   * Regenerate suggestions (preserves locked tags)
   */
  async regenerateSuggestions(videoId) {
    const lockedTags = this.db.prepare(`
      SELECT t.name FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ? AND vt.is_locked = 1
    `).all(videoId);
    const lockedTagNames = new Set(lockedTags.map((t2) => t2.name));
    this.db.prepare(`
      DELETE FROM video_tags
      WHERE video_id = ? AND is_locked = 0 AND source IN ('suggested', 'ai_refined')
    `).run(videoId);
    const suggestions = await this.suggestTags(videoId);
    suggestions.accepted = suggestions.accepted.filter((t2) => !lockedTagNames.has(t2.tagName));
    return suggestions;
  }
  /**
   * Get tags for a video
   */
  getVideoTags(videoId) {
    const rows = this.db.prepare(`
      SELECT t.name, t.section, vt.confidence, vt.is_locked, vt.source
      FROM video_tags vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ?
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(videoId);
    return rows.map((row) => ({
      name: row.name,
      section: row.section || "Unknown",
      confidence: row.confidence,
      isLocked: row.is_locked === 1,
      source: row.source
    }));
  }
  /**
   * Check if a video is indexed
   */
  isVideoIndexed(videoId) {
    return this.embeddingService.isVideoIndexed(videoId);
  }
  /**
   * Get taxonomy information
   */
  getTaxonomy() {
    return this.taxonomyService.toJSON();
  }
  /**
   * Reload taxonomy from file
   */
  async reloadTaxonomy() {
    try {
      await this.taxonomyService.load();
      return { success: true, tagCount: this.taxonomyService.getTagCount() };
    } catch (error2) {
      console.error("Failed to reload taxonomy:", error2);
      return { success: false, tagCount: 0 };
    }
  }
  /**
   * Cleanup resources for a video
   */
  async cleanupVideo(videoId) {
    this.embeddingService.deleteVideoEmbeddings(videoId);
    await this.frameExtractor.cleanup(videoId);
  }
  // Helper methods
  getTag(tagName) {
    const normalized = this.taxonomyService.normalizeTagName(tagName);
    return this.db.prepare("SELECT id, name FROM tags WHERE name = ?").get(normalized);
  }
  getOrCreateTag(tagName) {
    const normalized = this.taxonomyService.normalizeTagName(tagName);
    let existing = this.getTag(normalized);
    if (existing) return existing;
    const tagConfig = this.taxonomyService.getTagConfig(normalized);
    this.db.prepare(`
      INSERT INTO tags (name, section, is_ai_generated) VALUES (?, ?, 0)
    `).run(normalized, tagConfig?.section || null);
    existing = this.getTag(normalized);
    if (!existing) {
      throw new Error(`Failed to create tag: ${normalized}`);
    }
    return existing;
  }
  getOrCreateCustomTag(tagName) {
    const normalized = tagName.toLowerCase().trim().replace(/\s+/g, "-");
    let existing = this.getTag(normalized);
    if (existing) return existing;
    this.db.prepare(`
      INSERT INTO tags (name, section, is_ai_generated) VALUES (?, 'Custom', 0)
    `).run(normalized);
    existing = this.getTag(normalized);
    if (!existing) {
      throw new Error(`Failed to create custom tag: ${normalized}`);
    }
    return existing;
  }
  // Expose services for advanced usage
  getTaxonomyService() {
    return this.taxonomyService;
  }
  getEmbeddingService() {
    return this.embeddingService;
  }
  getSimilarityService() {
    return this.similarityService;
  }
  getLLMRefiner() {
    return this.llmRefiner;
  }
}
const STATE_FILE = "watch-folder-state.json";
const DEFAULT_EXTENSIONS = /* @__PURE__ */ new Set([".txt", ".list", ".urls"]);
class WatchFolderService {
  constructor(db2) {
    this.db = db2;
    this.logger = new Logger("WatchFolderService");
    this.watcher = null;
    this.config = { enabled: false, path: null };
    this.fileState = /* @__PURE__ */ new Map();
    this.pending = /* @__PURE__ */ new Map();
    this.queue = new QueueManager(db2);
  }
  async startFromSettings() {
    const enabled = getSetting(this.db, "watch_folder_enabled");
    const path2 = getSetting(this.db, "watch_folder_path");
    const next = {
      enabled: enabled === "1" || enabled?.toLowerCase() === "true",
      path: path2 && path2.trim() ? path2 : null
    };
    await this.configure(next);
  }
  async configure(config) {
    const next = {
      enabled: config.enabled ?? this.config.enabled,
      path: config.path ?? this.config.path
    };
    const changed = next.enabled !== this.config.enabled || next.path !== this.config.path;
    this.config = next;
    if (!changed) {
      return;
    }
    await this.stop();
    if (this.config.enabled && this.config.path) {
      await this.start();
    }
  }
  async start() {
    if (!this.config.enabled || !this.config.path) {
      return;
    }
    await this.loadState();
    await this.scanFolder();
    if (this.watcher) {
      return;
    }
    try {
      this.watcher = node_fs.watch(this.config.path, (_event, filename) => {
        if (!filename) {
          return;
        }
        const fullPath = require$$0.join(this.config.path ?? "", filename.toString());
        this.queueProcess(fullPath);
      });
      this.logger.info("watch folder started", { path: this.config.path });
    } catch (error2) {
      this.logger.warn("failed to start watcher", { error: error2 });
    }
  }
  async stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    for (const timeout of this.pending.values()) {
      clearTimeout(timeout);
    }
    this.pending.clear();
  }
  async scanNow() {
    if (!this.config.enabled || !this.config.path) {
      return;
    }
    await this.scanFolder();
  }
  queueProcess(filePath) {
    if (this.pending.has(filePath)) {
      return;
    }
    const timer = setTimeout(() => {
      this.pending.delete(filePath);
      void this.processFile(filePath);
    }, 500);
    this.pending.set(filePath, timer);
  }
  async scanFolder() {
    if (!this.config.path) {
      return;
    }
    try {
      const entries = await promises.readdir(this.config.path);
      for (const entry of entries) {
        this.queueProcess(require$$0.join(this.config.path, entry));
      }
    } catch (error2) {
      this.logger.warn("failed to scan watch folder", { error: error2 });
    }
  }
  async processFile(filePath) {
    const ext = require$$0.extname(filePath).toLowerCase();
    if (!DEFAULT_EXTENSIONS.has(ext)) {
      return;
    }
    let info;
    try {
      info = await promises.stat(filePath);
    } catch {
      return;
    }
    if (!info.isFile()) {
      return;
    }
    const lastProcessed = this.fileState.get(filePath) ?? 0;
    if (info.mtimeMs <= lastProcessed) {
      return;
    }
    let content = "";
    try {
      content = await promises.readFile(filePath, "utf-8");
    } catch (error2) {
      this.logger.warn("failed to read watch file", { error: error2 });
      return;
    }
    const urls = this.extractUrls(content);
    if (urls.length) {
      const dedupeEnabled = this.readDedupeSetting();
      for (const url of urls) {
        if (dedupeEnabled && this.hasDuplicate(url)) {
          continue;
        }
        this.enqueueDownload(url);
      }
    }
    this.fileState.set(filePath, info.mtimeMs);
    await this.saveState();
  }
  extractUrls(contents) {
    const urls = /* @__PURE__ */ new Set();
    const lines = contents.split(/\r?\n/);
    const regex = /https?:\/\/[^\s]+/g;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const matches = trimmed.match(regex);
      if (matches) {
        for (const match of matches) {
          urls.add(match);
        }
      }
    }
    return Array.from(urls);
  }
  hasDownload(url) {
    const row = this.db.prepare("SELECT id FROM downloads WHERE url = ? LIMIT 1").get(url);
    return Boolean(row?.id);
  }
  hasVideo(url) {
    const row = this.db.prepare("SELECT id FROM videos WHERE source_url = ? LIMIT 1").get(url);
    return Boolean(row?.id);
  }
  hasDuplicate(url) {
    return this.hasDownload(url) || this.hasVideo(url);
  }
  readDedupeSetting() {
    const value = getSetting(this.db, "download_dedupe_enabled");
    if (value === null) {
      return true;
    }
    return value === "1" || value.toLowerCase() === "true";
  }
  enqueueDownload(url) {
    const downloadId = require$$1$1.randomUUID();
    const jobId = require$$1$1.randomUUID();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const outputDir = getSetting(this.db, "download_path") ?? getDownloadPath();
    this.db.prepare(
      "INSERT INTO downloads (id, url, job_id, status, progress, speed, eta, output_path, downloader, created_at, updated_at, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(downloadId, url, jobId, "queued", 0, null, null, null, "yt-dlp", createdAt, createdAt, null);
    this.queue.enqueue({
      id: jobId,
      type: "download",
      payload: {
        downloadId,
        url,
        outputDir
      }
    });
  }
  statePath() {
    return require$$0.join(getAppDataPath(), STATE_FILE);
  }
  async loadState() {
    const path2 = this.statePath();
    if (!node_fs.existsSync(path2)) {
      this.fileState.clear();
      return;
    }
    try {
      const content = await promises.readFile(path2, "utf-8");
      const parsed = JSON.parse(content);
      this.fileState = new Map(Object.entries(parsed.files ?? {}).map(([key, value]) => [key, Number(value) || 0]));
    } catch {
      this.fileState.clear();
    }
  }
  async saveState() {
    const path2 = this.statePath();
    const payload = { files: Object.fromEntries(this.fileState.entries()) };
    await promises.mkdir(getAppDataPath(), { recursive: true });
    await promises.writeFile(path2, JSON.stringify(payload, null, 2), "utf-8");
  }
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var main$1 = {};
var fs$i = {};
var universalify$1 = {};
universalify$1.fromCallback = function(fn) {
  return Object.defineProperty(function(...args) {
    if (typeof args[args.length - 1] === "function") fn.apply(this, args);
    else {
      return new Promise((resolve, reject) => {
        args.push((err, res) => err != null ? reject(err) : resolve(res));
        fn.apply(this, args);
      });
    }
  }, "name", { value: fn.name });
};
universalify$1.fromPromise = function(fn) {
  return Object.defineProperty(function(...args) {
    const cb = args[args.length - 1];
    if (typeof cb !== "function") return fn.apply(this, args);
    else {
      args.pop();
      fn.apply(this, args).then((r) => cb(null, r), cb);
    }
  }, "name", { value: fn.name });
};
var constants$2 = require$$0$3;
var origCwd = process.cwd;
var cwd = null;
var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd;
};
try {
  process.cwd();
} catch (er) {
}
if (typeof process.chdir === "function") {
  var chdir = process.chdir;
  process.chdir = function(d) {
    cwd = null;
    chdir.call(process, d);
  };
  if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
}
var polyfills$1 = patch$3;
function patch$3(fs2) {
  if (constants$2.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs2);
  }
  if (!fs2.lutimes) {
    patchLutimes(fs2);
  }
  fs2.chown = chownFix(fs2.chown);
  fs2.fchown = chownFix(fs2.fchown);
  fs2.lchown = chownFix(fs2.lchown);
  fs2.chmod = chmodFix(fs2.chmod);
  fs2.fchmod = chmodFix(fs2.fchmod);
  fs2.lchmod = chmodFix(fs2.lchmod);
  fs2.chownSync = chownFixSync(fs2.chownSync);
  fs2.fchownSync = chownFixSync(fs2.fchownSync);
  fs2.lchownSync = chownFixSync(fs2.lchownSync);
  fs2.chmodSync = chmodFixSync(fs2.chmodSync);
  fs2.fchmodSync = chmodFixSync(fs2.fchmodSync);
  fs2.lchmodSync = chmodFixSync(fs2.lchmodSync);
  fs2.stat = statFix(fs2.stat);
  fs2.fstat = statFix(fs2.fstat);
  fs2.lstat = statFix(fs2.lstat);
  fs2.statSync = statFixSync(fs2.statSync);
  fs2.fstatSync = statFixSync(fs2.fstatSync);
  fs2.lstatSync = statFixSync(fs2.lstatSync);
  if (fs2.chmod && !fs2.lchmod) {
    fs2.lchmod = function(path2, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs2.lchmodSync = function() {
    };
  }
  if (fs2.chown && !fs2.lchown) {
    fs2.lchown = function(path2, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs2.lchownSync = function() {
    };
  }
  if (platform === "win32") {
    fs2.rename = typeof fs2.rename !== "function" ? fs2.rename : function(fs$rename) {
      function rename2(from, to, cb) {
        var start = Date.now();
        var backoff = 0;
        fs$rename(from, to, function CB(er) {
          if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
            setTimeout(function() {
              fs2.stat(to, function(stater, st) {
                if (stater && stater.code === "ENOENT")
                  fs$rename(from, to, CB);
                else
                  cb(er);
              });
            }, backoff);
            if (backoff < 100)
              backoff += 10;
            return;
          }
          if (cb) cb(er);
        });
      }
      if (Object.setPrototypeOf) Object.setPrototypeOf(rename2, fs$rename);
      return rename2;
    }(fs2.rename);
  }
  fs2.read = typeof fs2.read !== "function" ? fs2.read : function(fs$read) {
    function read(fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === "function") {
        var eagCounter = 0;
        callback = function(er, _, __) {
          if (er && er.code === "EAGAIN" && eagCounter < 10) {
            eagCounter++;
            return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs2, fd, buffer, offset, length, position, callback);
    }
    if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
    return read;
  }(fs2.read);
  fs2.readSync = typeof fs2.readSync !== "function" ? fs2.readSync : /* @__PURE__ */ function(fs$readSync) {
    return function(fd, buffer, offset, length, position) {
      var eagCounter = 0;
      while (true) {
        try {
          return fs$readSync.call(fs2, fd, buffer, offset, length, position);
        } catch (er) {
          if (er.code === "EAGAIN" && eagCounter < 10) {
            eagCounter++;
            continue;
          }
          throw er;
        }
      }
    };
  }(fs2.readSync);
  function patchLchmod(fs22) {
    fs22.lchmod = function(path2, mode, callback) {
      fs22.open(
        path2,
        constants$2.O_WRONLY | constants$2.O_SYMLINK,
        mode,
        function(err, fd) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          fs22.fchmod(fd, mode, function(err2) {
            fs22.close(fd, function(err22) {
              if (callback) callback(err2 || err22);
            });
          });
        }
      );
    };
    fs22.lchmodSync = function(path2, mode) {
      var fd = fs22.openSync(path2, constants$2.O_WRONLY | constants$2.O_SYMLINK, mode);
      var threw = true;
      var ret;
      try {
        ret = fs22.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs22.closeSync(fd);
          } catch (er) {
          }
        } else {
          fs22.closeSync(fd);
        }
      }
      return ret;
    };
  }
  function patchLutimes(fs22) {
    if (constants$2.hasOwnProperty("O_SYMLINK") && fs22.futimes) {
      fs22.lutimes = function(path2, at, mt, cb) {
        fs22.open(path2, constants$2.O_SYMLINK, function(er, fd) {
          if (er) {
            if (cb) cb(er);
            return;
          }
          fs22.futimes(fd, at, mt, function(er2) {
            fs22.close(fd, function(er22) {
              if (cb) cb(er2 || er22);
            });
          });
        });
      };
      fs22.lutimesSync = function(path2, at, mt) {
        var fd = fs22.openSync(path2, constants$2.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs22.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs22.closeSync(fd);
            } catch (er) {
            }
          } else {
            fs22.closeSync(fd);
          }
        }
        return ret;
      };
    } else if (fs22.futimes) {
      fs22.lutimes = function(_a, _b, _c, cb) {
        if (cb) process.nextTick(cb);
      };
      fs22.lutimesSync = function() {
      };
    }
  }
  function chmodFix(orig) {
    if (!orig) return orig;
    return function(target, mode, cb) {
      return orig.call(fs2, target, mode, function(er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chmodFixSync(orig) {
    if (!orig) return orig;
    return function(target, mode) {
      try {
        return orig.call(fs2, target, mode);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function chownFix(orig) {
    if (!orig) return orig;
    return function(target, uid, gid, cb) {
      return orig.call(fs2, target, uid, gid, function(er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      });
    };
  }
  function chownFixSync(orig) {
    if (!orig) return orig;
    return function(target, uid, gid) {
      try {
        return orig.call(fs2, target, uid, gid);
      } catch (er) {
        if (!chownErOk(er)) throw er;
      }
    };
  }
  function statFix(orig) {
    if (!orig) return orig;
    return function(target, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = null;
      }
      function callback(er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 4294967296;
          if (stats.gid < 0) stats.gid += 4294967296;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs2, target, options, callback) : orig.call(fs2, target, callback);
    };
  }
  function statFixSync(orig) {
    if (!orig) return orig;
    return function(target, options) {
      var stats = options ? orig.call(fs2, target, options) : orig.call(fs2, target);
      if (stats) {
        if (stats.uid < 0) stats.uid += 4294967296;
        if (stats.gid < 0) stats.gid += 4294967296;
      }
      return stats;
    };
  }
  function chownErOk(er) {
    if (!er)
      return true;
    if (er.code === "ENOSYS")
      return true;
    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true;
    }
    return false;
  }
}
var Stream = require$$0$4.Stream;
var legacyStreams = legacy$1;
function legacy$1(fs2) {
  return {
    ReadStream,
    WriteStream
  };
  function ReadStream(path2, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path2, options);
    Stream.call(this);
    var self2 = this;
    this.path = path2;
    this.fd = null;
    this.readable = true;
    this.paused = false;
    this.flags = "r";
    this.mode = 438;
    this.bufferSize = 64 * 1024;
    options = options || {};
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }
    if (this.encoding) this.setEncoding(this.encoding);
    if (this.start !== void 0) {
      if ("number" !== typeof this.start) {
        throw TypeError("start must be a Number");
      }
      if (this.end === void 0) {
        this.end = Infinity;
      } else if ("number" !== typeof this.end) {
        throw TypeError("end must be a Number");
      }
      if (this.start > this.end) {
        throw new Error("start must be <= end");
      }
      this.pos = this.start;
    }
    if (this.fd !== null) {
      process.nextTick(function() {
        self2._read();
      });
      return;
    }
    fs2.open(this.path, this.flags, this.mode, function(err, fd) {
      if (err) {
        self2.emit("error", err);
        self2.readable = false;
        return;
      }
      self2.fd = fd;
      self2.emit("open", fd);
      self2._read();
    });
  }
  function WriteStream(path2, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path2, options);
    Stream.call(this);
    this.path = path2;
    this.fd = null;
    this.writable = true;
    this.flags = "w";
    this.encoding = "binary";
    this.mode = 438;
    this.bytesWritten = 0;
    options = options || {};
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }
    if (this.start !== void 0) {
      if ("number" !== typeof this.start) {
        throw TypeError("start must be a Number");
      }
      if (this.start < 0) {
        throw new Error("start must be >= zero");
      }
      this.pos = this.start;
    }
    this.busy = false;
    this._queue = [];
    if (this.fd === null) {
      this._open = fs2.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, void 0]);
      this.flush();
    }
  }
}
var clone_1 = clone$1;
var getPrototypeOf = Object.getPrototypeOf || function(obj) {
  return obj.__proto__;
};
function clone$1(obj) {
  if (obj === null || typeof obj !== "object")
    return obj;
  if (obj instanceof Object)
    var copy2 = { __proto__: getPrototypeOf(obj) };
  else
    var copy2 = /* @__PURE__ */ Object.create(null);
  Object.getOwnPropertyNames(obj).forEach(function(key) {
    Object.defineProperty(copy2, key, Object.getOwnPropertyDescriptor(obj, key));
  });
  return copy2;
}
var fs$h = require$$1$2;
var polyfills = polyfills$1;
var legacy = legacyStreams;
var clone = clone_1;
var util$2 = require$$4;
var gracefulQueue;
var previousSymbol;
if (typeof Symbol === "function" && typeof Symbol.for === "function") {
  gracefulQueue = Symbol.for("graceful-fs.queue");
  previousSymbol = Symbol.for("graceful-fs.previous");
} else {
  gracefulQueue = "___graceful-fs.queue";
  previousSymbol = "___graceful-fs.previous";
}
function noop() {
}
function publishQueue(context, queue2) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue2;
    }
  });
}
var debug$3 = noop;
if (util$2.debuglog)
  debug$3 = util$2.debuglog("gfs4");
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
  debug$3 = function() {
    var m = util$2.format.apply(util$2, arguments);
    m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
    console.error(m);
  };
if (!fs$h[gracefulQueue]) {
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$h, queue);
  fs$h.close = function(fs$close) {
    function close(fd, cb) {
      return fs$close.call(fs$h, fd, function(err) {
        if (!err) {
          resetQueue();
        }
        if (typeof cb === "function")
          cb.apply(this, arguments);
      });
    }
    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close;
  }(fs$h.close);
  fs$h.closeSync = function(fs$closeSync) {
    function closeSync(fd) {
      fs$closeSync.apply(fs$h, arguments);
      resetQueue();
    }
    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync;
  }(fs$h.closeSync);
  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
    process.on("exit", function() {
      debug$3(fs$h[gracefulQueue]);
      require$$5.equal(fs$h[gracefulQueue].length, 0);
    });
  }
}
if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$h[gracefulQueue]);
}
var gracefulFs = patch$2(clone(fs$h));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$h.__patched) {
  gracefulFs = patch$2(fs$h);
  fs$h.__patched = true;
}
function patch$2(fs2) {
  polyfills(fs2);
  fs2.gracefulify = patch$2;
  fs2.createReadStream = createReadStream;
  fs2.createWriteStream = createWriteStream;
  var fs$readFile = fs2.readFile;
  fs2.readFile = readFile2;
  function readFile2(path2, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$readFile(path2, options, cb);
    function go$readFile(path22, options2, cb2, startTime) {
      return fs$readFile(path22, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$readFile, [path22, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$writeFile = fs2.writeFile;
  fs2.writeFile = writeFile2;
  function writeFile2(path2, data, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$writeFile(path2, data, options, cb);
    function go$writeFile(path22, data2, options2, cb2, startTime) {
      return fs$writeFile(path22, data2, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$writeFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$appendFile = fs2.appendFile;
  if (fs$appendFile)
    fs2.appendFile = appendFile;
  function appendFile(path2, data, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    return go$appendFile(path2, data, options, cb);
    function go$appendFile(path22, data2, options2, cb2, startTime) {
      return fs$appendFile(path22, data2, options2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$appendFile, [path22, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$copyFile = fs2.copyFile;
  if (fs$copyFile)
    fs2.copyFile = copyFile2;
  function copyFile2(src2, dest, flags, cb) {
    if (typeof flags === "function") {
      cb = flags;
      flags = 0;
    }
    return go$copyFile(src2, dest, flags, cb);
    function go$copyFile(src22, dest2, flags2, cb2, startTime) {
      return fs$copyFile(src22, dest2, flags2, function(err) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$copyFile, [src22, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  var fs$readdir = fs2.readdir;
  fs2.readdir = readdir;
  var noReaddirOptionVersions = /^v[0-5]\./;
  function readdir(path2, options, cb) {
    if (typeof options === "function")
      cb = options, options = null;
    var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path22, options2, cb2, startTime) {
      return fs$readdir(path22, fs$readdirCallback(
        path22,
        options2,
        cb2,
        startTime
      ));
    } : function go$readdir2(path22, options2, cb2, startTime) {
      return fs$readdir(path22, options2, fs$readdirCallback(
        path22,
        options2,
        cb2,
        startTime
      ));
    };
    return go$readdir(path2, options, cb);
    function fs$readdirCallback(path22, options2, cb2, startTime) {
      return function(err, files) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([
            go$readdir,
            [path22, options2, cb2],
            err,
            startTime || Date.now(),
            Date.now()
          ]);
        else {
          if (files && files.sort)
            files.sort();
          if (typeof cb2 === "function")
            cb2.call(this, err, files);
        }
      };
    }
  }
  if (process.version.substr(0, 4) === "v0.8") {
    var legStreams = legacy(fs2);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }
  var fs$ReadStream = fs2.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }
  var fs$WriteStream = fs2.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }
  Object.defineProperty(fs2, "ReadStream", {
    get: function() {
      return ReadStream;
    },
    set: function(val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs2, "WriteStream", {
    get: function() {
      return WriteStream;
    },
    set: function(val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileReadStream = ReadStream;
  Object.defineProperty(fs2, "FileReadStream", {
    get: function() {
      return FileReadStream;
    },
    set: function(val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs2, "FileWriteStream", {
    get: function() {
      return FileWriteStream;
    },
    set: function(val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });
  function ReadStream(path2, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this;
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
  }
  function ReadStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function(err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();
        that.emit("error", err);
      } else {
        that.fd = fd;
        that.emit("open", fd);
        that.read();
      }
    });
  }
  function WriteStream(path2, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this;
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
  }
  function WriteStream$open() {
    var that = this;
    open(that.path, that.flags, that.mode, function(err, fd) {
      if (err) {
        that.destroy();
        that.emit("error", err);
      } else {
        that.fd = fd;
        that.emit("open", fd);
      }
    });
  }
  function createReadStream(path2, options) {
    return new fs2.ReadStream(path2, options);
  }
  function createWriteStream(path2, options) {
    return new fs2.WriteStream(path2, options);
  }
  var fs$open = fs2.open;
  fs2.open = open;
  function open(path2, flags, mode, cb) {
    if (typeof mode === "function")
      cb = mode, mode = null;
    return go$open(path2, flags, mode, cb);
    function go$open(path22, flags2, mode2, cb2, startTime) {
      return fs$open(path22, flags2, mode2, function(err, fd) {
        if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
          enqueue([go$open, [path22, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
        else {
          if (typeof cb2 === "function")
            cb2.apply(this, arguments);
        }
      });
    }
  }
  return fs2;
}
function enqueue(elem) {
  debug$3("ENQUEUE", elem[0].name, elem[1]);
  fs$h[gracefulQueue].push(elem);
  retry$2();
}
var retryTimer;
function resetQueue() {
  var now = Date.now();
  for (var i = 0; i < fs$h[gracefulQueue].length; ++i) {
    if (fs$h[gracefulQueue][i].length > 2) {
      fs$h[gracefulQueue][i][3] = now;
      fs$h[gracefulQueue][i][4] = now;
    }
  }
  retry$2();
}
function retry$2() {
  clearTimeout(retryTimer);
  retryTimer = void 0;
  if (fs$h[gracefulQueue].length === 0)
    return;
  var elem = fs$h[gracefulQueue].shift();
  var fn = elem[0];
  var args = elem[1];
  var err = elem[2];
  var startTime = elem[3];
  var lastTime = elem[4];
  if (startTime === void 0) {
    debug$3("RETRY", fn.name, args);
    fn.apply(null, args);
  } else if (Date.now() - startTime >= 6e4) {
    debug$3("TIMEOUT", fn.name, args);
    var cb = args.pop();
    if (typeof cb === "function")
      cb.call(null, err);
  } else {
    var sinceAttempt = Date.now() - lastTime;
    var sinceStart = Math.max(lastTime - startTime, 1);
    var desiredDelay = Math.min(sinceStart * 1.2, 100);
    if (sinceAttempt >= desiredDelay) {
      debug$3("RETRY", fn.name, args);
      fn.apply(null, args.concat([startTime]));
    } else {
      fs$h[gracefulQueue].push(elem);
    }
  }
  if (retryTimer === void 0) {
    retryTimer = setTimeout(retry$2, 0);
  }
}
(function(exports$1) {
  const u2 = universalify$1.fromCallback;
  const fs2 = gracefulFs;
  const api = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "lchmod",
    "lchown",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((key) => {
    return typeof fs2[key] === "function";
  });
  Object.assign(exports$1, fs2);
  api.forEach((method) => {
    exports$1[method] = u2(fs2[method]);
  });
  exports$1.exists = function(filename, callback) {
    if (typeof callback === "function") {
      return fs2.exists(filename, callback);
    }
    return new Promise((resolve) => {
      return fs2.exists(filename, resolve);
    });
  };
  exports$1.read = function(fd, buffer, offset, length, position, callback) {
    if (typeof callback === "function") {
      return fs2.read(fd, buffer, offset, length, position, callback);
    }
    return new Promise((resolve, reject) => {
      fs2.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
        if (err) return reject(err);
        resolve({ bytesRead, buffer: buffer2 });
      });
    });
  };
  exports$1.write = function(fd, buffer, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs2.write(fd, buffer, ...args);
    }
    return new Promise((resolve, reject) => {
      fs2.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
        if (err) return reject(err);
        resolve({ bytesWritten, buffer: buffer2 });
      });
    });
  };
  if (typeof fs2.writev === "function") {
    exports$1.writev = function(fd, buffers, ...args) {
      if (typeof args[args.length - 1] === "function") {
        return fs2.writev(fd, buffers, ...args);
      }
      return new Promise((resolve, reject) => {
        fs2.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
          if (err) return reject(err);
          resolve({ bytesWritten, buffers: buffers2 });
        });
      });
    };
  }
  if (typeof fs2.realpath.native === "function") {
    exports$1.realpath.native = u2(fs2.realpath.native);
  } else {
    process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  }
})(fs$i);
var makeDir$1 = {};
var utils$1 = {};
const path$l = require$$1$3;
utils$1.checkPath = function checkPath(pth) {
  if (process.platform === "win32") {
    const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path$l.parse(pth).root, ""));
    if (pathHasInvalidWinCharacters) {
      const error2 = new Error(`Path contains invalid characters: ${pth}`);
      error2.code = "EINVAL";
      throw error2;
    }
  }
};
const fs$g = fs$i;
const { checkPath: checkPath2 } = utils$1;
const getMode = (options) => {
  const defaults2 = { mode: 511 };
  if (typeof options === "number") return options;
  return { ...defaults2, ...options }.mode;
};
makeDir$1.makeDir = async (dir, options) => {
  checkPath2(dir);
  return fs$g.mkdir(dir, {
    mode: getMode(options),
    recursive: true
  });
};
makeDir$1.makeDirSync = (dir, options) => {
  checkPath2(dir);
  return fs$g.mkdirSync(dir, {
    mode: getMode(options),
    recursive: true
  });
};
const u$a = universalify$1.fromPromise;
const { makeDir: _makeDir, makeDirSync } = makeDir$1;
const makeDir = u$a(_makeDir);
var mkdirs$2 = {
  mkdirs: makeDir,
  mkdirsSync: makeDirSync,
  // alias
  mkdirp: makeDir,
  mkdirpSync: makeDirSync,
  ensureDir: makeDir,
  ensureDirSync: makeDirSync
};
const u$9 = universalify$1.fromPromise;
const fs$f = fs$i;
function pathExists$6(path2) {
  return fs$f.access(path2).then(() => true).catch(() => false);
}
var pathExists_1 = {
  pathExists: u$9(pathExists$6),
  pathExistsSync: fs$f.existsSync
};
const fs$e = gracefulFs;
function utimesMillis$1(path2, atime, mtime, callback) {
  fs$e.open(path2, "r+", (err, fd) => {
    if (err) return callback(err);
    fs$e.futimes(fd, atime, mtime, (futimesErr) => {
      fs$e.close(fd, (closeErr) => {
        if (callback) callback(futimesErr || closeErr);
      });
    });
  });
}
function utimesMillisSync$1(path2, atime, mtime) {
  const fd = fs$e.openSync(path2, "r+");
  fs$e.futimesSync(fd, atime, mtime);
  return fs$e.closeSync(fd);
}
var utimes = {
  utimesMillis: utimesMillis$1,
  utimesMillisSync: utimesMillisSync$1
};
const fs$d = fs$i;
const path$k = require$$1$3;
const util$1 = require$$4;
function getStats$2(src2, dest, opts) {
  const statFunc = opts.dereference ? (file2) => fs$d.stat(file2, { bigint: true }) : (file2) => fs$d.lstat(file2, { bigint: true });
  return Promise.all([
    statFunc(src2),
    statFunc(dest).catch((err) => {
      if (err.code === "ENOENT") return null;
      throw err;
    })
  ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
}
function getStatsSync(src2, dest, opts) {
  let destStat;
  const statFunc = opts.dereference ? (file2) => fs$d.statSync(file2, { bigint: true }) : (file2) => fs$d.lstatSync(file2, { bigint: true });
  const srcStat = statFunc(src2);
  try {
    destStat = statFunc(dest);
  } catch (err) {
    if (err.code === "ENOENT") return { srcStat, destStat: null };
    throw err;
  }
  return { srcStat, destStat };
}
function checkPaths(src2, dest, funcName, opts, cb) {
  util$1.callbackify(getStats$2)(src2, dest, opts, (err, stats) => {
    if (err) return cb(err);
    const { srcStat, destStat } = stats;
    if (destStat) {
      if (areIdentical$2(srcStat, destStat)) {
        const srcBaseName = path$k.basename(src2);
        const destBaseName = path$k.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return cb(null, { srcStat, destStat, isChangingCase: true });
        }
        return cb(new Error("Source and destination must not be the same."));
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite non-directory '${dest}' with directory '${src2}'.`));
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        return cb(new Error(`Cannot overwrite directory '${dest}' with non-directory '${src2}'.`));
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src2, dest)) {
      return cb(new Error(errMsg(src2, dest, funcName)));
    }
    return cb(null, { srcStat, destStat });
  });
}
function checkPathsSync(src2, dest, funcName, opts) {
  const { srcStat, destStat } = getStatsSync(src2, dest, opts);
  if (destStat) {
    if (areIdentical$2(srcStat, destStat)) {
      const srcBaseName = path$k.basename(src2);
      const destBaseName = path$k.basename(dest);
      if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
        return { srcStat, destStat, isChangingCase: true };
      }
      throw new Error("Source and destination must not be the same.");
    }
    if (srcStat.isDirectory() && !destStat.isDirectory()) {
      throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src2}'.`);
    }
    if (!srcStat.isDirectory() && destStat.isDirectory()) {
      throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src2}'.`);
    }
  }
  if (srcStat.isDirectory() && isSrcSubdir(src2, dest)) {
    throw new Error(errMsg(src2, dest, funcName));
  }
  return { srcStat, destStat };
}
function checkParentPaths(src2, srcStat, dest, funcName, cb) {
  const srcParent = path$k.resolve(path$k.dirname(src2));
  const destParent = path$k.resolve(path$k.dirname(dest));
  if (destParent === srcParent || destParent === path$k.parse(destParent).root) return cb();
  fs$d.stat(destParent, { bigint: true }, (err, destStat) => {
    if (err) {
      if (err.code === "ENOENT") return cb();
      return cb(err);
    }
    if (areIdentical$2(srcStat, destStat)) {
      return cb(new Error(errMsg(src2, dest, funcName)));
    }
    return checkParentPaths(src2, srcStat, destParent, funcName, cb);
  });
}
function checkParentPathsSync(src2, srcStat, dest, funcName) {
  const srcParent = path$k.resolve(path$k.dirname(src2));
  const destParent = path$k.resolve(path$k.dirname(dest));
  if (destParent === srcParent || destParent === path$k.parse(destParent).root) return;
  let destStat;
  try {
    destStat = fs$d.statSync(destParent, { bigint: true });
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  if (areIdentical$2(srcStat, destStat)) {
    throw new Error(errMsg(src2, dest, funcName));
  }
  return checkParentPathsSync(src2, srcStat, destParent, funcName);
}
function areIdentical$2(srcStat, destStat) {
  return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
}
function isSrcSubdir(src2, dest) {
  const srcArr = path$k.resolve(src2).split(path$k.sep).filter((i) => i);
  const destArr = path$k.resolve(dest).split(path$k.sep).filter((i) => i);
  return srcArr.reduce((acc, cur, i) => acc && destArr[i] === cur, true);
}
function errMsg(src2, dest, funcName) {
  return `Cannot ${funcName} '${src2}' to a subdirectory of itself, '${dest}'.`;
}
var stat$4 = {
  checkPaths,
  checkPathsSync,
  checkParentPaths,
  checkParentPathsSync,
  isSrcSubdir,
  areIdentical: areIdentical$2
};
const fs$c = gracefulFs;
const path$j = require$$1$3;
const mkdirs$1 = mkdirs$2.mkdirs;
const pathExists$5 = pathExists_1.pathExists;
const utimesMillis = utimes.utimesMillis;
const stat$3 = stat$4;
function copy$2(src2, dest, opts, cb) {
  if (typeof opts === "function" && !cb) {
    cb = opts;
    opts = {};
  } else if (typeof opts === "function") {
    opts = { filter: opts };
  }
  cb = cb || function() {
  };
  opts = opts || {};
  opts.clobber = "clobber" in opts ? !!opts.clobber : true;
  opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
  if (opts.preserveTimestamps && process.arch === "ia32") {
    process.emitWarning(
      "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
      "Warning",
      "fs-extra-WARN0001"
    );
  }
  stat$3.checkPaths(src2, dest, "copy", opts, (err, stats) => {
    if (err) return cb(err);
    const { srcStat, destStat } = stats;
    stat$3.checkParentPaths(src2, srcStat, dest, "copy", (err2) => {
      if (err2) return cb(err2);
      if (opts.filter) return handleFilter(checkParentDir, destStat, src2, dest, opts, cb);
      return checkParentDir(destStat, src2, dest, opts, cb);
    });
  });
}
function checkParentDir(destStat, src2, dest, opts, cb) {
  const destParent = path$j.dirname(dest);
  pathExists$5(destParent, (err, dirExists) => {
    if (err) return cb(err);
    if (dirExists) return getStats$1(destStat, src2, dest, opts, cb);
    mkdirs$1(destParent, (err2) => {
      if (err2) return cb(err2);
      return getStats$1(destStat, src2, dest, opts, cb);
    });
  });
}
function handleFilter(onInclude, destStat, src2, dest, opts, cb) {
  Promise.resolve(opts.filter(src2, dest)).then((include) => {
    if (include) return onInclude(destStat, src2, dest, opts, cb);
    return cb();
  }, (error2) => cb(error2));
}
function startCopy$1(destStat, src2, dest, opts, cb) {
  if (opts.filter) return handleFilter(getStats$1, destStat, src2, dest, opts, cb);
  return getStats$1(destStat, src2, dest, opts, cb);
}
function getStats$1(destStat, src2, dest, opts, cb) {
  const stat2 = opts.dereference ? fs$c.stat : fs$c.lstat;
  stat2(src2, (err, srcStat) => {
    if (err) return cb(err);
    if (srcStat.isDirectory()) return onDir$1(srcStat, destStat, src2, dest, opts, cb);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile$1(srcStat, destStat, src2, dest, opts, cb);
    else if (srcStat.isSymbolicLink()) return onLink$1(destStat, src2, dest, opts, cb);
    else if (srcStat.isSocket()) return cb(new Error(`Cannot copy a socket file: ${src2}`));
    else if (srcStat.isFIFO()) return cb(new Error(`Cannot copy a FIFO pipe: ${src2}`));
    return cb(new Error(`Unknown file: ${src2}`));
  });
}
function onFile$1(srcStat, destStat, src2, dest, opts, cb) {
  if (!destStat) return copyFile$1(srcStat, src2, dest, opts, cb);
  return mayCopyFile$1(srcStat, src2, dest, opts, cb);
}
function mayCopyFile$1(srcStat, src2, dest, opts, cb) {
  if (opts.overwrite) {
    fs$c.unlink(dest, (err) => {
      if (err) return cb(err);
      return copyFile$1(srcStat, src2, dest, opts, cb);
    });
  } else if (opts.errorOnExist) {
    return cb(new Error(`'${dest}' already exists`));
  } else return cb();
}
function copyFile$1(srcStat, src2, dest, opts, cb) {
  fs$c.copyFile(src2, dest, (err) => {
    if (err) return cb(err);
    if (opts.preserveTimestamps) return handleTimestampsAndMode(srcStat.mode, src2, dest, cb);
    return setDestMode$1(dest, srcStat.mode, cb);
  });
}
function handleTimestampsAndMode(srcMode, src2, dest, cb) {
  if (fileIsNotWritable$1(srcMode)) {
    return makeFileWritable$1(dest, srcMode, (err) => {
      if (err) return cb(err);
      return setDestTimestampsAndMode(srcMode, src2, dest, cb);
    });
  }
  return setDestTimestampsAndMode(srcMode, src2, dest, cb);
}
function fileIsNotWritable$1(srcMode) {
  return (srcMode & 128) === 0;
}
function makeFileWritable$1(dest, srcMode, cb) {
  return setDestMode$1(dest, srcMode | 128, cb);
}
function setDestTimestampsAndMode(srcMode, src2, dest, cb) {
  setDestTimestamps$1(src2, dest, (err) => {
    if (err) return cb(err);
    return setDestMode$1(dest, srcMode, cb);
  });
}
function setDestMode$1(dest, srcMode, cb) {
  return fs$c.chmod(dest, srcMode, cb);
}
function setDestTimestamps$1(src2, dest, cb) {
  fs$c.stat(src2, (err, updatedSrcStat) => {
    if (err) return cb(err);
    return utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime, cb);
  });
}
function onDir$1(srcStat, destStat, src2, dest, opts, cb) {
  if (!destStat) return mkDirAndCopy$1(srcStat.mode, src2, dest, opts, cb);
  return copyDir$1(src2, dest, opts, cb);
}
function mkDirAndCopy$1(srcMode, src2, dest, opts, cb) {
  fs$c.mkdir(dest, (err) => {
    if (err) return cb(err);
    copyDir$1(src2, dest, opts, (err2) => {
      if (err2) return cb(err2);
      return setDestMode$1(dest, srcMode, cb);
    });
  });
}
function copyDir$1(src2, dest, opts, cb) {
  fs$c.readdir(src2, (err, items) => {
    if (err) return cb(err);
    return copyDirItems(items, src2, dest, opts, cb);
  });
}
function copyDirItems(items, src2, dest, opts, cb) {
  const item = items.pop();
  if (!item) return cb();
  return copyDirItem$1(items, item, src2, dest, opts, cb);
}
function copyDirItem$1(items, item, src2, dest, opts, cb) {
  const srcItem = path$j.join(src2, item);
  const destItem = path$j.join(dest, item);
  stat$3.checkPaths(srcItem, destItem, "copy", opts, (err, stats) => {
    if (err) return cb(err);
    const { destStat } = stats;
    startCopy$1(destStat, srcItem, destItem, opts, (err2) => {
      if (err2) return cb(err2);
      return copyDirItems(items, src2, dest, opts, cb);
    });
  });
}
function onLink$1(destStat, src2, dest, opts, cb) {
  fs$c.readlink(src2, (err, resolvedSrc) => {
    if (err) return cb(err);
    if (opts.dereference) {
      resolvedSrc = path$j.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs$c.symlink(resolvedSrc, dest, cb);
    } else {
      fs$c.readlink(dest, (err2, resolvedDest) => {
        if (err2) {
          if (err2.code === "EINVAL" || err2.code === "UNKNOWN") return fs$c.symlink(resolvedSrc, dest, cb);
          return cb(err2);
        }
        if (opts.dereference) {
          resolvedDest = path$j.resolve(process.cwd(), resolvedDest);
        }
        if (stat$3.isSrcSubdir(resolvedSrc, resolvedDest)) {
          return cb(new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`));
        }
        if (destStat.isDirectory() && stat$3.isSrcSubdir(resolvedDest, resolvedSrc)) {
          return cb(new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`));
        }
        return copyLink$1(resolvedSrc, dest, cb);
      });
    }
  });
}
function copyLink$1(resolvedSrc, dest, cb) {
  fs$c.unlink(dest, (err) => {
    if (err) return cb(err);
    return fs$c.symlink(resolvedSrc, dest, cb);
  });
}
var copy_1 = copy$2;
const fs$b = gracefulFs;
const path$i = require$$1$3;
const mkdirsSync$1 = mkdirs$2.mkdirsSync;
const utimesMillisSync = utimes.utimesMillisSync;
const stat$2 = stat$4;
function copySync$1(src2, dest, opts) {
  if (typeof opts === "function") {
    opts = { filter: opts };
  }
  opts = opts || {};
  opts.clobber = "clobber" in opts ? !!opts.clobber : true;
  opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
  if (opts.preserveTimestamps && process.arch === "ia32") {
    process.emitWarning(
      "Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269",
      "Warning",
      "fs-extra-WARN0002"
    );
  }
  const { srcStat, destStat } = stat$2.checkPathsSync(src2, dest, "copy", opts);
  stat$2.checkParentPathsSync(src2, srcStat, dest, "copy");
  return handleFilterAndCopy(destStat, src2, dest, opts);
}
function handleFilterAndCopy(destStat, src2, dest, opts) {
  if (opts.filter && !opts.filter(src2, dest)) return;
  const destParent = path$i.dirname(dest);
  if (!fs$b.existsSync(destParent)) mkdirsSync$1(destParent);
  return getStats(destStat, src2, dest, opts);
}
function startCopy(destStat, src2, dest, opts) {
  if (opts.filter && !opts.filter(src2, dest)) return;
  return getStats(destStat, src2, dest, opts);
}
function getStats(destStat, src2, dest, opts) {
  const statSync = opts.dereference ? fs$b.statSync : fs$b.lstatSync;
  const srcStat = statSync(src2);
  if (srcStat.isDirectory()) return onDir(srcStat, destStat, src2, dest, opts);
  else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src2, dest, opts);
  else if (srcStat.isSymbolicLink()) return onLink(destStat, src2, dest, opts);
  else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src2}`);
  else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src2}`);
  throw new Error(`Unknown file: ${src2}`);
}
function onFile(srcStat, destStat, src2, dest, opts) {
  if (!destStat) return copyFile(srcStat, src2, dest, opts);
  return mayCopyFile(srcStat, src2, dest, opts);
}
function mayCopyFile(srcStat, src2, dest, opts) {
  if (opts.overwrite) {
    fs$b.unlinkSync(dest);
    return copyFile(srcStat, src2, dest, opts);
  } else if (opts.errorOnExist) {
    throw new Error(`'${dest}' already exists`);
  }
}
function copyFile(srcStat, src2, dest, opts) {
  fs$b.copyFileSync(src2, dest);
  if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src2, dest);
  return setDestMode(dest, srcStat.mode);
}
function handleTimestamps(srcMode, src2, dest) {
  if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
  return setDestTimestamps(src2, dest);
}
function fileIsNotWritable(srcMode) {
  return (srcMode & 128) === 0;
}
function makeFileWritable(dest, srcMode) {
  return setDestMode(dest, srcMode | 128);
}
function setDestMode(dest, srcMode) {
  return fs$b.chmodSync(dest, srcMode);
}
function setDestTimestamps(src2, dest) {
  const updatedSrcStat = fs$b.statSync(src2);
  return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
}
function onDir(srcStat, destStat, src2, dest, opts) {
  if (!destStat) return mkDirAndCopy(srcStat.mode, src2, dest, opts);
  return copyDir(src2, dest, opts);
}
function mkDirAndCopy(srcMode, src2, dest, opts) {
  fs$b.mkdirSync(dest);
  copyDir(src2, dest, opts);
  return setDestMode(dest, srcMode);
}
function copyDir(src2, dest, opts) {
  fs$b.readdirSync(src2).forEach((item) => copyDirItem(item, src2, dest, opts));
}
function copyDirItem(item, src2, dest, opts) {
  const srcItem = path$i.join(src2, item);
  const destItem = path$i.join(dest, item);
  const { destStat } = stat$2.checkPathsSync(srcItem, destItem, "copy", opts);
  return startCopy(destStat, srcItem, destItem, opts);
}
function onLink(destStat, src2, dest, opts) {
  let resolvedSrc = fs$b.readlinkSync(src2);
  if (opts.dereference) {
    resolvedSrc = path$i.resolve(process.cwd(), resolvedSrc);
  }
  if (!destStat) {
    return fs$b.symlinkSync(resolvedSrc, dest);
  } else {
    let resolvedDest;
    try {
      resolvedDest = fs$b.readlinkSync(dest);
    } catch (err) {
      if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs$b.symlinkSync(resolvedSrc, dest);
      throw err;
    }
    if (opts.dereference) {
      resolvedDest = path$i.resolve(process.cwd(), resolvedDest);
    }
    if (stat$2.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
    }
    if (fs$b.statSync(dest).isDirectory() && stat$2.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
    }
    return copyLink(resolvedSrc, dest);
  }
}
function copyLink(resolvedSrc, dest) {
  fs$b.unlinkSync(dest);
  return fs$b.symlinkSync(resolvedSrc, dest);
}
var copySync_1 = copySync$1;
const u$8 = universalify$1.fromCallback;
var copy$1 = {
  copy: u$8(copy_1),
  copySync: copySync_1
};
const fs$a = gracefulFs;
const path$h = require$$1$3;
const assert = require$$5;
const isWindows = process.platform === "win32";
function defaults(options) {
  const methods = [
    "unlink",
    "chmod",
    "stat",
    "lstat",
    "rmdir",
    "readdir"
  ];
  methods.forEach((m) => {
    options[m] = options[m] || fs$a[m];
    m = m + "Sync";
    options[m] = options[m] || fs$a[m];
  });
  options.maxBusyTries = options.maxBusyTries || 3;
}
function rimraf$1(p, options, cb) {
  let busyTries = 0;
  if (typeof options === "function") {
    cb = options;
    options = {};
  }
  assert(p, "rimraf: missing path");
  assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
  assert.strictEqual(typeof cb, "function", "rimraf: callback function required");
  assert(options, "rimraf: invalid options argument provided");
  assert.strictEqual(typeof options, "object", "rimraf: options should be object");
  defaults(options);
  rimraf_(p, options, function CB(er) {
    if (er) {
      if ((er.code === "EBUSY" || er.code === "ENOTEMPTY" || er.code === "EPERM") && busyTries < options.maxBusyTries) {
        busyTries++;
        const time = busyTries * 100;
        return setTimeout(() => rimraf_(p, options, CB), time);
      }
      if (er.code === "ENOENT") er = null;
    }
    cb(er);
  });
}
function rimraf_(p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.lstat(p, (er, st) => {
    if (er && er.code === "ENOENT") {
      return cb(null);
    }
    if (er && er.code === "EPERM" && isWindows) {
      return fixWinEPERM(p, options, er, cb);
    }
    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb);
    }
    options.unlink(p, (er2) => {
      if (er2) {
        if (er2.code === "ENOENT") {
          return cb(null);
        }
        if (er2.code === "EPERM") {
          return isWindows ? fixWinEPERM(p, options, er2, cb) : rmdir(p, options, er2, cb);
        }
        if (er2.code === "EISDIR") {
          return rmdir(p, options, er2, cb);
        }
      }
      return cb(er2);
    });
  });
}
function fixWinEPERM(p, options, er, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.chmod(p, 438, (er2) => {
    if (er2) {
      cb(er2.code === "ENOENT" ? null : er);
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === "ENOENT" ? null : er);
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb);
        } else {
          options.unlink(p, cb);
        }
      });
    }
  });
}
function fixWinEPERMSync(p, options, er) {
  let stats;
  assert(p);
  assert(options);
  try {
    options.chmodSync(p, 438);
  } catch (er2) {
    if (er2.code === "ENOENT") {
      return;
    } else {
      throw er;
    }
  }
  try {
    stats = options.statSync(p);
  } catch (er3) {
    if (er3.code === "ENOENT") {
      return;
    } else {
      throw er;
    }
  }
  if (stats.isDirectory()) {
    rmdirSync(p, options, er);
  } else {
    options.unlinkSync(p);
  }
}
function rmdir(p, options, originalEr, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.rmdir(p, (er) => {
    if (er && (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM")) {
      rmkids(p, options, cb);
    } else if (er && er.code === "ENOTDIR") {
      cb(originalEr);
    } else {
      cb(er);
    }
  });
}
function rmkids(p, options, cb) {
  assert(p);
  assert(options);
  assert(typeof cb === "function");
  options.readdir(p, (er, files) => {
    if (er) return cb(er);
    let n = files.length;
    let errState;
    if (n === 0) return options.rmdir(p, cb);
    files.forEach((f) => {
      rimraf$1(path$h.join(p, f), options, (er2) => {
        if (errState) {
          return;
        }
        if (er2) return cb(errState = er2);
        if (--n === 0) {
          options.rmdir(p, cb);
        }
      });
    });
  });
}
function rimrafSync(p, options) {
  let st;
  options = options || {};
  defaults(options);
  assert(p, "rimraf: missing path");
  assert.strictEqual(typeof p, "string", "rimraf: path should be a string");
  assert(options, "rimraf: missing options");
  assert.strictEqual(typeof options, "object", "rimraf: options should be object");
  try {
    st = options.lstatSync(p);
  } catch (er) {
    if (er.code === "ENOENT") {
      return;
    }
    if (er.code === "EPERM" && isWindows) {
      fixWinEPERMSync(p, options, er);
    }
  }
  try {
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null);
    } else {
      options.unlinkSync(p);
    }
  } catch (er) {
    if (er.code === "ENOENT") {
      return;
    } else if (er.code === "EPERM") {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er);
    } else if (er.code !== "EISDIR") {
      throw er;
    }
    rmdirSync(p, options, er);
  }
}
function rmdirSync(p, options, originalEr) {
  assert(p);
  assert(options);
  try {
    options.rmdirSync(p);
  } catch (er) {
    if (er.code === "ENOTDIR") {
      throw originalEr;
    } else if (er.code === "ENOTEMPTY" || er.code === "EEXIST" || er.code === "EPERM") {
      rmkidsSync(p, options);
    } else if (er.code !== "ENOENT") {
      throw er;
    }
  }
}
function rmkidsSync(p, options) {
  assert(p);
  assert(options);
  options.readdirSync(p).forEach((f) => rimrafSync(path$h.join(p, f), options));
  if (isWindows) {
    const startTime = Date.now();
    do {
      try {
        const ret = options.rmdirSync(p, options);
        return ret;
      } catch {
      }
    } while (Date.now() - startTime < 500);
  } else {
    const ret = options.rmdirSync(p, options);
    return ret;
  }
}
var rimraf_1 = rimraf$1;
rimraf$1.sync = rimrafSync;
const fs$9 = gracefulFs;
const u$7 = universalify$1.fromCallback;
const rimraf = rimraf_1;
function remove$2(path2, callback) {
  if (fs$9.rm) return fs$9.rm(path2, { recursive: true, force: true }, callback);
  rimraf(path2, callback);
}
function removeSync$1(path2) {
  if (fs$9.rmSync) return fs$9.rmSync(path2, { recursive: true, force: true });
  rimraf.sync(path2);
}
var remove_1 = {
  remove: u$7(remove$2),
  removeSync: removeSync$1
};
const u$6 = universalify$1.fromPromise;
const fs$8 = fs$i;
const path$g = require$$1$3;
const mkdir$3 = mkdirs$2;
const remove$1 = remove_1;
const emptyDir = u$6(async function emptyDir2(dir) {
  let items;
  try {
    items = await fs$8.readdir(dir);
  } catch {
    return mkdir$3.mkdirs(dir);
  }
  return Promise.all(items.map((item) => remove$1.remove(path$g.join(dir, item))));
});
function emptyDirSync(dir) {
  let items;
  try {
    items = fs$8.readdirSync(dir);
  } catch {
    return mkdir$3.mkdirsSync(dir);
  }
  items.forEach((item) => {
    item = path$g.join(dir, item);
    remove$1.removeSync(item);
  });
}
var empty = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
};
const u$5 = universalify$1.fromCallback;
const path$f = require$$1$3;
const fs$7 = gracefulFs;
const mkdir$2 = mkdirs$2;
function createFile$1(file2, callback) {
  function makeFile() {
    fs$7.writeFile(file2, "", (err) => {
      if (err) return callback(err);
      callback();
    });
  }
  fs$7.stat(file2, (err, stats) => {
    if (!err && stats.isFile()) return callback();
    const dir = path$f.dirname(file2);
    fs$7.stat(dir, (err2, stats2) => {
      if (err2) {
        if (err2.code === "ENOENT") {
          return mkdir$2.mkdirs(dir, (err3) => {
            if (err3) return callback(err3);
            makeFile();
          });
        }
        return callback(err2);
      }
      if (stats2.isDirectory()) makeFile();
      else {
        fs$7.readdir(dir, (err3) => {
          if (err3) return callback(err3);
        });
      }
    });
  });
}
function createFileSync$1(file2) {
  let stats;
  try {
    stats = fs$7.statSync(file2);
  } catch {
  }
  if (stats && stats.isFile()) return;
  const dir = path$f.dirname(file2);
  try {
    if (!fs$7.statSync(dir).isDirectory()) {
      fs$7.readdirSync(dir);
    }
  } catch (err) {
    if (err && err.code === "ENOENT") mkdir$2.mkdirsSync(dir);
    else throw err;
  }
  fs$7.writeFileSync(file2, "");
}
var file = {
  createFile: u$5(createFile$1),
  createFileSync: createFileSync$1
};
const u$4 = universalify$1.fromCallback;
const path$e = require$$1$3;
const fs$6 = gracefulFs;
const mkdir$1 = mkdirs$2;
const pathExists$4 = pathExists_1.pathExists;
const { areIdentical: areIdentical$1 } = stat$4;
function createLink$1(srcpath, dstpath, callback) {
  function makeLink(srcpath2, dstpath2) {
    fs$6.link(srcpath2, dstpath2, (err) => {
      if (err) return callback(err);
      callback(null);
    });
  }
  fs$6.lstat(dstpath, (_, dstStat) => {
    fs$6.lstat(srcpath, (err, srcStat) => {
      if (err) {
        err.message = err.message.replace("lstat", "ensureLink");
        return callback(err);
      }
      if (dstStat && areIdentical$1(srcStat, dstStat)) return callback(null);
      const dir = path$e.dirname(dstpath);
      pathExists$4(dir, (err2, dirExists) => {
        if (err2) return callback(err2);
        if (dirExists) return makeLink(srcpath, dstpath);
        mkdir$1.mkdirs(dir, (err3) => {
          if (err3) return callback(err3);
          makeLink(srcpath, dstpath);
        });
      });
    });
  });
}
function createLinkSync$1(srcpath, dstpath) {
  let dstStat;
  try {
    dstStat = fs$6.lstatSync(dstpath);
  } catch {
  }
  try {
    const srcStat = fs$6.lstatSync(srcpath);
    if (dstStat && areIdentical$1(srcStat, dstStat)) return;
  } catch (err) {
    err.message = err.message.replace("lstat", "ensureLink");
    throw err;
  }
  const dir = path$e.dirname(dstpath);
  const dirExists = fs$6.existsSync(dir);
  if (dirExists) return fs$6.linkSync(srcpath, dstpath);
  mkdir$1.mkdirsSync(dir);
  return fs$6.linkSync(srcpath, dstpath);
}
var link = {
  createLink: u$4(createLink$1),
  createLinkSync: createLinkSync$1
};
const path$d = require$$1$3;
const fs$5 = gracefulFs;
const pathExists$3 = pathExists_1.pathExists;
function symlinkPaths$1(srcpath, dstpath, callback) {
  if (path$d.isAbsolute(srcpath)) {
    return fs$5.lstat(srcpath, (err) => {
      if (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        return callback(err);
      }
      return callback(null, {
        toCwd: srcpath,
        toDst: srcpath
      });
    });
  } else {
    const dstdir = path$d.dirname(dstpath);
    const relativeToDst = path$d.join(dstdir, srcpath);
    return pathExists$3(relativeToDst, (err, exists) => {
      if (err) return callback(err);
      if (exists) {
        return callback(null, {
          toCwd: relativeToDst,
          toDst: srcpath
        });
      } else {
        return fs$5.lstat(srcpath, (err2) => {
          if (err2) {
            err2.message = err2.message.replace("lstat", "ensureSymlink");
            return callback(err2);
          }
          return callback(null, {
            toCwd: srcpath,
            toDst: path$d.relative(dstdir, srcpath)
          });
        });
      }
    });
  }
}
function symlinkPathsSync$1(srcpath, dstpath) {
  let exists;
  if (path$d.isAbsolute(srcpath)) {
    exists = fs$5.existsSync(srcpath);
    if (!exists) throw new Error("absolute srcpath does not exist");
    return {
      toCwd: srcpath,
      toDst: srcpath
    };
  } else {
    const dstdir = path$d.dirname(dstpath);
    const relativeToDst = path$d.join(dstdir, srcpath);
    exists = fs$5.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    } else {
      exists = fs$5.existsSync(srcpath);
      if (!exists) throw new Error("relative srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: path$d.relative(dstdir, srcpath)
      };
    }
  }
}
var symlinkPaths_1 = {
  symlinkPaths: symlinkPaths$1,
  symlinkPathsSync: symlinkPathsSync$1
};
const fs$4 = gracefulFs;
function symlinkType$1(srcpath, type2, callback) {
  callback = typeof type2 === "function" ? type2 : callback;
  type2 = typeof type2 === "function" ? false : type2;
  if (type2) return callback(null, type2);
  fs$4.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, "file");
    type2 = stats && stats.isDirectory() ? "dir" : "file";
    callback(null, type2);
  });
}
function symlinkTypeSync$1(srcpath, type2) {
  let stats;
  if (type2) return type2;
  try {
    stats = fs$4.lstatSync(srcpath);
  } catch {
    return "file";
  }
  return stats && stats.isDirectory() ? "dir" : "file";
}
var symlinkType_1 = {
  symlinkType: symlinkType$1,
  symlinkTypeSync: symlinkTypeSync$1
};
const u$3 = universalify$1.fromCallback;
const path$c = require$$1$3;
const fs$3 = fs$i;
const _mkdirs = mkdirs$2;
const mkdirs = _mkdirs.mkdirs;
const mkdirsSync = _mkdirs.mkdirsSync;
const _symlinkPaths = symlinkPaths_1;
const symlinkPaths = _symlinkPaths.symlinkPaths;
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync;
const _symlinkType = symlinkType_1;
const symlinkType = _symlinkType.symlinkType;
const symlinkTypeSync = _symlinkType.symlinkTypeSync;
const pathExists$2 = pathExists_1.pathExists;
const { areIdentical } = stat$4;
function createSymlink$1(srcpath, dstpath, type2, callback) {
  callback = typeof type2 === "function" ? type2 : callback;
  type2 = typeof type2 === "function" ? false : type2;
  fs$3.lstat(dstpath, (err, stats) => {
    if (!err && stats.isSymbolicLink()) {
      Promise.all([
        fs$3.stat(srcpath),
        fs$3.stat(dstpath)
      ]).then(([srcStat, dstStat]) => {
        if (areIdentical(srcStat, dstStat)) return callback(null);
        _createSymlink(srcpath, dstpath, type2, callback);
      });
    } else _createSymlink(srcpath, dstpath, type2, callback);
  });
}
function _createSymlink(srcpath, dstpath, type2, callback) {
  symlinkPaths(srcpath, dstpath, (err, relative) => {
    if (err) return callback(err);
    srcpath = relative.toDst;
    symlinkType(relative.toCwd, type2, (err2, type3) => {
      if (err2) return callback(err2);
      const dir = path$c.dirname(dstpath);
      pathExists$2(dir, (err3, dirExists) => {
        if (err3) return callback(err3);
        if (dirExists) return fs$3.symlink(srcpath, dstpath, type3, callback);
        mkdirs(dir, (err4) => {
          if (err4) return callback(err4);
          fs$3.symlink(srcpath, dstpath, type3, callback);
        });
      });
    });
  });
}
function createSymlinkSync$1(srcpath, dstpath, type2) {
  let stats;
  try {
    stats = fs$3.lstatSync(dstpath);
  } catch {
  }
  if (stats && stats.isSymbolicLink()) {
    const srcStat = fs$3.statSync(srcpath);
    const dstStat = fs$3.statSync(dstpath);
    if (areIdentical(srcStat, dstStat)) return;
  }
  const relative = symlinkPathsSync(srcpath, dstpath);
  srcpath = relative.toDst;
  type2 = symlinkTypeSync(relative.toCwd, type2);
  const dir = path$c.dirname(dstpath);
  const exists = fs$3.existsSync(dir);
  if (exists) return fs$3.symlinkSync(srcpath, dstpath, type2);
  mkdirsSync(dir);
  return fs$3.symlinkSync(srcpath, dstpath, type2);
}
var symlink = {
  createSymlink: u$3(createSymlink$1),
  createSymlinkSync: createSymlinkSync$1
};
const { createFile, createFileSync } = file;
const { createLink, createLinkSync } = link;
const { createSymlink, createSymlinkSync } = symlink;
var ensure = {
  // file
  createFile,
  createFileSync,
  ensureFile: createFile,
  ensureFileSync: createFileSync,
  // link
  createLink,
  createLinkSync,
  ensureLink: createLink,
  ensureLinkSync: createLinkSync,
  // symlink
  createSymlink,
  createSymlinkSync,
  ensureSymlink: createSymlink,
  ensureSymlinkSync: createSymlinkSync
};
function stringify$4(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
  const EOF = finalEOL ? EOL : "";
  const str2 = JSON.stringify(obj, replacer, spaces);
  return str2.replace(/\n/g, EOL) + EOF;
}
function stripBom$1(content) {
  if (Buffer.isBuffer(content)) content = content.toString("utf8");
  return content.replace(/^\uFEFF/, "");
}
var utils = { stringify: stringify$4, stripBom: stripBom$1 };
let _fs;
try {
  _fs = gracefulFs;
} catch (_) {
  _fs = require$$1$2;
}
const universalify = universalify$1;
const { stringify: stringify$3, stripBom } = utils;
async function _readFile(file2, options = {}) {
  if (typeof options === "string") {
    options = { encoding: options };
  }
  const fs2 = options.fs || _fs;
  const shouldThrow = "throws" in options ? options.throws : true;
  let data = await universalify.fromCallback(fs2.readFile)(file2, options);
  data = stripBom(data);
  let obj;
  try {
    obj = JSON.parse(data, options ? options.reviver : null);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file2}: ${err.message}`;
      throw err;
    } else {
      return null;
    }
  }
  return obj;
}
const readFile = universalify.fromPromise(_readFile);
function readFileSync(file2, options = {}) {
  if (typeof options === "string") {
    options = { encoding: options };
  }
  const fs2 = options.fs || _fs;
  const shouldThrow = "throws" in options ? options.throws : true;
  try {
    let content = fs2.readFileSync(file2, options);
    content = stripBom(content);
    return JSON.parse(content, options.reviver);
  } catch (err) {
    if (shouldThrow) {
      err.message = `${file2}: ${err.message}`;
      throw err;
    } else {
      return null;
    }
  }
}
async function _writeFile(file2, obj, options = {}) {
  const fs2 = options.fs || _fs;
  const str2 = stringify$3(obj, options);
  await universalify.fromCallback(fs2.writeFile)(file2, str2, options);
}
const writeFile = universalify.fromPromise(_writeFile);
function writeFileSync(file2, obj, options = {}) {
  const fs2 = options.fs || _fs;
  const str2 = stringify$3(obj, options);
  return fs2.writeFileSync(file2, str2, options);
}
var jsonfile$1 = {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync
};
const jsonFile$1 = jsonfile$1;
var jsonfile = {
  // jsonfile exports
  readJson: jsonFile$1.readFile,
  readJsonSync: jsonFile$1.readFileSync,
  writeJson: jsonFile$1.writeFile,
  writeJsonSync: jsonFile$1.writeFileSync
};
const u$2 = universalify$1.fromCallback;
const fs$2 = gracefulFs;
const path$b = require$$1$3;
const mkdir = mkdirs$2;
const pathExists$1 = pathExists_1.pathExists;
function outputFile$1(file2, data, encoding, callback) {
  if (typeof encoding === "function") {
    callback = encoding;
    encoding = "utf8";
  }
  const dir = path$b.dirname(file2);
  pathExists$1(dir, (err, itDoes) => {
    if (err) return callback(err);
    if (itDoes) return fs$2.writeFile(file2, data, encoding, callback);
    mkdir.mkdirs(dir, (err2) => {
      if (err2) return callback(err2);
      fs$2.writeFile(file2, data, encoding, callback);
    });
  });
}
function outputFileSync$1(file2, ...args) {
  const dir = path$b.dirname(file2);
  if (fs$2.existsSync(dir)) {
    return fs$2.writeFileSync(file2, ...args);
  }
  mkdir.mkdirsSync(dir);
  fs$2.writeFileSync(file2, ...args);
}
var outputFile_1 = {
  outputFile: u$2(outputFile$1),
  outputFileSync: outputFileSync$1
};
const { stringify: stringify$2 } = utils;
const { outputFile } = outputFile_1;
async function outputJson(file2, data, options = {}) {
  const str2 = stringify$2(data, options);
  await outputFile(file2, str2, options);
}
var outputJson_1 = outputJson;
const { stringify: stringify$1 } = utils;
const { outputFileSync } = outputFile_1;
function outputJsonSync(file2, data, options) {
  const str2 = stringify$1(data, options);
  outputFileSync(file2, str2, options);
}
var outputJsonSync_1 = outputJsonSync;
const u$1 = universalify$1.fromPromise;
const jsonFile = jsonfile;
jsonFile.outputJson = u$1(outputJson_1);
jsonFile.outputJsonSync = outputJsonSync_1;
jsonFile.outputJSON = jsonFile.outputJson;
jsonFile.outputJSONSync = jsonFile.outputJsonSync;
jsonFile.writeJSON = jsonFile.writeJson;
jsonFile.writeJSONSync = jsonFile.writeJsonSync;
jsonFile.readJSON = jsonFile.readJson;
jsonFile.readJSONSync = jsonFile.readJsonSync;
var json$1 = jsonFile;
const fs$1 = gracefulFs;
const path$a = require$$1$3;
const copy = copy$1.copy;
const remove = remove_1.remove;
const mkdirp = mkdirs$2.mkdirp;
const pathExists = pathExists_1.pathExists;
const stat$1 = stat$4;
function move$1(src2, dest, opts, cb) {
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;
  stat$1.checkPaths(src2, dest, "move", opts, (err, stats) => {
    if (err) return cb(err);
    const { srcStat, isChangingCase = false } = stats;
    stat$1.checkParentPaths(src2, srcStat, dest, "move", (err2) => {
      if (err2) return cb(err2);
      if (isParentRoot$1(dest)) return doRename$1(src2, dest, overwrite, isChangingCase, cb);
      mkdirp(path$a.dirname(dest), (err3) => {
        if (err3) return cb(err3);
        return doRename$1(src2, dest, overwrite, isChangingCase, cb);
      });
    });
  });
}
function isParentRoot$1(dest) {
  const parent = path$a.dirname(dest);
  const parsedPath = path$a.parse(parent);
  return parsedPath.root === parent;
}
function doRename$1(src2, dest, overwrite, isChangingCase, cb) {
  if (isChangingCase) return rename$1(src2, dest, overwrite, cb);
  if (overwrite) {
    return remove(dest, (err) => {
      if (err) return cb(err);
      return rename$1(src2, dest, overwrite, cb);
    });
  }
  pathExists(dest, (err, destExists) => {
    if (err) return cb(err);
    if (destExists) return cb(new Error("dest already exists."));
    return rename$1(src2, dest, overwrite, cb);
  });
}
function rename$1(src2, dest, overwrite, cb) {
  fs$1.rename(src2, dest, (err) => {
    if (!err) return cb();
    if (err.code !== "EXDEV") return cb(err);
    return moveAcrossDevice$1(src2, dest, overwrite, cb);
  });
}
function moveAcrossDevice$1(src2, dest, overwrite, cb) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copy(src2, dest, opts, (err) => {
    if (err) return cb(err);
    return remove(src2, cb);
  });
}
var move_1 = move$1;
const fs = gracefulFs;
const path$9 = require$$1$3;
const copySync = copy$1.copySync;
const removeSync = remove_1.removeSync;
const mkdirpSync = mkdirs$2.mkdirpSync;
const stat = stat$4;
function moveSync(src2, dest, opts) {
  opts = opts || {};
  const overwrite = opts.overwrite || opts.clobber || false;
  const { srcStat, isChangingCase = false } = stat.checkPathsSync(src2, dest, "move", opts);
  stat.checkParentPathsSync(src2, srcStat, dest, "move");
  if (!isParentRoot(dest)) mkdirpSync(path$9.dirname(dest));
  return doRename(src2, dest, overwrite, isChangingCase);
}
function isParentRoot(dest) {
  const parent = path$9.dirname(dest);
  const parsedPath = path$9.parse(parent);
  return parsedPath.root === parent;
}
function doRename(src2, dest, overwrite, isChangingCase) {
  if (isChangingCase) return rename(src2, dest, overwrite);
  if (overwrite) {
    removeSync(dest);
    return rename(src2, dest, overwrite);
  }
  if (fs.existsSync(dest)) throw new Error("dest already exists.");
  return rename(src2, dest, overwrite);
}
function rename(src2, dest, overwrite) {
  try {
    fs.renameSync(src2, dest);
  } catch (err) {
    if (err.code !== "EXDEV") throw err;
    return moveAcrossDevice(src2, dest, overwrite);
  }
}
function moveAcrossDevice(src2, dest, overwrite) {
  const opts = {
    overwrite,
    errorOnExist: true
  };
  copySync(src2, dest, opts);
  return removeSync(src2);
}
var moveSync_1 = moveSync;
const u = universalify$1.fromCallback;
var move = {
  move: u(move_1),
  moveSync: moveSync_1
};
var lib = {
  // Export promiseified graceful-fs:
  ...fs$i,
  // Export extra methods:
  ...copy$1,
  ...empty,
  ...ensure,
  ...json$1,
  ...mkdirs$2,
  ...move,
  ...outputFile_1,
  ...pathExists_1,
  ...remove_1
};
var BaseUpdater$1 = {};
var AppUpdater$1 = {};
var out = {};
var CancellationToken$1 = {};
Object.defineProperty(CancellationToken$1, "__esModule", { value: true });
CancellationToken$1.CancellationError = CancellationToken$1.CancellationToken = void 0;
const events_1$1 = require$$0$5;
class CancellationToken extends events_1$1.EventEmitter {
  get cancelled() {
    return this._cancelled || this._parent != null && this._parent.cancelled;
  }
  set parent(value) {
    this.removeParentCancelHandler();
    this._parent = value;
    this.parentCancelHandler = () => this.cancel();
    this._parent.onCancel(this.parentCancelHandler);
  }
  // babel cannot compile ... correctly for super calls
  constructor(parent) {
    super();
    this.parentCancelHandler = null;
    this._parent = null;
    this._cancelled = false;
    if (parent != null) {
      this.parent = parent;
    }
  }
  cancel() {
    this._cancelled = true;
    this.emit("cancel");
  }
  onCancel(handler) {
    if (this.cancelled) {
      handler();
    } else {
      this.once("cancel", handler);
    }
  }
  createPromise(callback) {
    if (this.cancelled) {
      return Promise.reject(new CancellationError());
    }
    const finallyHandler = () => {
      if (cancelHandler != null) {
        try {
          this.removeListener("cancel", cancelHandler);
          cancelHandler = null;
        } catch (_ignore) {
        }
      }
    };
    let cancelHandler = null;
    return new Promise((resolve, reject) => {
      let addedCancelHandler = null;
      cancelHandler = () => {
        try {
          if (addedCancelHandler != null) {
            addedCancelHandler();
            addedCancelHandler = null;
          }
        } finally {
          reject(new CancellationError());
        }
      };
      if (this.cancelled) {
        cancelHandler();
        return;
      }
      this.onCancel(cancelHandler);
      callback(resolve, reject, (callback2) => {
        addedCancelHandler = callback2;
      });
    }).then((it) => {
      finallyHandler();
      return it;
    }).catch((e) => {
      finallyHandler();
      throw e;
    });
  }
  removeParentCancelHandler() {
    const parent = this._parent;
    if (parent != null && this.parentCancelHandler != null) {
      parent.removeListener("cancel", this.parentCancelHandler);
      this.parentCancelHandler = null;
    }
  }
  dispose() {
    try {
      this.removeParentCancelHandler();
    } finally {
      this.removeAllListeners();
      this._parent = null;
    }
  }
}
CancellationToken$1.CancellationToken = CancellationToken;
class CancellationError extends Error {
  constructor() {
    super("cancelled");
  }
}
CancellationToken$1.CancellationError = CancellationError;
var error = {};
Object.defineProperty(error, "__esModule", { value: true });
error.newError = newError;
function newError(message, code) {
  const error2 = new Error(message);
  error2.code = code;
  return error2;
}
var httpExecutor = {};
var src = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type2 = typeof val;
    if (type2 === "string" && val.length > 0) {
      return parse2(val);
    } else if (type2 === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse2(str2) {
    str2 = String(str2);
    if (str2.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str2
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type2 = (match[2] || "ms").toLowerCase();
    switch (type2) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var common$6;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common$6;
  hasRequiredCommon = 1;
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce2;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = requireMs();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug2(...args) {
        if (!debug2.enabled) {
          return;
        }
        const self2 = debug2;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug.log;
        logFn.apply(self2, args);
      }
      debug2.namespace = namespace;
      debug2.useColors = createDebug.useColors();
      debug2.color = createDebug.selectColor(namespace);
      debug2.extend = extend3;
      debug2.destroy = createDebug.destroy;
      Object.defineProperty(debug2, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug2);
      }
      return debug2;
    }
    function extend3(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce2(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  common$6 = setup;
  return common$6;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module2, exports$1) {
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load2;
    exports$1.useColors = useColors;
    exports$1.storage = localstorage();
    exports$1.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports$1.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports$1.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports$1.storage.setItem("debug", namespaces);
        } else {
          exports$1.storage.removeItem("debug");
        }
      } catch (error2) {
      }
    }
    function load2() {
      let r;
      try {
        r = exports$1.storage.getItem("debug") || exports$1.storage.getItem("DEBUG");
      } catch (error2) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error2) {
      }
    }
    module2.exports = requireCommon()(exports$1);
    const { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error2) {
        return "[UnexpectedJSONParseError]: " + error2.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var node = { exports: {} };
var hasFlag;
var hasRequiredHasFlag;
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag;
  hasRequiredHasFlag = 1;
  hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
  return hasFlag;
}
var supportsColor_1;
var hasRequiredSupportsColor;
function requireSupportsColor() {
  if (hasRequiredSupportsColor) return supportsColor_1;
  hasRequiredSupportsColor = 1;
  const os2 = require$$2;
  const tty = require$$1$4;
  const hasFlag2 = requireHasFlag();
  const { env } = process;
  let forceColor;
  if (hasFlag2("no-color") || hasFlag2("no-colors") || hasFlag2("color=false") || hasFlag2("color=never")) {
    forceColor = 0;
  } else if (hasFlag2("color") || hasFlag2("colors") || hasFlag2("color=true") || hasFlag2("color=always")) {
    forceColor = 1;
  }
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      forceColor = 1;
    } else if (env.FORCE_COLOR === "false") {
      forceColor = 0;
    } else {
      forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, streamIsTTY) {
    if (forceColor === 0) {
      return 0;
    }
    if (hasFlag2("color=16m") || hasFlag2("color=full") || hasFlag2("color=truecolor")) {
      return 3;
    }
    if (hasFlag2("color=256")) {
      return 2;
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os2.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream) {
    const level = supportsColor(stream, stream && stream.isTTY);
    return translateLevel(level);
  }
  supportsColor_1 = {
    supportsColor: getSupportLevel,
    stdout: translateLevel(supportsColor(true, tty.isatty(1))),
    stderr: translateLevel(supportsColor(true, tty.isatty(2)))
  };
  return supportsColor_1;
}
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node.exports;
  hasRequiredNode = 1;
  (function(module2, exports$1) {
    const tty = require$$1$4;
    const util2 = require$$4;
    exports$1.init = init;
    exports$1.log = log;
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load2;
    exports$1.useColors = useColors;
    exports$1.destroy = util2.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports$1.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = requireSupportsColor();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports$1.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error2) {
    }
    exports$1.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports$1.inspectOpts ? Boolean(exports$1.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports$1.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util2.formatWithOptions(exports$1.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load2() {
      return process.env.DEBUG;
    }
    function init(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports$1.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports$1.inspectOpts[keys[i]];
      }
    }
    module2.exports = requireCommon()(exports$1);
    const { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str2) => str2.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  })(node, node.exports);
  return node.exports;
}
if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
  src.exports = requireBrowser();
} else {
  src.exports = requireNode();
}
var srcExports = src.exports;
var ProgressCallbackTransform$1 = {};
Object.defineProperty(ProgressCallbackTransform$1, "__esModule", { value: true });
ProgressCallbackTransform$1.ProgressCallbackTransform = void 0;
const stream_1$3 = require$$0$4;
class ProgressCallbackTransform extends stream_1$3.Transform {
  constructor(total, cancellationToken, onProgress) {
    super();
    this.total = total;
    this.cancellationToken = cancellationToken;
    this.onProgress = onProgress;
    this.start = Date.now();
    this.transferred = 0;
    this.delta = 0;
    this.nextUpdate = this.start + 1e3;
  }
  _transform(chunk, encoding, callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"), null);
      return;
    }
    this.transferred += chunk.length;
    this.delta += chunk.length;
    const now = Date.now();
    if (now >= this.nextUpdate && this.transferred !== this.total) {
      this.nextUpdate = now + 1e3;
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
      });
      this.delta = 0;
    }
    callback(null, chunk);
  }
  _flush(callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.total,
      delta: this.delta,
      transferred: this.total,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
    this.delta = 0;
    callback(null);
  }
}
ProgressCallbackTransform$1.ProgressCallbackTransform = ProgressCallbackTransform;
Object.defineProperty(httpExecutor, "__esModule", { value: true });
httpExecutor.DigestTransform = httpExecutor.HttpExecutor = httpExecutor.HttpError = void 0;
httpExecutor.createHttpError = createHttpError;
httpExecutor.parseJson = parseJson;
httpExecutor.configureRequestOptionsFromUrl = configureRequestOptionsFromUrl;
httpExecutor.configureRequestUrl = configureRequestUrl;
httpExecutor.safeGetHeader = safeGetHeader;
httpExecutor.configureRequestOptions = configureRequestOptions;
httpExecutor.safeStringifyJson = safeStringifyJson;
const crypto_1$4 = require$$0$6;
const debug_1$1 = srcExports;
const fs_1$5 = require$$1$2;
const stream_1$2 = require$$0$4;
const url_1$5 = require$$4$1;
const CancellationToken_1$1 = CancellationToken$1;
const error_1$2 = error;
const ProgressCallbackTransform_1 = ProgressCallbackTransform$1;
const debug$2 = (0, debug_1$1.default)("electron-builder");
function createHttpError(response, description = null) {
  return new HttpError(response.statusCode || -1, `${response.statusCode} ${response.statusMessage}` + (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) + "\nHeaders: " + safeStringifyJson(response.headers), description);
}
const HTTP_STATUS_CODES = /* @__PURE__ */ new Map([
  [429, "Too many requests"],
  [400, "Bad request"],
  [403, "Forbidden"],
  [404, "Not found"],
  [405, "Method not allowed"],
  [406, "Not acceptable"],
  [408, "Request timeout"],
  [413, "Request entity too large"],
  [500, "Internal server error"],
  [502, "Bad gateway"],
  [503, "Service unavailable"],
  [504, "Gateway timeout"],
  [505, "HTTP version not supported"]
]);
class HttpError extends Error {
  constructor(statusCode, message = `HTTP error: ${HTTP_STATUS_CODES.get(statusCode) || statusCode}`, description = null) {
    super(message);
    this.statusCode = statusCode;
    this.description = description;
    this.name = "HttpError";
    this.code = `HTTP_ERROR_${statusCode}`;
  }
  isServerError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
}
httpExecutor.HttpError = HttpError;
function parseJson(result) {
  return result.then((it) => it == null || it.length === 0 ? null : JSON.parse(it));
}
class HttpExecutor {
  constructor() {
    this.maxRedirects = 10;
  }
  request(options, cancellationToken = new CancellationToken_1$1.CancellationToken(), data) {
    configureRequestOptions(options);
    const json2 = data == null ? void 0 : JSON.stringify(data);
    const encodedData = json2 ? Buffer.from(json2) : void 0;
    if (encodedData != null) {
      debug$2(json2);
      const { headers, ...opts } = options;
      options = {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": encodedData.length,
          ...headers
        },
        ...opts
      };
    }
    return this.doApiRequest(options, cancellationToken, (it) => it.end(encodedData));
  }
  doApiRequest(options, cancellationToken, requestProcessor, redirectCount = 0) {
    if (debug$2.enabled) {
      debug$2(`Request: ${safeStringifyJson(options)}`);
    }
    return cancellationToken.createPromise((resolve, reject, onCancel) => {
      const request = this.createRequest(options, (response) => {
        try {
          this.handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor);
        } catch (e) {
          reject(e);
        }
      });
      this.addErrorAndTimeoutHandlers(request, reject, options.timeout);
      this.addRedirectHandlers(request, options, reject, redirectCount, (options2) => {
        this.doApiRequest(options2, cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
      });
      requestProcessor(request, reject);
      onCancel(() => request.abort());
    });
  }
  // noinspection JSUnusedLocalSymbols
  // eslint-disable-next-line
  addRedirectHandlers(request, options, reject, redirectCount, handler) {
  }
  addErrorAndTimeoutHandlers(request, reject, timeout = 60 * 1e3) {
    this.addTimeOutHandler(request, reject, timeout);
    request.on("error", reject);
    request.on("aborted", () => {
      reject(new Error("Request has been aborted by the server"));
    });
  }
  handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor) {
    var _a;
    if (debug$2.enabled) {
      debug$2(`Response: ${response.statusCode} ${response.statusMessage}, request options: ${safeStringifyJson(options)}`);
    }
    if (response.statusCode === 404) {
      reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
      return;
    } else if (response.statusCode === 204) {
      resolve();
      return;
    }
    const code = (_a = response.statusCode) !== null && _a !== void 0 ? _a : 0;
    const shouldRedirect = code >= 300 && code < 400;
    const redirectUrl = safeGetHeader(response, "location");
    if (shouldRedirect && redirectUrl != null) {
      if (redirectCount > this.maxRedirects) {
        reject(this.createMaxRedirectError());
        return;
      }
      this.doApiRequest(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options), cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
      return;
    }
    response.setEncoding("utf8");
    let data = "";
    response.on("error", reject);
    response.on("data", (chunk) => data += chunk);
    response.on("end", () => {
      try {
        if (response.statusCode != null && response.statusCode >= 400) {
          const contentType = safeGetHeader(response, "content-type");
          const isJson = contentType != null && (Array.isArray(contentType) ? contentType.find((it) => it.includes("json")) != null : contentType.includes("json"));
          reject(createHttpError(response, `method: ${options.method || "GET"} url: ${options.protocol || "https:"}//${options.hostname}${options.port ? `:${options.port}` : ""}${options.path}

          Data:
          ${isJson ? JSON.stringify(JSON.parse(data)) : data}
          `));
        } else {
          resolve(data.length === 0 ? null : data);
        }
      } catch (e) {
        reject(e);
      }
    });
  }
  async downloadToBuffer(url, options) {
    return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
      const responseChunks = [];
      const requestOptions = {
        headers: options.headers || void 0,
        // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
        redirect: "manual"
      };
      configureRequestUrl(url, requestOptions);
      configureRequestOptions(requestOptions);
      this.doDownload(requestOptions, {
        destination: null,
        options,
        onCancel,
        callback: (error2) => {
          if (error2 == null) {
            resolve(Buffer.concat(responseChunks));
          } else {
            reject(error2);
          }
        },
        responseHandler: (response, callback) => {
          let receivedLength = 0;
          response.on("data", (chunk) => {
            receivedLength += chunk.length;
            if (receivedLength > 524288e3) {
              callback(new Error("Maximum allowed size is 500 MB"));
              return;
            }
            responseChunks.push(chunk);
          });
          response.on("end", () => {
            callback(null);
          });
        }
      }, 0);
    });
  }
  doDownload(requestOptions, options, redirectCount) {
    const request = this.createRequest(requestOptions, (response) => {
      if (response.statusCode >= 400) {
        options.callback(new Error(`Cannot download "${requestOptions.protocol || "https:"}//${requestOptions.hostname}${requestOptions.path}", status ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      response.on("error", options.callback);
      const redirectUrl = safeGetHeader(response, "location");
      if (redirectUrl != null) {
        if (redirectCount < this.maxRedirects) {
          this.doDownload(HttpExecutor.prepareRedirectUrlOptions(redirectUrl, requestOptions), options, redirectCount++);
        } else {
          options.callback(this.createMaxRedirectError());
        }
        return;
      }
      if (options.responseHandler == null) {
        configurePipes(options, response);
      } else {
        options.responseHandler(response, options.callback);
      }
    });
    this.addErrorAndTimeoutHandlers(request, options.callback, requestOptions.timeout);
    this.addRedirectHandlers(request, requestOptions, options.callback, redirectCount, (requestOptions2) => {
      this.doDownload(requestOptions2, options, redirectCount++);
    });
    request.end();
  }
  createMaxRedirectError() {
    return new Error(`Too many redirects (> ${this.maxRedirects})`);
  }
  addTimeOutHandler(request, callback, timeout) {
    request.on("socket", (socket) => {
      socket.setTimeout(timeout, () => {
        request.abort();
        callback(new Error("Request timed out"));
      });
    });
  }
  static prepareRedirectUrlOptions(redirectUrl, options) {
    const newOptions = configureRequestOptionsFromUrl(redirectUrl, { ...options });
    const headers = newOptions.headers;
    if (headers === null || headers === void 0 ? void 0 : headers.authorization) {
      const parsedNewUrl = new url_1$5.URL(redirectUrl);
      if (parsedNewUrl.hostname.endsWith(".amazonaws.com") || parsedNewUrl.searchParams.has("X-Amz-Credential")) {
        delete headers.authorization;
      }
    }
    return newOptions;
  }
  static retryOnServerError(task, maxRetries = 3) {
    for (let attemptNumber = 0; ; attemptNumber++) {
      try {
        return task();
      } catch (e) {
        if (attemptNumber < maxRetries && (e instanceof HttpError && e.isServerError() || e.code === "EPIPE")) {
          continue;
        }
        throw e;
      }
    }
  }
}
httpExecutor.HttpExecutor = HttpExecutor;
function configureRequestOptionsFromUrl(url, options) {
  const result = configureRequestOptions(options);
  configureRequestUrl(new url_1$5.URL(url), result);
  return result;
}
function configureRequestUrl(url, options) {
  options.protocol = url.protocol;
  options.hostname = url.hostname;
  if (url.port) {
    options.port = url.port;
  } else if (options.port) {
    delete options.port;
  }
  options.path = url.pathname + url.search;
}
class DigestTransform extends stream_1$2.Transform {
  // noinspection JSUnusedGlobalSymbols
  get actual() {
    return this._actual;
  }
  constructor(expected, algorithm = "sha512", encoding = "base64") {
    super();
    this.expected = expected;
    this.algorithm = algorithm;
    this.encoding = encoding;
    this._actual = null;
    this.isValidateOnEnd = true;
    this.digester = (0, crypto_1$4.createHash)(algorithm);
  }
  // noinspection JSUnusedGlobalSymbols
  _transform(chunk, encoding, callback) {
    this.digester.update(chunk);
    callback(null, chunk);
  }
  // noinspection JSUnusedGlobalSymbols
  _flush(callback) {
    this._actual = this.digester.digest(this.encoding);
    if (this.isValidateOnEnd) {
      try {
        this.validate();
      } catch (e) {
        callback(e);
        return;
      }
    }
    callback(null);
  }
  validate() {
    if (this._actual == null) {
      throw (0, error_1$2.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
    }
    if (this._actual !== this.expected) {
      throw (0, error_1$2.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
    }
    return null;
  }
}
httpExecutor.DigestTransform = DigestTransform;
function checkSha2(sha2Header, sha2, callback) {
  if (sha2Header != null && sha2 != null && sha2Header !== sha2) {
    callback(new Error(`checksum mismatch: expected ${sha2} but got ${sha2Header} (X-Checksum-Sha2 header)`));
    return false;
  }
  return true;
}
function safeGetHeader(response, headerKey) {
  const value = response.headers[headerKey];
  if (value == null) {
    return null;
  } else if (Array.isArray(value)) {
    return value.length === 0 ? null : value[value.length - 1];
  } else {
    return value;
  }
}
function configurePipes(options, response) {
  if (!checkSha2(safeGetHeader(response, "X-Checksum-Sha2"), options.options.sha2, options.callback)) {
    return;
  }
  const streams = [];
  if (options.options.onProgress != null) {
    const contentLength = safeGetHeader(response, "content-length");
    if (contentLength != null) {
      streams.push(new ProgressCallbackTransform_1.ProgressCallbackTransform(parseInt(contentLength, 10), options.options.cancellationToken, options.options.onProgress));
    }
  }
  const sha512 = options.options.sha512;
  if (sha512 != null) {
    streams.push(new DigestTransform(sha512, "sha512", sha512.length === 128 && !sha512.includes("+") && !sha512.includes("Z") && !sha512.includes("=") ? "hex" : "base64"));
  } else if (options.options.sha2 != null) {
    streams.push(new DigestTransform(options.options.sha2, "sha256", "hex"));
  }
  const fileOut = (0, fs_1$5.createWriteStream)(options.destination);
  streams.push(fileOut);
  let lastStream = response;
  for (const stream of streams) {
    stream.on("error", (error2) => {
      fileOut.close();
      if (!options.options.cancellationToken.cancelled) {
        options.callback(error2);
      }
    });
    lastStream = lastStream.pipe(stream);
  }
  fileOut.on("finish", () => {
    fileOut.close(options.callback);
  });
}
function configureRequestOptions(options, token, method) {
  if (method != null) {
    options.method = method;
  }
  options.headers = { ...options.headers };
  const headers = options.headers;
  if (token != null) {
    headers.authorization = token.startsWith("Basic") || token.startsWith("Bearer") ? token : `token ${token}`;
  }
  if (headers["User-Agent"] == null) {
    headers["User-Agent"] = "electron-builder";
  }
  if (method == null || method === "GET" || headers["Cache-Control"] == null) {
    headers["Cache-Control"] = "no-cache";
  }
  if (options.protocol == null && process.versions.electron != null) {
    options.protocol = "https:";
  }
  return options;
}
function safeStringifyJson(data, skippedNames) {
  return JSON.stringify(data, (name, value) => {
    if (name.endsWith("Authorization") || name.endsWith("authorization") || name.endsWith("Password") || name.endsWith("PASSWORD") || name.endsWith("Token") || name.includes("password") || name.includes("token") || skippedNames != null && skippedNames.has(name)) {
      return "<stripped sensitive data>";
    }
    return value;
  }, 2);
}
var MemoLazy$1 = {};
Object.defineProperty(MemoLazy$1, "__esModule", { value: true });
MemoLazy$1.MemoLazy = void 0;
class MemoLazy {
  constructor(selector, creator) {
    this.selector = selector;
    this.creator = creator;
    this.selected = void 0;
    this._value = void 0;
  }
  get hasValue() {
    return this._value !== void 0;
  }
  get value() {
    const selected = this.selector();
    if (this._value !== void 0 && equals(this.selected, selected)) {
      return this._value;
    }
    this.selected = selected;
    const result = this.creator(selected);
    this.value = result;
    return result;
  }
  set value(value) {
    this._value = value;
  }
}
MemoLazy$1.MemoLazy = MemoLazy;
function equals(firstValue, secondValue) {
  const isFirstObject = typeof firstValue === "object" && firstValue !== null;
  const isSecondObject = typeof secondValue === "object" && secondValue !== null;
  if (isFirstObject && isSecondObject) {
    const keys1 = Object.keys(firstValue);
    const keys2 = Object.keys(secondValue);
    return keys1.length === keys2.length && keys1.every((key) => equals(firstValue[key], secondValue[key]));
  }
  return firstValue === secondValue;
}
var publishOptions = {};
Object.defineProperty(publishOptions, "__esModule", { value: true });
publishOptions.githubUrl = githubUrl;
publishOptions.getS3LikeProviderBaseUrl = getS3LikeProviderBaseUrl;
function githubUrl(options, defaultHost = "github.com") {
  return `${options.protocol || "https"}://${options.host || defaultHost}`;
}
function getS3LikeProviderBaseUrl(configuration) {
  const provider = configuration.provider;
  if (provider === "s3") {
    return s3Url(configuration);
  }
  if (provider === "spaces") {
    return spacesUrl(configuration);
  }
  throw new Error(`Not supported provider: ${provider}`);
}
function s3Url(options) {
  let url;
  if (options.accelerate == true) {
    url = `https://${options.bucket}.s3-accelerate.amazonaws.com`;
  } else if (options.endpoint != null) {
    url = `${options.endpoint}/${options.bucket}`;
  } else if (options.bucket.includes(".")) {
    if (options.region == null) {
      throw new Error(`Bucket name "${options.bucket}" includes a dot, but S3 region is missing`);
    }
    if (options.region === "us-east-1") {
      url = `https://s3.amazonaws.com/${options.bucket}`;
    } else {
      url = `https://s3-${options.region}.amazonaws.com/${options.bucket}`;
    }
  } else if (options.region === "cn-north-1") {
    url = `https://${options.bucket}.s3.${options.region}.amazonaws.com.cn`;
  } else {
    url = `https://${options.bucket}.s3.amazonaws.com`;
  }
  return appendPath(url, options.path);
}
function appendPath(url, p) {
  if (p != null && p.length > 0) {
    if (!p.startsWith("/")) {
      url += "/";
    }
    url += p;
  }
  return url;
}
function spacesUrl(options) {
  if (options.name == null) {
    throw new Error(`name is missing`);
  }
  if (options.region == null) {
    throw new Error(`region is missing`);
  }
  return appendPath(`https://${options.name}.${options.region}.digitaloceanspaces.com`, options.path);
}
var retry$1 = {};
Object.defineProperty(retry$1, "__esModule", { value: true });
retry$1.retry = retry;
const CancellationToken_1 = CancellationToken$1;
async function retry(task, retryCount, interval, backoff = 0, attempt = 0, shouldRetry) {
  var _a;
  const cancellationToken = new CancellationToken_1.CancellationToken();
  try {
    return await task();
  } catch (error2) {
    if (((_a = shouldRetry === null || shouldRetry === void 0 ? void 0 : shouldRetry(error2)) !== null && _a !== void 0 ? _a : true) && retryCount > 0 && !cancellationToken.cancelled) {
      await new Promise((resolve) => setTimeout(resolve, interval + backoff * attempt));
      return await retry(task, retryCount - 1, interval, backoff, attempt + 1, shouldRetry);
    } else {
      throw error2;
    }
  }
}
var rfc2253Parser = {};
Object.defineProperty(rfc2253Parser, "__esModule", { value: true });
rfc2253Parser.parseDn = parseDn;
function parseDn(seq2) {
  let quoted = false;
  let key = null;
  let token = "";
  let nextNonSpace = 0;
  seq2 = seq2.trim();
  const result = /* @__PURE__ */ new Map();
  for (let i = 0; i <= seq2.length; i++) {
    if (i === seq2.length) {
      if (key !== null) {
        result.set(key, token);
      }
      break;
    }
    const ch = seq2[i];
    if (quoted) {
      if (ch === '"') {
        quoted = false;
        continue;
      }
    } else {
      if (ch === '"') {
        quoted = true;
        continue;
      }
      if (ch === "\\") {
        i++;
        const ord = parseInt(seq2.slice(i, i + 2), 16);
        if (Number.isNaN(ord)) {
          token += seq2[i];
        } else {
          i++;
          token += String.fromCharCode(ord);
        }
        continue;
      }
      if (key === null && ch === "=") {
        key = token;
        token = "";
        continue;
      }
      if (ch === "," || ch === ";" || ch === "+") {
        if (key !== null) {
          result.set(key, token);
        }
        key = null;
        token = "";
        continue;
      }
    }
    if (ch === " " && !quoted) {
      if (token.length === 0) {
        continue;
      }
      if (i > nextNonSpace) {
        let j = i;
        while (seq2[j] === " ") {
          j++;
        }
        nextNonSpace = j;
      }
      if (nextNonSpace >= seq2.length || seq2[nextNonSpace] === "," || seq2[nextNonSpace] === ";" || key === null && seq2[nextNonSpace] === "=" || key !== null && seq2[nextNonSpace] === "+") {
        i = nextNonSpace - 1;
        continue;
      }
    }
    token += ch;
  }
  return result;
}
var uuid = {};
Object.defineProperty(uuid, "__esModule", { value: true });
uuid.nil = uuid.UUID = void 0;
const crypto_1$3 = require$$0$6;
const error_1$1 = error;
const invalidName = "options.name must be either a string or a Buffer";
const randomHost = (0, crypto_1$3.randomBytes)(16);
randomHost[0] = randomHost[0] | 1;
const hex2byte = {};
const byte2hex = [];
for (let i = 0; i < 256; i++) {
  const hex = (i + 256).toString(16).substr(1);
  hex2byte[hex] = i;
  byte2hex[i] = hex;
}
class UUID {
  constructor(uuid2) {
    this.ascii = null;
    this.binary = null;
    const check = UUID.check(uuid2);
    if (!check) {
      throw new Error("not a UUID");
    }
    this.version = check.version;
    if (check.format === "ascii") {
      this.ascii = uuid2;
    } else {
      this.binary = uuid2;
    }
  }
  static v5(name, namespace) {
    return uuidNamed(name, "sha1", 80, namespace);
  }
  toString() {
    if (this.ascii == null) {
      this.ascii = stringify(this.binary);
    }
    return this.ascii;
  }
  inspect() {
    return `UUID v${this.version} ${this.toString()}`;
  }
  static check(uuid2, offset = 0) {
    if (typeof uuid2 === "string") {
      uuid2 = uuid2.toLowerCase();
      if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(uuid2)) {
        return false;
      }
      if (uuid2 === "00000000-0000-0000-0000-000000000000") {
        return { version: void 0, variant: "nil", format: "ascii" };
      }
      return {
        version: (hex2byte[uuid2[14] + uuid2[15]] & 240) >> 4,
        variant: getVariant((hex2byte[uuid2[19] + uuid2[20]] & 224) >> 5),
        format: "ascii"
      };
    }
    if (Buffer.isBuffer(uuid2)) {
      if (uuid2.length < offset + 16) {
        return false;
      }
      let i = 0;
      for (; i < 16; i++) {
        if (uuid2[offset + i] !== 0) {
          break;
        }
      }
      if (i === 16) {
        return { version: void 0, variant: "nil", format: "binary" };
      }
      return {
        version: (uuid2[offset + 6] & 240) >> 4,
        variant: getVariant((uuid2[offset + 8] & 224) >> 5),
        format: "binary"
      };
    }
    throw (0, error_1$1.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
  }
  // read stringified uuid into a Buffer
  static parse(input) {
    const buffer = Buffer.allocUnsafe(16);
    let j = 0;
    for (let i = 0; i < 16; i++) {
      buffer[i] = hex2byte[input[j++] + input[j++]];
      if (i === 3 || i === 5 || i === 7 || i === 9) {
        j += 1;
      }
    }
    return buffer;
  }
}
uuid.UUID = UUID;
UUID.OID = UUID.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
function getVariant(bits) {
  switch (bits) {
    case 0:
    case 1:
    case 3:
      return "ncs";
    case 4:
    case 5:
      return "rfc4122";
    case 6:
      return "microsoft";
    default:
      return "future";
  }
}
var UuidEncoding;
(function(UuidEncoding2) {
  UuidEncoding2[UuidEncoding2["ASCII"] = 0] = "ASCII";
  UuidEncoding2[UuidEncoding2["BINARY"] = 1] = "BINARY";
  UuidEncoding2[UuidEncoding2["OBJECT"] = 2] = "OBJECT";
})(UuidEncoding || (UuidEncoding = {}));
function uuidNamed(name, hashMethod, version, namespace, encoding = UuidEncoding.ASCII) {
  const hash = (0, crypto_1$3.createHash)(hashMethod);
  const nameIsNotAString = typeof name !== "string";
  if (nameIsNotAString && !Buffer.isBuffer(name)) {
    throw (0, error_1$1.newError)(invalidName, "ERR_INVALID_UUID_NAME");
  }
  hash.update(namespace);
  hash.update(name);
  const buffer = hash.digest();
  let result;
  switch (encoding) {
    case UuidEncoding.BINARY:
      buffer[6] = buffer[6] & 15 | version;
      buffer[8] = buffer[8] & 63 | 128;
      result = buffer;
      break;
    case UuidEncoding.OBJECT:
      buffer[6] = buffer[6] & 15 | version;
      buffer[8] = buffer[8] & 63 | 128;
      result = new UUID(buffer);
      break;
    default:
      result = byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6] & 15 | version] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8] & 63 | 128] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
      break;
  }
  return result;
}
function stringify(buffer) {
  return byte2hex[buffer[0]] + byte2hex[buffer[1]] + byte2hex[buffer[2]] + byte2hex[buffer[3]] + "-" + byte2hex[buffer[4]] + byte2hex[buffer[5]] + "-" + byte2hex[buffer[6]] + byte2hex[buffer[7]] + "-" + byte2hex[buffer[8]] + byte2hex[buffer[9]] + "-" + byte2hex[buffer[10]] + byte2hex[buffer[11]] + byte2hex[buffer[12]] + byte2hex[buffer[13]] + byte2hex[buffer[14]] + byte2hex[buffer[15]];
}
uuid.nil = new UUID("00000000-0000-0000-0000-000000000000");
var xml = {};
var sax$1 = {};
(function(exports$1) {
  (function(sax2) {
    sax2.parser = function(strict, opt) {
      return new SAXParser(strict, opt);
    };
    sax2.SAXParser = SAXParser;
    sax2.SAXStream = SAXStream;
    sax2.createStream = createStream;
    sax2.MAX_BUFFER_LENGTH = 64 * 1024;
    var buffers = [
      "comment",
      "sgmlDecl",
      "textNode",
      "tagName",
      "doctype",
      "procInstName",
      "procInstBody",
      "entity",
      "attribName",
      "attribValue",
      "cdata",
      "script"
    ];
    sax2.EVENTS = [
      "text",
      "processinginstruction",
      "sgmldeclaration",
      "doctype",
      "comment",
      "opentagstart",
      "attribute",
      "opentag",
      "closetag",
      "opencdata",
      "cdata",
      "closecdata",
      "error",
      "end",
      "ready",
      "script",
      "opennamespace",
      "closenamespace"
    ];
    function SAXParser(strict, opt) {
      if (!(this instanceof SAXParser)) {
        return new SAXParser(strict, opt);
      }
      var parser = this;
      clearBuffers(parser);
      parser.q = parser.c = "";
      parser.bufferCheckPosition = sax2.MAX_BUFFER_LENGTH;
      parser.opt = opt || {};
      parser.opt.lowercase = parser.opt.lowercase || parser.opt.lowercasetags;
      parser.looseCase = parser.opt.lowercase ? "toLowerCase" : "toUpperCase";
      parser.tags = [];
      parser.closed = parser.closedRoot = parser.sawRoot = false;
      parser.tag = parser.error = null;
      parser.strict = !!strict;
      parser.noscript = !!(strict || parser.opt.noscript);
      parser.state = S.BEGIN;
      parser.strictEntities = parser.opt.strictEntities;
      parser.ENTITIES = parser.strictEntities ? Object.create(sax2.XML_ENTITIES) : Object.create(sax2.ENTITIES);
      parser.attribList = [];
      if (parser.opt.xmlns) {
        parser.ns = Object.create(rootNS);
      }
      if (parser.opt.unquotedAttributeValues === void 0) {
        parser.opt.unquotedAttributeValues = !strict;
      }
      parser.trackPosition = parser.opt.position !== false;
      if (parser.trackPosition) {
        parser.position = parser.line = parser.column = 0;
      }
      emit(parser, "onready");
    }
    if (!Object.create) {
      Object.create = function(o) {
        function F() {
        }
        F.prototype = o;
        var newf = new F();
        return newf;
      };
    }
    if (!Object.keys) {
      Object.keys = function(o) {
        var a = [];
        for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
        return a;
      };
    }
    function checkBufferLength(parser) {
      var maxAllowed = Math.max(sax2.MAX_BUFFER_LENGTH, 10);
      var maxActual = 0;
      for (var i = 0, l = buffers.length; i < l; i++) {
        var len = parser[buffers[i]].length;
        if (len > maxAllowed) {
          switch (buffers[i]) {
            case "textNode":
              closeText(parser);
              break;
            case "cdata":
              emitNode(parser, "oncdata", parser.cdata);
              parser.cdata = "";
              break;
            case "script":
              emitNode(parser, "onscript", parser.script);
              parser.script = "";
              break;
            default:
              error2(parser, "Max buffer length exceeded: " + buffers[i]);
          }
        }
        maxActual = Math.max(maxActual, len);
      }
      var m = sax2.MAX_BUFFER_LENGTH - maxActual;
      parser.bufferCheckPosition = m + parser.position;
    }
    function clearBuffers(parser) {
      for (var i = 0, l = buffers.length; i < l; i++) {
        parser[buffers[i]] = "";
      }
    }
    function flushBuffers(parser) {
      closeText(parser);
      if (parser.cdata !== "") {
        emitNode(parser, "oncdata", parser.cdata);
        parser.cdata = "";
      }
      if (parser.script !== "") {
        emitNode(parser, "onscript", parser.script);
        parser.script = "";
      }
    }
    SAXParser.prototype = {
      end: function() {
        end(this);
      },
      write,
      resume: function() {
        this.error = null;
        return this;
      },
      close: function() {
        return this.write(null);
      },
      flush: function() {
        flushBuffers(this);
      }
    };
    var Stream2;
    try {
      Stream2 = require("stream").Stream;
    } catch (ex) {
      Stream2 = function() {
      };
    }
    if (!Stream2) Stream2 = function() {
    };
    var streamWraps = sax2.EVENTS.filter(function(ev) {
      return ev !== "error" && ev !== "end";
    });
    function createStream(strict, opt) {
      return new SAXStream(strict, opt);
    }
    function SAXStream(strict, opt) {
      if (!(this instanceof SAXStream)) {
        return new SAXStream(strict, opt);
      }
      Stream2.apply(this);
      this._parser = new SAXParser(strict, opt);
      this.writable = true;
      this.readable = true;
      var me = this;
      this._parser.onend = function() {
        me.emit("end");
      };
      this._parser.onerror = function(er) {
        me.emit("error", er);
        me._parser.error = null;
      };
      this._decoder = null;
      streamWraps.forEach(function(ev) {
        Object.defineProperty(me, "on" + ev, {
          get: function() {
            return me._parser["on" + ev];
          },
          set: function(h) {
            if (!h) {
              me.removeAllListeners(ev);
              me._parser["on" + ev] = h;
              return h;
            }
            me.on(ev, h);
          },
          enumerable: true,
          configurable: false
        });
      });
    }
    SAXStream.prototype = Object.create(Stream2.prototype, {
      constructor: {
        value: SAXStream
      }
    });
    SAXStream.prototype.write = function(data) {
      if (typeof Buffer === "function" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(data)) {
        if (!this._decoder) {
          var SD = require$$1$5.StringDecoder;
          this._decoder = new SD("utf8");
        }
        data = this._decoder.write(data);
      }
      this._parser.write(data.toString());
      this.emit("data", data);
      return true;
    };
    SAXStream.prototype.end = function(chunk) {
      if (chunk && chunk.length) {
        this.write(chunk);
      }
      this._parser.end();
      return true;
    };
    SAXStream.prototype.on = function(ev, handler) {
      var me = this;
      if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
        me._parser["on" + ev] = function() {
          var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          args.splice(0, 0, ev);
          me.emit.apply(me, args);
        };
      }
      return Stream2.prototype.on.call(me, ev, handler);
    };
    var CDATA = "[CDATA[";
    var DOCTYPE = "DOCTYPE";
    var XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
    var XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
    var rootNS = { xml: XML_NAMESPACE, xmlns: XMLNS_NAMESPACE };
    var nameStart = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    var nameBody = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    var entityStart = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    var entityBody = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
    function isWhitespace2(c) {
      return c === " " || c === "\n" || c === "\r" || c === "	";
    }
    function isQuote(c) {
      return c === '"' || c === "'";
    }
    function isAttribEnd(c) {
      return c === ">" || isWhitespace2(c);
    }
    function isMatch(regex, c) {
      return regex.test(c);
    }
    function notMatch(regex, c) {
      return !isMatch(regex, c);
    }
    var S = 0;
    sax2.STATE = {
      BEGIN: S++,
      // leading byte order mark or whitespace
      BEGIN_WHITESPACE: S++,
      // leading whitespace
      TEXT: S++,
      // general stuff
      TEXT_ENTITY: S++,
      // &amp and such.
      OPEN_WAKA: S++,
      // <
      SGML_DECL: S++,
      // <!BLARG
      SGML_DECL_QUOTED: S++,
      // <!BLARG foo "bar
      DOCTYPE: S++,
      // <!DOCTYPE
      DOCTYPE_QUOTED: S++,
      // <!DOCTYPE "//blah
      DOCTYPE_DTD: S++,
      // <!DOCTYPE "//blah" [ ...
      DOCTYPE_DTD_QUOTED: S++,
      // <!DOCTYPE "//blah" [ "foo
      COMMENT_STARTING: S++,
      // <!-
      COMMENT: S++,
      // <!--
      COMMENT_ENDING: S++,
      // <!-- blah -
      COMMENT_ENDED: S++,
      // <!-- blah --
      CDATA: S++,
      // <![CDATA[ something
      CDATA_ENDING: S++,
      // ]
      CDATA_ENDING_2: S++,
      // ]]
      PROC_INST: S++,
      // <?hi
      PROC_INST_BODY: S++,
      // <?hi there
      PROC_INST_ENDING: S++,
      // <?hi "there" ?
      OPEN_TAG: S++,
      // <strong
      OPEN_TAG_SLASH: S++,
      // <strong /
      ATTRIB: S++,
      // <a
      ATTRIB_NAME: S++,
      // <a foo
      ATTRIB_NAME_SAW_WHITE: S++,
      // <a foo _
      ATTRIB_VALUE: S++,
      // <a foo=
      ATTRIB_VALUE_QUOTED: S++,
      // <a foo="bar
      ATTRIB_VALUE_CLOSED: S++,
      // <a foo="bar"
      ATTRIB_VALUE_UNQUOTED: S++,
      // <a foo=bar
      ATTRIB_VALUE_ENTITY_Q: S++,
      // <foo bar="&quot;"
      ATTRIB_VALUE_ENTITY_U: S++,
      // <foo bar=&quot
      CLOSE_TAG: S++,
      // </a
      CLOSE_TAG_SAW_WHITE: S++,
      // </a   >
      SCRIPT: S++,
      // <script> ...
      SCRIPT_ENDING: S++
      // <script> ... <
    };
    sax2.XML_ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'"
    };
    sax2.ENTITIES = {
      amp: "&",
      gt: ">",
      lt: "<",
      quot: '"',
      apos: "'",
      AElig: 198,
      Aacute: 193,
      Acirc: 194,
      Agrave: 192,
      Aring: 197,
      Atilde: 195,
      Auml: 196,
      Ccedil: 199,
      ETH: 208,
      Eacute: 201,
      Ecirc: 202,
      Egrave: 200,
      Euml: 203,
      Iacute: 205,
      Icirc: 206,
      Igrave: 204,
      Iuml: 207,
      Ntilde: 209,
      Oacute: 211,
      Ocirc: 212,
      Ograve: 210,
      Oslash: 216,
      Otilde: 213,
      Ouml: 214,
      THORN: 222,
      Uacute: 218,
      Ucirc: 219,
      Ugrave: 217,
      Uuml: 220,
      Yacute: 221,
      aacute: 225,
      acirc: 226,
      aelig: 230,
      agrave: 224,
      aring: 229,
      atilde: 227,
      auml: 228,
      ccedil: 231,
      eacute: 233,
      ecirc: 234,
      egrave: 232,
      eth: 240,
      euml: 235,
      iacute: 237,
      icirc: 238,
      igrave: 236,
      iuml: 239,
      ntilde: 241,
      oacute: 243,
      ocirc: 244,
      ograve: 242,
      oslash: 248,
      otilde: 245,
      ouml: 246,
      szlig: 223,
      thorn: 254,
      uacute: 250,
      ucirc: 251,
      ugrave: 249,
      uuml: 252,
      yacute: 253,
      yuml: 255,
      copy: 169,
      reg: 174,
      nbsp: 160,
      iexcl: 161,
      cent: 162,
      pound: 163,
      curren: 164,
      yen: 165,
      brvbar: 166,
      sect: 167,
      uml: 168,
      ordf: 170,
      laquo: 171,
      not: 172,
      shy: 173,
      macr: 175,
      deg: 176,
      plusmn: 177,
      sup1: 185,
      sup2: 178,
      sup3: 179,
      acute: 180,
      micro: 181,
      para: 182,
      middot: 183,
      cedil: 184,
      ordm: 186,
      raquo: 187,
      frac14: 188,
      frac12: 189,
      frac34: 190,
      iquest: 191,
      times: 215,
      divide: 247,
      OElig: 338,
      oelig: 339,
      Scaron: 352,
      scaron: 353,
      Yuml: 376,
      fnof: 402,
      circ: 710,
      tilde: 732,
      Alpha: 913,
      Beta: 914,
      Gamma: 915,
      Delta: 916,
      Epsilon: 917,
      Zeta: 918,
      Eta: 919,
      Theta: 920,
      Iota: 921,
      Kappa: 922,
      Lambda: 923,
      Mu: 924,
      Nu: 925,
      Xi: 926,
      Omicron: 927,
      Pi: 928,
      Rho: 929,
      Sigma: 931,
      Tau: 932,
      Upsilon: 933,
      Phi: 934,
      Chi: 935,
      Psi: 936,
      Omega: 937,
      alpha: 945,
      beta: 946,
      gamma: 947,
      delta: 948,
      epsilon: 949,
      zeta: 950,
      eta: 951,
      theta: 952,
      iota: 953,
      kappa: 954,
      lambda: 955,
      mu: 956,
      nu: 957,
      xi: 958,
      omicron: 959,
      pi: 960,
      rho: 961,
      sigmaf: 962,
      sigma: 963,
      tau: 964,
      upsilon: 965,
      phi: 966,
      chi: 967,
      psi: 968,
      omega: 969,
      thetasym: 977,
      upsih: 978,
      piv: 982,
      ensp: 8194,
      emsp: 8195,
      thinsp: 8201,
      zwnj: 8204,
      zwj: 8205,
      lrm: 8206,
      rlm: 8207,
      ndash: 8211,
      mdash: 8212,
      lsquo: 8216,
      rsquo: 8217,
      sbquo: 8218,
      ldquo: 8220,
      rdquo: 8221,
      bdquo: 8222,
      dagger: 8224,
      Dagger: 8225,
      bull: 8226,
      hellip: 8230,
      permil: 8240,
      prime: 8242,
      Prime: 8243,
      lsaquo: 8249,
      rsaquo: 8250,
      oline: 8254,
      frasl: 8260,
      euro: 8364,
      image: 8465,
      weierp: 8472,
      real: 8476,
      trade: 8482,
      alefsym: 8501,
      larr: 8592,
      uarr: 8593,
      rarr: 8594,
      darr: 8595,
      harr: 8596,
      crarr: 8629,
      lArr: 8656,
      uArr: 8657,
      rArr: 8658,
      dArr: 8659,
      hArr: 8660,
      forall: 8704,
      part: 8706,
      exist: 8707,
      empty: 8709,
      nabla: 8711,
      isin: 8712,
      notin: 8713,
      ni: 8715,
      prod: 8719,
      sum: 8721,
      minus: 8722,
      lowast: 8727,
      radic: 8730,
      prop: 8733,
      infin: 8734,
      ang: 8736,
      and: 8743,
      or: 8744,
      cap: 8745,
      cup: 8746,
      int: 8747,
      there4: 8756,
      sim: 8764,
      cong: 8773,
      asymp: 8776,
      ne: 8800,
      equiv: 8801,
      le: 8804,
      ge: 8805,
      sub: 8834,
      sup: 8835,
      nsub: 8836,
      sube: 8838,
      supe: 8839,
      oplus: 8853,
      otimes: 8855,
      perp: 8869,
      sdot: 8901,
      lceil: 8968,
      rceil: 8969,
      lfloor: 8970,
      rfloor: 8971,
      lang: 9001,
      rang: 9002,
      loz: 9674,
      spades: 9824,
      clubs: 9827,
      hearts: 9829,
      diams: 9830
    };
    Object.keys(sax2.ENTITIES).forEach(function(key) {
      var e = sax2.ENTITIES[key];
      var s2 = typeof e === "number" ? String.fromCharCode(e) : e;
      sax2.ENTITIES[key] = s2;
    });
    for (var s in sax2.STATE) {
      sax2.STATE[sax2.STATE[s]] = s;
    }
    S = sax2.STATE;
    function emit(parser, event, data) {
      parser[event] && parser[event](data);
    }
    function emitNode(parser, nodeType, data) {
      if (parser.textNode) closeText(parser);
      emit(parser, nodeType, data);
    }
    function closeText(parser) {
      parser.textNode = textopts(parser.opt, parser.textNode);
      if (parser.textNode) emit(parser, "ontext", parser.textNode);
      parser.textNode = "";
    }
    function textopts(opt, text) {
      if (opt.trim) text = text.trim();
      if (opt.normalize) text = text.replace(/\s+/g, " ");
      return text;
    }
    function error2(parser, er) {
      closeText(parser);
      if (parser.trackPosition) {
        er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
      }
      er = new Error(er);
      parser.error = er;
      emit(parser, "onerror", er);
      return parser;
    }
    function end(parser) {
      if (parser.sawRoot && !parser.closedRoot)
        strictFail(parser, "Unclosed root tag");
      if (parser.state !== S.BEGIN && parser.state !== S.BEGIN_WHITESPACE && parser.state !== S.TEXT) {
        error2(parser, "Unexpected end");
      }
      closeText(parser);
      parser.c = "";
      parser.closed = true;
      emit(parser, "onend");
      SAXParser.call(parser, parser.strict, parser.opt);
      return parser;
    }
    function strictFail(parser, message) {
      if (typeof parser !== "object" || !(parser instanceof SAXParser)) {
        throw new Error("bad call to strictFail");
      }
      if (parser.strict) {
        error2(parser, message);
      }
    }
    function newTag(parser) {
      if (!parser.strict) parser.tagName = parser.tagName[parser.looseCase]();
      var parent = parser.tags[parser.tags.length - 1] || parser;
      var tag = parser.tag = { name: parser.tagName, attributes: {} };
      if (parser.opt.xmlns) {
        tag.ns = parent.ns;
      }
      parser.attribList.length = 0;
      emitNode(parser, "onopentagstart", tag);
    }
    function qname(name, attribute) {
      var i = name.indexOf(":");
      var qualName = i < 0 ? ["", name] : name.split(":");
      var prefix = qualName[0];
      var local = qualName[1];
      if (attribute && name === "xmlns") {
        prefix = "xmlns";
        local = "";
      }
      return { prefix, local };
    }
    function attrib(parser) {
      if (!parser.strict) {
        parser.attribName = parser.attribName[parser.looseCase]();
      }
      if (parser.attribList.indexOf(parser.attribName) !== -1 || parser.tag.attributes.hasOwnProperty(parser.attribName)) {
        parser.attribName = parser.attribValue = "";
        return;
      }
      if (parser.opt.xmlns) {
        var qn = qname(parser.attribName, true);
        var prefix = qn.prefix;
        var local = qn.local;
        if (prefix === "xmlns") {
          if (local === "xml" && parser.attribValue !== XML_NAMESPACE) {
            strictFail(
              parser,
              "xml: prefix must be bound to " + XML_NAMESPACE + "\nActual: " + parser.attribValue
            );
          } else if (local === "xmlns" && parser.attribValue !== XMLNS_NAMESPACE) {
            strictFail(
              parser,
              "xmlns: prefix must be bound to " + XMLNS_NAMESPACE + "\nActual: " + parser.attribValue
            );
          } else {
            var tag = parser.tag;
            var parent = parser.tags[parser.tags.length - 1] || parser;
            if (tag.ns === parent.ns) {
              tag.ns = Object.create(parent.ns);
            }
            tag.ns[local] = parser.attribValue;
          }
        }
        parser.attribList.push([parser.attribName, parser.attribValue]);
      } else {
        parser.tag.attributes[parser.attribName] = parser.attribValue;
        emitNode(parser, "onattribute", {
          name: parser.attribName,
          value: parser.attribValue
        });
      }
      parser.attribName = parser.attribValue = "";
    }
    function openTag(parser, selfClosing) {
      if (parser.opt.xmlns) {
        var tag = parser.tag;
        var qn = qname(parser.tagName);
        tag.prefix = qn.prefix;
        tag.local = qn.local;
        tag.uri = tag.ns[qn.prefix] || "";
        if (tag.prefix && !tag.uri) {
          strictFail(
            parser,
            "Unbound namespace prefix: " + JSON.stringify(parser.tagName)
          );
          tag.uri = qn.prefix;
        }
        var parent = parser.tags[parser.tags.length - 1] || parser;
        if (tag.ns && parent.ns !== tag.ns) {
          Object.keys(tag.ns).forEach(function(p) {
            emitNode(parser, "onopennamespace", {
              prefix: p,
              uri: tag.ns[p]
            });
          });
        }
        for (var i = 0, l = parser.attribList.length; i < l; i++) {
          var nv = parser.attribList[i];
          var name = nv[0];
          var value = nv[1];
          var qualName = qname(name, true);
          var prefix = qualName.prefix;
          var local = qualName.local;
          var uri = prefix === "" ? "" : tag.ns[prefix] || "";
          var a = {
            name,
            value,
            prefix,
            local,
            uri
          };
          if (prefix && prefix !== "xmlns" && !uri) {
            strictFail(
              parser,
              "Unbound namespace prefix: " + JSON.stringify(prefix)
            );
            a.uri = prefix;
          }
          parser.tag.attributes[name] = a;
          emitNode(parser, "onattribute", a);
        }
        parser.attribList.length = 0;
      }
      parser.tag.isSelfClosing = !!selfClosing;
      parser.sawRoot = true;
      parser.tags.push(parser.tag);
      emitNode(parser, "onopentag", parser.tag);
      if (!selfClosing) {
        if (!parser.noscript && parser.tagName.toLowerCase() === "script") {
          parser.state = S.SCRIPT;
        } else {
          parser.state = S.TEXT;
        }
        parser.tag = null;
        parser.tagName = "";
      }
      parser.attribName = parser.attribValue = "";
      parser.attribList.length = 0;
    }
    function closeTag(parser) {
      if (!parser.tagName) {
        strictFail(parser, "Weird empty close tag.");
        parser.textNode += "</>";
        parser.state = S.TEXT;
        return;
      }
      if (parser.script) {
        if (parser.tagName !== "script") {
          parser.script += "</" + parser.tagName + ">";
          parser.tagName = "";
          parser.state = S.SCRIPT;
          return;
        }
        emitNode(parser, "onscript", parser.script);
        parser.script = "";
      }
      var t2 = parser.tags.length;
      var tagName = parser.tagName;
      if (!parser.strict) {
        tagName = tagName[parser.looseCase]();
      }
      var closeTo = tagName;
      while (t2--) {
        var close = parser.tags[t2];
        if (close.name !== closeTo) {
          strictFail(parser, "Unexpected close tag");
        } else {
          break;
        }
      }
      if (t2 < 0) {
        strictFail(parser, "Unmatched closing tag: " + parser.tagName);
        parser.textNode += "</" + parser.tagName + ">";
        parser.state = S.TEXT;
        return;
      }
      parser.tagName = tagName;
      var s2 = parser.tags.length;
      while (s2-- > t2) {
        var tag = parser.tag = parser.tags.pop();
        parser.tagName = parser.tag.name;
        emitNode(parser, "onclosetag", parser.tagName);
        var x = {};
        for (var i in tag.ns) {
          x[i] = tag.ns[i];
        }
        var parent = parser.tags[parser.tags.length - 1] || parser;
        if (parser.opt.xmlns && tag.ns !== parent.ns) {
          Object.keys(tag.ns).forEach(function(p) {
            var n = tag.ns[p];
            emitNode(parser, "onclosenamespace", { prefix: p, uri: n });
          });
        }
      }
      if (t2 === 0) parser.closedRoot = true;
      parser.tagName = parser.attribValue = parser.attribName = "";
      parser.attribList.length = 0;
      parser.state = S.TEXT;
    }
    function parseEntity(parser) {
      var entity = parser.entity;
      var entityLC = entity.toLowerCase();
      var num;
      var numStr = "";
      if (parser.ENTITIES[entity]) {
        return parser.ENTITIES[entity];
      }
      if (parser.ENTITIES[entityLC]) {
        return parser.ENTITIES[entityLC];
      }
      entity = entityLC;
      if (entity.charAt(0) === "#") {
        if (entity.charAt(1) === "x") {
          entity = entity.slice(2);
          num = parseInt(entity, 16);
          numStr = num.toString(16);
        } else {
          entity = entity.slice(1);
          num = parseInt(entity, 10);
          numStr = num.toString(10);
        }
      }
      entity = entity.replace(/^0+/, "");
      if (isNaN(num) || numStr.toLowerCase() !== entity || num < 0 || num > 1114111) {
        strictFail(parser, "Invalid character entity");
        return "&" + parser.entity + ";";
      }
      return String.fromCodePoint(num);
    }
    function beginWhiteSpace(parser, c) {
      if (c === "<") {
        parser.state = S.OPEN_WAKA;
        parser.startTagPosition = parser.position;
      } else if (!isWhitespace2(c)) {
        strictFail(parser, "Non-whitespace before first tag.");
        parser.textNode = c;
        parser.state = S.TEXT;
      }
    }
    function charAt(chunk, i) {
      var result = "";
      if (i < chunk.length) {
        result = chunk.charAt(i);
      }
      return result;
    }
    function write(chunk) {
      var parser = this;
      if (this.error) {
        throw this.error;
      }
      if (parser.closed) {
        return error2(
          parser,
          "Cannot write after close. Assign an onready handler."
        );
      }
      if (chunk === null) {
        return end(parser);
      }
      if (typeof chunk === "object") {
        chunk = chunk.toString();
      }
      var i = 0;
      var c = "";
      while (true) {
        c = charAt(chunk, i++);
        parser.c = c;
        if (!c) {
          break;
        }
        if (parser.trackPosition) {
          parser.position++;
          if (c === "\n") {
            parser.line++;
            parser.column = 0;
          } else {
            parser.column++;
          }
        }
        switch (parser.state) {
          case S.BEGIN:
            parser.state = S.BEGIN_WHITESPACE;
            if (c === "\uFEFF") {
              continue;
            }
            beginWhiteSpace(parser, c);
            continue;
          case S.BEGIN_WHITESPACE:
            beginWhiteSpace(parser, c);
            continue;
          case S.TEXT:
            if (parser.sawRoot && !parser.closedRoot) {
              var starti = i - 1;
              while (c && c !== "<" && c !== "&") {
                c = charAt(chunk, i++);
                if (c && parser.trackPosition) {
                  parser.position++;
                  if (c === "\n") {
                    parser.line++;
                    parser.column = 0;
                  } else {
                    parser.column++;
                  }
                }
              }
              parser.textNode += chunk.substring(starti, i - 1);
            }
            if (c === "<" && !(parser.sawRoot && parser.closedRoot && !parser.strict)) {
              parser.state = S.OPEN_WAKA;
              parser.startTagPosition = parser.position;
            } else {
              if (!isWhitespace2(c) && (!parser.sawRoot || parser.closedRoot)) {
                strictFail(parser, "Text data outside of root node.");
              }
              if (c === "&") {
                parser.state = S.TEXT_ENTITY;
              } else {
                parser.textNode += c;
              }
            }
            continue;
          case S.SCRIPT:
            if (c === "<") {
              parser.state = S.SCRIPT_ENDING;
            } else {
              parser.script += c;
            }
            continue;
          case S.SCRIPT_ENDING:
            if (c === "/") {
              parser.state = S.CLOSE_TAG;
            } else {
              parser.script += "<" + c;
              parser.state = S.SCRIPT;
            }
            continue;
          case S.OPEN_WAKA:
            if (c === "!") {
              parser.state = S.SGML_DECL;
              parser.sgmlDecl = "";
            } else if (isWhitespace2(c)) ;
            else if (isMatch(nameStart, c)) {
              parser.state = S.OPEN_TAG;
              parser.tagName = c;
            } else if (c === "/") {
              parser.state = S.CLOSE_TAG;
              parser.tagName = "";
            } else if (c === "?") {
              parser.state = S.PROC_INST;
              parser.procInstName = parser.procInstBody = "";
            } else {
              strictFail(parser, "Unencoded <");
              if (parser.startTagPosition + 1 < parser.position) {
                var pad = parser.position - parser.startTagPosition;
                c = new Array(pad).join(" ") + c;
              }
              parser.textNode += "<" + c;
              parser.state = S.TEXT;
            }
            continue;
          case S.SGML_DECL:
            if (parser.sgmlDecl + c === "--") {
              parser.state = S.COMMENT;
              parser.comment = "";
              parser.sgmlDecl = "";
              continue;
            }
            if (parser.doctype && parser.doctype !== true && parser.sgmlDecl) {
              parser.state = S.DOCTYPE_DTD;
              parser.doctype += "<!" + parser.sgmlDecl + c;
              parser.sgmlDecl = "";
            } else if ((parser.sgmlDecl + c).toUpperCase() === CDATA) {
              emitNode(parser, "onopencdata");
              parser.state = S.CDATA;
              parser.sgmlDecl = "";
              parser.cdata = "";
            } else if ((parser.sgmlDecl + c).toUpperCase() === DOCTYPE) {
              parser.state = S.DOCTYPE;
              if (parser.doctype || parser.sawRoot) {
                strictFail(
                  parser,
                  "Inappropriately located doctype declaration"
                );
              }
              parser.doctype = "";
              parser.sgmlDecl = "";
            } else if (c === ">") {
              emitNode(parser, "onsgmldeclaration", parser.sgmlDecl);
              parser.sgmlDecl = "";
              parser.state = S.TEXT;
            } else if (isQuote(c)) {
              parser.state = S.SGML_DECL_QUOTED;
              parser.sgmlDecl += c;
            } else {
              parser.sgmlDecl += c;
            }
            continue;
          case S.SGML_DECL_QUOTED:
            if (c === parser.q) {
              parser.state = S.SGML_DECL;
              parser.q = "";
            }
            parser.sgmlDecl += c;
            continue;
          case S.DOCTYPE:
            if (c === ">") {
              parser.state = S.TEXT;
              emitNode(parser, "ondoctype", parser.doctype);
              parser.doctype = true;
            } else {
              parser.doctype += c;
              if (c === "[") {
                parser.state = S.DOCTYPE_DTD;
              } else if (isQuote(c)) {
                parser.state = S.DOCTYPE_QUOTED;
                parser.q = c;
              }
            }
            continue;
          case S.DOCTYPE_QUOTED:
            parser.doctype += c;
            if (c === parser.q) {
              parser.q = "";
              parser.state = S.DOCTYPE;
            }
            continue;
          case S.DOCTYPE_DTD:
            if (c === "]") {
              parser.doctype += c;
              parser.state = S.DOCTYPE;
            } else if (c === "<") {
              parser.state = S.OPEN_WAKA;
              parser.startTagPosition = parser.position;
            } else if (isQuote(c)) {
              parser.doctype += c;
              parser.state = S.DOCTYPE_DTD_QUOTED;
              parser.q = c;
            } else {
              parser.doctype += c;
            }
            continue;
          case S.DOCTYPE_DTD_QUOTED:
            parser.doctype += c;
            if (c === parser.q) {
              parser.state = S.DOCTYPE_DTD;
              parser.q = "";
            }
            continue;
          case S.COMMENT:
            if (c === "-") {
              parser.state = S.COMMENT_ENDING;
            } else {
              parser.comment += c;
            }
            continue;
          case S.COMMENT_ENDING:
            if (c === "-") {
              parser.state = S.COMMENT_ENDED;
              parser.comment = textopts(parser.opt, parser.comment);
              if (parser.comment) {
                emitNode(parser, "oncomment", parser.comment);
              }
              parser.comment = "";
            } else {
              parser.comment += "-" + c;
              parser.state = S.COMMENT;
            }
            continue;
          case S.COMMENT_ENDED:
            if (c !== ">") {
              strictFail(parser, "Malformed comment");
              parser.comment += "--" + c;
              parser.state = S.COMMENT;
            } else if (parser.doctype && parser.doctype !== true) {
              parser.state = S.DOCTYPE_DTD;
            } else {
              parser.state = S.TEXT;
            }
            continue;
          case S.CDATA:
            var starti = i - 1;
            while (c && c !== "]") {
              c = charAt(chunk, i++);
              if (c && parser.trackPosition) {
                parser.position++;
                if (c === "\n") {
                  parser.line++;
                  parser.column = 0;
                } else {
                  parser.column++;
                }
              }
            }
            parser.cdata += chunk.substring(starti, i - 1);
            if (c === "]") {
              parser.state = S.CDATA_ENDING;
            }
            continue;
          case S.CDATA_ENDING:
            if (c === "]") {
              parser.state = S.CDATA_ENDING_2;
            } else {
              parser.cdata += "]" + c;
              parser.state = S.CDATA;
            }
            continue;
          case S.CDATA_ENDING_2:
            if (c === ">") {
              if (parser.cdata) {
                emitNode(parser, "oncdata", parser.cdata);
              }
              emitNode(parser, "onclosecdata");
              parser.cdata = "";
              parser.state = S.TEXT;
            } else if (c === "]") {
              parser.cdata += "]";
            } else {
              parser.cdata += "]]" + c;
              parser.state = S.CDATA;
            }
            continue;
          case S.PROC_INST:
            if (c === "?") {
              parser.state = S.PROC_INST_ENDING;
            } else if (isWhitespace2(c)) {
              parser.state = S.PROC_INST_BODY;
            } else {
              parser.procInstName += c;
            }
            continue;
          case S.PROC_INST_BODY:
            if (!parser.procInstBody && isWhitespace2(c)) {
              continue;
            } else if (c === "?") {
              parser.state = S.PROC_INST_ENDING;
            } else {
              parser.procInstBody += c;
            }
            continue;
          case S.PROC_INST_ENDING:
            if (c === ">") {
              emitNode(parser, "onprocessinginstruction", {
                name: parser.procInstName,
                body: parser.procInstBody
              });
              parser.procInstName = parser.procInstBody = "";
              parser.state = S.TEXT;
            } else {
              parser.procInstBody += "?" + c;
              parser.state = S.PROC_INST_BODY;
            }
            continue;
          case S.OPEN_TAG:
            if (isMatch(nameBody, c)) {
              parser.tagName += c;
            } else {
              newTag(parser);
              if (c === ">") {
                openTag(parser);
              } else if (c === "/") {
                parser.state = S.OPEN_TAG_SLASH;
              } else {
                if (!isWhitespace2(c)) {
                  strictFail(parser, "Invalid character in tag name");
                }
                parser.state = S.ATTRIB;
              }
            }
            continue;
          case S.OPEN_TAG_SLASH:
            if (c === ">") {
              openTag(parser, true);
              closeTag(parser);
            } else {
              strictFail(
                parser,
                "Forward-slash in opening tag not followed by >"
              );
              parser.state = S.ATTRIB;
            }
            continue;
          case S.ATTRIB:
            if (isWhitespace2(c)) {
              continue;
            } else if (c === ">") {
              openTag(parser);
            } else if (c === "/") {
              parser.state = S.OPEN_TAG_SLASH;
            } else if (isMatch(nameStart, c)) {
              parser.attribName = c;
              parser.attribValue = "";
              parser.state = S.ATTRIB_NAME;
            } else {
              strictFail(parser, "Invalid attribute name");
            }
            continue;
          case S.ATTRIB_NAME:
            if (c === "=") {
              parser.state = S.ATTRIB_VALUE;
            } else if (c === ">") {
              strictFail(parser, "Attribute without value");
              parser.attribValue = parser.attribName;
              attrib(parser);
              openTag(parser);
            } else if (isWhitespace2(c)) {
              parser.state = S.ATTRIB_NAME_SAW_WHITE;
            } else if (isMatch(nameBody, c)) {
              parser.attribName += c;
            } else {
              strictFail(parser, "Invalid attribute name");
            }
            continue;
          case S.ATTRIB_NAME_SAW_WHITE:
            if (c === "=") {
              parser.state = S.ATTRIB_VALUE;
            } else if (isWhitespace2(c)) {
              continue;
            } else {
              strictFail(parser, "Attribute without value");
              parser.tag.attributes[parser.attribName] = "";
              parser.attribValue = "";
              emitNode(parser, "onattribute", {
                name: parser.attribName,
                value: ""
              });
              parser.attribName = "";
              if (c === ">") {
                openTag(parser);
              } else if (isMatch(nameStart, c)) {
                parser.attribName = c;
                parser.state = S.ATTRIB_NAME;
              } else {
                strictFail(parser, "Invalid attribute name");
                parser.state = S.ATTRIB;
              }
            }
            continue;
          case S.ATTRIB_VALUE:
            if (isWhitespace2(c)) {
              continue;
            } else if (isQuote(c)) {
              parser.q = c;
              parser.state = S.ATTRIB_VALUE_QUOTED;
            } else {
              if (!parser.opt.unquotedAttributeValues) {
                error2(parser, "Unquoted attribute value");
              }
              parser.state = S.ATTRIB_VALUE_UNQUOTED;
              parser.attribValue = c;
            }
            continue;
          case S.ATTRIB_VALUE_QUOTED:
            if (c !== parser.q) {
              if (c === "&") {
                parser.state = S.ATTRIB_VALUE_ENTITY_Q;
              } else {
                parser.attribValue += c;
              }
              continue;
            }
            attrib(parser);
            parser.q = "";
            parser.state = S.ATTRIB_VALUE_CLOSED;
            continue;
          case S.ATTRIB_VALUE_CLOSED:
            if (isWhitespace2(c)) {
              parser.state = S.ATTRIB;
            } else if (c === ">") {
              openTag(parser);
            } else if (c === "/") {
              parser.state = S.OPEN_TAG_SLASH;
            } else if (isMatch(nameStart, c)) {
              strictFail(parser, "No whitespace between attributes");
              parser.attribName = c;
              parser.attribValue = "";
              parser.state = S.ATTRIB_NAME;
            } else {
              strictFail(parser, "Invalid attribute name");
            }
            continue;
          case S.ATTRIB_VALUE_UNQUOTED:
            if (!isAttribEnd(c)) {
              if (c === "&") {
                parser.state = S.ATTRIB_VALUE_ENTITY_U;
              } else {
                parser.attribValue += c;
              }
              continue;
            }
            attrib(parser);
            if (c === ">") {
              openTag(parser);
            } else {
              parser.state = S.ATTRIB;
            }
            continue;
          case S.CLOSE_TAG:
            if (!parser.tagName) {
              if (isWhitespace2(c)) {
                continue;
              } else if (notMatch(nameStart, c)) {
                if (parser.script) {
                  parser.script += "</" + c;
                  parser.state = S.SCRIPT;
                } else {
                  strictFail(parser, "Invalid tagname in closing tag.");
                }
              } else {
                parser.tagName = c;
              }
            } else if (c === ">") {
              closeTag(parser);
            } else if (isMatch(nameBody, c)) {
              parser.tagName += c;
            } else if (parser.script) {
              parser.script += "</" + parser.tagName;
              parser.tagName = "";
              parser.state = S.SCRIPT;
            } else {
              if (!isWhitespace2(c)) {
                strictFail(parser, "Invalid tagname in closing tag");
              }
              parser.state = S.CLOSE_TAG_SAW_WHITE;
            }
            continue;
          case S.CLOSE_TAG_SAW_WHITE:
            if (isWhitespace2(c)) {
              continue;
            }
            if (c === ">") {
              closeTag(parser);
            } else {
              strictFail(parser, "Invalid characters in closing tag");
            }
            continue;
          case S.TEXT_ENTITY:
          case S.ATTRIB_VALUE_ENTITY_Q:
          case S.ATTRIB_VALUE_ENTITY_U:
            var returnState;
            var buffer;
            switch (parser.state) {
              case S.TEXT_ENTITY:
                returnState = S.TEXT;
                buffer = "textNode";
                break;
              case S.ATTRIB_VALUE_ENTITY_Q:
                returnState = S.ATTRIB_VALUE_QUOTED;
                buffer = "attribValue";
                break;
              case S.ATTRIB_VALUE_ENTITY_U:
                returnState = S.ATTRIB_VALUE_UNQUOTED;
                buffer = "attribValue";
                break;
            }
            if (c === ";") {
              var parsedEntity = parseEntity(parser);
              if (parser.opt.unparsedEntities && !Object.values(sax2.XML_ENTITIES).includes(parsedEntity)) {
                parser.entity = "";
                parser.state = returnState;
                parser.write(parsedEntity);
              } else {
                parser[buffer] += parsedEntity;
                parser.entity = "";
                parser.state = returnState;
              }
            } else if (isMatch(parser.entity.length ? entityBody : entityStart, c)) {
              parser.entity += c;
            } else {
              strictFail(parser, "Invalid character in entity name");
              parser[buffer] += "&" + parser.entity + c;
              parser.entity = "";
              parser.state = returnState;
            }
            continue;
          default: {
            throw new Error(parser, "Unknown state: " + parser.state);
          }
        }
      }
      if (parser.position >= parser.bufferCheckPosition) {
        checkBufferLength(parser);
      }
      return parser;
    }
    /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
    if (!String.fromCodePoint) {
      (function() {
        var stringFromCharCode = String.fromCharCode;
        var floor = Math.floor;
        var fromCodePoint = function() {
          var MAX_SIZE = 16384;
          var codeUnits = [];
          var highSurrogate;
          var lowSurrogate;
          var index = -1;
          var length = arguments.length;
          if (!length) {
            return "";
          }
          var result = "";
          while (++index < length) {
            var codePoint = Number(arguments[index]);
            if (!isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 || // not a valid Unicode code point
            codePoint > 1114111 || // not a valid Unicode code point
            floor(codePoint) !== codePoint) {
              throw RangeError("Invalid code point: " + codePoint);
            }
            if (codePoint <= 65535) {
              codeUnits.push(codePoint);
            } else {
              codePoint -= 65536;
              highSurrogate = (codePoint >> 10) + 55296;
              lowSurrogate = codePoint % 1024 + 56320;
              codeUnits.push(highSurrogate, lowSurrogate);
            }
            if (index + 1 === length || codeUnits.length > MAX_SIZE) {
              result += stringFromCharCode.apply(null, codeUnits);
              codeUnits.length = 0;
            }
          }
          return result;
        };
        if (Object.defineProperty) {
          Object.defineProperty(String, "fromCodePoint", {
            value: fromCodePoint,
            configurable: true,
            writable: true
          });
        } else {
          String.fromCodePoint = fromCodePoint;
        }
      })();
    }
  })(exports$1);
})(sax$1);
Object.defineProperty(xml, "__esModule", { value: true });
xml.XElement = void 0;
xml.parseXml = parseXml;
const sax = sax$1;
const error_1 = error;
class XElement {
  constructor(name) {
    this.name = name;
    this.value = "";
    this.attributes = null;
    this.isCData = false;
    this.elements = null;
    if (!name) {
      throw (0, error_1.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
    }
    if (!isValidName(name)) {
      throw (0, error_1.newError)(`Invalid element name: ${name}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
  }
  attribute(name) {
    const result = this.attributes === null ? null : this.attributes[name];
    if (result == null) {
      throw (0, error_1.newError)(`No attribute "${name}"`, "ERR_XML_MISSED_ATTRIBUTE");
    }
    return result;
  }
  removeAttribute(name) {
    if (this.attributes !== null) {
      delete this.attributes[name];
    }
  }
  element(name, ignoreCase = false, errorIfMissed = null) {
    const result = this.elementOrNull(name, ignoreCase);
    if (result === null) {
      throw (0, error_1.newError)(errorIfMissed || `No element "${name}"`, "ERR_XML_MISSED_ELEMENT");
    }
    return result;
  }
  elementOrNull(name, ignoreCase = false) {
    if (this.elements === null) {
      return null;
    }
    for (const element of this.elements) {
      if (isNameEquals(element, name, ignoreCase)) {
        return element;
      }
    }
    return null;
  }
  getElements(name, ignoreCase = false) {
    if (this.elements === null) {
      return [];
    }
    return this.elements.filter((it) => isNameEquals(it, name, ignoreCase));
  }
  elementValueOrEmpty(name, ignoreCase = false) {
    const element = this.elementOrNull(name, ignoreCase);
    return element === null ? "" : element.value;
  }
}
xml.XElement = XElement;
const NAME_REG_EXP = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
function isValidName(name) {
  return NAME_REG_EXP.test(name);
}
function isNameEquals(element, name, ignoreCase) {
  const elementName = element.name;
  return elementName === name || ignoreCase === true && elementName.length === name.length && elementName.toLowerCase() === name.toLowerCase();
}
function parseXml(data) {
  let rootElement = null;
  const parser = sax.parser(true, {});
  const elements = [];
  parser.onopentag = (saxElement) => {
    const element = new XElement(saxElement.name);
    element.attributes = saxElement.attributes;
    if (rootElement === null) {
      rootElement = element;
    } else {
      const parent = elements[elements.length - 1];
      if (parent.elements == null) {
        parent.elements = [];
      }
      parent.elements.push(element);
    }
    elements.push(element);
  };
  parser.onclosetag = () => {
    elements.pop();
  };
  parser.ontext = (text) => {
    if (elements.length > 0) {
      elements[elements.length - 1].value = text;
    }
  };
  parser.oncdata = (cdata) => {
    const element = elements[elements.length - 1];
    element.value = cdata;
    element.isCData = true;
  };
  parser.onerror = (err) => {
    throw err;
  };
  parser.write(data);
  return rootElement;
}
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.CURRENT_APP_PACKAGE_FILE_NAME = exports$1.CURRENT_APP_INSTALLER_FILE_NAME = exports$1.XElement = exports$1.parseXml = exports$1.UUID = exports$1.parseDn = exports$1.retry = exports$1.githubUrl = exports$1.getS3LikeProviderBaseUrl = exports$1.ProgressCallbackTransform = exports$1.MemoLazy = exports$1.safeStringifyJson = exports$1.safeGetHeader = exports$1.parseJson = exports$1.HttpExecutor = exports$1.HttpError = exports$1.DigestTransform = exports$1.createHttpError = exports$1.configureRequestUrl = exports$1.configureRequestOptionsFromUrl = exports$1.configureRequestOptions = exports$1.newError = exports$1.CancellationToken = exports$1.CancellationError = void 0;
  exports$1.asArray = asArray;
  var CancellationToken_12 = CancellationToken$1;
  Object.defineProperty(exports$1, "CancellationError", { enumerable: true, get: function() {
    return CancellationToken_12.CancellationError;
  } });
  Object.defineProperty(exports$1, "CancellationToken", { enumerable: true, get: function() {
    return CancellationToken_12.CancellationToken;
  } });
  var error_12 = error;
  Object.defineProperty(exports$1, "newError", { enumerable: true, get: function() {
    return error_12.newError;
  } });
  var httpExecutor_1 = httpExecutor;
  Object.defineProperty(exports$1, "configureRequestOptions", { enumerable: true, get: function() {
    return httpExecutor_1.configureRequestOptions;
  } });
  Object.defineProperty(exports$1, "configureRequestOptionsFromUrl", { enumerable: true, get: function() {
    return httpExecutor_1.configureRequestOptionsFromUrl;
  } });
  Object.defineProperty(exports$1, "configureRequestUrl", { enumerable: true, get: function() {
    return httpExecutor_1.configureRequestUrl;
  } });
  Object.defineProperty(exports$1, "createHttpError", { enumerable: true, get: function() {
    return httpExecutor_1.createHttpError;
  } });
  Object.defineProperty(exports$1, "DigestTransform", { enumerable: true, get: function() {
    return httpExecutor_1.DigestTransform;
  } });
  Object.defineProperty(exports$1, "HttpError", { enumerable: true, get: function() {
    return httpExecutor_1.HttpError;
  } });
  Object.defineProperty(exports$1, "HttpExecutor", { enumerable: true, get: function() {
    return httpExecutor_1.HttpExecutor;
  } });
  Object.defineProperty(exports$1, "parseJson", { enumerable: true, get: function() {
    return httpExecutor_1.parseJson;
  } });
  Object.defineProperty(exports$1, "safeGetHeader", { enumerable: true, get: function() {
    return httpExecutor_1.safeGetHeader;
  } });
  Object.defineProperty(exports$1, "safeStringifyJson", { enumerable: true, get: function() {
    return httpExecutor_1.safeStringifyJson;
  } });
  var MemoLazy_1 = MemoLazy$1;
  Object.defineProperty(exports$1, "MemoLazy", { enumerable: true, get: function() {
    return MemoLazy_1.MemoLazy;
  } });
  var ProgressCallbackTransform_12 = ProgressCallbackTransform$1;
  Object.defineProperty(exports$1, "ProgressCallbackTransform", { enumerable: true, get: function() {
    return ProgressCallbackTransform_12.ProgressCallbackTransform;
  } });
  var publishOptions_1 = publishOptions;
  Object.defineProperty(exports$1, "getS3LikeProviderBaseUrl", { enumerable: true, get: function() {
    return publishOptions_1.getS3LikeProviderBaseUrl;
  } });
  Object.defineProperty(exports$1, "githubUrl", { enumerable: true, get: function() {
    return publishOptions_1.githubUrl;
  } });
  var retry_1 = retry$1;
  Object.defineProperty(exports$1, "retry", { enumerable: true, get: function() {
    return retry_1.retry;
  } });
  var rfc2253Parser_1 = rfc2253Parser;
  Object.defineProperty(exports$1, "parseDn", { enumerable: true, get: function() {
    return rfc2253Parser_1.parseDn;
  } });
  var uuid_1 = uuid;
  Object.defineProperty(exports$1, "UUID", { enumerable: true, get: function() {
    return uuid_1.UUID;
  } });
  var xml_1 = xml;
  Object.defineProperty(exports$1, "parseXml", { enumerable: true, get: function() {
    return xml_1.parseXml;
  } });
  Object.defineProperty(exports$1, "XElement", { enumerable: true, get: function() {
    return xml_1.XElement;
  } });
  exports$1.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe";
  exports$1.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
  function asArray(v) {
    if (v == null) {
      return [];
    } else if (Array.isArray(v)) {
      return v;
    } else {
      return [v];
    }
  }
})(out);
var jsYaml = {};
var loader$1 = {};
var common$5 = {};
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result = "", cycle;
  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
common$5.isNothing = isNothing;
common$5.isObject = isObject;
common$5.toArray = toArray;
common$5.repeat = repeat;
common$5.isNegativeZero = isNegativeZero;
common$5.extend = extend;
function formatError(exception2, compact) {
  var where = "", message = exception2.reason || "(unknown reason)";
  if (!exception2.mark) return message;
  if (exception2.mark.name) {
    where += 'in "' + exception2.mark.name + '" ';
  }
  where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
  if (!compact && exception2.mark.snippet) {
    where += "\n\n" + exception2.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$4(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$4.prototype = Object.create(Error.prototype);
YAMLException$4.prototype.constructor = YAMLException$4;
YAMLException$4.prototype.toString = function toString(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$4;
var common$4 = common$5;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
    pos: position - lineStart + head.length
    // relative position
  };
}
function padStart(string, max) {
  return common$4.repeat(" ", max - string.length) + string;
}
function makeSnippet$1(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer) return null;
  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent !== "number") options.indent = 1;
  if (typeof options.linesBefore !== "number") options.linesBefore = 3;
  if (typeof options.linesAfter !== "number") options.linesAfter = 2;
  var re2 = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re2.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common$4.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common$4.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result += common$4.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common$4.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet$1;
var YAMLException$3 = exception;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map2) {
  var result = {};
  if (map2 !== null) {
    Object.keys(map2).forEach(function(style) {
      map2[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$e(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new YAMLException$3('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new YAMLException$3('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$e;
var YAMLException$2 = exception;
var Type$d = type;
function compileList(schema2, name) {
  var result = [];
  schema2[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof Type$d) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);
  } else {
    throw new YAMLException$2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type2) {
    if (!(type2 instanceof Type$d)) {
      throw new YAMLException$2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type2.loadKind && type2.loadKind !== "scalar") {
      throw new YAMLException$2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type2.multi) {
      throw new YAMLException$2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type2) {
    if (!(type2 instanceof Type$d)) {
      throw new YAMLException$2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var Type$c = type;
var str = new Type$c("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var Type$b = type;
var seq = new Type$b("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var Type$a = type;
var map = new Type$a("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var Schema = schema;
var failsafe = new Schema({
  explicit: [
    str,
    seq,
    map
  ]
});
var Type$9 = type;
function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new Type$9("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
var Type$8 = type;
function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new Type$8("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
var common$3 = common$5;
var Type$7 = type;
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max) return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max) return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_") return false;
  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_") return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0") return 0;
  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common$3.isNegativeZero(object));
}
var int = new Type$7("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var common$2 = common$5;
var Type$6 = type;
var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function resolveYamlFloat(data) {
  if (data === null) return false;
  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common$2.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common$2.isNegativeZero(object));
}
var float = new Type$6("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var Type$5 = type;
var YAML_DATE_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
);
var YAML_TIMESTAMP_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 6e4;
    if (match[9] === "-") delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new Type$5("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
var Type$4 = type;
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new Type$4("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var Type$3 = type;
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
  if (data === null) return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64) continue;
    if (code < 0) return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map2[bits >> 18 & 63];
    result += map2[bits >> 12 & 63];
    result += map2[bits >> 6 & 63];
    result += map2[bits & 63];
  } else if (tail === 2) {
    result += map2[bits >> 10 & 63];
    result += map2[bits >> 4 & 63];
    result += map2[bits << 2 & 63];
    result += map2[64];
  } else if (tail === 1) {
    result += map2[bits >> 2 & 63];
    result += map2[bits << 4 & 63];
    result += map2[64];
    result += map2[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new Type$3("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var Type$2 = type;
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]") return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }
    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new Type$2("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var Type$1 = type;
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null) return true;
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]") return false;
    keys = Object.keys(pair);
    if (keys.length !== 1) return false;
    result[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null) return [];
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }
  return result;
}
var pairs = new Type$1("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var Type = type;
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null) return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new Type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var common$1 = common$5;
var YAMLException$1 = exception;
var makeSnippet = snippet;
var DEFAULT_SCHEMA$1 = _default;
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "" : c === 95 ? " " : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode(
    (c - 65536 >> 10) + 55296,
    (c - 65536 & 1023) + 56320
  );
}
function setProperty(object, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value
    });
  } else {
    object[key] = value;
  }
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || DEFAULT_SCHEMA$1;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = makeSnippet(mark);
  return new YAMLException$1(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major2, minor2;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major2 = parseInt(match[1], 10);
    minor2 = parseInt(match[2], 10);
    if (major2 !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor2 < 2;
    if (minor2 !== 1 && minor2 !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common$1.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      setProperty(destination, key, source[key]);
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    setProperty(_result, keyNode, valueNode);
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common$1.repeat("\n", count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common$1.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common$1.repeat("\n", emptyLines);
      }
    } else {
      state.result += common$1.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33) return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38) return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = /* @__PURE__ */ Object.create(null);
  state.anchorMap = /* @__PURE__ */ Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch)) break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0) readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll(input, iterator, options) {
  if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
    options = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return void 0;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new YAMLException$1("expected a single document in the stream, but found more");
}
loader$1.loadAll = loadAll;
loader$1.load = load;
var dumper$1 = {};
var common = common$5;
var YAMLException = exception;
var DEFAULT_SCHEMA = _default;
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema2, map2) {
  var result, keys, index, length, tag, style, type2;
  if (map2 === null) return {};
  result = {};
  keys = Object.keys(map2);
  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map2[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type2 = schema2.compiledTypeMap["fallback"][tag];
    if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
      style = type2.styleAliases[style];
    }
    result[tag] = style;
  }
  return result;
}
function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1, QUOTING_TYPE_DOUBLE = 2;
function State(options) {
  this.schema = options["schema"] || DEFAULT_SCHEMA;
  this.indent = Math.max(1, options["indent"] || 2);
  this.noArrayIndent = options["noArrayIndent"] || false;
  this.skipInvalid = options["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
  this.sortKeys = options["sortKeys"] || false;
  this.lineWidth = options["lineWidth"] || 80;
  this.noRefs = options["noRefs"] || false;
  this.noCompatMode = options["noCompatMode"] || false;
  this.condenseFlow = options["condenseFlow"] || false;
  this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options["forceQuotes"] || false;
  this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
  while (position < length) {
    next = string.indexOf("\n", position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n") result += ind;
    result += line;
  }
  return result;
}
function generateNextLine(state, level) {
  return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type2;
  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type2 = state.implicitTypes[index];
    if (type2.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    (inblock ? (
      // c = flow-in
      cIsNsCharOrWhitespace
    ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
  );
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}
var STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
          i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = function() {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string2) {
      return testImplicitResolving(state, string2);
    }
    switch (chooseScalarStyle(
      string,
      singleLineOnly,
      state.indent,
      lineWidth,
      testAmbiguity,
      state.quotingType,
      state.forceQuotes && !iskey,
      inblock
    )) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new YAMLException("impossible error: invalid scalar style");
    }
  }();
}
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
  var clip = string[string.length - 1] === "\n";
  var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + "\n";
}
function dropEndingNewline(string) {
  return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result = function() {
    var nextLF = string.indexOf("\n");
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }();
  var prevMoreIndented = string[0] === "\n" || string[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ") return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += "\n" + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result += "\n";
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }
  return result.slice(1);
}
function escapeString(string) {
  var result = "";
  var char = 0;
  var escapeSeq;
  for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 65536) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }
  return result;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "") pairBuffer += ", ";
    if (state.condenseFlow) pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024) pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new YAMLException("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type2, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length; index < length; index += 1) {
    type2 = typeList[index];
    if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
      if (explicit) {
        if (type2.multi && type2.representName) {
          state.tag = type2.representName(object);
        } else {
          state.tag = type2.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type2.represent) {
        style = state.styleMap[type2.tag] || type2.defaultStyle;
        if (_toString.call(type2.represent) === "[object Function]") {
          _result = type2.represent(object, style);
        } else if (_hasOwnProperty.call(type2.represent, style)) {
          _result = type2.represent[style](object, style);
        } else {
          throw new YAMLException("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type2 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type2 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type2 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new YAMLException("unacceptable kind of an object to dump " + type2);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(
        state.tag[0] === "!" ? state.tag.slice(1) : state.tag
      ).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}
function dump(input, options) {
  options = options || {};
  var state = new State(options);
  if (!state.noRefs) getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
  return "";
}
dumper$1.dump = dump;
var loader = loader$1;
var dumper = dumper$1;
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
  };
}
jsYaml.Type = type;
jsYaml.Schema = schema;
jsYaml.FAILSAFE_SCHEMA = failsafe;
jsYaml.JSON_SCHEMA = json;
jsYaml.CORE_SCHEMA = core;
jsYaml.DEFAULT_SCHEMA = _default;
jsYaml.load = loader.load;
jsYaml.loadAll = loader.loadAll;
jsYaml.dump = dumper.dump;
jsYaml.YAMLException = exception;
jsYaml.types = {
  binary,
  float,
  map,
  null: _null,
  pairs,
  set,
  timestamp,
  bool,
  int,
  merge,
  omap,
  seq,
  str
};
jsYaml.safeLoad = renamed("safeLoad", "load");
jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
jsYaml.safeDump = renamed("safeDump", "dump");
var main = {};
Object.defineProperty(main, "__esModule", { value: true });
main.Lazy = void 0;
class Lazy {
  constructor(creator) {
    this._value = null;
    this.creator = creator;
  }
  get hasValue() {
    return this.creator == null;
  }
  get value() {
    if (this.creator == null) {
      return this._value;
    }
    const result = this.creator();
    this.value = result;
    return result;
  }
  set value(value) {
    this._value = value;
    this.creator = null;
  }
}
main.Lazy = Lazy;
var re$2 = { exports: {} };
const SEMVER_SPEC_VERSION = "2.0.0";
const MAX_LENGTH$1 = 256;
const MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
9007199254740991;
const MAX_SAFE_COMPONENT_LENGTH = 16;
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$1 - 6;
const RELEASE_TYPES = [
  "major",
  "premajor",
  "minor",
  "preminor",
  "patch",
  "prepatch",
  "prerelease"
];
var constants$1 = {
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
  RELEASE_TYPES,
  SEMVER_SPEC_VERSION,
  FLAG_INCLUDE_PRERELEASE: 1,
  FLAG_LOOSE: 2
};
const debug$1 = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
};
var debug_1 = debug$1;
(function(module2, exports$1) {
  const {
    MAX_SAFE_COMPONENT_LENGTH: MAX_SAFE_COMPONENT_LENGTH2,
    MAX_SAFE_BUILD_LENGTH: MAX_SAFE_BUILD_LENGTH2,
    MAX_LENGTH: MAX_LENGTH2
  } = constants$1;
  const debug2 = debug_1;
  exports$1 = module2.exports = {};
  const re2 = exports$1.re = [];
  const safeRe = exports$1.safeRe = [];
  const src2 = exports$1.src = [];
  const safeSrc = exports$1.safeSrc = [];
  const t2 = exports$1.t = {};
  let R = 0;
  const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
  const safeRegexReplacements = [
    ["\\s", 1],
    ["\\d", MAX_LENGTH2],
    [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH2]
  ];
  const makeSafeRegex = (value) => {
    for (const [token, max] of safeRegexReplacements) {
      value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
    }
    return value;
  };
  const createToken = (name, value, isGlobal) => {
    const safe = makeSafeRegex(value);
    const index = R++;
    debug2(name, index, value);
    t2[name] = index;
    src2[index] = value;
    safeSrc[index] = safe;
    re2[index] = new RegExp(value, isGlobal ? "g" : void 0);
    safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
  };
  createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
  createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
  createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
  createToken("MAINVERSION", `(${src2[t2.NUMERICIDENTIFIER]})\\.(${src2[t2.NUMERICIDENTIFIER]})\\.(${src2[t2.NUMERICIDENTIFIER]})`);
  createToken("MAINVERSIONLOOSE", `(${src2[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src2[t2.NUMERICIDENTIFIERLOOSE]})\\.(${src2[t2.NUMERICIDENTIFIERLOOSE]})`);
  createToken("PRERELEASEIDENTIFIER", `(?:${src2[t2.NONNUMERICIDENTIFIER]}|${src2[t2.NUMERICIDENTIFIER]})`);
  createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src2[t2.NONNUMERICIDENTIFIER]}|${src2[t2.NUMERICIDENTIFIERLOOSE]})`);
  createToken("PRERELEASE", `(?:-(${src2[t2.PRERELEASEIDENTIFIER]}(?:\\.${src2[t2.PRERELEASEIDENTIFIER]})*))`);
  createToken("PRERELEASELOOSE", `(?:-?(${src2[t2.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src2[t2.PRERELEASEIDENTIFIERLOOSE]})*))`);
  createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
  createToken("BUILD", `(?:\\+(${src2[t2.BUILDIDENTIFIER]}(?:\\.${src2[t2.BUILDIDENTIFIER]})*))`);
  createToken("FULLPLAIN", `v?${src2[t2.MAINVERSION]}${src2[t2.PRERELEASE]}?${src2[t2.BUILD]}?`);
  createToken("FULL", `^${src2[t2.FULLPLAIN]}$`);
  createToken("LOOSEPLAIN", `[v=\\s]*${src2[t2.MAINVERSIONLOOSE]}${src2[t2.PRERELEASELOOSE]}?${src2[t2.BUILD]}?`);
  createToken("LOOSE", `^${src2[t2.LOOSEPLAIN]}$`);
  createToken("GTLT", "((?:<|>)?=?)");
  createToken("XRANGEIDENTIFIERLOOSE", `${src2[t2.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
  createToken("XRANGEIDENTIFIER", `${src2[t2.NUMERICIDENTIFIER]}|x|X|\\*`);
  createToken("XRANGEPLAIN", `[v=\\s]*(${src2[t2.XRANGEIDENTIFIER]})(?:\\.(${src2[t2.XRANGEIDENTIFIER]})(?:\\.(${src2[t2.XRANGEIDENTIFIER]})(?:${src2[t2.PRERELEASE]})?${src2[t2.BUILD]}?)?)?`);
  createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src2[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src2[t2.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src2[t2.XRANGEIDENTIFIERLOOSE]})(?:${src2[t2.PRERELEASELOOSE]})?${src2[t2.BUILD]}?)?)?`);
  createToken("XRANGE", `^${src2[t2.GTLT]}\\s*${src2[t2.XRANGEPLAIN]}$`);
  createToken("XRANGELOOSE", `^${src2[t2.GTLT]}\\s*${src2[t2.XRANGEPLAINLOOSE]}$`);
  createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH2}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH2}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH2}}))?`);
  createToken("COERCE", `${src2[t2.COERCEPLAIN]}(?:$|[^\\d])`);
  createToken("COERCEFULL", src2[t2.COERCEPLAIN] + `(?:${src2[t2.PRERELEASE]})?(?:${src2[t2.BUILD]})?(?:$|[^\\d])`);
  createToken("COERCERTL", src2[t2.COERCE], true);
  createToken("COERCERTLFULL", src2[t2.COERCEFULL], true);
  createToken("LONETILDE", "(?:~>?)");
  createToken("TILDETRIM", `(\\s*)${src2[t2.LONETILDE]}\\s+`, true);
  exports$1.tildeTrimReplace = "$1~";
  createToken("TILDE", `^${src2[t2.LONETILDE]}${src2[t2.XRANGEPLAIN]}$`);
  createToken("TILDELOOSE", `^${src2[t2.LONETILDE]}${src2[t2.XRANGEPLAINLOOSE]}$`);
  createToken("LONECARET", "(?:\\^)");
  createToken("CARETTRIM", `(\\s*)${src2[t2.LONECARET]}\\s+`, true);
  exports$1.caretTrimReplace = "$1^";
  createToken("CARET", `^${src2[t2.LONECARET]}${src2[t2.XRANGEPLAIN]}$`);
  createToken("CARETLOOSE", `^${src2[t2.LONECARET]}${src2[t2.XRANGEPLAINLOOSE]}$`);
  createToken("COMPARATORLOOSE", `^${src2[t2.GTLT]}\\s*(${src2[t2.LOOSEPLAIN]})$|^$`);
  createToken("COMPARATOR", `^${src2[t2.GTLT]}\\s*(${src2[t2.FULLPLAIN]})$|^$`);
  createToken("COMPARATORTRIM", `(\\s*)${src2[t2.GTLT]}\\s*(${src2[t2.LOOSEPLAIN]}|${src2[t2.XRANGEPLAIN]})`, true);
  exports$1.comparatorTrimReplace = "$1$2$3";
  createToken("HYPHENRANGE", `^\\s*(${src2[t2.XRANGEPLAIN]})\\s+-\\s+(${src2[t2.XRANGEPLAIN]})\\s*$`);
  createToken("HYPHENRANGELOOSE", `^\\s*(${src2[t2.XRANGEPLAINLOOSE]})\\s+-\\s+(${src2[t2.XRANGEPLAINLOOSE]})\\s*$`);
  createToken("STAR", "(<|>)?=?\\s*\\*");
  createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
  createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
})(re$2, re$2.exports);
var reExports = re$2.exports;
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({});
const parseOptions$1 = (options) => {
  if (!options) {
    return emptyOpts;
  }
  if (typeof options !== "object") {
    return looseOption;
  }
  return options;
};
var parseOptions_1 = parseOptions$1;
const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  if (typeof a === "number" && typeof b === "number") {
    return a === b ? 0 : a < b ? -1 : 1;
  }
  const anum = numeric.test(a);
  const bnum = numeric.test(b);
  if (anum && bnum) {
    a = +a;
    b = +b;
  }
  return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
};
const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);
var identifiers$1 = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers
};
const debug = debug_1;
const { MAX_LENGTH, MAX_SAFE_INTEGER } = constants$1;
const { safeRe: re$1, t: t$1 } = reExports;
const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers$1;
let SemVer$d = class SemVer {
  constructor(version, options) {
    options = parseOptions(options);
    if (version instanceof SemVer) {
      if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
        return version;
      } else {
        version = version.version;
      }
    } else if (typeof version !== "string") {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
    }
    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      );
    }
    debug("SemVer", version, options);
    this.options = options;
    this.loose = !!options.loose;
    this.includePrerelease = !!options.includePrerelease;
    const m = version.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);
    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`);
    }
    this.raw = version;
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];
    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError("Invalid major version");
    }
    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError("Invalid minor version");
    }
    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError("Invalid patch version");
    }
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split(".").map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num;
          }
        }
        return id;
      });
    }
    this.build = m[5] ? m[5].split(".") : [];
    this.format();
  }
  format() {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join(".")}`;
    }
    return this.version;
  }
  toString() {
    return this.version;
  }
  compare(other) {
    debug("SemVer.compare", this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === "string" && other === this.version) {
        return 0;
      }
      other = new SemVer(other, this.options);
    }
    if (other.version === this.version) {
      return 0;
    }
    return this.compareMain(other) || this.comparePre(other);
  }
  compareMain(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    if (this.major < other.major) {
      return -1;
    }
    if (this.major > other.major) {
      return 1;
    }
    if (this.minor < other.minor) {
      return -1;
    }
    if (this.minor > other.minor) {
      return 1;
    }
    if (this.patch < other.patch) {
      return -1;
    }
    if (this.patch > other.patch) {
      return 1;
    }
    return 0;
  }
  comparePre(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    if (this.prerelease.length && !other.prerelease.length) {
      return -1;
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1;
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0;
    }
    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug("prerelease compare", i, a, b);
      if (a === void 0 && b === void 0) {
        return 0;
      } else if (b === void 0) {
        return 1;
      } else if (a === void 0) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  compareBuild(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug("build compare", i, a, b);
      if (a === void 0 && b === void 0) {
        return 0;
      } else if (b === void 0) {
        return 1;
      } else if (a === void 0) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(release, identifier, identifierBase) {
    if (release.startsWith("pre")) {
      if (!identifier && identifierBase === false) {
        throw new Error("invalid increment argument: identifier is empty");
      }
      if (identifier) {
        const match = `-${identifier}`.match(this.options.loose ? re$1[t$1.PRERELEASELOOSE] : re$1[t$1.PRERELEASE]);
        if (!match || match[1] !== identifier) {
          throw new Error(`invalid identifier: ${identifier}`);
        }
      }
    }
    switch (release) {
      case "premajor":
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc("pre", identifier, identifierBase);
        break;
      case "preminor":
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc("pre", identifier, identifierBase);
        break;
      case "prepatch":
        this.prerelease.length = 0;
        this.inc("patch", identifier, identifierBase);
        this.inc("pre", identifier, identifierBase);
        break;
      case "prerelease":
        if (this.prerelease.length === 0) {
          this.inc("patch", identifier, identifierBase);
        }
        this.inc("pre", identifier, identifierBase);
        break;
      case "release":
        if (this.prerelease.length === 0) {
          throw new Error(`version ${this.raw} is not a prerelease`);
        }
        this.prerelease.length = 0;
        break;
      case "major":
        if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break;
      case "minor":
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break;
      case "patch":
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break;
      case "pre": {
        const base = Number(identifierBase) ? 1 : 0;
        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === "number") {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            if (identifier === this.prerelease.join(".") && identifierBase === false) {
              throw new Error("invalid increment argument: identifier already exists");
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          let prerelease2 = [identifier, base];
          if (identifierBase === false) {
            prerelease2 = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease2;
            }
          } else {
            this.prerelease = prerelease2;
          }
        }
        break;
      }
      default:
        throw new Error(`invalid increment argument: ${release}`);
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join(".")}`;
    }
    return this;
  }
};
var semver$2 = SemVer$d;
const SemVer$c = semver$2;
const parse$6 = (version, options, throwErrors = false) => {
  if (version instanceof SemVer$c) {
    return version;
  }
  try {
    return new SemVer$c(version, options);
  } catch (er) {
    if (!throwErrors) {
      return null;
    }
    throw er;
  }
};
var parse_1 = parse$6;
const parse$5 = parse_1;
const valid$2 = (version, options) => {
  const v = parse$5(version, options);
  return v ? v.version : null;
};
var valid_1 = valid$2;
const parse$4 = parse_1;
const clean$1 = (version, options) => {
  const s = parse$4(version.trim().replace(/^[=v]+/, ""), options);
  return s ? s.version : null;
};
var clean_1 = clean$1;
const SemVer$b = semver$2;
const inc$1 = (version, release, options, identifier, identifierBase) => {
  if (typeof options === "string") {
    identifierBase = identifier;
    identifier = options;
    options = void 0;
  }
  try {
    return new SemVer$b(
      version instanceof SemVer$b ? version.version : version,
      options
    ).inc(release, identifier, identifierBase).version;
  } catch (er) {
    return null;
  }
};
var inc_1 = inc$1;
const parse$3 = parse_1;
const diff$1 = (version1, version2) => {
  const v1 = parse$3(version1, null, true);
  const v2 = parse$3(version2, null, true);
  const comparison = v1.compare(v2);
  if (comparison === 0) {
    return null;
  }
  const v1Higher = comparison > 0;
  const highVersion = v1Higher ? v1 : v2;
  const lowVersion = v1Higher ? v2 : v1;
  const highHasPre = !!highVersion.prerelease.length;
  const lowHasPre = !!lowVersion.prerelease.length;
  if (lowHasPre && !highHasPre) {
    if (!lowVersion.patch && !lowVersion.minor) {
      return "major";
    }
    if (lowVersion.compareMain(highVersion) === 0) {
      if (lowVersion.minor && !lowVersion.patch) {
        return "minor";
      }
      return "patch";
    }
  }
  const prefix = highHasPre ? "pre" : "";
  if (v1.major !== v2.major) {
    return prefix + "major";
  }
  if (v1.minor !== v2.minor) {
    return prefix + "minor";
  }
  if (v1.patch !== v2.patch) {
    return prefix + "patch";
  }
  return "prerelease";
};
var diff_1 = diff$1;
const SemVer$a = semver$2;
const major$1 = (a, loose) => new SemVer$a(a, loose).major;
var major_1 = major$1;
const SemVer$9 = semver$2;
const minor$1 = (a, loose) => new SemVer$9(a, loose).minor;
var minor_1 = minor$1;
const SemVer$8 = semver$2;
const patch$1 = (a, loose) => new SemVer$8(a, loose).patch;
var patch_1 = patch$1;
const parse$2 = parse_1;
const prerelease$1 = (version, options) => {
  const parsed = parse$2(version, options);
  return parsed && parsed.prerelease.length ? parsed.prerelease : null;
};
var prerelease_1 = prerelease$1;
const SemVer$7 = semver$2;
const compare$b = (a, b, loose) => new SemVer$7(a, loose).compare(new SemVer$7(b, loose));
var compare_1 = compare$b;
const compare$a = compare_1;
const rcompare$1 = (a, b, loose) => compare$a(b, a, loose);
var rcompare_1 = rcompare$1;
const compare$9 = compare_1;
const compareLoose$1 = (a, b) => compare$9(a, b, true);
var compareLoose_1 = compareLoose$1;
const SemVer$6 = semver$2;
const compareBuild$3 = (a, b, loose) => {
  const versionA = new SemVer$6(a, loose);
  const versionB = new SemVer$6(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB);
};
var compareBuild_1 = compareBuild$3;
const compareBuild$2 = compareBuild_1;
const sort$1 = (list, loose) => list.sort((a, b) => compareBuild$2(a, b, loose));
var sort_1 = sort$1;
const compareBuild$1 = compareBuild_1;
const rsort$1 = (list, loose) => list.sort((a, b) => compareBuild$1(b, a, loose));
var rsort_1 = rsort$1;
const compare$8 = compare_1;
const gt$4 = (a, b, loose) => compare$8(a, b, loose) > 0;
var gt_1 = gt$4;
const compare$7 = compare_1;
const lt$3 = (a, b, loose) => compare$7(a, b, loose) < 0;
var lt_1 = lt$3;
const compare$6 = compare_1;
const eq$2 = (a, b, loose) => compare$6(a, b, loose) === 0;
var eq_1 = eq$2;
const compare$5 = compare_1;
const neq$2 = (a, b, loose) => compare$5(a, b, loose) !== 0;
var neq_1 = neq$2;
const compare$4 = compare_1;
const gte$3 = (a, b, loose) => compare$4(a, b, loose) >= 0;
var gte_1 = gte$3;
const compare$3 = compare_1;
const lte$3 = (a, b, loose) => compare$3(a, b, loose) <= 0;
var lte_1 = lte$3;
const eq$1 = eq_1;
const neq$1 = neq_1;
const gt$3 = gt_1;
const gte$2 = gte_1;
const lt$2 = lt_1;
const lte$2 = lte_1;
const cmp$1 = (a, op, b, loose) => {
  switch (op) {
    case "===":
      if (typeof a === "object") {
        a = a.version;
      }
      if (typeof b === "object") {
        b = b.version;
      }
      return a === b;
    case "!==":
      if (typeof a === "object") {
        a = a.version;
      }
      if (typeof b === "object") {
        b = b.version;
      }
      return a !== b;
    case "":
    case "=":
    case "==":
      return eq$1(a, b, loose);
    case "!=":
      return neq$1(a, b, loose);
    case ">":
      return gt$3(a, b, loose);
    case ">=":
      return gte$2(a, b, loose);
    case "<":
      return lt$2(a, b, loose);
    case "<=":
      return lte$2(a, b, loose);
    default:
      throw new TypeError(`Invalid operator: ${op}`);
  }
};
var cmp_1 = cmp$1;
const SemVer$5 = semver$2;
const parse$1 = parse_1;
const { safeRe: re, t } = reExports;
const coerce$1 = (version, options) => {
  if (version instanceof SemVer$5) {
    return version;
  }
  if (typeof version === "number") {
    version = String(version);
  }
  if (typeof version !== "string") {
    return null;
  }
  options = options || {};
  let match = null;
  if (!options.rtl) {
    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
  } else {
    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
    let next;
    while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
      if (!match || next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
    }
    coerceRtlRegex.lastIndex = -1;
  }
  if (match === null) {
    return null;
  }
  const major2 = match[2];
  const minor2 = match[3] || "0";
  const patch2 = match[4] || "0";
  const prerelease2 = options.includePrerelease && match[5] ? `-${match[5]}` : "";
  const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
  return parse$1(`${major2}.${minor2}.${patch2}${prerelease2}${build}`, options);
};
var coerce_1 = coerce$1;
class LRUCache {
  constructor() {
    this.max = 1e3;
    this.map = /* @__PURE__ */ new Map();
  }
  get(key) {
    const value = this.map.get(key);
    if (value === void 0) {
      return void 0;
    } else {
      this.map.delete(key);
      this.map.set(key, value);
      return value;
    }
  }
  delete(key) {
    return this.map.delete(key);
  }
  set(key, value) {
    const deleted = this.delete(key);
    if (!deleted && value !== void 0) {
      if (this.map.size >= this.max) {
        const firstKey = this.map.keys().next().value;
        this.delete(firstKey);
      }
      this.map.set(key, value);
    }
    return this;
  }
}
var lrucache = LRUCache;
var range;
var hasRequiredRange;
function requireRange() {
  if (hasRequiredRange) return range;
  hasRequiredRange = 1;
  const SPACE_CHARACTERS = /\s+/g;
  class Range2 {
    constructor(range2, options) {
      options = parseOptions2(options);
      if (range2 instanceof Range2) {
        if (range2.loose === !!options.loose && range2.includePrerelease === !!options.includePrerelease) {
          return range2;
        } else {
          return new Range2(range2.raw, options);
        }
      }
      if (range2 instanceof Comparator2) {
        this.raw = range2.value;
        this.set = [[range2]];
        this.formatted = void 0;
        return this;
      }
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;
      this.raw = range2.trim().replace(SPACE_CHARACTERS, " ");
      this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
      if (!this.set.length) {
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      }
      if (this.set.length > 1) {
        const first = this.set[0];
        this.set = this.set.filter((c) => !isNullSet(c[0]));
        if (this.set.length === 0) {
          this.set = [first];
        } else if (this.set.length > 1) {
          for (const c of this.set) {
            if (c.length === 1 && isAny(c[0])) {
              this.set = [c];
              break;
            }
          }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let i = 0; i < this.set.length; i++) {
          if (i > 0) {
            this.formatted += "||";
          }
          const comps = this.set[i];
          for (let k = 0; k < comps.length; k++) {
            if (k > 0) {
              this.formatted += " ";
            }
            this.formatted += comps[k].toString().trim();
          }
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(range2) {
      const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
      const memoKey = memoOpts + ":" + range2;
      const cached = cache.get(memoKey);
      if (cached) {
        return cached;
      }
      const loose = this.options.loose;
      const hr = loose ? re2[t2.HYPHENRANGELOOSE] : re2[t2.HYPHENRANGE];
      range2 = range2.replace(hr, hyphenReplace(this.options.includePrerelease));
      debug2("hyphen replace", range2);
      range2 = range2.replace(re2[t2.COMPARATORTRIM], comparatorTrimReplace);
      debug2("comparator trim", range2);
      range2 = range2.replace(re2[t2.TILDETRIM], tildeTrimReplace);
      debug2("tilde trim", range2);
      range2 = range2.replace(re2[t2.CARETTRIM], caretTrimReplace);
      debug2("caret trim", range2);
      let rangeList = range2.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
      if (loose) {
        rangeList = rangeList.filter((comp) => {
          debug2("loose invalid filter", comp, this.options);
          return !!comp.match(re2[t2.COMPARATORLOOSE]);
        });
      }
      debug2("range list", rangeList);
      const rangeMap = /* @__PURE__ */ new Map();
      const comparators = rangeList.map((comp) => new Comparator2(comp, this.options));
      for (const comp of comparators) {
        if (isNullSet(comp)) {
          return [comp];
        }
        rangeMap.set(comp.value, comp);
      }
      if (rangeMap.size > 1 && rangeMap.has("")) {
        rangeMap.delete("");
      }
      const result = [...rangeMap.values()];
      cache.set(memoKey, result);
      return result;
    }
    intersects(range2, options) {
      if (!(range2 instanceof Range2)) {
        throw new TypeError("a Range is required");
      }
      return this.set.some((thisComparators) => {
        return isSatisfiable(thisComparators, options) && range2.set.some((rangeComparators) => {
          return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
            return rangeComparators.every((rangeComparator) => {
              return thisComparator.intersects(rangeComparator, options);
            });
          });
        });
      });
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(version) {
      if (!version) {
        return false;
      }
      if (typeof version === "string") {
        try {
          version = new SemVer3(version, this.options);
        } catch (er) {
          return false;
        }
      }
      for (let i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version, this.options)) {
          return true;
        }
      }
      return false;
    }
  }
  range = Range2;
  const LRU = lrucache;
  const cache = new LRU();
  const parseOptions2 = parseOptions_1;
  const Comparator2 = requireComparator();
  const debug2 = debug_1;
  const SemVer3 = semver$2;
  const {
    safeRe: re2,
    t: t2,
    comparatorTrimReplace,
    tildeTrimReplace,
    caretTrimReplace
  } = reExports;
  const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = constants$1;
  const isNullSet = (c) => c.value === "<0.0.0-0";
  const isAny = (c) => c.value === "";
  const isSatisfiable = (comparators, options) => {
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while (result && remainingComparators.length) {
      result = remainingComparators.every((otherComparator) => {
        return testComparator.intersects(otherComparator, options);
      });
      testComparator = remainingComparators.pop();
    }
    return result;
  };
  const parseComparator = (comp, options) => {
    comp = comp.replace(re2[t2.BUILD], "");
    debug2("comp", comp, options);
    comp = replaceCarets(comp, options);
    debug2("caret", comp);
    comp = replaceTildes(comp, options);
    debug2("tildes", comp);
    comp = replaceXRanges(comp, options);
    debug2("xrange", comp);
    comp = replaceStars(comp, options);
    debug2("stars", comp);
    return comp;
  };
  const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
  const replaceTildes = (comp, options) => {
    return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
  };
  const replaceTilde = (comp, options) => {
    const r = options.loose ? re2[t2.TILDELOOSE] : re2[t2.TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
      debug2("tilde", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
      } else if (pr) {
        debug2("replaceTilde pr", pr);
        ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
      } else {
        ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
      }
      debug2("tilde return", ret);
      return ret;
    });
  };
  const replaceCarets = (comp, options) => {
    return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
  };
  const replaceCaret = (comp, options) => {
    debug2("caret", comp, options);
    const r = options.loose ? re2[t2.CARETLOOSE] : re2[t2.CARET];
    const z = options.includePrerelease ? "-0" : "";
    return comp.replace(r, (_, M, m, p, pr) => {
      debug2("caret", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        if (M === "0") {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
        }
      } else if (pr) {
        debug2("replaceCaret pr", pr);
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
        }
      } else {
        debug2("no pr");
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
        }
      }
      debug2("caret return", ret);
      return ret;
    });
  };
  const replaceXRanges = (comp, options) => {
    debug2("replaceXRanges", comp, options);
    return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
  };
  const replaceXRange = (comp, options) => {
    comp = comp.trim();
    const r = options.loose ? re2[t2.XRANGELOOSE] : re2[t2.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
      debug2("xRange", comp, ret, gtlt, M, m, p, pr);
      const xM = isX(M);
      const xm = xM || isX(m);
      const xp = xm || isX(p);
      const anyX = xp;
      if (gtlt === "=" && anyX) {
        gtlt = "";
      }
      pr = options.includePrerelease ? "-0" : "";
      if (xM) {
        if (gtlt === ">" || gtlt === "<") {
          ret = "<0.0.0-0";
        } else {
          ret = "*";
        }
      } else if (gtlt && anyX) {
        if (xm) {
          m = 0;
        }
        p = 0;
        if (gtlt === ">") {
          gtlt = ">=";
          if (xm) {
            M = +M + 1;
            m = 0;
            p = 0;
          } else {
            m = +m + 1;
            p = 0;
          }
        } else if (gtlt === "<=") {
          gtlt = "<";
          if (xm) {
            M = +M + 1;
          } else {
            m = +m + 1;
          }
        }
        if (gtlt === "<") {
          pr = "-0";
        }
        ret = `${gtlt + M}.${m}.${p}${pr}`;
      } else if (xm) {
        ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
      } else if (xp) {
        ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
      }
      debug2("xRange return", ret);
      return ret;
    });
  };
  const replaceStars = (comp, options) => {
    debug2("replaceStars", comp, options);
    return comp.trim().replace(re2[t2.STAR], "");
  };
  const replaceGTE0 = (comp, options) => {
    debug2("replaceGTE0", comp, options);
    return comp.trim().replace(re2[options.includePrerelease ? t2.GTE0PRE : t2.GTE0], "");
  };
  const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
    if (isX(fM)) {
      from = "";
    } else if (isX(fm)) {
      from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
    } else if (isX(fp)) {
      from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
    } else if (fpr) {
      from = `>=${from}`;
    } else {
      from = `>=${from}${incPr ? "-0" : ""}`;
    }
    if (isX(tM)) {
      to = "";
    } else if (isX(tm)) {
      to = `<${+tM + 1}.0.0-0`;
    } else if (isX(tp)) {
      to = `<${tM}.${+tm + 1}.0-0`;
    } else if (tpr) {
      to = `<=${tM}.${tm}.${tp}-${tpr}`;
    } else if (incPr) {
      to = `<${tM}.${tm}.${+tp + 1}-0`;
    } else {
      to = `<=${to}`;
    }
    return `${from} ${to}`.trim();
  };
  const testSet = (set2, version, options) => {
    for (let i = 0; i < set2.length; i++) {
      if (!set2[i].test(version)) {
        return false;
      }
    }
    if (version.prerelease.length && !options.includePrerelease) {
      for (let i = 0; i < set2.length; i++) {
        debug2(set2[i].semver);
        if (set2[i].semver === Comparator2.ANY) {
          continue;
        }
        if (set2[i].semver.prerelease.length > 0) {
          const allowed = set2[i].semver;
          if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  };
  return range;
}
var comparator;
var hasRequiredComparator;
function requireComparator() {
  if (hasRequiredComparator) return comparator;
  hasRequiredComparator = 1;
  const ANY2 = Symbol("SemVer ANY");
  class Comparator2 {
    static get ANY() {
      return ANY2;
    }
    constructor(comp, options) {
      options = parseOptions2(options);
      if (comp instanceof Comparator2) {
        if (comp.loose === !!options.loose) {
          return comp;
        } else {
          comp = comp.value;
        }
      }
      comp = comp.trim().split(/\s+/).join(" ");
      debug2("comparator", comp, options);
      this.options = options;
      this.loose = !!options.loose;
      this.parse(comp);
      if (this.semver === ANY2) {
        this.value = "";
      } else {
        this.value = this.operator + this.semver.version;
      }
      debug2("comp", this);
    }
    parse(comp) {
      const r = this.options.loose ? re2[t2.COMPARATORLOOSE] : re2[t2.COMPARATOR];
      const m = comp.match(r);
      if (!m) {
        throw new TypeError(`Invalid comparator: ${comp}`);
      }
      this.operator = m[1] !== void 0 ? m[1] : "";
      if (this.operator === "=") {
        this.operator = "";
      }
      if (!m[2]) {
        this.semver = ANY2;
      } else {
        this.semver = new SemVer3(m[2], this.options.loose);
      }
    }
    toString() {
      return this.value;
    }
    test(version) {
      debug2("Comparator.test", version, this.options.loose);
      if (this.semver === ANY2 || version === ANY2) {
        return true;
      }
      if (typeof version === "string") {
        try {
          version = new SemVer3(version, this.options);
        } catch (er) {
          return false;
        }
      }
      return cmp2(version, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
      if (!(comp instanceof Comparator2)) {
        throw new TypeError("a Comparator is required");
      }
      if (this.operator === "") {
        if (this.value === "") {
          return true;
        }
        return new Range2(comp.value, options).test(this.value);
      } else if (comp.operator === "") {
        if (comp.value === "") {
          return true;
        }
        return new Range2(this.value, options).test(comp.semver);
      }
      options = parseOptions2(options);
      if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
        return false;
      }
      if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
        return false;
      }
      if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
        return true;
      }
      if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
        return true;
      }
      if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
        return true;
      }
      if (cmp2(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
        return true;
      }
      if (cmp2(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
        return true;
      }
      return false;
    }
  }
  comparator = Comparator2;
  const parseOptions2 = parseOptions_1;
  const { safeRe: re2, t: t2 } = reExports;
  const cmp2 = cmp_1;
  const debug2 = debug_1;
  const SemVer3 = semver$2;
  const Range2 = requireRange();
  return comparator;
}
const Range$9 = requireRange();
const satisfies$4 = (version, range2, options) => {
  try {
    range2 = new Range$9(range2, options);
  } catch (er) {
    return false;
  }
  return range2.test(version);
};
var satisfies_1 = satisfies$4;
const Range$8 = requireRange();
const toComparators$1 = (range2, options) => new Range$8(range2, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
var toComparators_1 = toComparators$1;
const SemVer$4 = semver$2;
const Range$7 = requireRange();
const maxSatisfying$1 = (versions, range2, options) => {
  let max = null;
  let maxSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$7(range2, options);
  } catch (er) {
    return null;
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      if (!max || maxSV.compare(v) === -1) {
        max = v;
        maxSV = new SemVer$4(max, options);
      }
    }
  });
  return max;
};
var maxSatisfying_1 = maxSatisfying$1;
const SemVer$3 = semver$2;
const Range$6 = requireRange();
const minSatisfying$1 = (versions, range2, options) => {
  let min = null;
  let minSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$6(range2, options);
  } catch (er) {
    return null;
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      if (!min || minSV.compare(v) === 1) {
        min = v;
        minSV = new SemVer$3(min, options);
      }
    }
  });
  return min;
};
var minSatisfying_1 = minSatisfying$1;
const SemVer$2 = semver$2;
const Range$5 = requireRange();
const gt$2 = gt_1;
const minVersion$1 = (range2, loose) => {
  range2 = new Range$5(range2, loose);
  let minver = new SemVer$2("0.0.0");
  if (range2.test(minver)) {
    return minver;
  }
  minver = new SemVer$2("0.0.0-0");
  if (range2.test(minver)) {
    return minver;
  }
  minver = null;
  for (let i = 0; i < range2.set.length; ++i) {
    const comparators = range2.set[i];
    let setMin = null;
    comparators.forEach((comparator2) => {
      const compver = new SemVer$2(comparator2.semver.version);
      switch (comparator2.operator) {
        case ">":
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
        case "":
        case ">=":
          if (!setMin || gt$2(compver, setMin)) {
            setMin = compver;
          }
          break;
        case "<":
        case "<=":
          break;
        default:
          throw new Error(`Unexpected operation: ${comparator2.operator}`);
      }
    });
    if (setMin && (!minver || gt$2(minver, setMin))) {
      minver = setMin;
    }
  }
  if (minver && range2.test(minver)) {
    return minver;
  }
  return null;
};
var minVersion_1 = minVersion$1;
const Range$4 = requireRange();
const validRange$1 = (range2, options) => {
  try {
    return new Range$4(range2, options).range || "*";
  } catch (er) {
    return null;
  }
};
var valid$1 = validRange$1;
const SemVer$1 = semver$2;
const Comparator$2 = requireComparator();
const { ANY: ANY$1 } = Comparator$2;
const Range$3 = requireRange();
const satisfies$3 = satisfies_1;
const gt$1 = gt_1;
const lt$1 = lt_1;
const lte$1 = lte_1;
const gte$1 = gte_1;
const outside$3 = (version, range2, hilo, options) => {
  version = new SemVer$1(version, options);
  range2 = new Range$3(range2, options);
  let gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case ">":
      gtfn = gt$1;
      ltefn = lte$1;
      ltfn = lt$1;
      comp = ">";
      ecomp = ">=";
      break;
    case "<":
      gtfn = lt$1;
      ltefn = gte$1;
      ltfn = gt$1;
      comp = "<";
      ecomp = "<=";
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }
  if (satisfies$3(version, range2, options)) {
    return false;
  }
  for (let i = 0; i < range2.set.length; ++i) {
    const comparators = range2.set[i];
    let high = null;
    let low = null;
    comparators.forEach((comparator2) => {
      if (comparator2.semver === ANY$1) {
        comparator2 = new Comparator$2(">=0.0.0");
      }
      high = high || comparator2;
      low = low || comparator2;
      if (gtfn(comparator2.semver, high.semver, options)) {
        high = comparator2;
      } else if (ltfn(comparator2.semver, low.semver, options)) {
        low = comparator2;
      }
    });
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }
    if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
};
var outside_1 = outside$3;
const outside$2 = outside_1;
const gtr$1 = (version, range2, options) => outside$2(version, range2, ">", options);
var gtr_1 = gtr$1;
const outside$1 = outside_1;
const ltr$1 = (version, range2, options) => outside$1(version, range2, "<", options);
var ltr_1 = ltr$1;
const Range$2 = requireRange();
const intersects$1 = (r1, r2, options) => {
  r1 = new Range$2(r1, options);
  r2 = new Range$2(r2, options);
  return r1.intersects(r2, options);
};
var intersects_1 = intersects$1;
const satisfies$2 = satisfies_1;
const compare$2 = compare_1;
var simplify = (versions, range2, options) => {
  const set2 = [];
  let first = null;
  let prev = null;
  const v = versions.sort((a, b) => compare$2(a, b, options));
  for (const version of v) {
    const included = satisfies$2(version, range2, options);
    if (included) {
      prev = version;
      if (!first) {
        first = version;
      }
    } else {
      if (prev) {
        set2.push([first, prev]);
      }
      prev = null;
      first = null;
    }
  }
  if (first) {
    set2.push([first, null]);
  }
  const ranges = [];
  for (const [min, max] of set2) {
    if (min === max) {
      ranges.push(min);
    } else if (!max && min === v[0]) {
      ranges.push("*");
    } else if (!max) {
      ranges.push(`>=${min}`);
    } else if (min === v[0]) {
      ranges.push(`<=${max}`);
    } else {
      ranges.push(`${min} - ${max}`);
    }
  }
  const simplified = ranges.join(" || ");
  const original = typeof range2.raw === "string" ? range2.raw : String(range2);
  return simplified.length < original.length ? simplified : range2;
};
const Range$1 = requireRange();
const Comparator$1 = requireComparator();
const { ANY } = Comparator$1;
const satisfies$1 = satisfies_1;
const compare$1 = compare_1;
const subset$1 = (sub, dom, options = {}) => {
  if (sub === dom) {
    return true;
  }
  sub = new Range$1(sub, options);
  dom = new Range$1(dom, options);
  let sawNonNull = false;
  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options);
      sawNonNull = sawNonNull || isSub !== null;
      if (isSub) {
        continue OUTER;
      }
    }
    if (sawNonNull) {
      return false;
    }
  }
  return true;
};
const minimumVersionWithPreRelease = [new Comparator$1(">=0.0.0-0")];
const minimumVersion = [new Comparator$1(">=0.0.0")];
const simpleSubset = (sub, dom, options) => {
  if (sub === dom) {
    return true;
  }
  if (sub.length === 1 && sub[0].semver === ANY) {
    if (dom.length === 1 && dom[0].semver === ANY) {
      return true;
    } else if (options.includePrerelease) {
      sub = minimumVersionWithPreRelease;
    } else {
      sub = minimumVersion;
    }
  }
  if (dom.length === 1 && dom[0].semver === ANY) {
    if (options.includePrerelease) {
      return true;
    } else {
      dom = minimumVersion;
    }
  }
  const eqSet = /* @__PURE__ */ new Set();
  let gt2, lt2;
  for (const c of sub) {
    if (c.operator === ">" || c.operator === ">=") {
      gt2 = higherGT(gt2, c, options);
    } else if (c.operator === "<" || c.operator === "<=") {
      lt2 = lowerLT(lt2, c, options);
    } else {
      eqSet.add(c.semver);
    }
  }
  if (eqSet.size > 1) {
    return null;
  }
  let gtltComp;
  if (gt2 && lt2) {
    gtltComp = compare$1(gt2.semver, lt2.semver, options);
    if (gtltComp > 0) {
      return null;
    } else if (gtltComp === 0 && (gt2.operator !== ">=" || lt2.operator !== "<=")) {
      return null;
    }
  }
  for (const eq2 of eqSet) {
    if (gt2 && !satisfies$1(eq2, String(gt2), options)) {
      return null;
    }
    if (lt2 && !satisfies$1(eq2, String(lt2), options)) {
      return null;
    }
    for (const c of dom) {
      if (!satisfies$1(eq2, String(c), options)) {
        return false;
      }
    }
    return true;
  }
  let higher, lower;
  let hasDomLT, hasDomGT;
  let needDomLTPre = lt2 && !options.includePrerelease && lt2.semver.prerelease.length ? lt2.semver : false;
  let needDomGTPre = gt2 && !options.includePrerelease && gt2.semver.prerelease.length ? gt2.semver : false;
  if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt2.operator === "<" && needDomLTPre.prerelease[0] === 0) {
    needDomLTPre = false;
  }
  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
    hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
    if (gt2) {
      if (needDomGTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
          needDomGTPre = false;
        }
      }
      if (c.operator === ">" || c.operator === ">=") {
        higher = higherGT(gt2, c, options);
        if (higher === c && higher !== gt2) {
          return false;
        }
      } else if (gt2.operator === ">=" && !satisfies$1(gt2.semver, String(c), options)) {
        return false;
      }
    }
    if (lt2) {
      if (needDomLTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
          needDomLTPre = false;
        }
      }
      if (c.operator === "<" || c.operator === "<=") {
        lower = lowerLT(lt2, c, options);
        if (lower === c && lower !== lt2) {
          return false;
        }
      } else if (lt2.operator === "<=" && !satisfies$1(lt2.semver, String(c), options)) {
        return false;
      }
    }
    if (!c.operator && (lt2 || gt2) && gtltComp !== 0) {
      return false;
    }
  }
  if (gt2 && hasDomLT && !lt2 && gtltComp !== 0) {
    return false;
  }
  if (lt2 && hasDomGT && !gt2 && gtltComp !== 0) {
    return false;
  }
  if (needDomGTPre || needDomLTPre) {
    return false;
  }
  return true;
};
const higherGT = (a, b, options) => {
  if (!a) {
    return b;
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
};
const lowerLT = (a, b, options) => {
  if (!a) {
    return b;
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
};
var subset_1 = subset$1;
const internalRe = reExports;
const constants = constants$1;
const SemVer2 = semver$2;
const identifiers = identifiers$1;
const parse = parse_1;
const valid = valid_1;
const clean = clean_1;
const inc = inc_1;
const diff = diff_1;
const major = major_1;
const minor = minor_1;
const patch = patch_1;
const prerelease = prerelease_1;
const compare = compare_1;
const rcompare = rcompare_1;
const compareLoose = compareLoose_1;
const compareBuild = compareBuild_1;
const sort = sort_1;
const rsort = rsort_1;
const gt = gt_1;
const lt = lt_1;
const eq = eq_1;
const neq = neq_1;
const gte = gte_1;
const lte = lte_1;
const cmp = cmp_1;
const coerce = coerce_1;
const Comparator = requireComparator();
const Range = requireRange();
const satisfies = satisfies_1;
const toComparators = toComparators_1;
const maxSatisfying = maxSatisfying_1;
const minSatisfying = minSatisfying_1;
const minVersion = minVersion_1;
const validRange = valid$1;
const outside = outside_1;
const gtr = gtr_1;
const ltr = ltr_1;
const intersects = intersects_1;
const simplifyRange = simplify;
const subset = subset_1;
var semver$1 = {
  parse,
  valid,
  clean,
  inc,
  diff,
  major,
  minor,
  patch,
  prerelease,
  compare,
  rcompare,
  compareLoose,
  compareBuild,
  sort,
  rsort,
  gt,
  lt,
  eq,
  neq,
  gte,
  lte,
  cmp,
  coerce,
  Comparator,
  Range,
  satisfies,
  toComparators,
  maxSatisfying,
  minSatisfying,
  minVersion,
  validRange,
  outside,
  gtr,
  ltr,
  intersects,
  simplifyRange,
  subset,
  SemVer: SemVer2,
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: constants.RELEASE_TYPES,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers
};
var DownloadedUpdateHelper$1 = {};
var lodash_isequal = { exports: {} };
lodash_isequal.exports;
(function(module2, exports$1) {
  var LARGE_ARRAY_SIZE = 200;
  var HASH_UNDEFINED = "__lodash_hash_undefined__";
  var COMPARE_PARTIAL_FLAG = 1, COMPARE_UNORDERED_FLAG = 2;
  var MAX_SAFE_INTEGER2 = 9007199254740991;
  var argsTag = "[object Arguments]", arrayTag = "[object Array]", asyncTag = "[object AsyncFunction]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", nullTag = "[object Null]", objectTag = "[object Object]", promiseTag = "[object Promise]", proxyTag = "[object Proxy]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag2 = "[object Symbol]", undefinedTag = "[object Undefined]", weakMapTag = "[object WeakMap]";
  var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
  var reRegExpChar2 = /[\\^$.*+?()[\]{}|]/g;
  var reIsHostCtor = /^\[object .+?Constructor\]$/;
  var reIsUint = /^(?:0|[1-9]\d*)$/;
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
  var freeGlobal2 = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
  var freeSelf2 = typeof self == "object" && self && self.Object === Object && self;
  var root2 = freeGlobal2 || freeSelf2 || Function("return this")();
  var freeExports = exports$1 && !exports$1.nodeType && exports$1;
  var freeModule = freeExports && true && module2 && !module2.nodeType && module2;
  var moduleExports = freeModule && freeModule.exports === freeExports;
  var freeProcess = moduleExports && freeGlobal2.process;
  var nodeUtil = function() {
    try {
      return freeProcess && freeProcess.binding && freeProcess.binding("util");
    } catch (e) {
    }
  }();
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
  function arrayFilter(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }
  function arrayPush(array, values) {
    var index = -1, length = values.length, offset = array.length;
    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }
  function arraySome(array, predicate) {
    var index = -1, length = array == null ? 0 : array.length;
    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }
  function baseTimes(n, iteratee) {
    var index = -1, result = Array(n);
    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }
  function cacheHas(cache, key) {
    return cache.has(key);
  }
  function getValue(object, key) {
    return object == null ? void 0 : object[key];
  }
  function mapToArray(map2) {
    var index = -1, result = Array(map2.size);
    map2.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }
  function setToArray(set2) {
    var index = -1, result = Array(set2.size);
    set2.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }
  var arrayProto = Array.prototype, funcProto = Function.prototype, objectProto2 = Object.prototype;
  var coreJsData = root2["__core-js_shared__"];
  var funcToString = funcProto.toString;
  var hasOwnProperty = objectProto2.hasOwnProperty;
  var maskSrcKey = function() {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
    return uid ? "Symbol(src)_1." + uid : "";
  }();
  var nativeObjectToString = objectProto2.toString;
  var reIsNative = RegExp(
    "^" + funcToString.call(hasOwnProperty).replace(reRegExpChar2, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  var Buffer2 = moduleExports ? root2.Buffer : void 0, Symbol2 = root2.Symbol, Uint8Array2 = root2.Uint8Array, propertyIsEnumerable = objectProto2.propertyIsEnumerable, splice = arrayProto.splice, symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
  var nativeGetSymbols = Object.getOwnPropertySymbols, nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0, nativeKeys = overArg(Object.keys, Object);
  var DataView = getNative(root2, "DataView"), Map2 = getNative(root2, "Map"), Promise2 = getNative(root2, "Promise"), Set2 = getNative(root2, "Set"), WeakMap = getNative(root2, "WeakMap"), nativeCreate = getNative(Object, "create");
  var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap);
  var symbolProto2 = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto2 ? symbolProto2.valueOf : void 0;
  function Hash(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? void 0 : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : void 0;
  }
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
  }
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
    return this;
  }
  Hash.prototype.clear = hashClear;
  Hash.prototype["delete"] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;
  function ListCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }
  function listCacheDelete(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }
  function listCacheGet(key) {
    var data = this.__data__, index = assocIndexOf(data, key);
    return index < 0 ? void 0 : data[index][1];
  }
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }
  function listCacheSet(key, value) {
    var data = this.__data__, index = assocIndexOf(data, key);
    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype["delete"] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;
  function MapCache(entries) {
    var index = -1, length = entries == null ? 0 : entries.length;
    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      "hash": new Hash(),
      "map": new (Map2 || ListCache)(),
      "string": new Hash()
    };
  }
  function mapCacheDelete(key) {
    var result = getMapData(this, key)["delete"](key);
    this.size -= result ? 1 : 0;
    return result;
  }
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }
  function mapCacheSet(key, value) {
    var data = getMapData(this, key), size = data.size;
    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype["delete"] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;
  function SetCache(values) {
    var index = -1, length = values == null ? 0 : values.length;
    this.__data__ = new MapCache();
    while (++index < length) {
      this.add(values[index]);
    }
  }
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }
  function setCacheHas(value) {
    return this.__data__.has(value);
  }
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }
  function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
  }
  function stackDelete(key) {
    var data = this.__data__, result = data["delete"](key);
    this.size = data.size;
    return result;
  }
  function stackGet(key) {
    return this.__data__.get(key);
  }
  function stackHas(key) {
    return this.__data__.has(key);
  }
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs2 = data.__data__;
      if (!Map2 || pairs2.length < LARGE_ARRAY_SIZE - 1) {
        pairs2.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs2);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }
  Stack.prototype.clear = stackClear;
  Stack.prototype["delete"] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value), isArg = !isArr && isArguments(value), isBuff = !isArr && !isArg && isBuffer(value), isType = !isArr && !isArg && !isBuff && isTypedArray(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
    for (var key in value) {
      if (hasOwnProperty.call(value, key) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
      (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
      isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq2(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }
  function baseGetTag(value) {
    if (value == null) {
      return value === void 0 ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString2(value);
  }
  function baseIsArguments(value) {
    return isObjectLike2(value) && baseGetTag(value) == argsTag;
  }
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObjectLike2(value) && !isObjectLike2(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray(object), othIsArr = isArray(other), objTag = objIsArr ? arrayTag : getTag(object), othTag = othIsArr ? arrayTag : getTag(other);
    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;
    var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
        stack || (stack = new Stack());
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }
  function baseIsNative(value) {
    if (!isObject2(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }
  function baseIsTypedArray(value) {
    return isObjectLike2(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
  }
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != "constructor") {
        result.push(key);
      }
    }
    return result;
  }
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG, arrLength = array.length, othLength = other.length;
    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : void 0;
    stack.set(array, other);
    stack.set(other, array);
    while (++index < arrLength) {
      var arrValue = array[index], othValue = other[index];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== void 0) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      if (seen) {
        if (!arraySome(other, function(othValue2, othIndex) {
          if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
            return seen.push(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
        result = false;
        break;
      }
    }
    stack["delete"](array);
    stack["delete"](other);
    return result;
  }
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;
      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array2(object), new Uint8Array2(other))) {
          return false;
        }
        return true;
      case boolTag:
      case dateTag:
      case numberTag:
        return eq2(+object, +other);
      case errorTag:
        return object.name == other.name && object.message == other.message;
      case regexpTag:
      case stringTag:
        return object == other + "";
      case mapTag:
        var convert = mapToArray;
      case setTag:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
        convert || (convert = setToArray);
        if (object.size != other.size && !isPartial) {
          return false;
        }
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG;
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack["delete"](object);
        return result;
      case symbolTag2:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);
    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key], othValue = other[key];
      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == "constructor");
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor, othCtor = other.constructor;
      if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack["delete"](object);
    stack["delete"](other);
    return result;
  }
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }
  function getMapData(map2, key) {
    var data = map2.__data__;
    return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
  }
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : void 0;
  }
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
    try {
      value[symToStringTag] = void 0;
      var unmasked = true;
    } catch (e) {
    }
    var result = nativeObjectToString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable.call(object, symbol);
    });
  };
  var getTag = baseGetTag;
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
    getTag = function(value) {
      var result = baseGetTag(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER2 : length;
    return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
  }
  function isKeyable(value) {
    var type2 = typeof value;
    return type2 == "string" || type2 == "number" || type2 == "symbol" || type2 == "boolean" ? value !== "__proto__" : value === null;
  }
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }
  function isPrototype(value) {
    var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto2;
    return value === proto;
  }
  function objectToString2(value) {
    return nativeObjectToString.call(value);
  }
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {
      }
      try {
        return func + "";
      } catch (e) {
      }
    }
    return "";
  }
  function eq2(value, other) {
    return value === other || value !== value && other !== other;
  }
  var isArguments = baseIsArguments(/* @__PURE__ */ function() {
    return arguments;
  }()) ? baseIsArguments : function(value) {
    return isObjectLike2(value) && hasOwnProperty.call(value, "callee") && !propertyIsEnumerable.call(value, "callee");
  };
  var isArray = Array.isArray;
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }
  var isBuffer = nativeIsBuffer || stubFalse;
  function isEqual2(value, other) {
    return baseIsEqual(value, other);
  }
  function isFunction(value) {
    if (!isObject2(value)) {
      return false;
    }
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }
  function isLength(value) {
    return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER2;
  }
  function isObject2(value) {
    var type2 = typeof value;
    return value != null && (type2 == "object" || type2 == "function");
  }
  function isObjectLike2(value) {
    return value != null && typeof value == "object";
  }
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }
  function stubArray() {
    return [];
  }
  function stubFalse() {
    return false;
  }
  module2.exports = isEqual2;
})(lodash_isequal, lodash_isequal.exports);
var lodash_isequalExports = lodash_isequal.exports;
Object.defineProperty(DownloadedUpdateHelper$1, "__esModule", { value: true });
DownloadedUpdateHelper$1.DownloadedUpdateHelper = void 0;
DownloadedUpdateHelper$1.createTempUpdateFile = createTempUpdateFile;
const crypto_1$2 = require$$0$6;
const fs_1$4 = require$$1$2;
const isEqual = lodash_isequalExports;
const fs_extra_1$6 = lib;
const path$8 = require$$1$3;
class DownloadedUpdateHelper {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    this._file = null;
    this._packageFile = null;
    this.versionInfo = null;
    this.fileInfo = null;
    this._downloadedFileInfo = null;
  }
  get downloadedFileInfo() {
    return this._downloadedFileInfo;
  }
  get file() {
    return this._file;
  }
  get packageFile() {
    return this._packageFile;
  }
  get cacheDirForPendingUpdate() {
    return path$8.join(this.cacheDir, "pending");
  }
  async validateDownloadedPath(updateFile, updateInfo, fileInfo, logger2) {
    if (this.versionInfo != null && this.file === updateFile && this.fileInfo != null) {
      if (isEqual(this.versionInfo, updateInfo) && isEqual(this.fileInfo.info, fileInfo.info) && await (0, fs_extra_1$6.pathExists)(updateFile)) {
        return updateFile;
      } else {
        return null;
      }
    }
    const cachedUpdateFile = await this.getValidCachedUpdateFile(fileInfo, logger2);
    if (cachedUpdateFile === null) {
      return null;
    }
    logger2.info(`Update has already been downloaded to ${updateFile}).`);
    this._file = cachedUpdateFile;
    return cachedUpdateFile;
  }
  async setDownloadedFile(downloadedFile, packageFile, versionInfo, fileInfo, updateFileName, isSaveCache) {
    this._file = downloadedFile;
    this._packageFile = packageFile;
    this.versionInfo = versionInfo;
    this.fileInfo = fileInfo;
    this._downloadedFileInfo = {
      fileName: updateFileName,
      sha512: fileInfo.info.sha512,
      isAdminRightsRequired: fileInfo.info.isAdminRightsRequired === true
    };
    if (isSaveCache) {
      await (0, fs_extra_1$6.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
  }
  async clear() {
    this._file = null;
    this._packageFile = null;
    this.versionInfo = null;
    this.fileInfo = null;
    await this.cleanCacheDirForPendingUpdate();
  }
  async cleanCacheDirForPendingUpdate() {
    try {
      await (0, fs_extra_1$6.emptyDir)(this.cacheDirForPendingUpdate);
    } catch (_ignore) {
    }
  }
  /**
   * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
   * @param fileInfo
   * @param logger
   */
  async getValidCachedUpdateFile(fileInfo, logger2) {
    const updateInfoFilePath = this.getUpdateInfoFile();
    const doesUpdateInfoFileExist = await (0, fs_extra_1$6.pathExists)(updateInfoFilePath);
    if (!doesUpdateInfoFileExist) {
      return null;
    }
    let cachedInfo;
    try {
      cachedInfo = await (0, fs_extra_1$6.readJson)(updateInfoFilePath);
    } catch (error2) {
      let message = `No cached update info available`;
      if (error2.code !== "ENOENT") {
        await this.cleanCacheDirForPendingUpdate();
        message += ` (error on read: ${error2.message})`;
      }
      logger2.info(message);
      return null;
    }
    const isCachedInfoFileNameValid = (cachedInfo === null || cachedInfo === void 0 ? void 0 : cachedInfo.fileName) !== null;
    if (!isCachedInfoFileNameValid) {
      logger2.warn(`Cached update info is corrupted: no fileName, directory for cached update will be cleaned`);
      await this.cleanCacheDirForPendingUpdate();
      return null;
    }
    if (fileInfo.info.sha512 !== cachedInfo.sha512) {
      logger2.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${cachedInfo.sha512}, expected: ${fileInfo.info.sha512}. Directory for cached update will be cleaned`);
      await this.cleanCacheDirForPendingUpdate();
      return null;
    }
    const updateFile = path$8.join(this.cacheDirForPendingUpdate, cachedInfo.fileName);
    if (!await (0, fs_extra_1$6.pathExists)(updateFile)) {
      logger2.info("Cached update file doesn't exist");
      return null;
    }
    const sha512 = await hashFile(updateFile);
    if (fileInfo.info.sha512 !== sha512) {
      logger2.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${sha512}, expected: ${fileInfo.info.sha512}`);
      await this.cleanCacheDirForPendingUpdate();
      return null;
    }
    this._downloadedFileInfo = cachedInfo;
    return updateFile;
  }
  getUpdateInfoFile() {
    return path$8.join(this.cacheDirForPendingUpdate, "update-info.json");
  }
}
DownloadedUpdateHelper$1.DownloadedUpdateHelper = DownloadedUpdateHelper;
function hashFile(file2, algorithm = "sha512", encoding = "base64", options) {
  return new Promise((resolve, reject) => {
    const hash = (0, crypto_1$2.createHash)(algorithm);
    hash.on("error", reject).setEncoding(encoding);
    (0, fs_1$4.createReadStream)(file2, {
      ...options,
      highWaterMark: 1024 * 1024
      /* better to use more memory but hash faster */
    }).on("error", reject).on("end", () => {
      hash.end();
      resolve(hash.read());
    }).pipe(hash, { end: false });
  });
}
async function createTempUpdateFile(name, cacheDir, log) {
  let nameCounter = 0;
  let result = path$8.join(cacheDir, name);
  for (let i = 0; i < 3; i++) {
    try {
      await (0, fs_extra_1$6.unlink)(result);
      return result;
    } catch (e) {
      if (e.code === "ENOENT") {
        return result;
      }
      log.warn(`Error on remove temp update file: ${e}`);
      result = path$8.join(cacheDir, `${nameCounter++}-${name}`);
    }
  }
  return result;
}
var ElectronAppAdapter$1 = {};
var AppAdapter = {};
Object.defineProperty(AppAdapter, "__esModule", { value: true });
AppAdapter.getAppCacheDir = getAppCacheDir;
const path$7 = require$$1$3;
const os_1$1 = require$$2;
function getAppCacheDir() {
  const homedir = (0, os_1$1.homedir)();
  let result;
  if (process.platform === "win32") {
    result = process.env["LOCALAPPDATA"] || path$7.join(homedir, "AppData", "Local");
  } else if (process.platform === "darwin") {
    result = path$7.join(homedir, "Library", "Caches");
  } else {
    result = process.env["XDG_CACHE_HOME"] || path$7.join(homedir, ".cache");
  }
  return result;
}
Object.defineProperty(ElectronAppAdapter$1, "__esModule", { value: true });
ElectronAppAdapter$1.ElectronAppAdapter = void 0;
const path$6 = require$$1$3;
const AppAdapter_1 = AppAdapter;
class ElectronAppAdapter {
  constructor(app = require$$1.app) {
    this.app = app;
  }
  whenReady() {
    return this.app.whenReady();
  }
  get version() {
    return this.app.getVersion();
  }
  get name() {
    return this.app.getName();
  }
  get isPackaged() {
    return this.app.isPackaged === true;
  }
  get appUpdateConfigPath() {
    return this.isPackaged ? path$6.join(process.resourcesPath, "app-update.yml") : path$6.join(this.app.getAppPath(), "dev-app-update.yml");
  }
  get userDataPath() {
    return this.app.getPath("userData");
  }
  get baseCachePath() {
    return (0, AppAdapter_1.getAppCacheDir)();
  }
  quit() {
    this.app.quit();
  }
  relaunch() {
    this.app.relaunch();
  }
  onQuit(handler) {
    this.app.once("quit", (_, exitCode) => handler(exitCode));
  }
}
ElectronAppAdapter$1.ElectronAppAdapter = ElectronAppAdapter;
var electronHttpExecutor = {};
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.ElectronHttpExecutor = exports$1.NET_SESSION_NAME = void 0;
  exports$1.getNetSession = getNetSession;
  const builder_util_runtime_12 = out;
  exports$1.NET_SESSION_NAME = "electron-updater";
  function getNetSession() {
    return require$$1.session.fromPartition(exports$1.NET_SESSION_NAME, {
      cache: false
    });
  }
  class ElectronHttpExecutor extends builder_util_runtime_12.HttpExecutor {
    constructor(proxyLoginCallback) {
      super();
      this.proxyLoginCallback = proxyLoginCallback;
      this.cachedSession = null;
    }
    async download(url, destination, options) {
      return await options.cancellationToken.createPromise((resolve, reject, onCancel) => {
        const requestOptions = {
          headers: options.headers || void 0,
          redirect: "manual"
        };
        (0, builder_util_runtime_12.configureRequestUrl)(url, requestOptions);
        (0, builder_util_runtime_12.configureRequestOptions)(requestOptions);
        this.doDownload(requestOptions, {
          destination,
          options,
          onCancel,
          callback: (error2) => {
            if (error2 == null) {
              resolve(destination);
            } else {
              reject(error2);
            }
          },
          responseHandler: null
        }, 0);
      });
    }
    createRequest(options, callback) {
      if (options.headers && options.headers.Host) {
        options.host = options.headers.Host;
        delete options.headers.Host;
      }
      if (this.cachedSession == null) {
        this.cachedSession = getNetSession();
      }
      const request = require$$1.net.request({
        ...options,
        session: this.cachedSession
      });
      request.on("response", callback);
      if (this.proxyLoginCallback != null) {
        request.on("login", this.proxyLoginCallback);
      }
      return request;
    }
    addRedirectHandlers(request, options, reject, redirectCount, handler) {
      request.on("redirect", (statusCode, method, redirectUrl) => {
        request.abort();
        if (redirectCount > this.maxRedirects) {
          reject(this.createMaxRedirectError());
        } else {
          handler(builder_util_runtime_12.HttpExecutor.prepareRedirectUrlOptions(redirectUrl, options));
        }
      });
    }
  }
  exports$1.ElectronHttpExecutor = ElectronHttpExecutor;
})(electronHttpExecutor);
var GenericProvider$1 = {};
var util = {};
var symbolTag = "[object Symbol]";
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g, reHasRegExpChar = RegExp(reRegExpChar.source);
var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal || freeSelf || Function("return this")();
var objectProto = Object.prototype;
var objectToString = objectProto.toString;
var Symbol$1 = root.Symbol;
var symbolProto = Symbol$1 ? Symbol$1.prototype : void 0, symbolToString = symbolProto ? symbolProto.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
function isObjectLike(value) {
  return !!value && typeof value == "object";
}
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
}
function toString2(value) {
  return value == null ? "" : baseToString(value);
}
function escapeRegExp$1(string) {
  string = toString2(string);
  return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, "\\$&") : string;
}
var lodash_escaperegexp = escapeRegExp$1;
Object.defineProperty(util, "__esModule", { value: true });
util.newBaseUrl = newBaseUrl;
util.newUrlFromBase = newUrlFromBase;
util.getChannelFilename = getChannelFilename;
util.blockmapFiles = blockmapFiles;
const url_1$4 = require$$4$1;
const escapeRegExp = lodash_escaperegexp;
function newBaseUrl(url) {
  const result = new url_1$4.URL(url);
  if (!result.pathname.endsWith("/")) {
    result.pathname += "/";
  }
  return result;
}
function newUrlFromBase(pathname, baseUrl, addRandomQueryToAvoidCaching = false) {
  const result = new url_1$4.URL(pathname, baseUrl);
  const search = baseUrl.search;
  if (search != null && search.length !== 0) {
    result.search = search;
  } else if (addRandomQueryToAvoidCaching) {
    result.search = `noCache=${Date.now().toString(32)}`;
  }
  return result;
}
function getChannelFilename(channel) {
  return `${channel}.yml`;
}
function blockmapFiles(baseUrl, oldVersion, newVersion) {
  const newBlockMapUrl = newUrlFromBase(`${baseUrl.pathname}.blockmap`, baseUrl);
  const oldBlockMapUrl = newUrlFromBase(`${baseUrl.pathname.replace(new RegExp(escapeRegExp(newVersion), "g"), oldVersion)}.blockmap`, baseUrl);
  return [oldBlockMapUrl, newBlockMapUrl];
}
var Provider$1 = {};
Object.defineProperty(Provider$1, "__esModule", { value: true });
Provider$1.Provider = void 0;
Provider$1.findFile = findFile;
Provider$1.parseUpdateInfo = parseUpdateInfo;
Provider$1.getFileList = getFileList;
Provider$1.resolveFiles = resolveFiles;
const builder_util_runtime_1$e = out;
const js_yaml_1$2 = jsYaml;
const util_1$6 = util;
class Provider {
  constructor(runtimeOptions) {
    this.runtimeOptions = runtimeOptions;
    this.requestHeaders = null;
    this.executor = runtimeOptions.executor;
  }
  get isUseMultipleRangeRequest() {
    return this.runtimeOptions.isUseMultipleRangeRequest !== false;
  }
  getChannelFilePrefix() {
    if (this.runtimeOptions.platform === "linux") {
      const arch = process.env["TEST_UPDATER_ARCH"] || process.arch;
      const archSuffix = arch === "x64" ? "" : `-${arch}`;
      return "-linux" + archSuffix;
    } else {
      return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
  }
  // due to historical reasons for windows we use channel name without platform specifier
  getDefaultChannelName() {
    return this.getCustomChannelName("latest");
  }
  getCustomChannelName(channel) {
    return `${channel}${this.getChannelFilePrefix()}`;
  }
  get fileExtraDownloadHeaders() {
    return null;
  }
  setRequestHeaders(value) {
    this.requestHeaders = value;
  }
  /**
   * Method to perform API request only to resolve update info, but not to download update.
   */
  httpRequest(url, headers, cancellationToken) {
    return this.executor.request(this.createRequestOptions(url, headers), cancellationToken);
  }
  createRequestOptions(url, headers) {
    const result = {};
    if (this.requestHeaders == null) {
      if (headers != null) {
        result.headers = headers;
      }
    } else {
      result.headers = headers == null ? this.requestHeaders : { ...this.requestHeaders, ...headers };
    }
    (0, builder_util_runtime_1$e.configureRequestUrl)(url, result);
    return result;
  }
}
Provider$1.Provider = Provider;
function findFile(files, extension, not) {
  if (files.length === 0) {
    throw (0, builder_util_runtime_1$e.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  const result = files.find((it) => it.url.pathname.toLowerCase().endsWith(`.${extension}`));
  if (result != null) {
    return result;
  } else if (not == null) {
    return files[0];
  } else {
    return files.find((fileInfo) => !not.some((ext) => fileInfo.url.pathname.toLowerCase().endsWith(`.${ext}`)));
  }
}
function parseUpdateInfo(rawData, channelFile, channelFileUrl) {
  if (rawData == null) {
    throw (0, builder_util_runtime_1$e.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  let result;
  try {
    result = (0, js_yaml_1$2.load)(rawData);
  } catch (e) {
    throw (0, builder_util_runtime_1$e.newError)(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}, rawData: ${rawData}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
  }
  return result;
}
function getFileList(updateInfo) {
  const files = updateInfo.files;
  if (files != null && files.length > 0) {
    return files;
  }
  if (updateInfo.path != null) {
    return [
      {
        url: updateInfo.path,
        sha2: updateInfo.sha2,
        sha512: updateInfo.sha512
      }
    ];
  } else {
    throw (0, builder_util_runtime_1$e.newError)(`No files provided: ${(0, builder_util_runtime_1$e.safeStringifyJson)(updateInfo)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
}
function resolveFiles(updateInfo, baseUrl, pathTransformer = (p) => p) {
  const files = getFileList(updateInfo);
  const result = files.map((fileInfo) => {
    if (fileInfo.sha2 == null && fileInfo.sha512 == null) {
      throw (0, builder_util_runtime_1$e.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, builder_util_runtime_1$e.safeStringifyJson)(fileInfo)}`, "ERR_UPDATER_NO_CHECKSUM");
    }
    return {
      url: (0, util_1$6.newUrlFromBase)(pathTransformer(fileInfo.url), baseUrl),
      info: fileInfo
    };
  });
  const packages = updateInfo.packages;
  const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
  if (packageInfo != null) {
    result[0].packageInfo = {
      ...packageInfo,
      path: (0, util_1$6.newUrlFromBase)(pathTransformer(packageInfo.path), baseUrl).href
    };
  }
  return result;
}
Object.defineProperty(GenericProvider$1, "__esModule", { value: true });
GenericProvider$1.GenericProvider = void 0;
const builder_util_runtime_1$d = out;
const util_1$5 = util;
const Provider_1$a = Provider$1;
class GenericProvider extends Provider_1$a.Provider {
  constructor(configuration, updater, runtimeOptions) {
    super(runtimeOptions);
    this.configuration = configuration;
    this.updater = updater;
    this.baseUrl = (0, util_1$5.newBaseUrl)(this.configuration.url);
  }
  get channel() {
    const result = this.updater.channel || this.configuration.channel;
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
  }
  async getLatestVersion() {
    const channelFile = (0, util_1$5.getChannelFilename)(this.channel);
    const channelUrl = (0, util_1$5.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
    for (let attemptNumber = 0; ; attemptNumber++) {
      try {
        return (0, Provider_1$a.parseUpdateInfo)(await this.httpRequest(channelUrl), channelFile, channelUrl);
      } catch (e) {
        if (e instanceof builder_util_runtime_1$d.HttpError && e.statusCode === 404) {
          throw (0, builder_util_runtime_1$d.newError)(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        } else if (e.code === "ECONNREFUSED") {
          if (attemptNumber < 3) {
            await new Promise((resolve, reject) => {
              try {
                setTimeout(resolve, 1e3 * attemptNumber);
              } catch (e2) {
                reject(e2);
              }
            });
            continue;
          }
        }
        throw e;
      }
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$a.resolveFiles)(updateInfo, this.baseUrl);
  }
}
GenericProvider$1.GenericProvider = GenericProvider;
var providerFactory = {};
var BitbucketProvider$1 = {};
Object.defineProperty(BitbucketProvider$1, "__esModule", { value: true });
BitbucketProvider$1.BitbucketProvider = void 0;
const builder_util_runtime_1$c = out;
const util_1$4 = util;
const Provider_1$9 = Provider$1;
class BitbucketProvider extends Provider_1$9.Provider {
  constructor(configuration, updater, runtimeOptions) {
    super({
      ...runtimeOptions,
      isUseMultipleRangeRequest: false
    });
    this.configuration = configuration;
    this.updater = updater;
    const { owner, slug } = configuration;
    this.baseUrl = (0, util_1$4.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${owner}/${slug}/downloads`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "latest";
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$c.CancellationToken();
    const channelFile = (0, util_1$4.getChannelFilename)(this.getCustomChannelName(this.channel));
    const channelUrl = (0, util_1$4.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const updateInfo = await this.httpRequest(channelUrl, void 0, cancellationToken);
      return (0, Provider_1$9.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
    } catch (e) {
      throw (0, builder_util_runtime_1$c.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$9.resolveFiles)(updateInfo, this.baseUrl);
  }
  toString() {
    const { owner, slug } = this.configuration;
    return `Bitbucket (owner: ${owner}, slug: ${slug}, channel: ${this.channel})`;
  }
}
BitbucketProvider$1.BitbucketProvider = BitbucketProvider;
var GitHubProvider$1 = {};
Object.defineProperty(GitHubProvider$1, "__esModule", { value: true });
GitHubProvider$1.GitHubProvider = GitHubProvider$1.BaseGitHubProvider = void 0;
GitHubProvider$1.computeReleaseNotes = computeReleaseNotes;
const builder_util_runtime_1$b = out;
const semver = semver$1;
const url_1$3 = require$$4$1;
const util_1$3 = util;
const Provider_1$8 = Provider$1;
const hrefRegExp = /\/tag\/([^/]+)$/;
class BaseGitHubProvider extends Provider_1$8.Provider {
  constructor(options, defaultHost, runtimeOptions) {
    super({
      ...runtimeOptions,
      /* because GitHib uses S3 */
      isUseMultipleRangeRequest: false
    });
    this.options = options;
    this.baseUrl = (0, util_1$3.newBaseUrl)((0, builder_util_runtime_1$b.githubUrl)(options, defaultHost));
    const apiHost = defaultHost === "github.com" ? "api.github.com" : defaultHost;
    this.baseApiUrl = (0, util_1$3.newBaseUrl)((0, builder_util_runtime_1$b.githubUrl)(options, apiHost));
  }
  computeGithubBasePath(result) {
    const host = this.options.host;
    return host && !["github.com", "api.github.com"].includes(host) ? `/api/v3${result}` : result;
  }
}
GitHubProvider$1.BaseGitHubProvider = BaseGitHubProvider;
class GitHubProvider extends BaseGitHubProvider {
  constructor(options, updater, runtimeOptions) {
    super(options, "github.com", runtimeOptions);
    this.options = options;
    this.updater = updater;
  }
  get channel() {
    const result = this.updater.channel || this.options.channel;
    return result == null ? this.getDefaultChannelName() : this.getCustomChannelName(result);
  }
  async getLatestVersion() {
    var _a, _b, _c, _d, _e;
    const cancellationToken = new builder_util_runtime_1$b.CancellationToken();
    const feedXml = await this.httpRequest((0, util_1$3.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
      accept: "application/xml, application/atom+xml, text/xml, */*"
    }, cancellationToken);
    const feed = (0, builder_util_runtime_1$b.parseXml)(feedXml);
    let latestRelease = feed.element("entry", false, `No published versions on GitHub`);
    let tag = null;
    try {
      if (this.updater.allowPrerelease) {
        const currentChannel = ((_a = this.updater) === null || _a === void 0 ? void 0 : _a.channel) || ((_b = semver.prerelease(this.updater.currentVersion)) === null || _b === void 0 ? void 0 : _b[0]) || null;
        if (currentChannel === null) {
          tag = hrefRegExp.exec(latestRelease.element("link").attribute("href"))[1];
        } else {
          for (const element of feed.getElements("entry")) {
            const hrefElement = hrefRegExp.exec(element.element("link").attribute("href"));
            if (hrefElement === null)
              continue;
            const hrefTag = hrefElement[1];
            const hrefChannel = ((_c = semver.prerelease(hrefTag)) === null || _c === void 0 ? void 0 : _c[0]) || null;
            const shouldFetchVersion = !currentChannel || ["alpha", "beta"].includes(currentChannel);
            const isCustomChannel = hrefChannel !== null && !["alpha", "beta"].includes(String(hrefChannel));
            const channelMismatch = currentChannel === "beta" && hrefChannel === "alpha";
            if (shouldFetchVersion && !isCustomChannel && !channelMismatch) {
              tag = hrefTag;
              break;
            }
            const isNextPreRelease = hrefChannel && hrefChannel === currentChannel;
            if (isNextPreRelease) {
              tag = hrefTag;
              break;
            }
          }
        }
      } else {
        tag = await this.getLatestTagName(cancellationToken);
        for (const element of feed.getElements("entry")) {
          if (hrefRegExp.exec(element.element("link").attribute("href"))[1] === tag) {
            latestRelease = element;
            break;
          }
        }
      }
    } catch (e) {
      throw (0, builder_util_runtime_1$b.newError)(`Cannot parse releases feed: ${e.stack || e.message},
XML:
${feedXml}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
    }
    if (tag == null) {
      throw (0, builder_util_runtime_1$b.newError)(`No published versions on GitHub`, "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
    }
    let rawData;
    let channelFile = "";
    let channelFileUrl = "";
    const fetchData = async (channelName) => {
      channelFile = (0, util_1$3.getChannelFilename)(channelName);
      channelFileUrl = (0, util_1$3.newUrlFromBase)(this.getBaseDownloadPath(String(tag), channelFile), this.baseUrl);
      const requestOptions = this.createRequestOptions(channelFileUrl);
      try {
        return await this.executor.request(requestOptions, cancellationToken);
      } catch (e) {
        if (e instanceof builder_util_runtime_1$b.HttpError && e.statusCode === 404) {
          throw (0, builder_util_runtime_1$b.newError)(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
        }
        throw e;
      }
    };
    try {
      let channel = this.channel;
      if (this.updater.allowPrerelease && ((_d = semver.prerelease(tag)) === null || _d === void 0 ? void 0 : _d[0])) {
        channel = this.getCustomChannelName(String((_e = semver.prerelease(tag)) === null || _e === void 0 ? void 0 : _e[0]));
      }
      rawData = await fetchData(channel);
    } catch (e) {
      if (this.updater.allowPrerelease) {
        rawData = await fetchData(this.getDefaultChannelName());
      } else {
        throw e;
      }
    }
    const result = (0, Provider_1$8.parseUpdateInfo)(rawData, channelFile, channelFileUrl);
    if (result.releaseName == null) {
      result.releaseName = latestRelease.elementValueOrEmpty("title");
    }
    if (result.releaseNotes == null) {
      result.releaseNotes = computeReleaseNotes(this.updater.currentVersion, this.updater.fullChangelog, feed, latestRelease);
    }
    return {
      tag,
      ...result
    };
  }
  async getLatestTagName(cancellationToken) {
    const options = this.options;
    const url = options.host == null || options.host === "github.com" ? (0, util_1$3.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new url_1$3.URL(`${this.computeGithubBasePath(`/repos/${options.owner}/${options.repo}/releases`)}/latest`, this.baseApiUrl);
    try {
      const rawData = await this.httpRequest(url, { Accept: "application/json" }, cancellationToken);
      if (rawData == null) {
        return null;
      }
      const releaseInfo = JSON.parse(rawData);
      return releaseInfo.tag_name;
    } catch (e) {
      throw (0, builder_util_runtime_1$b.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return `/${this.options.owner}/${this.options.repo}/releases`;
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$8.resolveFiles)(updateInfo, this.baseUrl, (p) => this.getBaseDownloadPath(updateInfo.tag, p.replace(/ /g, "-")));
  }
  getBaseDownloadPath(tag, fileName) {
    return `${this.basePath}/download/${tag}/${fileName}`;
  }
}
GitHubProvider$1.GitHubProvider = GitHubProvider;
function getNoteValue(parent) {
  const result = parent.elementValueOrEmpty("content");
  return result === "No content." ? "" : result;
}
function computeReleaseNotes(currentVersion, isFullChangelog, feed, latestRelease) {
  if (!isFullChangelog) {
    return getNoteValue(latestRelease);
  }
  const releaseNotes = [];
  for (const release of feed.getElements("entry")) {
    const versionRelease = /\/tag\/v?([^/]+)$/.exec(release.element("link").attribute("href"))[1];
    if (semver.lt(currentVersion, versionRelease)) {
      releaseNotes.push({
        version: versionRelease,
        note: getNoteValue(release)
      });
    }
  }
  return releaseNotes.sort((a, b) => semver.rcompare(a.version, b.version));
}
var KeygenProvider$1 = {};
Object.defineProperty(KeygenProvider$1, "__esModule", { value: true });
KeygenProvider$1.KeygenProvider = void 0;
const builder_util_runtime_1$a = out;
const util_1$2 = util;
const Provider_1$7 = Provider$1;
class KeygenProvider extends Provider_1$7.Provider {
  constructor(configuration, updater, runtimeOptions) {
    super({
      ...runtimeOptions,
      isUseMultipleRangeRequest: false
    });
    this.configuration = configuration;
    this.updater = updater;
    this.defaultHostname = "api.keygen.sh";
    const host = this.configuration.host || this.defaultHostname;
    this.baseUrl = (0, util_1$2.newBaseUrl)(`https://${host}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
  }
  get channel() {
    return this.updater.channel || this.configuration.channel || "stable";
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$a.CancellationToken();
    const channelFile = (0, util_1$2.getChannelFilename)(this.getCustomChannelName(this.channel));
    const channelUrl = (0, util_1$2.newUrlFromBase)(channelFile, this.baseUrl, this.updater.isAddNoCacheQuery);
    try {
      const updateInfo = await this.httpRequest(channelUrl, {
        Accept: "application/vnd.api+json",
        "Keygen-Version": "1.1"
      }, cancellationToken);
      return (0, Provider_1$7.parseUpdateInfo)(updateInfo, channelFile, channelUrl);
    } catch (e) {
      throw (0, builder_util_runtime_1$a.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$7.resolveFiles)(updateInfo, this.baseUrl);
  }
  toString() {
    const { account, product, platform: platform2 } = this.configuration;
    return `Keygen (account: ${account}, product: ${product}, platform: ${platform2}, channel: ${this.channel})`;
  }
}
KeygenProvider$1.KeygenProvider = KeygenProvider;
var PrivateGitHubProvider$1 = {};
Object.defineProperty(PrivateGitHubProvider$1, "__esModule", { value: true });
PrivateGitHubProvider$1.PrivateGitHubProvider = void 0;
const builder_util_runtime_1$9 = out;
const js_yaml_1$1 = jsYaml;
const path$5 = require$$1$3;
const url_1$2 = require$$4$1;
const util_1$1 = util;
const GitHubProvider_1$1 = GitHubProvider$1;
const Provider_1$6 = Provider$1;
class PrivateGitHubProvider extends GitHubProvider_1$1.BaseGitHubProvider {
  constructor(options, updater, token, runtimeOptions) {
    super(options, "api.github.com", runtimeOptions);
    this.updater = updater;
    this.token = token;
  }
  createRequestOptions(url, headers) {
    const result = super.createRequestOptions(url, headers);
    result.redirect = "manual";
    return result;
  }
  async getLatestVersion() {
    const cancellationToken = new builder_util_runtime_1$9.CancellationToken();
    const channelFile = (0, util_1$1.getChannelFilename)(this.getDefaultChannelName());
    const releaseInfo = await this.getLatestVersionInfo(cancellationToken);
    const asset = releaseInfo.assets.find((it) => it.name === channelFile);
    if (asset == null) {
      throw (0, builder_util_runtime_1$9.newError)(`Cannot find ${channelFile} in the release ${releaseInfo.html_url || releaseInfo.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
    }
    const url = new url_1$2.URL(asset.url);
    let result;
    try {
      result = (0, js_yaml_1$1.load)(await this.httpRequest(url, this.configureHeaders("application/octet-stream"), cancellationToken));
    } catch (e) {
      if (e instanceof builder_util_runtime_1$9.HttpError && e.statusCode === 404) {
        throw (0, builder_util_runtime_1$9.newError)(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      }
      throw e;
    }
    result.assets = releaseInfo.assets;
    return result;
  }
  get fileExtraDownloadHeaders() {
    return this.configureHeaders("application/octet-stream");
  }
  configureHeaders(accept) {
    return {
      accept,
      authorization: `token ${this.token}`
    };
  }
  async getLatestVersionInfo(cancellationToken) {
    const allowPrerelease = this.updater.allowPrerelease;
    let basePath = this.basePath;
    if (!allowPrerelease) {
      basePath = `${basePath}/latest`;
    }
    const url = (0, util_1$1.newUrlFromBase)(basePath, this.baseUrl);
    try {
      const version = JSON.parse(await this.httpRequest(url, this.configureHeaders("application/vnd.github.v3+json"), cancellationToken));
      if (allowPrerelease) {
        return version.find((it) => it.prerelease) || version[0];
      } else {
        return version;
      }
    } catch (e) {
      throw (0, builder_util_runtime_1$9.newError)(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
    }
  }
  get basePath() {
    return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
  }
  resolveFiles(updateInfo) {
    return (0, Provider_1$6.getFileList)(updateInfo).map((it) => {
      const name = path$5.posix.basename(it.url).replace(/ /g, "-");
      const asset = updateInfo.assets.find((it2) => it2 != null && it2.name === name);
      if (asset == null) {
        throw (0, builder_util_runtime_1$9.newError)(`Cannot find asset "${name}" in: ${JSON.stringify(updateInfo.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
      }
      return {
        url: new url_1$2.URL(asset.url),
        info: it
      };
    });
  }
}
PrivateGitHubProvider$1.PrivateGitHubProvider = PrivateGitHubProvider;
Object.defineProperty(providerFactory, "__esModule", { value: true });
providerFactory.isUrlProbablySupportMultiRangeRequests = isUrlProbablySupportMultiRangeRequests;
providerFactory.createClient = createClient;
const builder_util_runtime_1$8 = out;
const BitbucketProvider_1 = BitbucketProvider$1;
const GenericProvider_1$1 = GenericProvider$1;
const GitHubProvider_1 = GitHubProvider$1;
const KeygenProvider_1 = KeygenProvider$1;
const PrivateGitHubProvider_1 = PrivateGitHubProvider$1;
function isUrlProbablySupportMultiRangeRequests(url) {
  return !url.includes("s3.amazonaws.com");
}
function createClient(data, updater, runtimeOptions) {
  if (typeof data === "string") {
    throw (0, builder_util_runtime_1$8.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
  }
  const provider = data.provider;
  switch (provider) {
    case "github": {
      const githubOptions = data;
      const token = (githubOptions.private ? process.env["GH_TOKEN"] || process.env["GITHUB_TOKEN"] : null) || githubOptions.token;
      if (token == null) {
        return new GitHubProvider_1.GitHubProvider(githubOptions, updater, runtimeOptions);
      } else {
        return new PrivateGitHubProvider_1.PrivateGitHubProvider(githubOptions, updater, token, runtimeOptions);
      }
    }
    case "bitbucket":
      return new BitbucketProvider_1.BitbucketProvider(data, updater, runtimeOptions);
    case "keygen":
      return new KeygenProvider_1.KeygenProvider(data, updater, runtimeOptions);
    case "s3":
    case "spaces":
      return new GenericProvider_1$1.GenericProvider({
        provider: "generic",
        url: (0, builder_util_runtime_1$8.getS3LikeProviderBaseUrl)(data),
        channel: data.channel || null
      }, updater, {
        ...runtimeOptions,
        // https://github.com/minio/minio/issues/5285#issuecomment-350428955
        isUseMultipleRangeRequest: false
      });
    case "generic": {
      const options = data;
      return new GenericProvider_1$1.GenericProvider(options, updater, {
        ...runtimeOptions,
        isUseMultipleRangeRequest: options.useMultipleRangeRequest !== false && isUrlProbablySupportMultiRangeRequests(options.url)
      });
    }
    case "custom": {
      const options = data;
      const constructor = options.updateProvider;
      if (!constructor) {
        throw (0, builder_util_runtime_1$8.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
      }
      return new constructor(options, updater, runtimeOptions);
    }
    default:
      throw (0, builder_util_runtime_1$8.newError)(`Unsupported provider: ${provider}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
  }
}
var GenericDifferentialDownloader$1 = {};
var DifferentialDownloader$1 = {};
var DataSplitter$1 = {};
var downloadPlanBuilder = {};
Object.defineProperty(downloadPlanBuilder, "__esModule", { value: true });
downloadPlanBuilder.OperationKind = void 0;
downloadPlanBuilder.computeOperations = computeOperations;
var OperationKind$1;
(function(OperationKind2) {
  OperationKind2[OperationKind2["COPY"] = 0] = "COPY";
  OperationKind2[OperationKind2["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind$1 || (downloadPlanBuilder.OperationKind = OperationKind$1 = {}));
function computeOperations(oldBlockMap, newBlockMap, logger2) {
  const nameToOldBlocks = buildBlockFileMap(oldBlockMap.files);
  const nameToNewBlocks = buildBlockFileMap(newBlockMap.files);
  let lastOperation = null;
  const blockMapFile = newBlockMap.files[0];
  const operations = [];
  const name = blockMapFile.name;
  const oldEntry = nameToOldBlocks.get(name);
  if (oldEntry == null) {
    throw new Error(`no file ${name} in old blockmap`);
  }
  const newFile = nameToNewBlocks.get(name);
  let changedBlockCount = 0;
  const { checksumToOffset: checksumToOldOffset, checksumToOldSize } = buildChecksumMap(nameToOldBlocks.get(name), oldEntry.offset, logger2);
  let newOffset = blockMapFile.offset;
  for (let i = 0; i < newFile.checksums.length; newOffset += newFile.sizes[i], i++) {
    const blockSize = newFile.sizes[i];
    const checksum = newFile.checksums[i];
    let oldOffset = checksumToOldOffset.get(checksum);
    if (oldOffset != null && checksumToOldSize.get(checksum) !== blockSize) {
      logger2.warn(`Checksum ("${checksum}") matches, but size differs (old: ${checksumToOldSize.get(checksum)}, new: ${blockSize})`);
      oldOffset = void 0;
    }
    if (oldOffset === void 0) {
      changedBlockCount++;
      if (lastOperation != null && lastOperation.kind === OperationKind$1.DOWNLOAD && lastOperation.end === newOffset) {
        lastOperation.end += blockSize;
      } else {
        lastOperation = {
          kind: OperationKind$1.DOWNLOAD,
          start: newOffset,
          end: newOffset + blockSize
          // oldBlocks: null,
        };
        validateAndAdd(lastOperation, operations, checksum, i);
      }
    } else {
      if (lastOperation != null && lastOperation.kind === OperationKind$1.COPY && lastOperation.end === oldOffset) {
        lastOperation.end += blockSize;
      } else {
        lastOperation = {
          kind: OperationKind$1.COPY,
          start: oldOffset,
          end: oldOffset + blockSize
          // oldBlocks: [checksum]
        };
        validateAndAdd(lastOperation, operations, checksum, i);
      }
    }
  }
  if (changedBlockCount > 0) {
    logger2.info(`File${blockMapFile.name === "file" ? "" : " " + blockMapFile.name} has ${changedBlockCount} changed blocks`);
  }
  return operations;
}
const isValidateOperationRange = process.env["DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES"] === "true";
function validateAndAdd(operation, operations, checksum, index) {
  if (isValidateOperationRange && operations.length !== 0) {
    const lastOperation = operations[operations.length - 1];
    if (lastOperation.kind === operation.kind && operation.start < lastOperation.end && operation.start > lastOperation.start) {
      const min = [lastOperation.start, lastOperation.end, operation.start, operation.end].reduce((p, v) => p < v ? p : v);
      throw new Error(`operation (block index: ${index}, checksum: ${checksum}, kind: ${OperationKind$1[operation.kind]}) overlaps previous operation (checksum: ${checksum}):
abs: ${lastOperation.start} until ${lastOperation.end} and ${operation.start} until ${operation.end}
rel: ${lastOperation.start - min} until ${lastOperation.end - min} and ${operation.start - min} until ${operation.end - min}`);
    }
  }
  operations.push(operation);
}
function buildChecksumMap(file2, fileOffset, logger2) {
  const checksumToOffset = /* @__PURE__ */ new Map();
  const checksumToSize = /* @__PURE__ */ new Map();
  let offset = fileOffset;
  for (let i = 0; i < file2.checksums.length; i++) {
    const checksum = file2.checksums[i];
    const size = file2.sizes[i];
    const existing = checksumToSize.get(checksum);
    if (existing === void 0) {
      checksumToOffset.set(checksum, offset);
      checksumToSize.set(checksum, size);
    } else if (logger2.debug != null) {
      const sizeExplanation = existing === size ? "(same size)" : `(size: ${existing}, this size: ${size})`;
      logger2.debug(`${checksum} duplicated in blockmap ${sizeExplanation}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
    }
    offset += size;
  }
  return { checksumToOffset, checksumToOldSize: checksumToSize };
}
function buildBlockFileMap(list) {
  const result = /* @__PURE__ */ new Map();
  for (const item of list) {
    result.set(item.name, item);
  }
  return result;
}
Object.defineProperty(DataSplitter$1, "__esModule", { value: true });
DataSplitter$1.DataSplitter = void 0;
DataSplitter$1.copyData = copyData;
const builder_util_runtime_1$7 = out;
const fs_1$3 = require$$1$2;
const stream_1$1 = require$$0$4;
const downloadPlanBuilder_1$2 = downloadPlanBuilder;
const DOUBLE_CRLF = Buffer.from("\r\n\r\n");
var ReadState;
(function(ReadState2) {
  ReadState2[ReadState2["INIT"] = 0] = "INIT";
  ReadState2[ReadState2["HEADER"] = 1] = "HEADER";
  ReadState2[ReadState2["BODY"] = 2] = "BODY";
})(ReadState || (ReadState = {}));
function copyData(task, out2, oldFileFd, reject, resolve) {
  const readStream = (0, fs_1$3.createReadStream)("", {
    fd: oldFileFd,
    autoClose: false,
    start: task.start,
    // end is inclusive
    end: task.end - 1
  });
  readStream.on("error", reject);
  readStream.once("end", resolve);
  readStream.pipe(out2, {
    end: false
  });
}
class DataSplitter extends stream_1$1.Writable {
  constructor(out2, options, partIndexToTaskIndex, boundary, partIndexToLength, finishHandler) {
    super();
    this.out = out2;
    this.options = options;
    this.partIndexToTaskIndex = partIndexToTaskIndex;
    this.partIndexToLength = partIndexToLength;
    this.finishHandler = finishHandler;
    this.partIndex = -1;
    this.headerListBuffer = null;
    this.readState = ReadState.INIT;
    this.ignoreByteCount = 0;
    this.remainingPartDataCount = 0;
    this.actualPartLength = 0;
    this.boundaryLength = boundary.length + 4;
    this.ignoreByteCount = this.boundaryLength - 2;
  }
  get isFinished() {
    return this.partIndex === this.partIndexToLength.length;
  }
  // noinspection JSUnusedGlobalSymbols
  _write(data, encoding, callback) {
    if (this.isFinished) {
      console.error(`Trailing ignored data: ${data.length} bytes`);
      return;
    }
    this.handleData(data).then(callback).catch(callback);
  }
  async handleData(chunk) {
    let start = 0;
    if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0) {
      throw (0, builder_util_runtime_1$7.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
    }
    if (this.ignoreByteCount > 0) {
      const toIgnore = Math.min(this.ignoreByteCount, chunk.length);
      this.ignoreByteCount -= toIgnore;
      start = toIgnore;
    } else if (this.remainingPartDataCount > 0) {
      const toRead = Math.min(this.remainingPartDataCount, chunk.length);
      this.remainingPartDataCount -= toRead;
      await this.processPartData(chunk, 0, toRead);
      start = toRead;
    }
    if (start === chunk.length) {
      return;
    }
    if (this.readState === ReadState.HEADER) {
      const headerListEnd = this.searchHeaderListEnd(chunk, start);
      if (headerListEnd === -1) {
        return;
      }
      start = headerListEnd;
      this.readState = ReadState.BODY;
      this.headerListBuffer = null;
    }
    while (true) {
      if (this.readState === ReadState.BODY) {
        this.readState = ReadState.INIT;
      } else {
        this.partIndex++;
        let taskIndex = this.partIndexToTaskIndex.get(this.partIndex);
        if (taskIndex == null) {
          if (this.isFinished) {
            taskIndex = this.options.end;
          } else {
            throw (0, builder_util_runtime_1$7.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
          }
        }
        const prevTaskIndex = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
        if (prevTaskIndex < taskIndex) {
          await this.copyExistingData(prevTaskIndex, taskIndex);
        } else if (prevTaskIndex > taskIndex) {
          throw (0, builder_util_runtime_1$7.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
        }
        if (this.isFinished) {
          this.onPartEnd();
          this.finishHandler();
          return;
        }
        start = this.searchHeaderListEnd(chunk, start);
        if (start === -1) {
          this.readState = ReadState.HEADER;
          return;
        }
      }
      const partLength = this.partIndexToLength[this.partIndex];
      const end = start + partLength;
      const effectiveEnd = Math.min(end, chunk.length);
      await this.processPartStarted(chunk, start, effectiveEnd);
      this.remainingPartDataCount = partLength - (effectiveEnd - start);
      if (this.remainingPartDataCount > 0) {
        return;
      }
      start = end + this.boundaryLength;
      if (start >= chunk.length) {
        this.ignoreByteCount = this.boundaryLength - (chunk.length - end);
        return;
      }
    }
  }
  copyExistingData(index, end) {
    return new Promise((resolve, reject) => {
      const w = () => {
        if (index === end) {
          resolve();
          return;
        }
        const task = this.options.tasks[index];
        if (task.kind !== downloadPlanBuilder_1$2.OperationKind.COPY) {
          reject(new Error("Task kind must be COPY"));
          return;
        }
        copyData(task, this.out, this.options.oldFileFd, reject, () => {
          index++;
          w();
        });
      };
      w();
    });
  }
  searchHeaderListEnd(chunk, readOffset) {
    const headerListEnd = chunk.indexOf(DOUBLE_CRLF, readOffset);
    if (headerListEnd !== -1) {
      return headerListEnd + DOUBLE_CRLF.length;
    }
    const partialChunk = readOffset === 0 ? chunk : chunk.slice(readOffset);
    if (this.headerListBuffer == null) {
      this.headerListBuffer = partialChunk;
    } else {
      this.headerListBuffer = Buffer.concat([this.headerListBuffer, partialChunk]);
    }
    return -1;
  }
  onPartEnd() {
    const expectedLength = this.partIndexToLength[this.partIndex - 1];
    if (this.actualPartLength !== expectedLength) {
      throw (0, builder_util_runtime_1$7.newError)(`Expected length: ${expectedLength} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
    }
    this.actualPartLength = 0;
  }
  processPartStarted(data, start, end) {
    if (this.partIndex !== 0) {
      this.onPartEnd();
    }
    return this.processPartData(data, start, end);
  }
  processPartData(data, start, end) {
    this.actualPartLength += end - start;
    const out2 = this.out;
    if (out2.write(start === 0 && data.length === end ? data : data.slice(start, end))) {
      return Promise.resolve();
    } else {
      return new Promise((resolve, reject) => {
        out2.on("error", reject);
        out2.once("drain", () => {
          out2.removeListener("error", reject);
          resolve();
        });
      });
    }
  }
}
DataSplitter$1.DataSplitter = DataSplitter;
var multipleRangeDownloader = {};
Object.defineProperty(multipleRangeDownloader, "__esModule", { value: true });
multipleRangeDownloader.executeTasksUsingMultipleRangeRequests = executeTasksUsingMultipleRangeRequests;
multipleRangeDownloader.checkIsRangesSupported = checkIsRangesSupported;
const builder_util_runtime_1$6 = out;
const DataSplitter_1$1 = DataSplitter$1;
const downloadPlanBuilder_1$1 = downloadPlanBuilder;
function executeTasksUsingMultipleRangeRequests(differentialDownloader, tasks, out2, oldFileFd, reject) {
  const w = (taskOffset) => {
    if (taskOffset >= tasks.length) {
      if (differentialDownloader.fileMetadataBuffer != null) {
        out2.write(differentialDownloader.fileMetadataBuffer);
      }
      out2.end();
      return;
    }
    const nextOffset = taskOffset + 1e3;
    doExecuteTasks(differentialDownloader, {
      tasks,
      start: taskOffset,
      end: Math.min(tasks.length, nextOffset),
      oldFileFd
    }, out2, () => w(nextOffset), reject);
  };
  return w;
}
function doExecuteTasks(differentialDownloader, options, out2, resolve, reject) {
  let ranges = "bytes=";
  let partCount = 0;
  const partIndexToTaskIndex = /* @__PURE__ */ new Map();
  const partIndexToLength = [];
  for (let i = options.start; i < options.end; i++) {
    const task = options.tasks[i];
    if (task.kind === downloadPlanBuilder_1$1.OperationKind.DOWNLOAD) {
      ranges += `${task.start}-${task.end - 1}, `;
      partIndexToTaskIndex.set(partCount, i);
      partCount++;
      partIndexToLength.push(task.end - task.start);
    }
  }
  if (partCount <= 1) {
    const w = (index) => {
      if (index >= options.end) {
        resolve();
        return;
      }
      const task = options.tasks[index++];
      if (task.kind === downloadPlanBuilder_1$1.OperationKind.COPY) {
        (0, DataSplitter_1$1.copyData)(task, out2, options.oldFileFd, reject, () => w(index));
      } else {
        const requestOptions2 = differentialDownloader.createRequestOptions();
        requestOptions2.headers.Range = `bytes=${task.start}-${task.end - 1}`;
        const request2 = differentialDownloader.httpExecutor.createRequest(requestOptions2, (response) => {
          if (!checkIsRangesSupported(response, reject)) {
            return;
          }
          response.pipe(out2, {
            end: false
          });
          response.once("end", () => w(index));
        });
        differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request2, reject);
        request2.end();
      }
    };
    w(options.start);
    return;
  }
  const requestOptions = differentialDownloader.createRequestOptions();
  requestOptions.headers.Range = ranges.substring(0, ranges.length - 2);
  const request = differentialDownloader.httpExecutor.createRequest(requestOptions, (response) => {
    if (!checkIsRangesSupported(response, reject)) {
      return;
    }
    const contentType = (0, builder_util_runtime_1$6.safeGetHeader)(response, "content-type");
    const m = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(contentType);
    if (m == null) {
      reject(new Error(`Content-Type "multipart/byteranges" is expected, but got "${contentType}"`));
      return;
    }
    const dicer = new DataSplitter_1$1.DataSplitter(out2, options, partIndexToTaskIndex, m[1] || m[2], partIndexToLength, resolve);
    dicer.on("error", reject);
    response.pipe(dicer);
    response.on("end", () => {
      setTimeout(() => {
        request.abort();
        reject(new Error("Response ends without calling any handlers"));
      }, 1e4);
    });
  });
  differentialDownloader.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
  request.end();
}
function checkIsRangesSupported(response, reject) {
  if (response.statusCode >= 400) {
    reject((0, builder_util_runtime_1$6.createHttpError)(response));
    return false;
  }
  if (response.statusCode !== 206) {
    const acceptRanges = (0, builder_util_runtime_1$6.safeGetHeader)(response, "accept-ranges");
    if (acceptRanges == null || acceptRanges === "none") {
      reject(new Error(`Server doesn't support Accept-Ranges (response code ${response.statusCode})`));
      return false;
    }
  }
  return true;
}
var ProgressDifferentialDownloadCallbackTransform$1 = {};
Object.defineProperty(ProgressDifferentialDownloadCallbackTransform$1, "__esModule", { value: true });
ProgressDifferentialDownloadCallbackTransform$1.ProgressDifferentialDownloadCallbackTransform = void 0;
const stream_1 = require$$0$4;
var OperationKind;
(function(OperationKind2) {
  OperationKind2[OperationKind2["COPY"] = 0] = "COPY";
  OperationKind2[OperationKind2["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind || (OperationKind = {}));
class ProgressDifferentialDownloadCallbackTransform extends stream_1.Transform {
  constructor(progressDifferentialDownloadInfo, cancellationToken, onProgress) {
    super();
    this.progressDifferentialDownloadInfo = progressDifferentialDownloadInfo;
    this.cancellationToken = cancellationToken;
    this.onProgress = onProgress;
    this.start = Date.now();
    this.transferred = 0;
    this.delta = 0;
    this.expectedBytes = 0;
    this.index = 0;
    this.operationType = OperationKind.COPY;
    this.nextUpdate = this.start + 1e3;
  }
  _transform(chunk, encoding, callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"), null);
      return;
    }
    if (this.operationType == OperationKind.COPY) {
      callback(null, chunk);
      return;
    }
    this.transferred += chunk.length;
    this.delta += chunk.length;
    const now = Date.now();
    if (now >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
      this.nextUpdate = now + 1e3;
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((now - this.start) / 1e3))
      });
      this.delta = 0;
    }
    callback(null, chunk);
  }
  beginFileCopy() {
    this.operationType = OperationKind.COPY;
  }
  beginRangeDownload() {
    this.operationType = OperationKind.DOWNLOAD;
    this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
  }
  endRangeDownload() {
    if (this.transferred !== this.progressDifferentialDownloadInfo.grandTotal) {
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
  }
  // Called when we are 100% done with the connection/download
  _flush(callback) {
    if (this.cancellationToken.cancelled) {
      callback(new Error("cancelled"));
      return;
    }
    this.onProgress({
      total: this.progressDifferentialDownloadInfo.grandTotal,
      delta: this.delta,
      transferred: this.transferred,
      percent: 100,
      bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
    });
    this.delta = 0;
    this.transferred = 0;
    callback(null);
  }
}
ProgressDifferentialDownloadCallbackTransform$1.ProgressDifferentialDownloadCallbackTransform = ProgressDifferentialDownloadCallbackTransform;
Object.defineProperty(DifferentialDownloader$1, "__esModule", { value: true });
DifferentialDownloader$1.DifferentialDownloader = void 0;
const builder_util_runtime_1$5 = out;
const fs_extra_1$5 = lib;
const fs_1$2 = require$$1$2;
const DataSplitter_1 = DataSplitter$1;
const url_1$1 = require$$4$1;
const downloadPlanBuilder_1 = downloadPlanBuilder;
const multipleRangeDownloader_1 = multipleRangeDownloader;
const ProgressDifferentialDownloadCallbackTransform_1 = ProgressDifferentialDownloadCallbackTransform$1;
class DifferentialDownloader {
  // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
  constructor(blockAwareFileInfo, httpExecutor2, options) {
    this.blockAwareFileInfo = blockAwareFileInfo;
    this.httpExecutor = httpExecutor2;
    this.options = options;
    this.fileMetadataBuffer = null;
    this.logger = options.logger;
  }
  createRequestOptions() {
    const result = {
      headers: {
        ...this.options.requestHeaders,
        accept: "*/*"
      }
    };
    (0, builder_util_runtime_1$5.configureRequestUrl)(this.options.newUrl, result);
    (0, builder_util_runtime_1$5.configureRequestOptions)(result);
    return result;
  }
  doDownload(oldBlockMap, newBlockMap) {
    if (oldBlockMap.version !== newBlockMap.version) {
      throw new Error(`version is different (${oldBlockMap.version} - ${newBlockMap.version}), full download is required`);
    }
    const logger2 = this.logger;
    const operations = (0, downloadPlanBuilder_1.computeOperations)(oldBlockMap, newBlockMap, logger2);
    if (logger2.debug != null) {
      logger2.debug(JSON.stringify(operations, null, 2));
    }
    let downloadSize = 0;
    let copySize = 0;
    for (const operation of operations) {
      const length = operation.end - operation.start;
      if (operation.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
        downloadSize += length;
      } else {
        copySize += length;
      }
    }
    const newSize = this.blockAwareFileInfo.size;
    if (downloadSize + copySize + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== newSize) {
      throw new Error(`Internal error, size mismatch: downloadSize: ${downloadSize}, copySize: ${copySize}, newSize: ${newSize}`);
    }
    logger2.info(`Full: ${formatBytes(newSize)}, To download: ${formatBytes(downloadSize)} (${Math.round(downloadSize / (newSize / 100))}%)`);
    return this.downloadFile(operations);
  }
  downloadFile(tasks) {
    const fdList = [];
    const closeFiles = () => {
      return Promise.all(fdList.map((openedFile) => {
        return (0, fs_extra_1$5.close)(openedFile.descriptor).catch((e) => {
          this.logger.error(`cannot close file "${openedFile.path}": ${e}`);
        });
      }));
    };
    return this.doDownloadFile(tasks, fdList).then(closeFiles).catch((e) => {
      return closeFiles().catch((closeFilesError) => {
        try {
          this.logger.error(`cannot close files: ${closeFilesError}`);
        } catch (errorOnLog) {
          try {
            console.error(errorOnLog);
          } catch (_ignored) {
          }
        }
        throw e;
      }).then(() => {
        throw e;
      });
    });
  }
  async doDownloadFile(tasks, fdList) {
    const oldFileFd = await (0, fs_extra_1$5.open)(this.options.oldFile, "r");
    fdList.push({ descriptor: oldFileFd, path: this.options.oldFile });
    const newFileFd = await (0, fs_extra_1$5.open)(this.options.newFile, "w");
    fdList.push({ descriptor: newFileFd, path: this.options.newFile });
    const fileOut = (0, fs_1$2.createWriteStream)(this.options.newFile, { fd: newFileFd });
    await new Promise((resolve, reject) => {
      const streams = [];
      let downloadInfoTransform = void 0;
      if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
        const expectedByteCounts = [];
        let grandTotalBytes = 0;
        for (const task of tasks) {
          if (task.kind === downloadPlanBuilder_1.OperationKind.DOWNLOAD) {
            expectedByteCounts.push(task.end - task.start);
            grandTotalBytes += task.end - task.start;
          }
        }
        const progressDifferentialDownloadInfo = {
          expectedByteCounts,
          grandTotal: grandTotalBytes
        };
        downloadInfoTransform = new ProgressDifferentialDownloadCallbackTransform_1.ProgressDifferentialDownloadCallbackTransform(progressDifferentialDownloadInfo, this.options.cancellationToken, this.options.onProgress);
        streams.push(downloadInfoTransform);
      }
      const digestTransform = new builder_util_runtime_1$5.DigestTransform(this.blockAwareFileInfo.sha512);
      digestTransform.isValidateOnEnd = false;
      streams.push(digestTransform);
      fileOut.on("finish", () => {
        fileOut.close(() => {
          fdList.splice(1, 1);
          try {
            digestTransform.validate();
          } catch (e) {
            reject(e);
            return;
          }
          resolve(void 0);
        });
      });
      streams.push(fileOut);
      let lastStream = null;
      for (const stream of streams) {
        stream.on("error", reject);
        if (lastStream == null) {
          lastStream = stream;
        } else {
          lastStream = lastStream.pipe(stream);
        }
      }
      const firstStream = streams[0];
      let w;
      if (this.options.isUseMultipleRangeRequest) {
        w = (0, multipleRangeDownloader_1.executeTasksUsingMultipleRangeRequests)(this, tasks, firstStream, oldFileFd, reject);
        w(0);
        return;
      }
      let downloadOperationCount = 0;
      let actualUrl = null;
      this.logger.info(`Differential download: ${this.options.newUrl}`);
      const requestOptions = this.createRequestOptions();
      requestOptions.redirect = "manual";
      w = (index) => {
        var _a, _b;
        if (index >= tasks.length) {
          if (this.fileMetadataBuffer != null) {
            firstStream.write(this.fileMetadataBuffer);
          }
          firstStream.end();
          return;
        }
        const operation = tasks[index++];
        if (operation.kind === downloadPlanBuilder_1.OperationKind.COPY) {
          if (downloadInfoTransform) {
            downloadInfoTransform.beginFileCopy();
          }
          (0, DataSplitter_1.copyData)(operation, firstStream, oldFileFd, reject, () => w(index));
          return;
        }
        const range2 = `bytes=${operation.start}-${operation.end - 1}`;
        requestOptions.headers.range = range2;
        (_b = (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug) === null || _b === void 0 ? void 0 : _b.call(_a, `download range: ${range2}`);
        if (downloadInfoTransform) {
          downloadInfoTransform.beginRangeDownload();
        }
        const request = this.httpExecutor.createRequest(requestOptions, (response) => {
          response.on("error", reject);
          response.on("aborted", () => {
            reject(new Error("response has been aborted by the server"));
          });
          if (response.statusCode >= 400) {
            reject((0, builder_util_runtime_1$5.createHttpError)(response));
          }
          response.pipe(firstStream, {
            end: false
          });
          response.once("end", () => {
            if (downloadInfoTransform) {
              downloadInfoTransform.endRangeDownload();
            }
            if (++downloadOperationCount === 100) {
              downloadOperationCount = 0;
              setTimeout(() => w(index), 1e3);
            } else {
              w(index);
            }
          });
        });
        request.on("redirect", (statusCode, method, redirectUrl) => {
          this.logger.info(`Redirect to ${removeQuery(redirectUrl)}`);
          actualUrl = redirectUrl;
          (0, builder_util_runtime_1$5.configureRequestUrl)(new url_1$1.URL(actualUrl), requestOptions);
          request.followRedirect();
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
        request.end();
      };
      w(0);
    });
  }
  async readRemoteBytes(start, endInclusive) {
    const buffer = Buffer.allocUnsafe(endInclusive + 1 - start);
    const requestOptions = this.createRequestOptions();
    requestOptions.headers.range = `bytes=${start}-${endInclusive}`;
    let position = 0;
    await this.request(requestOptions, (chunk) => {
      chunk.copy(buffer, position);
      position += chunk.length;
    });
    if (position !== buffer.length) {
      throw new Error(`Received data length ${position} is not equal to expected ${buffer.length}`);
    }
    return buffer;
  }
  request(requestOptions, dataHandler) {
    return new Promise((resolve, reject) => {
      const request = this.httpExecutor.createRequest(requestOptions, (response) => {
        if (!(0, multipleRangeDownloader_1.checkIsRangesSupported)(response, reject)) {
          return;
        }
        response.on("error", reject);
        response.on("aborted", () => {
          reject(new Error("response has been aborted by the server"));
        });
        response.on("data", dataHandler);
        response.on("end", () => resolve());
      });
      this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
      request.end();
    });
  }
}
DifferentialDownloader$1.DifferentialDownloader = DifferentialDownloader;
function formatBytes(value, symbol = " KB") {
  return new Intl.NumberFormat("en").format((value / 1024).toFixed(2)) + symbol;
}
function removeQuery(url) {
  const index = url.indexOf("?");
  return index < 0 ? url : url.substring(0, index);
}
Object.defineProperty(GenericDifferentialDownloader$1, "__esModule", { value: true });
GenericDifferentialDownloader$1.GenericDifferentialDownloader = void 0;
const DifferentialDownloader_1$1 = DifferentialDownloader$1;
class GenericDifferentialDownloader extends DifferentialDownloader_1$1.DifferentialDownloader {
  download(oldBlockMap, newBlockMap) {
    return this.doDownload(oldBlockMap, newBlockMap);
  }
}
GenericDifferentialDownloader$1.GenericDifferentialDownloader = GenericDifferentialDownloader;
var types = {};
(function(exports$1) {
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.UpdaterSignal = exports$1.UPDATE_DOWNLOADED = exports$1.DOWNLOAD_PROGRESS = exports$1.CancellationToken = void 0;
  exports$1.addHandler = addHandler;
  const builder_util_runtime_12 = out;
  Object.defineProperty(exports$1, "CancellationToken", { enumerable: true, get: function() {
    return builder_util_runtime_12.CancellationToken;
  } });
  exports$1.DOWNLOAD_PROGRESS = "download-progress";
  exports$1.UPDATE_DOWNLOADED = "update-downloaded";
  class UpdaterSignal {
    constructor(emitter) {
      this.emitter = emitter;
    }
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(handler) {
      addHandler(this.emitter, "login", handler);
    }
    progress(handler) {
      addHandler(this.emitter, exports$1.DOWNLOAD_PROGRESS, handler);
    }
    updateDownloaded(handler) {
      addHandler(this.emitter, exports$1.UPDATE_DOWNLOADED, handler);
    }
    updateCancelled(handler) {
      addHandler(this.emitter, "update-cancelled", handler);
    }
  }
  exports$1.UpdaterSignal = UpdaterSignal;
  function addHandler(emitter, event, handler) {
    {
      emitter.on(event, handler);
    }
  }
})(types);
Object.defineProperty(AppUpdater$1, "__esModule", { value: true });
AppUpdater$1.NoOpLogger = AppUpdater$1.AppUpdater = void 0;
const builder_util_runtime_1$4 = out;
const crypto_1$1 = require$$0$6;
const os_1 = require$$2;
const events_1 = require$$0$5;
const fs_extra_1$4 = lib;
const js_yaml_1 = jsYaml;
const lazy_val_1 = main;
const path$4 = require$$1$3;
const semver_1 = semver$1;
const DownloadedUpdateHelper_1 = DownloadedUpdateHelper$1;
const ElectronAppAdapter_1 = ElectronAppAdapter$1;
const electronHttpExecutor_1 = electronHttpExecutor;
const GenericProvider_1 = GenericProvider$1;
const providerFactory_1 = providerFactory;
const zlib_1$1 = require$$14;
const util_1 = util;
const GenericDifferentialDownloader_1 = GenericDifferentialDownloader$1;
const types_1$5 = types;
class AppUpdater extends events_1.EventEmitter {
  /**
   * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
   */
  get channel() {
    return this._channel;
  }
  /**
   * Set the update channel. Overrides `channel` in the update configuration.
   *
   * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
   */
  set channel(value) {
    if (this._channel != null) {
      if (typeof value !== "string") {
        throw (0, builder_util_runtime_1$4.newError)(`Channel must be a string, but got: ${value}`, "ERR_UPDATER_INVALID_CHANNEL");
      } else if (value.length === 0) {
        throw (0, builder_util_runtime_1$4.newError)(`Channel must be not an empty string`, "ERR_UPDATER_INVALID_CHANNEL");
      }
    }
    this._channel = value;
    this.allowDowngrade = true;
  }
  /**
   *  Shortcut for explicitly adding auth tokens to request headers
   */
  addAuthHeader(token) {
    this.requestHeaders = Object.assign({}, this.requestHeaders, {
      authorization: token
    });
  }
  // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  get netSession() {
    return (0, electronHttpExecutor_1.getNetSession)();
  }
  /**
   * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
   * Set it to `null` if you would like to disable a logging feature.
   */
  get logger() {
    return this._logger;
  }
  set logger(value) {
    this._logger = value == null ? new NoOpLogger() : value;
  }
  // noinspection JSUnusedGlobalSymbols
  /**
   * test only
   * @private
   */
  set updateConfigPath(value) {
    this.clientPromise = null;
    this._appUpdateConfigPath = value;
    this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
  }
  /**
   * Allows developer to override default logic for determining if an update is supported.
   * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
   */
  get isUpdateSupported() {
    return this._isUpdateSupported;
  }
  set isUpdateSupported(value) {
    if (value) {
      this._isUpdateSupported = value;
    }
  }
  constructor(options, app) {
    super();
    this.autoDownload = true;
    this.autoInstallOnAppQuit = true;
    this.autoRunAppAfterInstall = true;
    this.allowPrerelease = false;
    this.fullChangelog = false;
    this.allowDowngrade = false;
    this.disableWebInstaller = false;
    this.disableDifferentialDownload = false;
    this.forceDevUpdateConfig = false;
    this._channel = null;
    this.downloadedUpdateHelper = null;
    this.requestHeaders = null;
    this._logger = console;
    this.signals = new types_1$5.UpdaterSignal(this);
    this._appUpdateConfigPath = null;
    this._isUpdateSupported = (updateInfo) => this.checkIfUpdateSupported(updateInfo);
    this.clientPromise = null;
    this.stagingUserIdPromise = new lazy_val_1.Lazy(() => this.getOrCreateStagingUserId());
    this.configOnDisk = new lazy_val_1.Lazy(() => this.loadUpdateConfig());
    this.checkForUpdatesPromise = null;
    this.downloadPromise = null;
    this.updateInfoAndProvider = null;
    this._testOnlyOptions = null;
    this.on("error", (error2) => {
      this._logger.error(`Error: ${error2.stack || error2.message}`);
    });
    if (app == null) {
      this.app = new ElectronAppAdapter_1.ElectronAppAdapter();
      this.httpExecutor = new electronHttpExecutor_1.ElectronHttpExecutor((authInfo, callback) => this.emit("login", authInfo, callback));
    } else {
      this.app = app;
      this.httpExecutor = null;
    }
    const currentVersionString = this.app.version;
    const currentVersion = (0, semver_1.parse)(currentVersionString);
    if (currentVersion == null) {
      throw (0, builder_util_runtime_1$4.newError)(`App version is not a valid semver version: "${currentVersionString}"`, "ERR_UPDATER_INVALID_VERSION");
    }
    this.currentVersion = currentVersion;
    this.allowPrerelease = hasPrereleaseComponents(currentVersion);
    if (options != null) {
      this.setFeedURL(options);
      if (typeof options !== "string" && options.requestHeaders) {
        this.requestHeaders = options.requestHeaders;
      }
    }
  }
  //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
  getFeedURL() {
    return "Deprecated. Do not use it.";
  }
  /**
   * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
   * @param options If you want to override configuration in the `app-update.yml`.
   */
  setFeedURL(options) {
    const runtimeOptions = this.createProviderRuntimeOptions();
    let provider;
    if (typeof options === "string") {
      provider = new GenericProvider_1.GenericProvider({ provider: "generic", url: options }, this, {
        ...runtimeOptions,
        isUseMultipleRangeRequest: (0, providerFactory_1.isUrlProbablySupportMultiRangeRequests)(options)
      });
    } else {
      provider = (0, providerFactory_1.createClient)(options, this, runtimeOptions);
    }
    this.clientPromise = Promise.resolve(provider);
  }
  /**
   * Asks the server whether there is an update.
   * @returns null if the updater is disabled, otherwise info about the latest version
   */
  checkForUpdates() {
    if (!this.isUpdaterActive()) {
      return Promise.resolve(null);
    }
    let checkForUpdatesPromise = this.checkForUpdatesPromise;
    if (checkForUpdatesPromise != null) {
      this._logger.info("Checking for update (already in progress)");
      return checkForUpdatesPromise;
    }
    const nullizePromise = () => this.checkForUpdatesPromise = null;
    this._logger.info("Checking for update");
    checkForUpdatesPromise = this.doCheckForUpdates().then((it) => {
      nullizePromise();
      return it;
    }).catch((e) => {
      nullizePromise();
      this.emit("error", e, `Cannot check for updates: ${(e.stack || e).toString()}`);
      throw e;
    });
    this.checkForUpdatesPromise = checkForUpdatesPromise;
    return checkForUpdatesPromise;
  }
  isUpdaterActive() {
    const isEnabled = this.app.isPackaged || this.forceDevUpdateConfig;
    if (!isEnabled) {
      this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced");
      return false;
    }
    return true;
  }
  // noinspection JSUnusedGlobalSymbols
  checkForUpdatesAndNotify(downloadNotification) {
    return this.checkForUpdates().then((it) => {
      if (!(it === null || it === void 0 ? void 0 : it.downloadPromise)) {
        if (this._logger.debug != null) {
          this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null");
        }
        return it;
      }
      void it.downloadPromise.then(() => {
        const notificationContent = AppUpdater.formatDownloadNotification(it.updateInfo.version, this.app.name, downloadNotification);
        new require$$1.Notification(notificationContent).show();
      });
      return it;
    });
  }
  static formatDownloadNotification(version, appName, downloadNotification) {
    if (downloadNotification == null) {
      downloadNotification = {
        title: "A new update is ready to install",
        body: `{appName} version {version} has been downloaded and will be automatically installed on exit`
      };
    }
    downloadNotification = {
      title: downloadNotification.title.replace("{appName}", appName).replace("{version}", version),
      body: downloadNotification.body.replace("{appName}", appName).replace("{version}", version)
    };
    return downloadNotification;
  }
  async isStagingMatch(updateInfo) {
    const rawStagingPercentage = updateInfo.stagingPercentage;
    let stagingPercentage = rawStagingPercentage;
    if (stagingPercentage == null) {
      return true;
    }
    stagingPercentage = parseInt(stagingPercentage, 10);
    if (isNaN(stagingPercentage)) {
      this._logger.warn(`Staging percentage is NaN: ${rawStagingPercentage}`);
      return true;
    }
    stagingPercentage = stagingPercentage / 100;
    const stagingUserId = await this.stagingUserIdPromise.value;
    const val = builder_util_runtime_1$4.UUID.parse(stagingUserId).readUInt32BE(12);
    const percentage = val / 4294967295;
    this._logger.info(`Staging percentage: ${stagingPercentage}, percentage: ${percentage}, user id: ${stagingUserId}`);
    return percentage < stagingPercentage;
  }
  computeFinalHeaders(headers) {
    if (this.requestHeaders != null) {
      Object.assign(headers, this.requestHeaders);
    }
    return headers;
  }
  async isUpdateAvailable(updateInfo) {
    const latestVersion = (0, semver_1.parse)(updateInfo.version);
    if (latestVersion == null) {
      throw (0, builder_util_runtime_1$4.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${updateInfo.version}"`, "ERR_UPDATER_INVALID_VERSION");
    }
    const currentVersion = this.currentVersion;
    if ((0, semver_1.eq)(latestVersion, currentVersion)) {
      return false;
    }
    if (!await Promise.resolve(this.isUpdateSupported(updateInfo))) {
      return false;
    }
    const isStagingMatch = await this.isStagingMatch(updateInfo);
    if (!isStagingMatch) {
      return false;
    }
    const isLatestVersionNewer = (0, semver_1.gt)(latestVersion, currentVersion);
    const isLatestVersionOlder = (0, semver_1.lt)(latestVersion, currentVersion);
    if (isLatestVersionNewer) {
      return true;
    }
    return this.allowDowngrade && isLatestVersionOlder;
  }
  checkIfUpdateSupported(updateInfo) {
    const minimumSystemVersion = updateInfo === null || updateInfo === void 0 ? void 0 : updateInfo.minimumSystemVersion;
    const currentOSVersion = (0, os_1.release)();
    if (minimumSystemVersion) {
      try {
        if ((0, semver_1.lt)(currentOSVersion, minimumSystemVersion)) {
          this._logger.info(`Current OS version ${currentOSVersion} is less than the minimum OS version required ${minimumSystemVersion} for version ${currentOSVersion}`);
          return false;
        }
      } catch (e) {
        this._logger.warn(`Failed to compare current OS version(${currentOSVersion}) with minimum OS version(${minimumSystemVersion}): ${(e.message || e).toString()}`);
      }
    }
    return true;
  }
  async getUpdateInfoAndProvider() {
    await this.app.whenReady();
    if (this.clientPromise == null) {
      this.clientPromise = this.configOnDisk.value.then((it) => (0, providerFactory_1.createClient)(it, this, this.createProviderRuntimeOptions()));
    }
    const client = await this.clientPromise;
    const stagingUserId = await this.stagingUserIdPromise.value;
    client.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": stagingUserId }));
    return {
      info: await client.getLatestVersion(),
      provider: client
    };
  }
  createProviderRuntimeOptions() {
    return {
      isUseMultipleRangeRequest: true,
      platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
      executor: this.httpExecutor
    };
  }
  async doCheckForUpdates() {
    this.emit("checking-for-update");
    const result = await this.getUpdateInfoAndProvider();
    const updateInfo = result.info;
    if (!await this.isUpdateAvailable(updateInfo)) {
      this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${updateInfo.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`);
      this.emit("update-not-available", updateInfo);
      return {
        isUpdateAvailable: false,
        versionInfo: updateInfo,
        updateInfo
      };
    }
    this.updateInfoAndProvider = result;
    this.onUpdateAvailable(updateInfo);
    const cancellationToken = new builder_util_runtime_1$4.CancellationToken();
    return {
      isUpdateAvailable: true,
      versionInfo: updateInfo,
      updateInfo,
      cancellationToken,
      downloadPromise: this.autoDownload ? this.downloadUpdate(cancellationToken) : null
    };
  }
  onUpdateAvailable(updateInfo) {
    this._logger.info(`Found version ${updateInfo.version} (url: ${(0, builder_util_runtime_1$4.asArray)(updateInfo.files).map((it) => it.url).join(", ")})`);
    this.emit("update-available", updateInfo);
  }
  /**
   * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
   * @returns {Promise<Array<string>>} Paths to downloaded files.
   */
  downloadUpdate(cancellationToken = new builder_util_runtime_1$4.CancellationToken()) {
    const updateInfoAndProvider = this.updateInfoAndProvider;
    if (updateInfoAndProvider == null) {
      const error2 = new Error("Please check update first");
      this.dispatchError(error2);
      return Promise.reject(error2);
    }
    if (this.downloadPromise != null) {
      this._logger.info("Downloading update (already in progress)");
      return this.downloadPromise;
    }
    this._logger.info(`Downloading update from ${(0, builder_util_runtime_1$4.asArray)(updateInfoAndProvider.info.files).map((it) => it.url).join(", ")}`);
    const errorHandler = (e) => {
      if (!(e instanceof builder_util_runtime_1$4.CancellationError)) {
        try {
          this.dispatchError(e);
        } catch (nestedError) {
          this._logger.warn(`Cannot dispatch error event: ${nestedError.stack || nestedError}`);
        }
      }
      return e;
    };
    this.downloadPromise = this.doDownloadUpdate({
      updateInfoAndProvider,
      requestHeaders: this.computeRequestHeaders(updateInfoAndProvider.provider),
      cancellationToken,
      disableWebInstaller: this.disableWebInstaller,
      disableDifferentialDownload: this.disableDifferentialDownload
    }).catch((e) => {
      throw errorHandler(e);
    }).finally(() => {
      this.downloadPromise = null;
    });
    return this.downloadPromise;
  }
  dispatchError(e) {
    this.emit("error", e, (e.stack || e).toString());
  }
  dispatchUpdateDownloaded(event) {
    this.emit(types_1$5.UPDATE_DOWNLOADED, event);
  }
  async loadUpdateConfig() {
    if (this._appUpdateConfigPath == null) {
      this._appUpdateConfigPath = this.app.appUpdateConfigPath;
    }
    return (0, js_yaml_1.load)(await (0, fs_extra_1$4.readFile)(this._appUpdateConfigPath, "utf-8"));
  }
  computeRequestHeaders(provider) {
    const fileExtraDownloadHeaders = provider.fileExtraDownloadHeaders;
    if (fileExtraDownloadHeaders != null) {
      const requestHeaders = this.requestHeaders;
      return requestHeaders == null ? fileExtraDownloadHeaders : {
        ...fileExtraDownloadHeaders,
        ...requestHeaders
      };
    }
    return this.computeFinalHeaders({ accept: "*/*" });
  }
  async getOrCreateStagingUserId() {
    const file2 = path$4.join(this.app.userDataPath, ".updaterId");
    try {
      const id2 = await (0, fs_extra_1$4.readFile)(file2, "utf-8");
      if (builder_util_runtime_1$4.UUID.check(id2)) {
        return id2;
      } else {
        this._logger.warn(`Staging user id file exists, but content was invalid: ${id2}`);
      }
    } catch (e) {
      if (e.code !== "ENOENT") {
        this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${e}`);
      }
    }
    const id = builder_util_runtime_1$4.UUID.v5((0, crypto_1$1.randomBytes)(4096), builder_util_runtime_1$4.UUID.OID);
    this._logger.info(`Generated new staging user ID: ${id}`);
    try {
      await (0, fs_extra_1$4.outputFile)(file2, id);
    } catch (e) {
      this._logger.warn(`Couldn't write out staging user ID: ${e}`);
    }
    return id;
  }
  /** @internal */
  get isAddNoCacheQuery() {
    const headers = this.requestHeaders;
    if (headers == null) {
      return true;
    }
    for (const headerName of Object.keys(headers)) {
      const s = headerName.toLowerCase();
      if (s === "authorization" || s === "private-token") {
        return false;
      }
    }
    return true;
  }
  async getOrCreateDownloadHelper() {
    let result = this.downloadedUpdateHelper;
    if (result == null) {
      const dirName = (await this.configOnDisk.value).updaterCacheDirName;
      const logger2 = this._logger;
      if (dirName == null) {
        logger2.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
      }
      const cacheDir = path$4.join(this.app.baseCachePath, dirName || this.app.name);
      if (logger2.debug != null) {
        logger2.debug(`updater cache dir: ${cacheDir}`);
      }
      result = new DownloadedUpdateHelper_1.DownloadedUpdateHelper(cacheDir);
      this.downloadedUpdateHelper = result;
    }
    return result;
  }
  async executeDownload(taskOptions) {
    const fileInfo = taskOptions.fileInfo;
    const downloadOptions = {
      headers: taskOptions.downloadUpdateOptions.requestHeaders,
      cancellationToken: taskOptions.downloadUpdateOptions.cancellationToken,
      sha2: fileInfo.info.sha2,
      sha512: fileInfo.info.sha512
    };
    if (this.listenerCount(types_1$5.DOWNLOAD_PROGRESS) > 0) {
      downloadOptions.onProgress = (it) => this.emit(types_1$5.DOWNLOAD_PROGRESS, it);
    }
    const updateInfo = taskOptions.downloadUpdateOptions.updateInfoAndProvider.info;
    const version = updateInfo.version;
    const packageInfo = fileInfo.packageInfo;
    function getCacheUpdateFileName() {
      const urlPath = decodeURIComponent(taskOptions.fileInfo.url.pathname);
      if (urlPath.endsWith(`.${taskOptions.fileExtension}`)) {
        return path$4.basename(urlPath);
      } else {
        return taskOptions.fileInfo.info.url;
      }
    }
    const downloadedUpdateHelper = await this.getOrCreateDownloadHelper();
    const cacheDir = downloadedUpdateHelper.cacheDirForPendingUpdate;
    await (0, fs_extra_1$4.mkdir)(cacheDir, { recursive: true });
    const updateFileName = getCacheUpdateFileName();
    let updateFile = path$4.join(cacheDir, updateFileName);
    const packageFile = packageInfo == null ? null : path$4.join(cacheDir, `package-${version}${path$4.extname(packageInfo.path) || ".7z"}`);
    const done = async (isSaveCache) => {
      await downloadedUpdateHelper.setDownloadedFile(updateFile, packageFile, updateInfo, fileInfo, updateFileName, isSaveCache);
      await taskOptions.done({
        ...updateInfo,
        downloadedFile: updateFile
      });
      return packageFile == null ? [updateFile] : [updateFile, packageFile];
    };
    const log = this._logger;
    const cachedUpdateFile = await downloadedUpdateHelper.validateDownloadedPath(updateFile, updateInfo, fileInfo, log);
    if (cachedUpdateFile != null) {
      updateFile = cachedUpdateFile;
      return await done(false);
    }
    const removeFileIfAny = async () => {
      await downloadedUpdateHelper.clear().catch(() => {
      });
      return await (0, fs_extra_1$4.unlink)(updateFile).catch(() => {
      });
    };
    const tempUpdateFile = await (0, DownloadedUpdateHelper_1.createTempUpdateFile)(`temp-${updateFileName}`, cacheDir, log);
    try {
      await taskOptions.task(tempUpdateFile, downloadOptions, packageFile, removeFileIfAny);
      await (0, builder_util_runtime_1$4.retry)(() => (0, fs_extra_1$4.rename)(tempUpdateFile, updateFile), 60, 500, 0, 0, (error2) => error2 instanceof Error && /^EBUSY:/.test(error2.message));
    } catch (e) {
      await removeFileIfAny();
      if (e instanceof builder_util_runtime_1$4.CancellationError) {
        log.info("cancelled");
        this.emit("update-cancelled", updateInfo);
      }
      throw e;
    }
    log.info(`New version ${version} has been downloaded to ${updateFile}`);
    return await done(true);
  }
  async differentialDownloadInstaller(fileInfo, downloadUpdateOptions, installerPath, provider, oldInstallerFileName) {
    try {
      if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload) {
        return true;
      }
      const blockmapFileUrls = (0, util_1.blockmapFiles)(fileInfo.url, this.app.version, downloadUpdateOptions.updateInfoAndProvider.info.version);
      this._logger.info(`Download block maps (old: "${blockmapFileUrls[0]}", new: ${blockmapFileUrls[1]})`);
      const downloadBlockMap = async (url) => {
        const data = await this.httpExecutor.downloadToBuffer(url, {
          headers: downloadUpdateOptions.requestHeaders,
          cancellationToken: downloadUpdateOptions.cancellationToken
        });
        if (data == null || data.length === 0) {
          throw new Error(`Blockmap "${url.href}" is empty`);
        }
        try {
          return JSON.parse((0, zlib_1$1.gunzipSync)(data).toString());
        } catch (e) {
          throw new Error(`Cannot parse blockmap "${url.href}", error: ${e}`);
        }
      };
      const downloadOptions = {
        newUrl: fileInfo.url,
        oldFile: path$4.join(this.downloadedUpdateHelper.cacheDir, oldInstallerFileName),
        logger: this._logger,
        newFile: installerPath,
        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        requestHeaders: downloadUpdateOptions.requestHeaders,
        cancellationToken: downloadUpdateOptions.cancellationToken
      };
      if (this.listenerCount(types_1$5.DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = (it) => this.emit(types_1$5.DOWNLOAD_PROGRESS, it);
      }
      const blockMapDataList = await Promise.all(blockmapFileUrls.map((u2) => downloadBlockMap(u2)));
      await new GenericDifferentialDownloader_1.GenericDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download(blockMapDataList[0], blockMapDataList[1]);
      return false;
    } catch (e) {
      this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
      if (this._testOnlyOptions != null) {
        throw e;
      }
      return true;
    }
  }
}
AppUpdater$1.AppUpdater = AppUpdater;
function hasPrereleaseComponents(version) {
  const versionPrereleaseComponent = (0, semver_1.prerelease)(version);
  return versionPrereleaseComponent != null && versionPrereleaseComponent.length > 0;
}
class NoOpLogger {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(message) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(message) {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(message) {
  }
}
AppUpdater$1.NoOpLogger = NoOpLogger;
Object.defineProperty(BaseUpdater$1, "__esModule", { value: true });
BaseUpdater$1.BaseUpdater = void 0;
const child_process_1$3 = require$$1$6;
const AppUpdater_1$1 = AppUpdater$1;
class BaseUpdater extends AppUpdater_1$1.AppUpdater {
  constructor(options, app) {
    super(options, app);
    this.quitAndInstallCalled = false;
    this.quitHandlerAdded = false;
  }
  quitAndInstall(isSilent = false, isForceRunAfter = false) {
    this._logger.info(`Install on explicit quitAndInstall`);
    const isInstalled = this.install(isSilent, isSilent ? isForceRunAfter : this.autoRunAppAfterInstall);
    if (isInstalled) {
      setImmediate(() => {
        require$$1.autoUpdater.emit("before-quit-for-update");
        this.app.quit();
      });
    } else {
      this.quitAndInstallCalled = false;
    }
  }
  executeDownload(taskOptions) {
    return super.executeDownload({
      ...taskOptions,
      done: (event) => {
        this.dispatchUpdateDownloaded(event);
        this.addQuitHandler();
        return Promise.resolve();
      }
    });
  }
  get installerPath() {
    return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
  }
  // must be sync (because quit even handler is not async)
  install(isSilent = false, isForceRunAfter = false) {
    if (this.quitAndInstallCalled) {
      this._logger.warn("install call ignored: quitAndInstallCalled is set to true");
      return false;
    }
    const downloadedUpdateHelper = this.downloadedUpdateHelper;
    const installerPath = this.installerPath;
    const downloadedFileInfo = downloadedUpdateHelper == null ? null : downloadedUpdateHelper.downloadedFileInfo;
    if (installerPath == null || downloadedFileInfo == null) {
      this.dispatchError(new Error("No valid update available, can't quit and install"));
      return false;
    }
    this.quitAndInstallCalled = true;
    try {
      this._logger.info(`Install: isSilent: ${isSilent}, isForceRunAfter: ${isForceRunAfter}`);
      return this.doInstall({
        isSilent,
        isForceRunAfter,
        isAdminRightsRequired: downloadedFileInfo.isAdminRightsRequired
      });
    } catch (e) {
      this.dispatchError(e);
      return false;
    }
  }
  addQuitHandler() {
    if (this.quitHandlerAdded || !this.autoInstallOnAppQuit) {
      return;
    }
    this.quitHandlerAdded = true;
    this.app.onQuit((exitCode) => {
      if (this.quitAndInstallCalled) {
        this._logger.info("Update installer has already been triggered. Quitting application.");
        return;
      }
      if (!this.autoInstallOnAppQuit) {
        this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
        return;
      }
      if (exitCode !== 0) {
        this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${exitCode}`);
        return;
      }
      this._logger.info("Auto install update on quit");
      this.install(true, false);
    });
  }
  wrapSudo() {
    const { name } = this.app;
    const installComment = `"${name} would like to update"`;
    const sudo = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu");
    const command = [sudo];
    if (/kdesudo/i.test(sudo)) {
      command.push("--comment", installComment);
      command.push("-c");
    } else if (/gksudo/i.test(sudo)) {
      command.push("--message", installComment);
    } else if (/pkexec/i.test(sudo)) {
      command.push("--disable-internal-agent");
    }
    return command.join(" ");
  }
  spawnSyncLog(cmd, args = [], env = {}) {
    this._logger.info(`Executing: ${cmd} with args: ${args}`);
    const response = (0, child_process_1$3.spawnSync)(cmd, args, {
      env: { ...process.env, ...env },
      encoding: "utf-8",
      shell: true
    });
    const { error: error2, status, stdout, stderr } = response;
    if (error2 != null) {
      this._logger.error(stderr);
      throw error2;
    } else if (status != null && status !== 0) {
      this._logger.error(stderr);
      throw new Error(`Command ${cmd} exited with code ${status}`);
    }
    return stdout.trim();
  }
  /**
   * This handles both node 8 and node 10 way of emitting error when spawning a process
   *   - node 8: Throws the error
   *   - node 10: Emit the error(Need to listen with on)
   */
  // https://github.com/electron-userland/electron-builder/issues/1129
  // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
  async spawnLog(cmd, args = [], env = void 0, stdio = "ignore") {
    this._logger.info(`Executing: ${cmd} with args: ${args}`);
    return new Promise((resolve, reject) => {
      try {
        const params = { stdio, env, detached: true };
        const p = (0, child_process_1$3.spawn)(cmd, args, params);
        p.on("error", (error2) => {
          reject(error2);
        });
        p.unref();
        if (p.pid !== void 0) {
          resolve(true);
        }
      } catch (error2) {
        reject(error2);
      }
    });
  }
}
BaseUpdater$1.BaseUpdater = BaseUpdater;
var AppImageUpdater$1 = {};
var FileWithEmbeddedBlockMapDifferentialDownloader$1 = {};
Object.defineProperty(FileWithEmbeddedBlockMapDifferentialDownloader$1, "__esModule", { value: true });
FileWithEmbeddedBlockMapDifferentialDownloader$1.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
const fs_extra_1$3 = lib;
const DifferentialDownloader_1 = DifferentialDownloader$1;
const zlib_1 = require$$14;
class FileWithEmbeddedBlockMapDifferentialDownloader extends DifferentialDownloader_1.DifferentialDownloader {
  async download() {
    const packageInfo = this.blockAwareFileInfo;
    const fileSize = packageInfo.size;
    const offset = fileSize - (packageInfo.blockMapSize + 4);
    this.fileMetadataBuffer = await this.readRemoteBytes(offset, fileSize - 1);
    const newBlockMap = readBlockMap(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
    await this.doDownload(await readEmbeddedBlockMapData(this.options.oldFile), newBlockMap);
  }
}
FileWithEmbeddedBlockMapDifferentialDownloader$1.FileWithEmbeddedBlockMapDifferentialDownloader = FileWithEmbeddedBlockMapDifferentialDownloader;
function readBlockMap(data) {
  return JSON.parse((0, zlib_1.inflateRawSync)(data).toString());
}
async function readEmbeddedBlockMapData(file2) {
  const fd = await (0, fs_extra_1$3.open)(file2, "r");
  try {
    const fileSize = (await (0, fs_extra_1$3.fstat)(fd)).size;
    const sizeBuffer = Buffer.allocUnsafe(4);
    await (0, fs_extra_1$3.read)(fd, sizeBuffer, 0, sizeBuffer.length, fileSize - sizeBuffer.length);
    const dataBuffer = Buffer.allocUnsafe(sizeBuffer.readUInt32BE(0));
    await (0, fs_extra_1$3.read)(fd, dataBuffer, 0, dataBuffer.length, fileSize - sizeBuffer.length - dataBuffer.length);
    await (0, fs_extra_1$3.close)(fd);
    return readBlockMap(dataBuffer);
  } catch (e) {
    await (0, fs_extra_1$3.close)(fd);
    throw e;
  }
}
Object.defineProperty(AppImageUpdater$1, "__esModule", { value: true });
AppImageUpdater$1.AppImageUpdater = void 0;
const builder_util_runtime_1$3 = out;
const child_process_1$2 = require$$1$6;
const fs_extra_1$2 = lib;
const fs_1$1 = require$$1$2;
const path$3 = require$$1$3;
const BaseUpdater_1$4 = BaseUpdater$1;
const FileWithEmbeddedBlockMapDifferentialDownloader_1$1 = FileWithEmbeddedBlockMapDifferentialDownloader$1;
const Provider_1$5 = Provider$1;
const types_1$4 = types;
class AppImageUpdater extends BaseUpdater_1$4.BaseUpdater {
  constructor(options, app) {
    super(options, app);
  }
  isUpdaterActive() {
    if (process.env["APPIMAGE"] == null) {
      if (process.env["SNAP"] == null) {
        this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage");
      } else {
        this._logger.info("SNAP env is defined, updater is disabled");
      }
      return false;
    }
    return super.isUpdaterActive();
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$5.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "AppImage",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        const oldFile = process.env["APPIMAGE"];
        if (oldFile == null) {
          throw (0, builder_util_runtime_1$3.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
        }
        if (downloadUpdateOptions.disableDifferentialDownload || await this.downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions)) {
          await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
        }
        await (0, fs_extra_1$2.chmod)(updateFile, 493);
      }
    });
  }
  async downloadDifferential(fileInfo, oldFile, updateFile, provider, downloadUpdateOptions) {
    try {
      const downloadOptions = {
        newUrl: fileInfo.url,
        oldFile,
        logger: this._logger,
        newFile: updateFile,
        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        requestHeaders: downloadUpdateOptions.requestHeaders,
        cancellationToken: downloadUpdateOptions.cancellationToken
      };
      if (this.listenerCount(types_1$4.DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = (it) => this.emit(types_1$4.DOWNLOAD_PROGRESS, it);
      }
      await new FileWithEmbeddedBlockMapDifferentialDownloader_1$1.FileWithEmbeddedBlockMapDifferentialDownloader(fileInfo.info, this.httpExecutor, downloadOptions).download();
      return false;
    } catch (e) {
      this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
      return process.platform === "linux";
    }
  }
  doInstall(options) {
    const appImageFile = process.env["APPIMAGE"];
    if (appImageFile == null) {
      throw (0, builder_util_runtime_1$3.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
    }
    (0, fs_1$1.unlinkSync)(appImageFile);
    let destination;
    const existingBaseName = path$3.basename(appImageFile);
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No valid update available, can't quit and install"));
      return false;
    }
    if (path$3.basename(installerPath) === existingBaseName || !/\d+\.\d+\.\d+/.test(existingBaseName)) {
      destination = appImageFile;
    } else {
      destination = path$3.join(path$3.dirname(appImageFile), path$3.basename(installerPath));
    }
    (0, child_process_1$2.execFileSync)("mv", ["-f", installerPath, destination]);
    if (destination !== appImageFile) {
      this.emit("appimage-filename-updated", destination);
    }
    const env = {
      ...process.env,
      APPIMAGE_SILENT_INSTALL: "true"
    };
    if (options.isForceRunAfter) {
      this.spawnLog(destination, [], env);
    } else {
      env.APPIMAGE_EXIT_AFTER_INSTALL = "true";
      (0, child_process_1$2.execFileSync)(destination, [], { env });
    }
    return true;
  }
}
AppImageUpdater$1.AppImageUpdater = AppImageUpdater;
var DebUpdater$1 = {};
Object.defineProperty(DebUpdater$1, "__esModule", { value: true });
DebUpdater$1.DebUpdater = void 0;
const BaseUpdater_1$3 = BaseUpdater$1;
const Provider_1$4 = Provider$1;
const types_1$3 = types;
class DebUpdater extends BaseUpdater_1$3.BaseUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$4.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
    return this.executeDownload({
      fileExtension: "deb",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        if (this.listenerCount(types_1$3.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1$3.DOWNLOAD_PROGRESS, it);
        }
        await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
      }
    });
  }
  get installerPath() {
    var _a, _b;
    return (_b = (_a = super.installerPath) === null || _a === void 0 ? void 0 : _a.replace(/ /g, "\\ ")) !== null && _b !== void 0 ? _b : null;
  }
  doInstall(options) {
    const sudo = this.wrapSudo();
    const wrapper = /pkexec/i.test(sudo) ? "" : `"`;
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No valid update available, can't quit and install"));
      return false;
    }
    const cmd = ["dpkg", "-i", installerPath, "||", "apt-get", "install", "-f", "-y"];
    this.spawnSyncLog(sudo, [`${wrapper}/bin/bash`, "-c", `'${cmd.join(" ")}'${wrapper}`]);
    if (options.isForceRunAfter) {
      this.app.relaunch();
    }
    return true;
  }
}
DebUpdater$1.DebUpdater = DebUpdater;
var PacmanUpdater$1 = {};
Object.defineProperty(PacmanUpdater$1, "__esModule", { value: true });
PacmanUpdater$1.PacmanUpdater = void 0;
const BaseUpdater_1$2 = BaseUpdater$1;
const types_1$2 = types;
const Provider_1$3 = Provider$1;
class PacmanUpdater extends BaseUpdater_1$2.BaseUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$3.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
    return this.executeDownload({
      fileExtension: "pacman",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        if (this.listenerCount(types_1$2.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1$2.DOWNLOAD_PROGRESS, it);
        }
        await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
      }
    });
  }
  get installerPath() {
    var _a, _b;
    return (_b = (_a = super.installerPath) === null || _a === void 0 ? void 0 : _a.replace(/ /g, "\\ ")) !== null && _b !== void 0 ? _b : null;
  }
  doInstall(options) {
    const sudo = this.wrapSudo();
    const wrapper = /pkexec/i.test(sudo) ? "" : `"`;
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No valid update available, can't quit and install"));
      return false;
    }
    const cmd = ["pacman", "-U", "--noconfirm", installerPath];
    this.spawnSyncLog(sudo, [`${wrapper}/bin/bash`, "-c", `'${cmd.join(" ")}'${wrapper}`]);
    if (options.isForceRunAfter) {
      this.app.relaunch();
    }
    return true;
  }
}
PacmanUpdater$1.PacmanUpdater = PacmanUpdater;
var RpmUpdater$1 = {};
Object.defineProperty(RpmUpdater$1, "__esModule", { value: true });
RpmUpdater$1.RpmUpdater = void 0;
const BaseUpdater_1$1 = BaseUpdater$1;
const types_1$1 = types;
const Provider_1$2 = Provider$1;
class RpmUpdater extends BaseUpdater_1$1.BaseUpdater {
  constructor(options, app) {
    super(options, app);
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1$2.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
    return this.executeDownload({
      fileExtension: "rpm",
      fileInfo,
      downloadUpdateOptions,
      task: async (updateFile, downloadOptions) => {
        if (this.listenerCount(types_1$1.DOWNLOAD_PROGRESS) > 0) {
          downloadOptions.onProgress = (it) => this.emit(types_1$1.DOWNLOAD_PROGRESS, it);
        }
        await this.httpExecutor.download(fileInfo.url, updateFile, downloadOptions);
      }
    });
  }
  get installerPath() {
    var _a, _b;
    return (_b = (_a = super.installerPath) === null || _a === void 0 ? void 0 : _a.replace(/ /g, "\\ ")) !== null && _b !== void 0 ? _b : null;
  }
  doInstall(options) {
    const sudo = this.wrapSudo();
    const wrapper = /pkexec/i.test(sudo) ? "" : `"`;
    const packageManager = this.spawnSyncLog("which zypper");
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No valid update available, can't quit and install"));
      return false;
    }
    let cmd;
    if (!packageManager) {
      const packageManager2 = this.spawnSyncLog("which dnf || which yum");
      cmd = [packageManager2, "-y", "install", installerPath];
    } else {
      cmd = [packageManager, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", installerPath];
    }
    this.spawnSyncLog(sudo, [`${wrapper}/bin/bash`, "-c", `'${cmd.join(" ")}'${wrapper}`]);
    if (options.isForceRunAfter) {
      this.app.relaunch();
    }
    return true;
  }
}
RpmUpdater$1.RpmUpdater = RpmUpdater;
var MacUpdater$1 = {};
Object.defineProperty(MacUpdater$1, "__esModule", { value: true });
MacUpdater$1.MacUpdater = void 0;
const builder_util_runtime_1$2 = out;
const fs_extra_1$1 = lib;
const fs_1 = require$$1$2;
const path$2 = require$$1$3;
const http_1 = require$$4$2;
const AppUpdater_1 = AppUpdater$1;
const Provider_1$1 = Provider$1;
const child_process_1$1 = require$$1$6;
const crypto_1 = require$$0$6;
class MacUpdater extends AppUpdater_1.AppUpdater {
  constructor(options, app) {
    super(options, app);
    this.nativeUpdater = require$$1.autoUpdater;
    this.squirrelDownloadedUpdate = false;
    this.nativeUpdater.on("error", (it) => {
      this._logger.warn(it);
      this.emit("error", it);
    });
    this.nativeUpdater.on("update-downloaded", () => {
      this.squirrelDownloadedUpdate = true;
      this.debug("nativeUpdater.update-downloaded");
    });
  }
  debug(message) {
    if (this._logger.debug != null) {
      this._logger.debug(message);
    }
  }
  closeServerIfExists() {
    if (this.server) {
      this.debug("Closing proxy server");
      this.server.close((err) => {
        if (err) {
          this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
        }
      });
    }
  }
  async doDownloadUpdate(downloadUpdateOptions) {
    let files = downloadUpdateOptions.updateInfoAndProvider.provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info);
    const log = this._logger;
    const sysctlRosettaInfoKey = "sysctl.proc_translated";
    let isRosetta = false;
    try {
      this.debug("Checking for macOS Rosetta environment");
      const result = (0, child_process_1$1.execFileSync)("sysctl", [sysctlRosettaInfoKey], { encoding: "utf8" });
      isRosetta = result.includes(`${sysctlRosettaInfoKey}: 1`);
      log.info(`Checked for macOS Rosetta environment (isRosetta=${isRosetta})`);
    } catch (e) {
      log.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${e}`);
    }
    let isArm64Mac = false;
    try {
      this.debug("Checking for arm64 in uname");
      const result = (0, child_process_1$1.execFileSync)("uname", ["-a"], { encoding: "utf8" });
      const isArm = result.includes("ARM");
      log.info(`Checked 'uname -a': arm64=${isArm}`);
      isArm64Mac = isArm64Mac || isArm;
    } catch (e) {
      log.warn(`uname shell command to check for arm64 failed: ${e}`);
    }
    isArm64Mac = isArm64Mac || process.arch === "arm64" || isRosetta;
    const isArm64 = (file2) => {
      var _a;
      return file2.url.pathname.includes("arm64") || ((_a = file2.info.url) === null || _a === void 0 ? void 0 : _a.includes("arm64"));
    };
    if (isArm64Mac && files.some(isArm64)) {
      files = files.filter((file2) => isArm64Mac === isArm64(file2));
    } else {
      files = files.filter((file2) => !isArm64(file2));
    }
    const zipFileInfo = (0, Provider_1$1.findFile)(files, "zip", ["pkg", "dmg"]);
    if (zipFileInfo == null) {
      throw (0, builder_util_runtime_1$2.newError)(`ZIP file not provided: ${(0, builder_util_runtime_1$2.safeStringifyJson)(files)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
    }
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const CURRENT_MAC_APP_ZIP_FILE_NAME = "update.zip";
    return this.executeDownload({
      fileExtension: "zip",
      fileInfo: zipFileInfo,
      downloadUpdateOptions,
      task: async (destinationFile, downloadOptions) => {
        const cachedUpdateFilePath = path$2.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
        const canDifferentialDownload = () => {
          if (!(0, fs_extra_1$1.pathExistsSync)(cachedUpdateFilePath)) {
            log.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download");
            return false;
          }
          return !downloadUpdateOptions.disableDifferentialDownload;
        };
        let differentialDownloadFailed = true;
        if (canDifferentialDownload()) {
          differentialDownloadFailed = await this.differentialDownloadInstaller(zipFileInfo, downloadUpdateOptions, destinationFile, provider, CURRENT_MAC_APP_ZIP_FILE_NAME);
        }
        if (differentialDownloadFailed) {
          await this.httpExecutor.download(zipFileInfo.url, destinationFile, downloadOptions);
        }
      },
      done: async (event) => {
        if (!downloadUpdateOptions.disableDifferentialDownload) {
          try {
            const cachedUpdateFilePath = path$2.join(this.downloadedUpdateHelper.cacheDir, CURRENT_MAC_APP_ZIP_FILE_NAME);
            await (0, fs_extra_1$1.copyFile)(event.downloadedFile, cachedUpdateFilePath);
          } catch (error2) {
            this._logger.warn(`Unable to copy file for caching for future differential downloads: ${error2.message}`);
          }
        }
        return this.updateDownloaded(zipFileInfo, event);
      }
    });
  }
  async updateDownloaded(zipFileInfo, event) {
    var _a;
    const downloadedFile = event.downloadedFile;
    const updateFileSize = (_a = zipFileInfo.info.size) !== null && _a !== void 0 ? _a : (await (0, fs_extra_1$1.stat)(downloadedFile)).size;
    const log = this._logger;
    const logContext = `fileToProxy=${zipFileInfo.url.href}`;
    this.closeServerIfExists();
    this.debug(`Creating proxy server for native Squirrel.Mac (${logContext})`);
    this.server = (0, http_1.createServer)();
    this.debug(`Proxy server for native Squirrel.Mac is created (${logContext})`);
    this.server.on("close", () => {
      log.info(`Proxy server for native Squirrel.Mac is closed (${logContext})`);
    });
    const getServerUrl = (s) => {
      const address = s.address();
      if (typeof address === "string") {
        return address;
      }
      return `http://127.0.0.1:${address === null || address === void 0 ? void 0 : address.port}`;
    };
    return await new Promise((resolve, reject) => {
      const pass = (0, crypto_1.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
      const authInfo = Buffer.from(`autoupdater:${pass}`, "ascii");
      const fileUrl = `/${(0, crypto_1.randomBytes)(64).toString("hex")}.zip`;
      this.server.on("request", (request, response) => {
        const requestUrl = request.url;
        log.info(`${requestUrl} requested`);
        if (requestUrl === "/") {
          if (!request.headers.authorization || request.headers.authorization.indexOf("Basic ") === -1) {
            response.statusCode = 401;
            response.statusMessage = "Invalid Authentication Credentials";
            response.end();
            log.warn("No authenthication info");
            return;
          }
          const base64Credentials = request.headers.authorization.split(" ")[1];
          const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
          const [username, password] = credentials.split(":");
          if (username !== "autoupdater" || password !== pass) {
            response.statusCode = 401;
            response.statusMessage = "Invalid Authentication Credentials";
            response.end();
            log.warn("Invalid authenthication credentials");
            return;
          }
          const data = Buffer.from(`{ "url": "${getServerUrl(this.server)}${fileUrl}" }`);
          response.writeHead(200, { "Content-Type": "application/json", "Content-Length": data.length });
          response.end(data);
          return;
        }
        if (!requestUrl.startsWith(fileUrl)) {
          log.warn(`${requestUrl} requested, but not supported`);
          response.writeHead(404);
          response.end();
          return;
        }
        log.info(`${fileUrl} requested by Squirrel.Mac, pipe ${downloadedFile}`);
        let errorOccurred = false;
        response.on("finish", () => {
          if (!errorOccurred) {
            this.nativeUpdater.removeListener("error", reject);
            resolve([]);
          }
        });
        const readStream = (0, fs_1.createReadStream)(downloadedFile);
        readStream.on("error", (error2) => {
          try {
            response.end();
          } catch (e) {
            log.warn(`cannot end response: ${e}`);
          }
          errorOccurred = true;
          this.nativeUpdater.removeListener("error", reject);
          reject(new Error(`Cannot pipe "${downloadedFile}": ${error2}`));
        });
        response.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Length": updateFileSize
        });
        readStream.pipe(response);
      });
      this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${logContext})`);
      this.server.listen(0, "127.0.0.1", () => {
        this.debug(`Proxy server for native Squirrel.Mac is listening (address=${getServerUrl(this.server)}, ${logContext})`);
        this.nativeUpdater.setFeedURL({
          url: getServerUrl(this.server),
          headers: {
            "Cache-Control": "no-cache",
            Authorization: `Basic ${authInfo.toString("base64")}`
          }
        });
        this.dispatchUpdateDownloaded(event);
        if (this.autoInstallOnAppQuit) {
          this.nativeUpdater.once("error", reject);
          this.nativeUpdater.checkForUpdates();
        } else {
          resolve([]);
        }
      });
    });
  }
  handleUpdateDownloaded() {
    if (this.autoRunAppAfterInstall) {
      this.nativeUpdater.quitAndInstall();
    } else {
      this.app.quit();
    }
    this.closeServerIfExists();
  }
  quitAndInstall() {
    if (this.squirrelDownloadedUpdate) {
      this.handleUpdateDownloaded();
    } else {
      this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded());
      if (!this.autoInstallOnAppQuit) {
        this.nativeUpdater.checkForUpdates();
      }
    }
  }
}
MacUpdater$1.MacUpdater = MacUpdater;
var NsisUpdater$1 = {};
var windowsExecutableCodeSignatureVerifier = {};
Object.defineProperty(windowsExecutableCodeSignatureVerifier, "__esModule", { value: true });
windowsExecutableCodeSignatureVerifier.verifySignature = verifySignature;
const builder_util_runtime_1$1 = out;
const child_process_1 = require$$1$6;
const os = require$$2;
const path$1 = require$$1$3;
function verifySignature(publisherNames, unescapedTempUpdateFile, logger2) {
  return new Promise((resolve, reject) => {
    const tempUpdateFile = unescapedTempUpdateFile.replace(/'/g, "''");
    logger2.info(`Verifying signature ${tempUpdateFile}`);
    (0, child_process_1.execFile)(`set "PSModulePath=" & chcp 65001 >NUL & powershell.exe`, ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${tempUpdateFile}' | ConvertTo-Json -Compress"`], {
      shell: true,
      timeout: 20 * 1e3
    }, (error2, stdout, stderr) => {
      var _a;
      try {
        if (error2 != null || stderr) {
          handleError(logger2, error2, stderr, reject);
          resolve(null);
          return;
        }
        const data = parseOut(stdout);
        if (data.Status === 0) {
          try {
            const normlaizedUpdateFilePath = path$1.normalize(data.Path);
            const normalizedTempUpdateFile = path$1.normalize(unescapedTempUpdateFile);
            logger2.info(`LiteralPath: ${normlaizedUpdateFilePath}. Update Path: ${normalizedTempUpdateFile}`);
            if (normlaizedUpdateFilePath !== normalizedTempUpdateFile) {
              handleError(logger2, new Error(`LiteralPath of ${normlaizedUpdateFilePath} is different than ${normalizedTempUpdateFile}`), stderr, reject);
              resolve(null);
              return;
            }
          } catch (error3) {
            logger2.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(_a = error3.message) !== null && _a !== void 0 ? _a : error3.stack}`);
          }
          const subject = (0, builder_util_runtime_1$1.parseDn)(data.SignerCertificate.Subject);
          let match = false;
          for (const name of publisherNames) {
            const dn = (0, builder_util_runtime_1$1.parseDn)(name);
            if (dn.size) {
              const allKeys = Array.from(dn.keys());
              match = allKeys.every((key) => {
                return dn.get(key) === subject.get(key);
              });
            } else if (name === subject.get("CN")) {
              logger2.warn(`Signature validated using only CN ${name}. Please add your full Distinguished Name (DN) to publisherNames configuration`);
              match = true;
            }
            if (match) {
              resolve(null);
              return;
            }
          }
        }
        const result = `publisherNames: ${publisherNames.join(" | ")}, raw info: ` + JSON.stringify(data, (name, value) => name === "RawData" ? void 0 : value, 2);
        logger2.warn(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
        resolve(result);
      } catch (e) {
        handleError(logger2, e, null, reject);
        resolve(null);
        return;
      }
    });
  });
}
function parseOut(out2) {
  const data = JSON.parse(out2);
  delete data.PrivateKey;
  delete data.IsOSBinary;
  delete data.SignatureType;
  const signerCertificate = data.SignerCertificate;
  if (signerCertificate != null) {
    delete signerCertificate.Archived;
    delete signerCertificate.Extensions;
    delete signerCertificate.Handle;
    delete signerCertificate.HasPrivateKey;
    delete signerCertificate.SubjectName;
  }
  return data;
}
function handleError(logger2, error2, stderr, reject) {
  if (isOldWin6()) {
    logger2.warn(`Cannot execute Get-AuthenticodeSignature: ${error2 || stderr}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  try {
    (0, child_process_1.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
  } catch (testError) {
    logger2.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
    return;
  }
  if (error2 != null) {
    reject(error2);
  }
  if (stderr) {
    reject(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${stderr}. Failing signature validation due to unknown stderr.`));
  }
}
function isOldWin6() {
  const winVersion = os.release();
  return winVersion.startsWith("6.") && !winVersion.startsWith("6.3");
}
Object.defineProperty(NsisUpdater$1, "__esModule", { value: true });
NsisUpdater$1.NsisUpdater = void 0;
const builder_util_runtime_1 = out;
const path = require$$1$3;
const BaseUpdater_1 = BaseUpdater$1;
const FileWithEmbeddedBlockMapDifferentialDownloader_1 = FileWithEmbeddedBlockMapDifferentialDownloader$1;
const types_1 = types;
const Provider_1 = Provider$1;
const fs_extra_1 = lib;
const windowsExecutableCodeSignatureVerifier_1 = windowsExecutableCodeSignatureVerifier;
const url_1 = require$$4$1;
class NsisUpdater extends BaseUpdater_1.BaseUpdater {
  constructor(options, app) {
    super(options, app);
    this._verifyUpdateCodeSignature = (publisherNames, unescapedTempUpdateFile) => (0, windowsExecutableCodeSignatureVerifier_1.verifySignature)(publisherNames, unescapedTempUpdateFile, this._logger);
  }
  /**
   * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
   * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
   */
  get verifyUpdateCodeSignature() {
    return this._verifyUpdateCodeSignature;
  }
  set verifyUpdateCodeSignature(value) {
    if (value) {
      this._verifyUpdateCodeSignature = value;
    }
  }
  /*** @private */
  doDownloadUpdate(downloadUpdateOptions) {
    const provider = downloadUpdateOptions.updateInfoAndProvider.provider;
    const fileInfo = (0, Provider_1.findFile)(provider.resolveFiles(downloadUpdateOptions.updateInfoAndProvider.info), "exe");
    return this.executeDownload({
      fileExtension: "exe",
      downloadUpdateOptions,
      fileInfo,
      task: async (destinationFile, downloadOptions, packageFile, removeTempDirIfAny) => {
        const packageInfo = fileInfo.packageInfo;
        const isWebInstaller = packageInfo != null && packageFile != null;
        if (isWebInstaller && downloadUpdateOptions.disableWebInstaller) {
          throw (0, builder_util_runtime_1.newError)(`Unable to download new version ${downloadUpdateOptions.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
        }
        if (!isWebInstaller && !downloadUpdateOptions.disableWebInstaller) {
          this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version.");
        }
        if (isWebInstaller || downloadUpdateOptions.disableDifferentialDownload || await this.differentialDownloadInstaller(fileInfo, downloadUpdateOptions, destinationFile, provider, builder_util_runtime_1.CURRENT_APP_INSTALLER_FILE_NAME)) {
          await this.httpExecutor.download(fileInfo.url, destinationFile, downloadOptions);
        }
        const signatureVerificationStatus = await this.verifySignature(destinationFile);
        if (signatureVerificationStatus != null) {
          await removeTempDirIfAny();
          throw (0, builder_util_runtime_1.newError)(`New version ${downloadUpdateOptions.updateInfoAndProvider.info.version} is not signed by the application owner: ${signatureVerificationStatus}`, "ERR_UPDATER_INVALID_SIGNATURE");
        }
        if (isWebInstaller) {
          if (await this.differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packageFile, provider)) {
            try {
              await this.httpExecutor.download(new url_1.URL(packageInfo.path), packageFile, {
                headers: downloadUpdateOptions.requestHeaders,
                cancellationToken: downloadUpdateOptions.cancellationToken,
                sha512: packageInfo.sha512
              });
            } catch (e) {
              try {
                await (0, fs_extra_1.unlink)(packageFile);
              } catch (_ignored) {
              }
              throw e;
            }
          }
        }
      }
    });
  }
  // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
  // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
  // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
  async verifySignature(tempUpdateFile) {
    let publisherName;
    try {
      publisherName = (await this.configOnDisk.value).publisherName;
      if (publisherName == null) {
        return null;
      }
    } catch (e) {
      if (e.code === "ENOENT") {
        return null;
      }
      throw e;
    }
    return await this._verifyUpdateCodeSignature(Array.isArray(publisherName) ? publisherName : [publisherName], tempUpdateFile);
  }
  doInstall(options) {
    const installerPath = this.installerPath;
    if (installerPath == null) {
      this.dispatchError(new Error("No valid update available, can't quit and install"));
      return false;
    }
    const args = ["--updated"];
    if (options.isSilent) {
      args.push("/S");
    }
    if (options.isForceRunAfter) {
      args.push("--force-run");
    }
    if (this.installDirectory) {
      args.push(`/D=${this.installDirectory}`);
    }
    const packagePath = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
    if (packagePath != null) {
      args.push(`--package-file=${packagePath}`);
    }
    const callUsingElevation = () => {
      this.spawnLog(path.join(process.resourcesPath, "elevate.exe"), [installerPath].concat(args)).catch((e) => this.dispatchError(e));
    };
    if (options.isAdminRightsRequired) {
      this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe");
      callUsingElevation();
      return true;
    }
    this.spawnLog(installerPath, args).catch((e) => {
      const errorCode = e.code;
      this._logger.info(`Cannot run installer: error code: ${errorCode}, error message: "${e.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`);
      if (errorCode === "UNKNOWN" || errorCode === "EACCES") {
        callUsingElevation();
      } else if (errorCode === "ENOENT") {
        require$$1.shell.openPath(installerPath).catch((err) => this.dispatchError(err));
      } else {
        this.dispatchError(e);
      }
    });
    return true;
  }
  async differentialDownloadWebPackage(downloadUpdateOptions, packageInfo, packagePath, provider) {
    if (packageInfo.blockMapSize == null) {
      return true;
    }
    try {
      const downloadOptions = {
        newUrl: new url_1.URL(packageInfo.path),
        oldFile: path.join(this.downloadedUpdateHelper.cacheDir, builder_util_runtime_1.CURRENT_APP_PACKAGE_FILE_NAME),
        logger: this._logger,
        newFile: packagePath,
        requestHeaders: this.requestHeaders,
        isUseMultipleRangeRequest: provider.isUseMultipleRangeRequest,
        cancellationToken: downloadUpdateOptions.cancellationToken
      };
      if (this.listenerCount(types_1.DOWNLOAD_PROGRESS) > 0) {
        downloadOptions.onProgress = (it) => this.emit(types_1.DOWNLOAD_PROGRESS, it);
      }
      await new FileWithEmbeddedBlockMapDifferentialDownloader_1.FileWithEmbeddedBlockMapDifferentialDownloader(packageInfo, this.httpExecutor, downloadOptions).download();
    } catch (e) {
      this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
      return process.platform === "win32";
    }
    return false;
  }
}
NsisUpdater$1.NsisUpdater = NsisUpdater;
(function(exports$1) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === void 0) k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports$12) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$12, p)) __createBinding(exports$12, m, p);
  };
  Object.defineProperty(exports$1, "__esModule", { value: true });
  exports$1.NsisUpdater = exports$1.MacUpdater = exports$1.RpmUpdater = exports$1.PacmanUpdater = exports$1.DebUpdater = exports$1.AppImageUpdater = exports$1.Provider = exports$1.NoOpLogger = exports$1.AppUpdater = exports$1.BaseUpdater = void 0;
  const fs_extra_12 = lib;
  const path2 = require$$1$3;
  var BaseUpdater_12 = BaseUpdater$1;
  Object.defineProperty(exports$1, "BaseUpdater", { enumerable: true, get: function() {
    return BaseUpdater_12.BaseUpdater;
  } });
  var AppUpdater_12 = AppUpdater$1;
  Object.defineProperty(exports$1, "AppUpdater", { enumerable: true, get: function() {
    return AppUpdater_12.AppUpdater;
  } });
  Object.defineProperty(exports$1, "NoOpLogger", { enumerable: true, get: function() {
    return AppUpdater_12.NoOpLogger;
  } });
  var Provider_12 = Provider$1;
  Object.defineProperty(exports$1, "Provider", { enumerable: true, get: function() {
    return Provider_12.Provider;
  } });
  var AppImageUpdater_1 = AppImageUpdater$1;
  Object.defineProperty(exports$1, "AppImageUpdater", { enumerable: true, get: function() {
    return AppImageUpdater_1.AppImageUpdater;
  } });
  var DebUpdater_1 = DebUpdater$1;
  Object.defineProperty(exports$1, "DebUpdater", { enumerable: true, get: function() {
    return DebUpdater_1.DebUpdater;
  } });
  var PacmanUpdater_1 = PacmanUpdater$1;
  Object.defineProperty(exports$1, "PacmanUpdater", { enumerable: true, get: function() {
    return PacmanUpdater_1.PacmanUpdater;
  } });
  var RpmUpdater_1 = RpmUpdater$1;
  Object.defineProperty(exports$1, "RpmUpdater", { enumerable: true, get: function() {
    return RpmUpdater_1.RpmUpdater;
  } });
  var MacUpdater_1 = MacUpdater$1;
  Object.defineProperty(exports$1, "MacUpdater", { enumerable: true, get: function() {
    return MacUpdater_1.MacUpdater;
  } });
  var NsisUpdater_1 = NsisUpdater$1;
  Object.defineProperty(exports$1, "NsisUpdater", { enumerable: true, get: function() {
    return NsisUpdater_1.NsisUpdater;
  } });
  __exportStar(types, exports$1);
  let _autoUpdater;
  function doLoadAutoUpdater() {
    if (process.platform === "win32") {
      _autoUpdater = new NsisUpdater$1.NsisUpdater();
    } else if (process.platform === "darwin") {
      _autoUpdater = new MacUpdater$1.MacUpdater();
    } else {
      _autoUpdater = new AppImageUpdater$1.AppImageUpdater();
      try {
        const identity = path2.join(process.resourcesPath, "package-type");
        if (!(0, fs_extra_12.existsSync)(identity)) {
          return _autoUpdater;
        }
        console.info("Checking for beta autoupdate feature for deb/rpm distributions");
        const fileType = (0, fs_extra_12.readFileSync)(identity).toString().trim();
        console.info("Found package-type:", fileType);
        switch (fileType) {
          case "deb":
            _autoUpdater = new DebUpdater$1.DebUpdater();
            break;
          case "rpm":
            _autoUpdater = new RpmUpdater$1.RpmUpdater();
            break;
          case "pacman":
            _autoUpdater = new PacmanUpdater$1.PacmanUpdater();
            break;
          default:
            break;
        }
      } catch (error2) {
        console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", error2.message);
      }
    }
    return _autoUpdater;
  }
  Object.defineProperty(exports$1, "autoUpdater", {
    enumerable: true,
    get: () => {
      return _autoUpdater || doLoadAutoUpdater();
    }
  });
})(main$1);
const __dirname$1 = require$$0.dirname(node_url.fileURLToPath(require("url").pathToFileURL(__filename).href));
let mainWindow = null;
let downloadWorker = null;
let isShuttingDown = false;
let transcodeWorker = null;
let transcriptionWorker = null;
let smartTagging = null;
let watchFolderService = null;
let mainLogPath = null;
const appLogger = new Logger("App");
const updaterLogger = new Logger("AutoUpdater");
function createWindow() {
  const preloadCjs = require$$0.join(__dirname$1, "../preload/index.cjs");
  const preloadJs = require$$0.join(__dirname$1, "../preload/index.js");
  const preloadMjs = require$$0.join(__dirname$1, "../preload/index.mjs");
  const preloadPath = node_fs.existsSync(preloadCjs) ? preloadCjs : node_fs.existsSync(preloadJs) ? preloadJs : preloadMjs;
  mainWindow = new require$$1.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(require$$0.join(__dirname$1, "../renderer/index.html"));
  }
  const logWebContents = (event, details) => {
    const entry = {
      event,
      details: details ?? null,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    appLogger.info(`WebContents ${event}`, details);
    void appendMainLog({ type: "webcontents", ...entry });
  };
  mainWindow.webContents.on("did-fail-load", (_event, code, description, url) => {
    logWebContents("did-fail-load", { code, description, url });
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    logWebContents("render-process-gone", details);
  });
  mainWindow.webContents.on("unresponsive", () => {
    logWebContents("unresponsive");
  });
  if (process.env.DRAPP_DEBUG_RENDERER === "1") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
async function appendMainLog(entry) {
  if (!mainLogPath) {
    return;
  }
  try {
    await promises.appendFile(mainLogPath, `${JSON.stringify(entry)}
`, "utf-8");
  } catch {
  }
}
async function ensureBinaries() {
  const binaryLogger = new Logger("Binaries");
  const missing = await binaryDownloaderService.checkMissingBinaries();
  if (missing.length === 0) {
    binaryLogger.info("All binaries present");
    return;
  }
  binaryLogger.info(`Missing binaries: ${missing.join(", ")}. Downloading...`);
  const results = await binaryDownloaderService.downloadMissingBinaries((progress) => {
    if (mainWindow) {
      mainWindow.webContents.send("binary-download/progress", progress);
    }
    if (progress.stage === "downloading") {
      binaryLogger.info(`Downloading ${progress.binary}: ${progress.progress ?? 0}%`);
    } else if (progress.stage === "done") {
      binaryLogger.info(`Downloaded ${progress.binary}`);
    } else if (progress.stage === "error") {
      binaryLogger.error(`Failed to download ${progress.binary}: ${progress.error}`);
    }
  });
  const downloaded = results.filter((r) => r.success).map((r) => r.binary);
  const failed = results.filter((r) => !r.success);
  if (downloaded.length > 0) {
    binaryLogger.info(`Successfully downloaded: ${downloaded.join(", ")}`);
  }
  if (failed.length > 0) {
    binaryLogger.warn(
      `Failed to download: ${failed.map((f) => `${f.binary} (${f.error})`).join(", ")}`
    );
  }
}
function initializeAutoUpdater() {
  if (!require$$1.app.isPackaged) {
    updaterLogger.info("Auto-updater disabled in dev");
    return;
  }
  const feedUrl = process.env.DRAPP_UPDATE_URL;
  if (feedUrl) {
    main$1.autoUpdater.setFeedURL({ provider: "generic", url: feedUrl });
  } else {
    updaterLogger.warn("No update feed URL configured");
    return;
  }
  main$1.autoUpdater.on("checking-for-update", () => {
    updaterLogger.info("Checking for updates");
  });
  main$1.autoUpdater.on("update-available", () => {
    updaterLogger.info("Update available");
  });
  main$1.autoUpdater.on("update-not-available", () => {
    updaterLogger.info("No updates available");
  });
  main$1.autoUpdater.on("error", (error2) => {
    updaterLogger.error("Update error", { message: error2?.message ?? "unknown" });
  });
  main$1.autoUpdater.on("download-progress", (progress) => {
    updaterLogger.info("Update progress", { percent: Math.round(progress.percent) });
  });
  main$1.autoUpdater.on("update-downloaded", () => {
    updaterLogger.info("Update downloaded, will install on quit");
  });
  void main$1.autoUpdater.checkForUpdatesAndNotify();
}
async function ensureTaxonomyFile() {
  const userDataPath = require$$1.app.getPath("userData");
  const taxonomyPath = require$$0.join(userDataPath, "tags.txt");
  try {
    await promises.access(taxonomyPath, promises.constants.F_OK);
  } catch {
    const defaultTaxonomyPath = require$$0.join(__dirname$1, "../../resources/tags.txt");
    try {
      await promises.access(defaultTaxonomyPath, promises.constants.F_OK);
      await promises.copyFile(defaultTaxonomyPath, taxonomyPath);
      console.log("Copied default tags.txt to user data");
    } catch {
      const minimalTaxonomy = `# Drapp Tag Taxonomy
@default_min_conf = 0.65
@low_confidence_policy = suggest

[General]
@min_conf = 0.60
favorite
watch-later
archived
`;
      await promises.writeFile(taxonomyPath, minimalTaxonomy);
      console.log("Created minimal tags.txt");
    }
  }
  return taxonomyPath;
}
async function initializeServices() {
  const db2 = getDatabase();
  const lmstudioUrl = getSetting(db2, "lmstudio_url");
  const lmstudioModel = getSetting(db2, "lmstudio_model");
  const metadataService = new MetadataService();
  const sessionService = new SessionService(db2);
  const keychainService = new KeychainService();
  watchFolderService = new WatchFolderService(db2);
  await watchFolderService.startFromSettings();
  downloadWorker = new DownloadWorker(db2, new YtDlpService(), (event) => {
    if (mainWindow) {
      mainWindow.webContents.send("download/event", event);
    }
  }, { sessionService, keychain: keychainService });
  const emitProcessingEvent = (event) => {
    if (mainWindow) {
      mainWindow.webContents.send("processing/event", event);
    }
  };
  transcodeWorker = new TranscodeWorker(db2, new FfmpegService(), metadataService, emitProcessingEvent);
  transcriptionWorker = new TranscriptionWorker(db2, new WhisperService(), metadataService, emitProcessingEvent);
  const taxonomyPath = await ensureTaxonomyFile();
  const smartTaggingConfig = { taxonomyPath };
  if (lmstudioUrl) {
    smartTaggingConfig.lmStudioUrl = lmstudioUrl;
  }
  if (lmstudioModel) {
    smartTaggingConfig.lmStudioModel = lmstudioModel;
  }
  smartTagging = new SmartTaggingService(db2, smartTaggingConfig);
  try {
    await smartTagging.initialize();
    console.log("Smart tagging service initialized");
  } catch (error2) {
    console.warn("Smart tagging initialization failed:", error2);
  }
  registerIpcHandlers({
    downloadWorker,
    smartTagging,
    transcodeWorker,
    transcriptionWorker,
    watchFolderService
  });
  downloadWorker.start();
  transcodeWorker.start();
  transcriptionWorker.start();
}
require$$1.protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
]);
require$$1.app.whenReady().then(async () => {
  require$$1.protocol.handle("media", (request) => {
    let filePath = decodeURIComponent(request.url.replace("media://", ""));
    const fileUrl = node_url.pathToFileURL(filePath).href;
    return require$$1.net.fetch(fileUrl);
  });
  mainLogPath = require$$0.join(require$$1.app.getPath("userData"), "main-errors.log");
  process.on("uncaughtException", (error2) => {
    const entry = {
      type: "uncaughtException",
      message: error2.message,
      stack: error2.stack,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    appLogger.error("Uncaught exception", { message: error2.message });
    void appendMainLog(entry);
  });
  process.on("unhandledRejection", (reason) => {
    const entry = {
      type: "unhandledRejection",
      message: reason instanceof Error ? reason.message : "unhandled rejection",
      stack: reason instanceof Error ? reason.stack : void 0,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    appLogger.error("Unhandled rejection", { message: entry.message });
    void appendMainLog(entry);
  });
  await initializeServices();
  createWindow();
  initializeAutoUpdater();
  void ensureBinaries();
  require$$1.app.on("activate", () => {
    if (require$$1.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
require$$1.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    require$$1.app.quit();
  }
});
require$$1.app.on("before-quit", async (event) => {
  downloadWorker?.stop();
  transcodeWorker?.stop();
  transcriptionWorker?.stop();
  void watchFolderService?.stop();
  const archivalService2 = getArchivalService();
  if (!isShuttingDown && archivalService2?.hasActiveJob()) {
    isShuttingDown = true;
    appLogger.info("Saving archival state before quit");
    event.preventDefault();
    try {
      await archivalService2.pause();
      appLogger.info("Archival state saved, quitting");
    } catch (error2) {
      appLogger.error("Failed to save archival state", { error: error2 });
    }
    require$$1.app.quit();
  }
});
exports.commonjsGlobal = commonjsGlobal;
exports.getDefaultExportFromCjs = getDefaultExportFromCjs;
