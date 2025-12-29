import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import type Database from 'better-sqlite3'
import type { ExtractedFrame } from '../../../shared/types/smart-tagging.types'

interface EmbeddingConfig {
  modelPath: string
  modelName: string
  dimensions: number
  batchSize: number
}

// Dynamic import types for optional dependencies
type OnnxSession = unknown

export class EmbeddingService {
  private session: OnnxSession | null = null
  private config: EmbeddingConfig
  private db: Database.Database
  private initialized = false

  constructor(db: Database.Database, config: Partial<EmbeddingConfig> = {}) {
    this.db = db
    this.config = {
      modelPath: join(app.getPath('userData'), 'models', 'clip-vit-base-patch32.onnx'),
      modelName: 'clip-vit-base-patch32',
      dimensions: 512,
      batchSize: 8,
      ...config
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Check if model exists
    if (!existsSync(this.config.modelPath)) {
      console.warn(
        `CLIP model not found at ${this.config.modelPath}. ` +
        `Embedding features will be disabled until model is installed.`
      )
      return
    }

    try {
      // Dynamically import onnxruntime-node
      const ort = await import('onnxruntime-node')
      this.session = await ort.InferenceSession.create(this.config.modelPath)
      this.initialized = true
      console.log('CLIP embedding model loaded successfully')
    } catch (error) {
      console.warn('Failed to load CLIP model:', error)
      console.warn('Embedding features will be disabled.')
    }
  }

  isAvailable(): boolean {
    return this.initialized && this.session !== null
  }

  getModelVersion(): string {
    return this.config.modelName
  }

  getDimensions(): number {
    return this.config.dimensions
  }

  async embedFrame(imagePath: string): Promise<Float32Array> {
    if (!this.isAvailable()) {
      throw new Error('Embedding model not initialized')
    }

    const tensor = await this.preprocessImage(imagePath)
    const ort = await import('onnxruntime-node')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = this.session as any

    const results = await session.run({ input: tensor })
    const outputKey = Object.keys(results)[0]
    return new Float32Array(results[outputKey].data as Float32Array)
  }

  async embedFrames(frames: ExtractedFrame[]): Promise<Map<number, Float32Array>> {
    if (!this.isAvailable()) {
      throw new Error('Embedding model not initialized')
    }

    const embeddings = new Map<number, Float32Array>()

    // Process in batches
    for (let i = 0; i < frames.length; i += this.config.batchSize) {
      const batch = frames.slice(i, i + this.config.batchSize)

      for (const frame of batch) {
        try {
          const embedding = await this.embedFrame(frame.filePath)
          embeddings.set(frame.index, embedding)
        } catch (error) {
          console.warn(`Failed to embed frame ${frame.index}:`, error)
          // Continue with other frames
        }
      }
    }

    return embeddings
  }

  private async preprocessImage(imagePath: string): Promise<unknown> {
    // Use sharp for image preprocessing
    const sharp = (await import('sharp')).default

    // Read and resize image to 224x224 (CLIP input size)
    const imageBuffer = await sharp(imagePath)
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer()

    // Convert to float32 and normalize with CLIP normalization values
    const floatData = new Float32Array(3 * 224 * 224)
    const mean = [0.48145466, 0.4578275, 0.40821073]
    const std = [0.26862954, 0.26130258, 0.27577711]

    // CLIP expects CHW format (channels, height, width)
    for (let i = 0; i < 224 * 224; i++) {
      // imageBuffer is in HWC (height, width, channels) RGB format
      floatData[i] = (imageBuffer[i * 3] / 255 - mean[0]) / std[0]                // R
      floatData[224 * 224 + i] = (imageBuffer[i * 3 + 1] / 255 - mean[1]) / std[1] // G
      floatData[2 * 224 * 224 + i] = (imageBuffer[i * 3 + 2] / 255 - mean[2]) / std[2] // B
    }

    const ort = await import('onnxruntime-node')
    return new ort.Tensor('float32', floatData, [1, 3, 224, 224])
  }

  computeAggregatedEmbedding(frameEmbeddings: Float32Array[]): Float32Array {
    if (frameEmbeddings.length === 0) {
      throw new Error('No embeddings to aggregate')
    }

    const dimensions = frameEmbeddings[0].length
    const aggregated = new Float32Array(dimensions)

    // Mean pooling
    for (const embedding of frameEmbeddings) {
      for (let i = 0; i < dimensions; i++) {
        aggregated[i] += embedding[i]
      }
    }

    for (let i = 0; i < dimensions; i++) {
      aggregated[i] /= frameEmbeddings.length
    }

    // L2 normalize
    let norm = 0
    for (let i = 0; i < dimensions; i++) {
      norm += aggregated[i] * aggregated[i]
    }
    norm = Math.sqrt(norm)

    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) {
        aggregated[i] /= norm
      }
    }

    return aggregated
  }

  // Database operations
  storeFrameEmbedding(
    videoId: string,
    frameIndex: number,
    timestampMs: number,
    filePath: string,
    embedding: Float32Array
  ): void {
    const id = `${videoId}_frame_${frameIndex}`
    const embeddingBuffer = Buffer.from(embedding.buffer)

    this.db.prepare(`
      INSERT OR REPLACE INTO video_frames
      (id, video_id, frame_index, timestamp_ms, file_path, embedding)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, videoId, frameIndex, timestampMs, filePath, embeddingBuffer)
  }

  storeVideoEmbedding(videoId: string, embedding: Float32Array, frameCount: number): void {
    const embeddingBuffer = Buffer.from(embedding.buffer)

    this.db.prepare(`
      INSERT OR REPLACE INTO video_embeddings
      (video_id, embedding, frame_count, model_version, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(videoId, embeddingBuffer, frameCount, this.config.modelName)
  }

  getVideoEmbedding(videoId: string): Float32Array | null {
    const row = this.db.prepare(
      'SELECT embedding FROM video_embeddings WHERE video_id = ?'
    ).get(videoId) as { embedding: Buffer } | undefined

    if (!row) return null

    return new Float32Array(
      row.embedding.buffer.slice(
        row.embedding.byteOffset,
        row.embedding.byteOffset + row.embedding.byteLength
      )
    )
  }

  getAllVideoEmbeddings(): Map<string, Float32Array> {
    const rows = this.db.prepare(
      'SELECT video_id, embedding FROM video_embeddings'
    ).all() as Array<{ video_id: string; embedding: Buffer }>

    const result = new Map<string, Float32Array>()
    for (const row of rows) {
      result.set(
        row.video_id,
        new Float32Array(
          row.embedding.buffer.slice(
            row.embedding.byteOffset,
            row.embedding.byteOffset + row.embedding.byteLength
          )
        )
      )
    }
    return result
  }

  getFrameEmbeddings(videoId: string): Map<number, Float32Array> {
    const rows = this.db.prepare(
      'SELECT frame_index, embedding FROM video_frames WHERE video_id = ? ORDER BY frame_index'
    ).all(videoId) as Array<{ frame_index: number; embedding: Buffer }>

    const result = new Map<number, Float32Array>()
    for (const row of rows) {
      result.set(
        row.frame_index,
        new Float32Array(
          row.embedding.buffer.slice(
            row.embedding.byteOffset,
            row.embedding.byteOffset + row.embedding.byteLength
          )
        )
      )
    }
    return result
  }

  isVideoIndexed(videoId: string): { indexed: boolean; frameCount: number | null } {
    const row = this.db.prepare(
      'SELECT frame_count FROM video_embeddings WHERE video_id = ?'
    ).get(videoId) as { frame_count: number } | undefined

    return {
      indexed: !!row,
      frameCount: row?.frame_count ?? null
    }
  }

  deleteVideoEmbeddings(videoId: string): void {
    this.db.prepare('DELETE FROM video_frames WHERE video_id = ?').run(videoId)
    this.db.prepare('DELETE FROM video_embeddings WHERE video_id = ?').run(videoId)
  }

  getEmbeddingCount(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM video_embeddings').get() as { count: number }
    return row.count
  }
}
