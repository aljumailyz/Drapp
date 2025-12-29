# Smart Tagging System - Local Learning from User Tags

## Overview

A privacy-preserving, local-only system that learns from user tagging behavior to improve future tag suggestions. Uses video frame embeddings, similarity search, and a local LLM (via LM Studio) for refinement—all without cloud calls or model training.

**Key Principles:**
- 100% local processing (no cloud)
- User controls the entire tag vocabulary via `tags.txt`
- Never invents tags—only suggests from taxonomy
- Never infers sensitive attributes
- Deterministic and reproducible

---

## Architecture Integration

### Where This Fits in Drapp

```
src/main/services/
├── smart-tagging/                    # NEW MODULE
│   ├── index.ts                      # Main orchestrator
│   ├── taxonomy.service.ts           # Parse/validate tags.txt
│   ├── frame-extractor.service.ts    # FFmpeg frame extraction
│   ├── embedding.service.ts          # CLIP embeddings via local model
│   ├── similarity.service.ts         # Vector search (brute-force → FAISS)
│   ├── neighbor-voting.service.ts    # Weighted tag candidate generation
│   ├── llm-refiner.service.ts        # LM Studio refinement step
│   ├── confidence.service.ts         # Threshold enforcement
│   └── types.ts                      # Type definitions
```

### Integration Points

1. **After video download** → Extract frames, compute embeddings, store
2. **When user adds/edits tags** → Update video_tags, log to tag_events
3. **When user requests suggestions** → Run full pipeline
4. **Settings UI** → Edit taxonomy, configure thresholds, LM Studio connection

---

## Taxonomy File Format

### `tags.txt` Location
```
~/Drapp/.drapp/tags.txt
```

### Format Specification

```txt
# Global defaults (apply to all sections unless overridden)
@default_min_conf = 0.65
@low_confidence_policy = suggest    # omit | suggest | ask

# ============================================
[Content Type]
@min_conf = 0.70

tutorial
review
vlog
music-video
documentary
comedy | min_conf=0.75
drama

# ============================================
[Genre]
@min_conf = 0.60

action
horror | min_conf=0.80
sci-fi
romance
thriller

# ============================================
[Mood]
@min_conf = 0.55

funny
serious
relaxing
intense
emotional

# ============================================
[Technical]
@min_conf = 0.50

4k
hdr
vertical-video
slow-motion
timelapse

# ============================================
[Custom]
# User-defined tags with no category restrictions
@min_conf = 0.70

favorites
watch-later
reference-material
```

### Parsing Rules

1. Lines starting with `#` are comments
2. Lines starting with `@` are directives
3. Lines with `[Name]` start a new section
4. Tags can have inline overrides: `tag-name | min_conf=0.80`
5. Empty lines are ignored
6. Tags are normalized: lowercase, trimmed, hyphens for spaces

---

## Database Schema Extensions

Add these tables to the existing schema:

```sql
-- Frame extraction results
CREATE TABLE video_frames (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  frame_index INTEGER NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  file_path TEXT NOT NULL,          -- Path to extracted frame image
  embedding BLOB,                    -- CLIP embedding (float32 array as blob)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, frame_index)
);

-- Aggregated video embeddings (mean-pooled from frames)
CREATE TABLE video_embeddings (
  video_id TEXT PRIMARY KEY REFERENCES videos(id) ON DELETE CASCADE,
  embedding BLOB NOT NULL,           -- Aggregated embedding
  frame_count INTEGER NOT NULL,
  model_version TEXT NOT NULL,       -- Track which CLIP model was used
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Extended video_tags table (replaces simple version)
CREATE TABLE video_tags_extended (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  -- Source tracking
  source TEXT NOT NULL,              -- 'user' | 'suggested' | 'ai_refined'
  confidence REAL,                   -- 0.0 to 1.0 (null for user-added)

  -- Lock mechanism
  is_locked INTEGER DEFAULT 0,       -- Locked tags survive regeneration
  locked_at TEXT,
  locked_by TEXT,                    -- 'user' | 'system'

  -- Suggestion state
  suggestion_state TEXT,             -- 'accepted' | 'rejected' | 'pending' | null

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(video_id, tag_id)
);

-- Tag event history (audit log)
CREATE TABLE tag_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,          -- 'add' | 'remove' | 'lock' | 'unlock' | 'accept' | 'reject'
  source TEXT NOT NULL,              -- 'user' | 'ai' | 'system'
  confidence REAL,
  metadata_json TEXT,                -- Additional context (similar videos used, etc.)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Taxonomy cache (parsed from tags.txt)
CREATE TABLE taxonomy_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section TEXT NOT NULL,
  tag_name TEXT NOT NULL UNIQUE,
  min_confidence REAL NOT NULL,
  is_active INTEGER DEFAULT 1,
  parsed_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_video_frames_video ON video_frames(video_id);
CREATE INDEX idx_video_tags_ext_video ON video_tags_extended(video_id);
CREATE INDEX idx_video_tags_ext_tag ON video_tags_extended(tag_id);
CREATE INDEX idx_video_tags_ext_locked ON video_tags_extended(is_locked) WHERE is_locked = 1;
CREATE INDEX idx_tag_events_video ON tag_events(video_id);
CREATE INDEX idx_tag_events_created ON tag_events(created_at);
```

---

## Core Services Implementation

### 1. Taxonomy Service

```typescript
// src/main/services/smart-tagging/taxonomy.service.ts

interface TaxonomyTag {
  name: string;
  section: string;
  minConfidence: number;
}

interface TaxonomyConfig {
  defaultMinConf: number;
  lowConfidencePolicy: 'omit' | 'suggest' | 'ask';
  sections: Map<string, {
    minConf: number;
    tags: TaxonomyTag[];
  }>;
  allTags: Map<string, TaxonomyTag>;  // Quick lookup by name
}

export class TaxonomyService {
  private config: TaxonomyConfig | null = null;
  private taxonomyPath: string;
  private fileWatcher: FSWatcher | null = null;

  constructor(libraryPath: string) {
    this.taxonomyPath = path.join(libraryPath, '.drapp', 'tags.txt');
  }

  async load(): Promise<TaxonomyConfig> {
    const content = await fs.readFile(this.taxonomyPath, 'utf-8');
    return this.parse(content);
  }

  parse(content: string): TaxonomyConfig {
    const lines = content.split('\n');

    let defaultMinConf = 0.65;
    let lowConfidencePolicy: 'omit' | 'suggest' | 'ask' = 'suggest';
    const sections = new Map<string, { minConf: number; tags: TaxonomyTag[] }>();
    const allTags = new Map<string, TaxonomyTag>();

    let currentSection = 'Uncategorized';
    let currentSectionMinConf = defaultMinConf;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue;

      // Global directives
      if (line.startsWith('@default_min_conf')) {
        defaultMinConf = parseFloat(line.split('=')[1].trim());
        continue;
      }

      if (line.startsWith('@low_confidence_policy')) {
        const policy = line.split('=')[1].trim();
        if (['omit', 'suggest', 'ask'].includes(policy)) {
          lowConfidencePolicy = policy as 'omit' | 'suggest' | 'ask';
        }
        continue;
      }

      // Section header
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1).trim();
        currentSectionMinConf = defaultMinConf;
        if (!sections.has(currentSection)) {
          sections.set(currentSection, { minConf: currentSectionMinConf, tags: [] });
        }
        continue;
      }

      // Section-level min_conf
      if (line.startsWith('@min_conf')) {
        currentSectionMinConf = parseFloat(line.split('=')[1].trim());
        const section = sections.get(currentSection);
        if (section) section.minConf = currentSectionMinConf;
        continue;
      }

      // Tag definition (possibly with inline override)
      const [tagPart, ...optionsParts] = line.split('|');
      const tagName = this.normalizeTagName(tagPart.trim());

      let tagMinConf = currentSectionMinConf;

      // Parse inline options
      for (const opt of optionsParts) {
        const [key, value] = opt.split('=').map(s => s.trim());
        if (key === 'min_conf') {
          tagMinConf = parseFloat(value);
        }
      }

      const tag: TaxonomyTag = {
        name: tagName,
        section: currentSection,
        minConfidence: tagMinConf,
      };

      // Ensure section exists
      if (!sections.has(currentSection)) {
        sections.set(currentSection, { minConf: currentSectionMinConf, tags: [] });
      }
      sections.get(currentSection)!.tags.push(tag);
      allTags.set(tagName, tag);
    }

    this.config = { defaultMinConf, lowConfidencePolicy, sections, allTags };
    return this.config;
  }

  normalizeTagName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
  }

  isValidTag(tagName: string): boolean {
    return this.config?.allTags.has(this.normalizeTagName(tagName)) ?? false;
  }

  getTagConfig(tagName: string): TaxonomyTag | undefined {
    return this.config?.allTags.get(this.normalizeTagName(tagName));
  }

  getAllowedTags(): string[] {
    return Array.from(this.config?.allTags.keys() ?? []);
  }

  getTagsBySection(): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [section, data] of this.config?.sections ?? []) {
      result.set(section, data.tags.map(t => t.name));
    }
    return result;
  }

  // Watch for file changes and reload
  watch(onChange: () => void): void {
    this.fileWatcher = fs.watch(this.taxonomyPath, async () => {
      await this.load();
      onChange();
    });
  }

  stopWatching(): void {
    this.fileWatcher?.close();
  }
}
```

### 2. Frame Extractor Service

```typescript
// src/main/services/smart-tagging/frame-extractor.service.ts

interface ExtractedFrame {
  index: number;
  timestampMs: number;
  filePath: string;
}

interface ExtractionOptions {
  maxFrames: number;           // Default: 30
  sceneChangeThreshold: number; // Default: 0.3 (for scene detection)
  minIntervalMs: number;        // Minimum time between frames
  outputDir: string;
}

export class FrameExtractorService {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor(binaryService: BinaryService) {
    this.ffmpegPath = binaryService.getPath('ffmpeg');
    this.ffprobePath = binaryService.getPath('ffprobe');
  }

  async extractFrames(
    videoPath: string,
    videoId: string,
    options: Partial<ExtractionOptions> = {}
  ): Promise<ExtractedFrame[]> {
    const opts: ExtractionOptions = {
      maxFrames: 30,
      sceneChangeThreshold: 0.3,
      minIntervalMs: 1000,
      outputDir: path.join(app.getPath('userData'), 'frames', videoId),
      ...options,
    };

    // Ensure output directory exists
    await fs.mkdir(opts.outputDir, { recursive: true });

    // Get video duration first
    const duration = await this.getVideoDuration(videoPath);

    // Strategy: Use scene detection + uniform sampling fallback
    const frames = await this.extractWithSceneDetection(videoPath, opts, duration);

    // If scene detection found too few frames, supplement with uniform sampling
    if (frames.length < opts.maxFrames / 2) {
      const uniformFrames = await this.extractUniformSamples(
        videoPath,
        opts,
        duration,
        opts.maxFrames - frames.length,
        new Set(frames.map(f => f.timestampMs))
      );
      frames.push(...uniformFrames);
    }

    // Sort by timestamp and limit
    frames.sort((a, b) => a.timestampMs - b.timestampMs);
    return frames.slice(0, opts.maxFrames);
  }

  private async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffprobePath, [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'json',
        videoPath
      ]);

      let output = '';
      proc.stdout.on('data', (data) => { output += data; });
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited with code ${code}`));
          return;
        }
        try {
          const data = JSON.parse(output);
          resolve(parseFloat(data.format.duration) * 1000);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  private async extractWithSceneDetection(
    videoPath: string,
    opts: ExtractionOptions,
    duration: number
  ): Promise<ExtractedFrame[]> {
    // Use FFmpeg's scene detection filter
    const outputPattern = path.join(opts.outputDir, 'scene_%04d.jpg');

    // select filter: detect scene changes above threshold
    // Also output timestamp to a file
    const metadataPath = path.join(opts.outputDir, 'scene_metadata.txt');

    const args = [
      '-i', videoPath,
      '-vf', `select='gt(scene,${opts.sceneChangeThreshold})',showinfo`,
      '-vsync', 'vfr',
      '-frame_pts', '1',
      '-q:v', '2',
      outputPattern,
      '-f', 'null', '-'
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, args);

      const frames: ExtractedFrame[] = [];
      let frameIndex = 0;
      let stderrOutput = '';

      proc.stderr.on('data', (data) => {
        stderrOutput += data.toString();

        // Parse showinfo output for timestamps
        // Format: [Parsed_showinfo_0 @ ...] n:0 pts:12345 pts_time:1.234
        const matches = data.toString().matchAll(/pts_time:(\d+\.?\d*)/g);
        for (const match of matches) {
          const timestampSec = parseFloat(match[1]);
          frames.push({
            index: frameIndex++,
            timestampMs: Math.round(timestampSec * 1000),
            filePath: path.join(opts.outputDir, `scene_${String(frameIndex).padStart(4, '0')}.jpg`),
          });
        }
      });

      proc.on('close', (code) => {
        // Scene detection can produce 0 frames for static videos, that's ok
        resolve(frames);
      });

      proc.on('error', reject);
    });
  }

  private async extractUniformSamples(
    videoPath: string,
    opts: ExtractionOptions,
    duration: number,
    count: number,
    existingTimestamps: Set<number>
  ): Promise<ExtractedFrame[]> {
    const frames: ExtractedFrame[] = [];
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      const timestampMs = Math.round(i * interval);

      // Skip if too close to an existing frame
      let tooClose = false;
      for (const existing of existingTimestamps) {
        if (Math.abs(existing - timestampMs) < opts.minIntervalMs) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const outputPath = path.join(opts.outputDir, `uniform_${String(i).padStart(4, '0')}.jpg`);

      await this.extractSingleFrame(videoPath, timestampMs, outputPath);

      frames.push({
        index: frames.length,
        timestampMs,
        filePath: outputPath,
      });
    }

    return frames;
  }

  private async extractSingleFrame(
    videoPath: string,
    timestampMs: number,
    outputPath: string
  ): Promise<void> {
    const timestampSec = timestampMs / 1000;

    return new Promise((resolve, reject) => {
      const proc = spawn(this.ffmpegPath, [
        '-ss', timestampSec.toString(),
        '-i', videoPath,
        '-vframes', '1',
        '-q:v', '2',
        '-y',
        outputPath
      ]);

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Failed to extract frame at ${timestampMs}ms`));
      });
      proc.on('error', reject);
    });
  }

  async cleanup(videoId: string): Promise<void> {
    const frameDir = path.join(app.getPath('userData'), 'frames', videoId);
    await fs.rm(frameDir, { recursive: true, force: true });
  }
}
```

### 3. Embedding Service

```typescript
// src/main/services/smart-tagging/embedding.service.ts

interface EmbeddingModel {
  name: string;
  dimensions: number;
  embed(imagePath: string): Promise<Float32Array>;
  embedBatch(imagePaths: string[]): Promise<Float32Array[]>;
}

interface EmbeddingConfig {
  modelPath: string;          // Path to ONNX model
  modelName: string;          // e.g., 'clip-vit-base-patch32'
  dimensions: number;         // e.g., 512
  batchSize: number;          // For batch processing
}

export class EmbeddingService {
  private model: EmbeddingModel | null = null;
  private config: EmbeddingConfig;
  private db: Database;

  constructor(db: Database, config: Partial<EmbeddingConfig> = {}) {
    this.db = db;
    this.config = {
      modelPath: path.join(app.getPath('userData'), 'models', 'clip-vit-base-patch32.onnx'),
      modelName: 'clip-vit-base-patch32',
      dimensions: 512,
      batchSize: 8,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // Load ONNX model using onnxruntime-node
    const ort = await import('onnxruntime-node');

    // Check if model exists, if not, prompt download
    if (!await this.modelExists()) {
      throw new Error(
        `CLIP model not found at ${this.config.modelPath}. ` +
        `Please download the model first.`
      );
    }

    const session = await ort.InferenceSession.create(this.config.modelPath);

    this.model = {
      name: this.config.modelName,
      dimensions: this.config.dimensions,
      embed: async (imagePath: string) => {
        const tensor = await this.preprocessImage(imagePath);
        const results = await session.run({ input: tensor });
        return new Float32Array(results.output.data as Float32Array);
      },
      embedBatch: async (imagePaths: string[]) => {
        // Process in batches
        const results: Float32Array[] = [];
        for (let i = 0; i < imagePaths.length; i += this.config.batchSize) {
          const batch = imagePaths.slice(i, i + this.config.batchSize);
          for (const imagePath of batch) {
            results.push(await this.model!.embed(imagePath));
          }
        }
        return results;
      },
    };
  }

  private async modelExists(): Promise<boolean> {
    try {
      await fs.access(this.config.modelPath);
      return true;
    } catch {
      return false;
    }
  }

  private async preprocessImage(imagePath: string): Promise<any> {
    // Use sharp to resize and normalize image
    const sharp = (await import('sharp')).default;

    const imageBuffer = await sharp(imagePath)
      .resize(224, 224, { fit: 'cover' })
      .raw()
      .toBuffer();

    // Convert to float32 and normalize (CLIP normalization)
    const floatData = new Float32Array(3 * 224 * 224);
    const mean = [0.48145466, 0.4578275, 0.40821073];
    const std = [0.26862954, 0.26130258, 0.27577711];

    for (let i = 0; i < 224 * 224; i++) {
      floatData[i] = (imageBuffer[i * 3] / 255 - mean[0]) / std[0];              // R
      floatData[224 * 224 + i] = (imageBuffer[i * 3 + 1] / 255 - mean[1]) / std[1]; // G
      floatData[2 * 224 * 224 + i] = (imageBuffer[i * 3 + 2] / 255 - mean[2]) / std[2]; // B
    }

    const ort = await import('onnxruntime-node');
    return new ort.Tensor('float32', floatData, [1, 3, 224, 224]);
  }

  async embedFrames(frames: ExtractedFrame[]): Promise<Map<number, Float32Array>> {
    if (!this.model) {
      throw new Error('Embedding model not initialized');
    }

    const embeddings = await this.model.embedBatch(frames.map(f => f.filePath));

    const result = new Map<number, Float32Array>();
    for (let i = 0; i < frames.length; i++) {
      result.set(frames[i].index, embeddings[i]);
    }

    return result;
  }

  async computeAggregatedEmbedding(frameEmbeddings: Float32Array[]): Promise<Float32Array> {
    // Mean pooling
    const dimensions = frameEmbeddings[0].length;
    const aggregated = new Float32Array(dimensions);

    for (const embedding of frameEmbeddings) {
      for (let i = 0; i < dimensions; i++) {
        aggregated[i] += embedding[i];
      }
    }

    // Normalize
    for (let i = 0; i < dimensions; i++) {
      aggregated[i] /= frameEmbeddings.length;
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) {
      norm += aggregated[i] * aggregated[i];
    }
    norm = Math.sqrt(norm);
    for (let i = 0; i < dimensions; i++) {
      aggregated[i] /= norm;
    }

    return aggregated;
  }

  async storeFrameEmbedding(
    videoId: string,
    frameIndex: number,
    timestampMs: number,
    filePath: string,
    embedding: Float32Array
  ): Promise<void> {
    const id = `${videoId}_frame_${frameIndex}`;
    const embeddingBlob = Buffer.from(embedding.buffer);

    this.db.prepare(`
      INSERT OR REPLACE INTO video_frames
      (id, video_id, frame_index, timestamp_ms, file_path, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, videoId, frameIndex, timestampMs, filePath, embeddingBlob);
  }

  async storeVideoEmbedding(videoId: string, embedding: Float32Array, frameCount: number): Promise<void> {
    const embeddingBlob = Buffer.from(embedding.buffer);

    this.db.prepare(`
      INSERT OR REPLACE INTO video_embeddings
      (video_id, embedding, frame_count, model_version, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(videoId, embeddingBlob, frameCount, this.config.modelName);
  }

  getVideoEmbedding(videoId: string): Float32Array | null {
    const row = this.db.prepare(
      'SELECT embedding FROM video_embeddings WHERE video_id = ?'
    ).get(videoId) as { embedding: Buffer } | undefined;

    if (!row) return null;
    return new Float32Array(row.embedding.buffer.slice(
      row.embedding.byteOffset,
      row.embedding.byteOffset + row.embedding.byteLength
    ));
  }

  getAllVideoEmbeddings(): Map<string, Float32Array> {
    const rows = this.db.prepare(
      'SELECT video_id, embedding FROM video_embeddings'
    ).all() as { video_id: string; embedding: Buffer }[];

    const result = new Map<string, Float32Array>();
    for (const row of rows) {
      result.set(row.video_id, new Float32Array(row.embedding.buffer.slice(
        row.embedding.byteOffset,
        row.embedding.byteOffset + row.embedding.byteLength
      )));
    }
    return result;
  }
}
```

### 4. Similarity Service

```typescript
// src/main/services/smart-tagging/similarity.service.ts

interface SimilarVideo {
  videoId: string;
  similarity: number;
  tags: { name: string; confidence: number | null; isLocked: boolean }[];
}

export class SimilarityService {
  private db: Database;
  private embeddingService: EmbeddingService;

  // Future: FAISS or hnswlib index
  private useApproximateSearch: boolean = false;

  constructor(db: Database, embeddingService: EmbeddingService) {
    this.db = db;
    this.embeddingService = embeddingService;
  }

  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async findSimilarVideos(
    targetVideoId: string,
    topK: number = 10,
    minSimilarity: number = 0.3
  ): Promise<SimilarVideo[]> {
    const targetEmbedding = this.embeddingService.getVideoEmbedding(targetVideoId);
    if (!targetEmbedding) {
      throw new Error(`No embedding found for video ${targetVideoId}`);
    }

    // Get all other video embeddings
    const allEmbeddings = this.embeddingService.getAllVideoEmbeddings();

    // Calculate similarities
    const similarities: { videoId: string; similarity: number }[] = [];

    for (const [videoId, embedding] of allEmbeddings) {
      if (videoId === targetVideoId) continue;

      const similarity = this.cosineSimilarity(targetEmbedding, embedding);
      if (similarity >= minSimilarity) {
        similarities.push({ videoId, similarity });
      }
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Take top K
    const topSimilar = similarities.slice(0, topK);

    // Fetch tags for each similar video
    const result: SimilarVideo[] = [];
    for (const { videoId, similarity } of topSimilar) {
      const tags = this.getVideoTags(videoId);
      result.push({ videoId, similarity, tags });
    }

    return result;
  }

  private getVideoTags(videoId: string): { name: string; confidence: number | null; isLocked: boolean }[] {
    const rows = this.db.prepare(`
      SELECT t.name, vt.confidence, vt.is_locked
      FROM video_tags_extended vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ?
      AND (vt.suggestion_state IS NULL OR vt.suggestion_state = 'accepted')
    `).all(videoId) as { name: string; confidence: number | null; is_locked: number }[];

    return rows.map(r => ({
      name: r.name,
      confidence: r.confidence,
      isLocked: r.is_locked === 1,
    }));
  }

  // Future: FAISS integration
  async buildIndex(): Promise<void> {
    // Placeholder for FAISS/hnswlib index building
    // Would convert all embeddings to a searchable index
  }
}
```

### 5. Neighbor Voting Service

```typescript
// src/main/services/smart-tagging/neighbor-voting.service.ts

interface TagCandidate {
  tagName: string;
  section: string;
  confidence: number;
  contributors: { videoId: string; similarity: number }[];
}

export class NeighborVotingService {
  private taxonomyService: TaxonomyService;
  private similarityService: SimilarityService;

  constructor(taxonomyService: TaxonomyService, similarityService: SimilarityService) {
    this.taxonomyService = taxonomyService;
    this.similarityService = similarityService;
  }

  async generateCandidates(
    targetVideoId: string,
    topK: number = 10
  ): Promise<TagCandidate[]> {
    // Find similar videos with their tags
    const similarVideos = await this.similarityService.findSimilarVideos(targetVideoId, topK);

    if (similarVideos.length === 0) {
      return [];
    }

    // Weighted voting for each tag
    const tagVotes = new Map<string, {
      weightedSum: number;
      totalWeight: number;
      contributors: { videoId: string; similarity: number }[];
    }>();

    for (const video of similarVideos) {
      for (const tag of video.tags) {
        // Only consider tags that are in the current taxonomy
        if (!this.taxonomyService.isValidTag(tag.name)) continue;

        const existing = tagVotes.get(tag.name) || {
          weightedSum: 0,
          totalWeight: 0,
          contributors: [],
        };

        existing.weightedSum += video.similarity; // has_tag = 1 since tag exists
        existing.totalWeight += video.similarity;
        existing.contributors.push({ videoId: video.videoId, similarity: video.similarity });

        tagVotes.set(tag.name, existing);
      }

      // Also track videos that DON'T have each tag (for normalization)
      const videoTagNames = new Set(video.tags.map(t => t.name));
      for (const tagName of this.taxonomyService.getAllowedTags()) {
        if (videoTagNames.has(tagName)) continue;

        const existing = tagVotes.get(tagName) || {
          weightedSum: 0,
          totalWeight: 0,
          contributors: [],
        };

        // has_tag = 0, but still contributes to totalWeight for normalization
        existing.totalWeight += video.similarity;
        tagVotes.set(tagName, existing);
      }
    }

    // Calculate confidence for each tag
    const candidates: TagCandidate[] = [];

    for (const [tagName, votes] of tagVotes) {
      if (votes.contributors.length === 0) continue; // No positive votes

      const confidence = votes.weightedSum / votes.totalWeight;
      const tagConfig = this.taxonomyService.getTagConfig(tagName);

      if (!tagConfig) continue;

      candidates.push({
        tagName,
        section: tagConfig.section,
        confidence,
        contributors: votes.contributors,
      });
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }
}
```

### 6. Confidence Service

```typescript
// src/main/services/smart-tagging/confidence.service.ts

interface ConfidenceResult {
  accepted: TagCandidate[];
  suggestedLowConfidence: TagCandidate[];
  needsReview: TagCandidate[];
}

export class ConfidenceService {
  private taxonomyService: TaxonomyService;

  constructor(taxonomyService: TaxonomyService) {
    this.taxonomyService = taxonomyService;
  }

  applyThresholds(candidates: TagCandidate[]): ConfidenceResult {
    const config = this.taxonomyService.getConfig();
    const policy = config.lowConfidencePolicy;

    const accepted: TagCandidate[] = [];
    const suggestedLowConfidence: TagCandidate[] = [];
    const needsReview: TagCandidate[] = [];

    for (const candidate of candidates) {
      const tagConfig = this.taxonomyService.getTagConfig(candidate.tagName);
      if (!tagConfig) continue;

      const threshold = tagConfig.minConfidence;

      if (candidate.confidence >= threshold) {
        accepted.push(candidate);
      } else {
        // Below threshold - apply policy
        switch (policy) {
          case 'omit':
            // Don't include in results at all
            break;
          case 'suggest':
            suggestedLowConfidence.push(candidate);
            break;
          case 'ask':
            needsReview.push(candidate);
            break;
        }
      }
    }

    return { accepted, suggestedLowConfidence, needsReview };
  }
}
```

### 7. LLM Refiner Service

```typescript
// src/main/services/smart-tagging/llm-refiner.service.ts

interface RefinementInput {
  videoTitle?: string;
  videoDescription?: string;
  userNotes?: string;
  candidates: TagCandidate[];
  similarVideos: SimilarVideo[];
  allowedTags: string[];
  taxonomyBySection: Map<string, string[]>;
}

interface RefinementOutput {
  refinedTags: {
    tagName: string;
    section: string;
    confidence: number;
    reason?: string;
  }[];
  droppedTags: {
    tagName: string;
    reason: string;
  }[];
}

export class LLMRefinerService {
  private baseUrl: string;
  private modelName: string;
  private client: OpenAI;

  constructor(config: { baseUrl: string; modelName: string }) {
    this.baseUrl = config.baseUrl;
    this.modelName = config.modelName;

    // Use OpenAI SDK with LM Studio endpoint
    this.client = new OpenAI({
      baseURL: this.baseUrl,
      apiKey: 'not-needed', // LM Studio doesn't require API key
    });
  }

  async refine(input: RefinementInput): Promise<RefinementOutput> {
    const systemPrompt = this.buildSystemPrompt(input);
    const userPrompt = this.buildUserPrompt(input);

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Deterministic
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    // Parse and validate JSON
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Retry once
      const retryResponse = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: content },
          { role: 'user', content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object matching the required schema.' },
        ],
        temperature: 0,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const retryContent = retryResponse.choices[0]?.message?.content;
      if (!retryContent) {
        throw new Error('No response from LLM on retry');
      }
      parsed = JSON.parse(retryContent);
    }

    // Validate and filter output
    return this.validateOutput(parsed, input.allowedTags);
  }

  private buildSystemPrompt(input: RefinementInput): string {
    const taxonomySection = Array.from(input.taxonomyBySection.entries())
      .map(([section, tags]) => `[${section}]\n${tags.join(', ')}`)
      .join('\n\n');

    return `You are a tag refinement assistant for a video library application.

Your job is to:
1. Review tag candidates generated from similar video analysis
2. Resolve any conflicts or redundancies
3. Map synonyms to canonical tags from the allowed taxonomy
4. Provide brief reasons for your decisions

CRITICAL RULES:
- You may ONLY output tags that exist in the allowed taxonomy below
- You must NEVER invent new tags
- You must NEVER infer sensitive attributes (age, ethnicity, etc.)
- Be deterministic and consistent

ALLOWED TAXONOMY:
${taxonomySection}

OUTPUT FORMAT (JSON):
{
  "refined_tags": [
    { "tag_name": "string", "section": "string", "confidence": 0.0-1.0, "reason": "optional string" }
  ],
  "dropped_tags": [
    { "tag_name": "string", "reason": "string" }
  ]
}`;
  }

  private buildUserPrompt(input: RefinementInput): string {
    const candidatesStr = input.candidates
      .map(c => `- ${c.tagName} (${c.section}): confidence=${c.confidence.toFixed(3)}`)
      .join('\n');

    const similarStr = input.similarVideos
      .slice(0, 5)
      .map(v => `- Video ${v.videoId} (similarity=${v.similarity.toFixed(3)}): tags=[${v.tags.map(t => t.name).join(', ')}]`)
      .join('\n');

    let prompt = `Refine these tag candidates for a video:

TAG CANDIDATES (from neighbor voting):
${candidatesStr}

SIMILAR VIDEOS USED FOR VOTING:
${similarStr}
`;

    if (input.videoTitle) {
      prompt += `\nVIDEO TITLE: ${input.videoTitle}`;
    }
    if (input.videoDescription) {
      prompt += `\nVIDEO DESCRIPTION: ${input.videoDescription.slice(0, 500)}`;
    }
    if (input.userNotes) {
      prompt += `\nUSER NOTES: ${input.userNotes}`;
    }

    prompt += `\n\nRespond with ONLY the JSON object. Do not include any other text.`;

    return prompt;
  }

  private validateOutput(parsed: any, allowedTags: string[]): RefinementOutput {
    const allowedSet = new Set(allowedTags);
    const refinedTags: RefinementOutput['refinedTags'] = [];
    const droppedTags: RefinementOutput['droppedTags'] = [];

    for (const tag of parsed.refined_tags || []) {
      const normalizedName = tag.tag_name?.toLowerCase().trim().replace(/\s+/g, '-');

      if (!normalizedName || !allowedSet.has(normalizedName)) {
        // Log and drop unknown tags
        console.warn(`LLM produced unknown tag: ${tag.tag_name}`);
        droppedTags.push({
          tagName: tag.tag_name,
          reason: 'Not in allowed taxonomy',
        });
        continue;
      }

      refinedTags.push({
        tagName: normalizedName,
        section: tag.section || 'Unknown',
        confidence: Math.min(1, Math.max(0, tag.confidence || 0)),
        reason: tag.reason,
      });
    }

    // Include explicitly dropped tags from LLM
    for (const dropped of parsed.dropped_tags || []) {
      droppedTags.push({
        tagName: dropped.tag_name,
        reason: dropped.reason || 'Dropped by LLM',
      });
    }

    return { refinedTags, droppedTags };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.models.list();
      return response.data.length > 0;
    } catch {
      return false;
    }
  }
}
```

### 8. Main Orchestrator

```typescript
// src/main/services/smart-tagging/index.ts

interface TagSuggestionResult {
  accepted: {
    tagName: string;
    section: string;
    confidence: number;
    reason?: string;
  }[];
  suggestedLowConfidence: {
    tagName: string;
    section: string;
    confidence: number;
  }[];
  needsReview: {
    tagName: string;
    section: string;
    confidence: number;
  }[];
  evidence: {
    similarVideos: {
      videoId: string;
      title?: string;
      similarity: number;
      tags: string[];
    }[];
    candidatesGenerated: number;
    llmRefined: boolean;
  };
}

export class SmartTaggingService {
  private taxonomyService: TaxonomyService;
  private frameExtractor: FrameExtractorService;
  private embeddingService: EmbeddingService;
  private similarityService: SimilarityService;
  private neighborVoting: NeighborVotingService;
  private confidenceService: ConfidenceService;
  private llmRefiner: LLMRefinerService;
  private db: Database;

  constructor(
    db: Database,
    libraryPath: string,
    binaryService: BinaryService,
    llmConfig: { baseUrl: string; modelName: string }
  ) {
    this.db = db;
    this.taxonomyService = new TaxonomyService(libraryPath);
    this.frameExtractor = new FrameExtractorService(binaryService);
    this.embeddingService = new EmbeddingService(db);
    this.similarityService = new SimilarityService(db, this.embeddingService);
    this.neighborVoting = new NeighborVotingService(this.taxonomyService, this.similarityService);
    this.confidenceService = new ConfidenceService(this.taxonomyService);
    this.llmRefiner = new LLMRefinerService(llmConfig);
  }

  async initialize(): Promise<void> {
    await this.taxonomyService.load();
    await this.embeddingService.initialize();
  }

  /**
   * Index a video: extract frames, compute embeddings, store
   */
  async indexVideo(videoId: string, videoPath: string): Promise<void> {
    // Extract frames
    const frames = await this.frameExtractor.extractFrames(videoPath, videoId);

    // Compute embeddings for each frame
    const embeddings = await this.embeddingService.embedFrames(frames);

    // Store frame embeddings
    for (const frame of frames) {
      const embedding = embeddings.get(frame.index);
      if (embedding) {
        await this.embeddingService.storeFrameEmbedding(
          videoId,
          frame.index,
          frame.timestampMs,
          frame.filePath,
          embedding
        );
      }
    }

    // Compute and store aggregated embedding
    const allEmbeddings = Array.from(embeddings.values());
    const aggregated = await this.embeddingService.computeAggregatedEmbedding(allEmbeddings);
    await this.embeddingService.storeVideoEmbedding(videoId, aggregated, frames.length);
  }

  /**
   * Suggest tags for a video based on similar tagged videos
   */
  async suggestTags(
    videoId: string,
    options: {
      topK?: number;
      useLLMRefinement?: boolean;
      videoTitle?: string;
      videoDescription?: string;
      userNotes?: string;
    } = {}
  ): Promise<TagSuggestionResult> {
    const { topK = 10, useLLMRefinement = true, videoTitle, videoDescription, userNotes } = options;

    // Generate candidates via neighbor voting
    const candidates = await this.neighborVoting.generateCandidates(videoId, topK);

    // Get similar videos for evidence
    const similarVideos = await this.similarityService.findSimilarVideos(videoId, topK);

    let finalCandidates = candidates;
    let llmRefined = false;

    // Optional LLM refinement
    if (useLLMRefinement && await this.llmRefiner.isAvailable()) {
      try {
        const refined = await this.llmRefiner.refine({
          videoTitle,
          videoDescription,
          userNotes,
          candidates,
          similarVideos,
          allowedTags: this.taxonomyService.getAllowedTags(),
          taxonomyBySection: this.taxonomyService.getTagsBySection(),
        });

        // Replace candidates with refined version
        finalCandidates = refined.refinedTags.map(t => ({
          tagName: t.tagName,
          section: t.section,
          confidence: t.confidence,
          contributors: candidates.find(c => c.tagName === t.tagName)?.contributors || [],
          reason: t.reason,
        }));

        llmRefined = true;
      } catch (e) {
        console.error('LLM refinement failed, using raw candidates:', e);
      }
    }

    // Apply confidence thresholds
    const { accepted, suggestedLowConfidence, needsReview } =
      this.confidenceService.applyThresholds(finalCandidates);

    // Build result
    return {
      accepted: accepted.map(c => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence,
        reason: (c as any).reason,
      })),
      suggestedLowConfidence: suggestedLowConfidence.map(c => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence,
      })),
      needsReview: needsReview.map(c => ({
        tagName: c.tagName,
        section: c.section,
        confidence: c.confidence,
      })),
      evidence: {
        similarVideos: similarVideos.map(v => ({
          videoId: v.videoId,
          title: this.getVideoTitle(v.videoId),
          similarity: v.similarity,
          tags: v.tags.map(t => t.name),
        })),
        candidatesGenerated: candidates.length,
        llmRefined,
      },
    };
  }

  /**
   * Apply user's tag decision (accept/reject a suggestion)
   */
  async applyTagDecision(
    videoId: string,
    tagName: string,
    decision: 'accept' | 'reject'
  ): Promise<void> {
    const tag = this.getOrCreateTag(tagName);

    if (decision === 'accept') {
      this.db.prepare(`
        INSERT OR REPLACE INTO video_tags_extended
        (id, video_id, tag_id, source, suggestion_state, updated_at)
        VALUES (?, ?, ?, 'suggested', 'accepted', CURRENT_TIMESTAMP)
      `).run(`${videoId}_${tag.id}`, videoId, tag.id);
    }

    // Log the event
    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, ?, 'user')
    `).run(videoId, tag.id, decision);
  }

  /**
   * Add a user tag manually
   */
  async addUserTag(videoId: string, tagName: string, lock: boolean = false): Promise<void> {
    if (!this.taxonomyService.isValidTag(tagName)) {
      throw new Error(`Tag "${tagName}" is not in the taxonomy`);
    }

    const tag = this.getOrCreateTag(tagName);

    this.db.prepare(`
      INSERT OR REPLACE INTO video_tags_extended
      (id, video_id, tag_id, source, is_locked, locked_at, suggestion_state, updated_at)
      VALUES (?, ?, ?, 'user', ?, ?, NULL, CURRENT_TIMESTAMP)
    `).run(
      `${videoId}_${tag.id}`,
      videoId,
      tag.id,
      lock ? 1 : 0,
      lock ? new Date().toISOString() : null
    );

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'add', 'user')
    `).run(videoId, tag.id);
  }

  /**
   * Lock a tag (protected from regeneration)
   */
  async lockTag(videoId: string, tagName: string): Promise<void> {
    const tag = this.getOrCreateTag(tagName);

    this.db.prepare(`
      UPDATE video_tags_extended
      SET is_locked = 1, locked_at = CURRENT_TIMESTAMP, locked_by = 'user'
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id);

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'lock', 'user')
    `).run(videoId, tag.id);
  }

  /**
   * Remove a tag (respects locks)
   */
  async removeTag(videoId: string, tagName: string, force: boolean = false): Promise<boolean> {
    const tag = this.getTag(tagName);
    if (!tag) return false;

    // Check if locked
    const existing = this.db.prepare(`
      SELECT is_locked FROM video_tags_extended
      WHERE video_id = ? AND tag_id = ?
    `).get(videoId, tag.id) as { is_locked: number } | undefined;

    if (existing?.is_locked && !force) {
      return false; // Cannot remove locked tag without force
    }

    this.db.prepare(`
      DELETE FROM video_tags_extended
      WHERE video_id = ? AND tag_id = ?
    `).run(videoId, tag.id);

    this.db.prepare(`
      INSERT INTO tag_events (video_id, tag_id, event_type, source)
      VALUES (?, ?, 'remove', 'user')
    `).run(videoId, tag.id);

    return true;
  }

  /**
   * Regenerate suggestions (preserves locked tags)
   */
  async regenerateSuggestions(videoId: string): Promise<TagSuggestionResult> {
    // Get locked tags
    const lockedTags = this.db.prepare(`
      SELECT t.name FROM video_tags_extended vt
      JOIN tags t ON vt.tag_id = t.id
      WHERE vt.video_id = ? AND vt.is_locked = 1
    `).all(videoId) as { name: string }[];

    // Clear non-locked suggested tags
    this.db.prepare(`
      DELETE FROM video_tags_extended
      WHERE video_id = ? AND is_locked = 0 AND source IN ('suggested', 'ai_refined')
    `).run(videoId);

    // Generate new suggestions
    const suggestions = await this.suggestTags(videoId);

    // Filter out already-locked tags from accepted
    suggestions.accepted = suggestions.accepted.filter(
      t => !lockedTags.some(lt => lt.name === t.tagName)
    );

    return suggestions;
  }

  private getVideoTitle(videoId: string): string | undefined {
    const row = this.db.prepare('SELECT title FROM videos WHERE id = ?').get(videoId) as { title?: string };
    return row?.title;
  }

  private getTag(tagName: string): { id: number; name: string } | undefined {
    return this.db.prepare('SELECT id, name FROM tags WHERE name = ?').get(tagName) as { id: number; name: string } | undefined;
  }

  private getOrCreateTag(tagName: string): { id: number; name: string } {
    const normalized = this.taxonomyService.normalizeTagName(tagName);
    const existing = this.getTag(normalized);
    if (existing) return existing;

    const tagConfig = this.taxonomyService.getTagConfig(normalized);

    this.db.prepare(`
      INSERT INTO tags (name, is_ai_generated) VALUES (?, 0)
    `).run(normalized);

    return this.getTag(normalized)!;
  }
}
```

---

## Configuration

### Settings Integration

Add to existing settings schema:

```typescript
// src/shared/types/settings.types.ts

interface SmartTaggingSettings {
  enabled: boolean;

  // Frame extraction
  maxFramesPerVideo: number;       // Default: 30
  sceneChangeThreshold: number;    // Default: 0.3

  // Similarity search
  topKNeighbors: number;           // Default: 10
  minSimilarity: number;           // Default: 0.3

  // LLM refinement
  useLLMRefinement: boolean;       // Default: true
  lmStudioUrl: string;             // Default: 'http://localhost:1234/v1'
  lmStudioModel: string;           // Default: 'auto' (use whatever is loaded)

  // Embedding model
  embeddingModel: string;          // Default: 'clip-vit-base-patch32'

  // Auto-suggest
  autoSuggestOnImport: boolean;    // Default: false
  autoIndexOnImport: boolean;      // Default: true
}
```

### Default Configuration

```json
{
  "smartTagging": {
    "enabled": true,
    "maxFramesPerVideo": 30,
    "sceneChangeThreshold": 0.3,
    "topKNeighbors": 10,
    "minSimilarity": 0.3,
    "useLLMRefinement": true,
    "lmStudioUrl": "http://localhost:1234/v1",
    "lmStudioModel": "auto",
    "embeddingModel": "clip-vit-base-patch32",
    "autoSuggestOnImport": false,
    "autoIndexOnImport": true
  }
}
```

---

## Sample tags.txt

```txt
# Drapp Video Taxonomy
# Edit this file to control which tags can be suggested
# Lines starting with # are comments

@default_min_conf = 0.65
@low_confidence_policy = suggest

# ============================================
[Content Type]
@min_conf = 0.70

tutorial
review
walkthrough
unboxing
vlog
podcast
interview
documentary
music-video
live-performance
trailer
clip
compilation
reaction
commentary

# ============================================
[Genre]
@min_conf = 0.60

gaming
tech
cooking
fitness
travel
education
entertainment
news
sports
music
art
science
nature
automotive

# ============================================
[Mood/Tone]
@min_conf = 0.55

funny
serious
relaxing
intense
emotional
informative
inspiring
nostalgic

# ============================================
[Technical Quality]
@min_conf = 0.50

4k
1080p
hdr
vertical
widescreen
slow-motion
timelapse
animation
screen-recording

# ============================================
[Duration Category]
@min_conf = 0.80

short-form | min_conf=0.90
long-form | min_conf=0.90

# ============================================
[Personal]
# User's custom organizational tags
@min_conf = 0.70

favorites
watch-later
reference
archive
to-edit
```

---

## UI Components

### Tag Suggestion Panel

```tsx
// src/renderer/components/ai/TagSuggestionPanel.tsx

interface TagSuggestionPanelProps {
  videoId: string;
  onTagsUpdated: () => void;
}

export function TagSuggestionPanel({ videoId, onTagsUpdated }: TagSuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateSuggestions = async () => {
    setLoading(true);
    try {
      const result = await window.api.smartTagging.suggestTags(videoId);
      setSuggestions(result);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (tagName: string) => {
    await window.api.smartTagging.applyDecision(videoId, tagName, 'accept');
    onTagsUpdated();
  };

  const handleReject = async (tagName: string) => {
    await window.api.smartTagging.applyDecision(videoId, tagName, 'reject');
    // Remove from local state
    if (suggestions) {
      setSuggestions({
        ...suggestions,
        accepted: suggestions.accepted.filter(t => t.tagName !== tagName),
        suggestedLowConfidence: suggestions.suggestedLowConfidence.filter(t => t.tagName !== tagName),
        needsReview: suggestions.needsReview.filter(t => t.tagName !== tagName),
      });
    }
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Smart Tag Suggestions</h3>
        <Button onClick={handleGenerateSuggestions} disabled={loading}>
          {loading ? 'Analyzing...' : 'Generate Suggestions'}
        </Button>
      </div>

      {suggestions && (
        <>
          {/* Accepted tags */}
          {suggestions.accepted.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm text-gray-400 mb-2">Suggested Tags</h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.accepted.map(tag => (
                  <TagChip
                    key={tag.tagName}
                    name={tag.tagName}
                    confidence={tag.confidence}
                    onAccept={() => handleAccept(tag.tagName)}
                    onReject={() => handleReject(tag.tagName)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Low confidence suggestions */}
          {suggestions.suggestedLowConfidence.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm text-gray-400 mb-2">Low Confidence</h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.suggestedLowConfidence.map(tag => (
                  <TagChip
                    key={tag.tagName}
                    name={tag.tagName}
                    confidence={tag.confidence}
                    variant="low-confidence"
                    onAccept={() => handleAccept(tag.tagName)}
                    onReject={() => handleReject(tag.tagName)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Evidence section */}
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer">
              How were these generated? ({suggestions.evidence.similarVideos.length} similar videos analyzed)
            </summary>
            <div className="mt-2 text-xs text-gray-600">
              {suggestions.evidence.similarVideos.map(v => (
                <div key={v.videoId} className="mb-1">
                  {v.title || v.videoId} (similarity: {(v.similarity * 100).toFixed(1)}%)
                  <span className="text-gray-500"> — {v.tags.join(', ')}</span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
```

---

## CLI / Dev Script

```typescript
// scripts/smart-tagging-cli.ts

import { program } from 'commander';
import { SmartTaggingService } from '../src/main/services/smart-tagging';

program
  .name('drapp-tagging')
  .description('Smart tagging CLI for Drapp');

program
  .command('index <videoPath>')
  .description('Index a video (extract frames, compute embeddings)')
  .option('-i, --id <videoId>', 'Video ID (auto-generated if not provided)')
  .action(async (videoPath, options) => {
    const service = await initService();
    const videoId = options.id || generateId();

    console.log(`Indexing video: ${videoPath}`);
    await service.indexVideo(videoId, videoPath);
    console.log(`Indexed as: ${videoId}`);
  });

program
  .command('suggest <videoId>')
  .description('Generate tag suggestions for a video')
  .option('-k, --top-k <number>', 'Number of similar videos to consider', '10')
  .option('--no-llm', 'Skip LLM refinement')
  .action(async (videoId, options) => {
    const service = await initService();

    const result = await service.suggestTags(videoId, {
      topK: parseInt(options.topK),
      useLLMRefinement: options.llm !== false,
    });

    console.log('\n=== Suggested Tags ===');
    for (const tag of result.accepted) {
      console.log(`  [${tag.section}] ${tag.tagName} (${(tag.confidence * 100).toFixed(1)}%)`);
    }

    if (result.suggestedLowConfidence.length > 0) {
      console.log('\n=== Low Confidence ===');
      for (const tag of result.suggestedLowConfidence) {
        console.log(`  [${tag.section}] ${tag.tagName} (${(tag.confidence * 100).toFixed(1)}%)`);
      }
    }

    console.log('\n=== Evidence ===');
    console.log(`Similar videos used: ${result.evidence.similarVideos.length}`);
    console.log(`LLM refined: ${result.evidence.llmRefined}`);
  });

program
  .command('add-tag <videoId> <tagName>')
  .description('Add a user tag to a video')
  .option('-l, --lock', 'Lock the tag')
  .action(async (videoId, tagName, options) => {
    const service = await initService();
    await service.addUserTag(videoId, tagName, options.lock);
    console.log(`Added tag: ${tagName}${options.lock ? ' (locked)' : ''}`);
  });

program
  .command('parse-taxonomy')
  .description('Parse and display the taxonomy file')
  .action(async () => {
    const service = await initService();
    const taxonomy = service.taxonomyService;

    for (const [section, tags] of taxonomy.getTagsBySection()) {
      console.log(`\n[${section}]`);
      for (const tag of tags) {
        const config = taxonomy.getTagConfig(tag);
        console.log(`  ${tag} (min_conf: ${config?.minConfidence})`);
      }
    }
  });

program.parse();
```

---

## Testing

### Test Cases

```typescript
// tests/smart-tagging.test.ts

describe('SmartTaggingService', () => {
  describe('TaxonomyService', () => {
    it('should parse basic taxonomy file', () => {
      const content = `
@default_min_conf = 0.65
@low_confidence_policy = suggest

[Content Type]
@min_conf = 0.70
tutorial
review | min_conf=0.80
      `;

      const service = new TaxonomyService('/tmp');
      const config = service.parse(content);

      expect(config.defaultMinConf).toBe(0.65);
      expect(config.lowConfidencePolicy).toBe('suggest');
      expect(config.allTags.get('tutorial')?.minConfidence).toBe(0.70);
      expect(config.allTags.get('review')?.minConfidence).toBe(0.80);
    });

    it('should validate tags against taxonomy', () => {
      // ...
    });
  });

  describe('FrameExtractor', () => {
    it('should extract frames from video', async () => {
      // ...
    });

    it('should respect maxFrames limit', async () => {
      // ...
    });
  });

  describe('EmbeddingService', () => {
    it('should compute embeddings for frames', async () => {
      // ...
    });

    it('should store and retrieve embeddings', async () => {
      // ...
    });
  });

  describe('SimilarityService', () => {
    it('should compute cosine similarity correctly', () => {
      const service = new SimilarityService(db, embeddingService);

      const a = new Float32Array([1, 0, 0]);
      const b = new Float32Array([1, 0, 0]);
      expect(service.cosineSimilarity(a, b)).toBeCloseTo(1.0);

      const c = new Float32Array([0, 1, 0]);
      expect(service.cosineSimilarity(a, c)).toBeCloseTo(0.0);
    });

    it('should find similar videos', async () => {
      // ...
    });
  });

  describe('ConfidenceService', () => {
    it('should apply thresholds correctly', () => {
      // ...
    });

    it('should respect low_confidence_policy', () => {
      // ...
    });
  });

  describe('LLMRefiner', () => {
    it('should only output allowed tags', async () => {
      // ...
    });

    it('should drop unknown tags', async () => {
      // ...
    });

    it('should retry on invalid JSON', async () => {
      // ...
    });
  });

  describe('Integration', () => {
    it('should generate suggestions for new video', async () => {
      // ...
    });

    it('should respect locked tags on regeneration', async () => {
      // ...
    });
  });
});
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "onnxruntime-node": "^1.17.0",
    "sharp": "^0.33.0"
  }
}
```

---

## Phase Integration

This smart tagging system fits into **Phase 7: LLM Integration** of the main plan, but with additional work in:

- **Phase 1**: Database schema extensions
- **Phase 2**: Integration with download completion hooks
- **Phase 3**: Library scanner integration
- **Phase 5**: FFmpeg frame extraction (reuses transcoder service)

Estimated additional files: ~15
Estimated implementation: Part of Phase 7, with prerequisites scattered across earlier phases
