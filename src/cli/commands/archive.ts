/**
 * Archive Command - Batch encode videos using AV1/H.265
 * Features a friendly TUI for non-technical users
 * Full feature parity with GUI version
 */

import { Command } from 'commander'
import { readdir, stat, access, mkdir } from 'node:fs/promises'
import { join, extname, basename, relative } from 'node:path'
import { ArchivalService } from '../../main/services/archival/archival.service.js'
import {
  DEFAULT_ARCHIVAL_CONFIG,
  formatEta,
  formatSpeed,
  type ArchivalEncodingConfig,
  type ArchivalProgressEvent,
  type ArchivalCodec,
  type ArchivalPreset,
  type ArchivalResolution,
  type Av1Encoder,
  ARCHIVAL_PRESETS
} from '../../shared/types/archival.types.js'
import { TUI, printWelcome, printError, printSummary, style } from '../ui/tui.js'
import { runWizard } from '../ui/wizard.js'

// Supported video extensions
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.mov', '.webm', '.avi',
  '.m4v', '.ts', '.mts', '.m2ts', '.flv', '.wmv'
])

/**
 * Recursively find all video files in a directory
 */
async function findVideoFiles(
  rootPath: string,
  basePath: string = rootPath
): Promise<Array<{ absolutePath: string; relativePath: string }>> {
  const files: Array<{ absolutePath: string; relativePath: string }> = []
  const ignoredDirs = new Set(['.drapp', '.git', 'node_modules', '$RECYCLE.BIN', 'System Volume Information'])

  async function walk(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          if (ignoredDirs.has(entry.name) || entry.name.startsWith('.')) {
            continue
          }
          await walk(fullPath)
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase()
          if (VIDEO_EXTENSIONS.has(ext)) {
            files.push({
              absolutePath: fullPath,
              relativePath: relative(basePath, fullPath)
            })
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await walk(rootPath)
  return files
}

// Track state for TUI updates
interface TUITracker {
  completed: number
  skipped: number
  failed: number
  savedBytes: number
}

/**
 * Create progress handler that updates the TUI
 */
function createTUIProgressHandler(
  tui: TUI,
  fileNames: string[],
  tracker: TUITracker
): (event: ArchivalProgressEvent) => void {
  return (event: ArchivalProgressEvent) => {
    switch (event.kind) {
      case 'item_start':
        tui.update({
          status: 'analyzing',
          currentFile: fileNames[event.processedItems ?? 0] || 'Unknown',
          currentFileIndex: (event.processedItems ?? 0) + 1,
          fileProgress: 0
        })
        break

      case 'item_progress':
        tui.update({
          status: 'encoding',
          fileProgress: event.progress ?? 0,
          batchProgress: event.batchProgress ?? 0,
          speed: event.encodingSpeed ? formatSpeed(event.encodingSpeed) : '--',
          fileEta: event.itemEtaSeconds !== undefined ? formatEta(event.itemEtaSeconds) : '--',
          batchEta: event.batchEtaSeconds !== undefined ? formatEta(event.batchEtaSeconds) : '--',
          currentFileIndex: (event.processedItems ?? 0) + 1
        })
        break

      case 'item_complete':
        if (event.status === 'completed') {
          tracker.completed++
          // Track compression savings
          if (event.outputSize && event.compressionRatio && event.compressionRatio > 1) {
            const inputSize = event.outputSize * event.compressionRatio
            tracker.savedBytes += inputSize - event.outputSize
          }
          tui.update({
            completed: tracker.completed,
            savedBytes: tracker.savedBytes,
            fileProgress: 100
          })
        } else if (event.status === 'skipped') {
          tracker.skipped++
          tui.update({ skipped: tracker.skipped })
        }
        break

      case 'item_error':
        tracker.failed++
        tui.update({ failed: tracker.failed })
        break

      case 'batch_complete':
        tui.update({
          status: 'complete',
          batchProgress: 100,
          fileProgress: 100
        })
        break
    }
  }
}

/**
 * Simple progress handler for non-TUI mode
 */
function createSimpleProgressHandler(): (event: ArchivalProgressEvent) => void {
  let lastUpdate = 0

  return (event: ArchivalProgressEvent) => {
    const now = Date.now()

    // Throttle updates
    if (now - lastUpdate < 200 && event.kind === 'item_progress') {
      return
    }
    lastUpdate = now

    switch (event.kind) {
      case 'item_start':
        console.log(`\n${style.cyan}→${style.reset} Starting video...`)
        break

      case 'item_progress':
        if (event.progress !== undefined) {
          const progress = event.progress
          const speed = event.encodingSpeed ? formatSpeed(event.encodingSpeed) : '--'
          const eta = event.itemEtaSeconds !== undefined ? formatEta(event.itemEtaSeconds) : '--'

          process.stdout.write(`\r  Progress: ${progress}%  Speed: ${speed}  ETA: ${eta}    `)
        }
        break

      case 'item_complete':
        process.stdout.write('\r\x1b[K')
        if (event.status === 'completed') {
          console.log(`  ${style.green}✓${style.reset} Completed`)
        } else if (event.status === 'skipped') {
          console.log(`  ${style.yellow}○${style.reset} Skipped`)
        }
        break

      case 'item_error':
        process.stdout.write('\r\x1b[K')
        console.log(`  ${style.red}✗${style.reset} Failed: ${event.error || 'Unknown error'}`)
        break

      case 'batch_complete':
        console.log(`\n${style.green}✓ Batch complete${style.reset}`)
        break
    }
  }
}

export const archiveCommand = new Command('archive')
  .description('Batch encode videos using AV1 or H.265')
  .argument('[input]', 'Input file or directory (optional with --interactive)')
  .argument('[output]', 'Output directory (optional with --interactive)')

  // === Interactive Mode ===
  .option('-i, --interactive', 'Launch interactive wizard to select files and configure settings', false)

  // === Basic Settings ===
  .option('-c, --codec <codec>', 'Codec: av1 or h265', 'av1')
  .option('-p, --preset <preset>', 'Quality preset: archive, max-compression, or fast', 'archive')
  .option('--container <format>', 'Container: mkv, mp4, or webm', 'mkv')

  // === Resolution ===
  .option('--resolution <res>', 'Target resolution: source, 4k, 1440p, 1080p, 720p, 480p, 360p', 'source')

  // === AV1 Settings ===
  .option('--av1-encoder <encoder>', 'AV1 encoder: libsvtav1 (fast) or libaom-av1 (quality)', 'libsvtav1')
  .option('--av1-preset <number>', 'AV1 speed preset: 0-13 for SVT, 0-8 for libaom (lower=slower/better)', '6')
  .option('--av1-crf <number>', 'AV1 CRF value: 0-63 (lower=better quality)')
  .option('--film-grain <number>', 'Film grain synthesis: 0-50 (0=off, helps with noisy video)', '10')

  // === H.265 Settings ===
  .option('--h265-preset <preset>', 'H.265 speed: ultrafast,superfast,veryfast,faster,fast,medium,slow,slower,veryslow', 'medium')
  .option('--h265-crf <number>', 'H.265 CRF value: 0-51 (lower=better quality)')
  .option('--h265-tune <tune>', 'H.265 tune: film, animation, grain, fastdecode, zerolatency')
  .option('--h265-bframes <number>', 'H.265 B-frames: 0-16', '4')

  // === Audio Settings ===
  .option('--audio-copy', 'Copy audio without re-encoding (default)', true)
  .option('--no-audio-copy', 'Re-encode audio')
  .option('--audio-codec <codec>', 'Audio codec if re-encoding: opus, aac, flac', 'aac')
  .option('--audio-bitrate <kbps>', 'Audio bitrate in kbps', '160')

  // === Encoding Options ===
  .option('--two-pass', 'Enable two-pass encoding (better quality, slower)', false)
  .option('--threads <number>', 'Limit encoder threads: 0, 4, or 6 (0=unlimited)', '0')

  // === Output Behavior ===
  .option('--overwrite', 'Overwrite existing output files', false)
  .option('--fill-mode', 'Skip files that would conflict with existing outputs', false)
  .option('--preserve-structure', 'Preserve folder structure from input', false)
  .option('--delete-if-larger', 'Delete output if larger than input', true)
  .option('--no-delete-if-larger', 'Keep output even if larger than input')
  .option('--delete-original', 'Delete original files after successful encoding (DANGEROUS)', false)

  // === Extras ===
  .option('--thumbnail', 'Extract thumbnail from encoded video', false)
  .option('--captions', 'Extract captions using Whisper transcription', false)
  .option('--caption-lang <lang>', 'Language for captions: en, es, auto, etc.', 'auto')

  // === UI ===
  .option('--simple', 'Use simple text output instead of visual interface', false)

  .action(async (input: string | undefined, output: string | undefined, options) => {
    // Handle interactive mode
    if (options.interactive || (!input && !output)) {
      if (!process.stdout.isTTY) {
        console.error(`${style.red}Error:${style.reset} Interactive mode requires a terminal`)
        process.exit(1)
      }

      const wizardResult = await runWizard()
      if (wizardResult.cancelled) {
        console.log(`\n${style.yellow}Cancelled${style.reset}`)
        process.exit(0)
      }

      // Use wizard results
      input = wizardResult.inputPaths[0]
      output = wizardResult.outputPath

      // Apply wizard options to command options
      options = {
        ...options,
        codec: wizardResult.options.codec,
        preset: wizardResult.options.preset,
        resolution: wizardResult.options.resolution,
        container: wizardResult.options.container,
        av1Encoder: wizardResult.options.av1Encoder,
        av1Preset: String(wizardResult.options.av1Preset),
        av1Crf: wizardResult.options.av1Crf ? String(wizardResult.options.av1Crf) : undefined,
        filmGrain: String(wizardResult.options.filmGrain),
        h265Preset: wizardResult.options.h265Preset,
        h265Crf: wizardResult.options.h265Crf ? String(wizardResult.options.h265Crf) : undefined,
        h265Tune: wizardResult.options.h265Tune,
        audioCopy: wizardResult.options.audioCopy,
        audioCodec: wizardResult.options.audioCodec,
        audioBitrate: String(wizardResult.options.audioBitrate),
        twoPass: wizardResult.options.twoPass,
        overwrite: wizardResult.options.overwrite,
        fillMode: wizardResult.options.fillMode,
        deleteIfLarger: wizardResult.options.deleteIfLarger,
        deleteOriginal: wizardResult.options.deleteOriginal,
        preserveStructure: wizardResult.options.preserveStructure,
        thumbnail: wizardResult.options.extractThumbnail,
        captions: wizardResult.options.extractCaptions,
        captionLang: wizardResult.options.captionLanguage,
        threads: String(wizardResult.options.threadLimit),
        simple: wizardResult.options.simple
      }

      // If wizard provided folder root and relative paths, use them
      if (wizardResult.folderRoot && wizardResult.relativePaths) {
        (options as any)._wizardFolderRoot = wizardResult.folderRoot
        (options as any)._wizardRelativePaths = wizardResult.relativePaths
      }

      // If multiple files were selected, use them directly
      if (wizardResult.inputPaths.length > 1) {
        // We'll handle this case below
        (options as any)._wizardInputPaths = wizardResult.inputPaths
      }
    }

    // Validate that we have input and output
    if (!input || !output) {
      console.error(`${style.red}Error:${style.reset} Input and output paths are required`)
      console.log(`\nUsage: drapp archive <input> <output>`)
      console.log(`   or: drapp archive --interactive`)
      process.exit(1)
    }

    const useTUI = !options.simple && process.stdout.isTTY

    // Initialize TUI
    let tui: TUI | null = null
    let service: ArchivalService | null = null
    const tracker: TUITracker = { completed: 0, skipped: 0, failed: 0, savedBytes: 0 }

    // Graceful shutdown handler
    const shutdown = () => {
      if (tui) {
        tui.stop()
      }
      if (service) {
        service.cancel()
      }
      console.log(`\n${style.yellow}Encoding cancelled${style.reset}`)
      process.exit(130) // Standard exit code for SIGINT
    }

    // Register shutdown handlers
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    try {
      // Validate input
      try {
        await access(input)
      } catch {
        if (useTUI) {
          printError('Input path not found', input)
        } else {
          console.error(`${style.red}Error:${style.reset} Input path not found: ${input}`)
        }
        process.exit(1)
      }

      const codec = options.codec as ArchivalCodec
      const preset = options.preset as ArchivalPreset

      // Show welcome in simple mode
      if (!useTUI) {
        printWelcome(codec, preset)
      }

      // Check if input is file or directory
      const inputStat = await stat(input)
      let inputPaths: string[] = []
      let relativePaths: string[] = []
      let folderRoot: string | undefined
      let fileNames: string[] = []

      // Check if wizard provided multiple paths with folder structure
      const wizardPaths = (options as any)._wizardInputPaths as string[] | undefined
      const wizardFolderRoot = (options as any)._wizardFolderRoot as string | undefined
      const wizardRelativePaths = (options as any)._wizardRelativePaths as string[] | undefined

      if (wizardPaths && wizardPaths.length > 0) {
        // Use wizard-selected paths directly
        inputPaths = wizardPaths

        // Use wizard relative paths if provided (for preserve structure)
        if (wizardRelativePaths && wizardRelativePaths.length === wizardPaths.length) {
          relativePaths = wizardRelativePaths
          folderRoot = wizardFolderRoot
        } else {
          relativePaths = wizardPaths.map(p => basename(p))
        }
        fileNames = relativePaths

        if (!useTUI) {
          console.log(`Selected ${style.cyan}${inputPaths.length}${style.reset} files`)
          if (options.preserveStructure && folderRoot) {
            console.log(`${style.dim}Preserving folder structure from: ${folderRoot}${style.reset}`)
          }
          console.log()
        }
      } else if (inputStat.isDirectory()) {
        if (!useTUI) {
          console.log(`${style.dim}Scanning directory...${style.reset}`)
        }

        const files = await findVideoFiles(input)

        if (files.length === 0) {
          if (useTUI) {
            printError('No video files found', `in ${input}`)
          } else {
            console.error(`${style.red}Error:${style.reset} No video files found in ${input}`)
          }
          process.exit(1)
        }

        inputPaths = files.map(f => f.absolutePath)
        relativePaths = files.map(f => f.relativePath)
        fileNames = files.map(f => f.relativePath)
        folderRoot = input

        if (!useTUI) {
          console.log(`Found ${style.cyan}${files.length}${style.reset} video files\n`)
        }
      } else {
        inputPaths = [input]
        relativePaths = [basename(input)]
        fileNames = [basename(input)]
      }

      // Create output directory
      await mkdir(output, { recursive: true })

      // Build config from preset
      const presetConfig = ARCHIVAL_PRESETS[preset] || {}

      // Start with defaults and apply preset
      const config: Partial<ArchivalEncodingConfig> = {
        ...DEFAULT_ARCHIVAL_CONFIG,
        ...presetConfig,
        codec,
        container: options.container as 'mkv' | 'mp4' | 'webm',
        resolution: options.resolution as ArchivalResolution,
        overwriteExisting: options.overwrite,
        fillMode: options.fillMode,
        preserveStructure: options.preserveStructure,
        deleteOutputIfLarger: options.deleteIfLarger,
        deleteOriginal: options.deleteOriginal,
        extractThumbnail: options.thumbnail,
        extractCaptions: options.captions,
        captionLanguage: options.captionLang,
        audioCopy: options.audioCopy,
        audioCodec: options.audioCodec as 'opus' | 'aac' | 'flac',
        audioBitrate: parseInt(options.audioBitrate, 10),
        threadLimit: parseInt(options.threads, 10) as 0 | 4 | 6
      }

      // Build AV1 options
      config.av1 = {
        ...DEFAULT_ARCHIVAL_CONFIG.av1,
        ...presetConfig.av1,
        encoder: options.av1Encoder as Av1Encoder,
        preset: parseInt(options.av1Preset, 10),
        filmGrainSynthesis: parseInt(options.filmGrain, 10),
        twoPass: options.twoPass
      }

      // Apply custom AV1 CRF if specified
      if (options.av1Crf) {
        config.av1.crf = parseInt(options.av1Crf, 10)
      }

      // Build H.265 options
      config.h265 = {
        ...DEFAULT_ARCHIVAL_CONFIG.h265,
        ...presetConfig.h265,
        preset: options.h265Preset as typeof DEFAULT_ARCHIVAL_CONFIG.h265.preset,
        bframes: parseInt(options.h265Bframes, 10),
        twoPass: options.twoPass
      }

      // Apply custom H.265 CRF if specified
      if (options.h265Crf) {
        config.h265.crf = parseInt(options.h265Crf, 10)
      }

      // Apply H.265 tune if specified
      if (options.h265Tune) {
        config.h265.tune = options.h265Tune as typeof DEFAULT_ARCHIVAL_CONFIG.h265.tune
      }

      // Initialize TUI or use simple mode
      let progressHandler: (event: ArchivalProgressEvent) => void

      if (useTUI) {
        tui = new TUI()
        tui.update({
          codec: codec.toUpperCase(),
          preset,
          totalFiles: inputPaths.length,
          subtitle: `Output: ${output}`,
          status: 'scanning'
        })
        tui.start()
        progressHandler = createTUIProgressHandler(tui, fileNames, tracker)
      } else {
        // Show config summary in simple mode
        console.log(`${style.dim}Configuration:${style.reset}`)
        console.log(`  Codec: ${style.cyan}${codec.toUpperCase()}${style.reset}`)
        console.log(`  Preset: ${style.cyan}${preset}${style.reset}`)
        console.log(`  Resolution: ${style.cyan}${options.resolution}${style.reset}`)
        console.log(`  Container: ${style.cyan}${options.container}${style.reset}`)
        if (codec === 'av1') {
          console.log(`  AV1 Encoder: ${style.cyan}${options.av1Encoder}${style.reset}`)
          console.log(`  AV1 Preset: ${style.cyan}${options.av1Preset}${style.reset}`)
          console.log(`  Film Grain: ${style.cyan}${options.filmGrain}${style.reset}`)
        } else {
          console.log(`  H.265 Preset: ${style.cyan}${options.h265Preset}${style.reset}`)
          if (options.h265Tune) {
            console.log(`  H.265 Tune: ${style.cyan}${options.h265Tune}${style.reset}`)
          }
        }
        console.log(`  Two-pass: ${style.cyan}${options.twoPass ? 'yes' : 'no'}${style.reset}`)
        console.log(`  Audio: ${style.cyan}${options.audioCopy ? 'copy' : options.audioCodec}${style.reset}`)
        if (options.captions) {
          console.log(`  Captions: ${style.cyan}${options.captionLang}${style.reset}`)
        }
        console.log(`  Output: ${style.cyan}${output}${style.reset}`)
        console.log()
        console.log(`${style.bold}Starting encoding...${style.reset}\n`)
        progressHandler = createSimpleProgressHandler()
      }

      // Create service with progress handler
      service = new ArchivalService(progressHandler)

      // Start batch processing
      await service.startBatch(
        inputPaths,
        output,
        config,
        folderRoot,
        relativePaths
      )

      // Wait for completion
      await new Promise<void>((resolve) => {
        const checkStatus = setInterval(() => {
          const status = service.getStatus()
          if (!status || status.status === 'completed' || status.status === 'cancelled') {
            clearInterval(checkStatus)
            resolve()
          }
        }, 500)
      })

      // Stop TUI before showing summary
      if (tui) {
        tui.stop()
      }

      // Show final summary
      const finalStatus = service.getStatus()

      if (finalStatus) {
        // Calculate total savings
        let totalSaved = 0
        for (const item of finalStatus.items) {
          if (item.status === 'completed' && item.inputSize && item.outputSize) {
            totalSaved += item.inputSize - item.outputSize
          }
        }

        printSummary(
          finalStatus.completedItems,
          finalStatus.skippedItems,
          finalStatus.failedItems,
          Math.max(0, totalSaved)
        )
      }

    } catch (error) {
      if (tui) {
        tui.stop()
      }

      const message = error instanceof Error ? error.message : String(error)
      if (useTUI) {
        printError(message.slice(0, 40))
      } else {
        console.error(`\n${style.red}Error:${style.reset}`, message)
      }
      process.exit(1)
    }
  })
