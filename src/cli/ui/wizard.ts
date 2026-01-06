/**
 * Interactive Wizard
 * Guided setup for archival encoding
 */

import { browseForInput, browseForOutput, menu, prompt, confirm } from './browser.js'
import { style } from './tui.js'
import { stat, readdir } from 'node:fs/promises'
import { join, extname, relative, basename, dirname, sep } from 'node:path'
import type {
  ArchivalCodec,
  ArchivalPreset,
  ArchivalResolution,
  Av1Encoder
} from '../../shared/types/archival.types.js'

// Video extensions
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.mov', '.webm', '.avi',
  '.m4v', '.ts', '.mts', '.m2ts', '.flv', '.wmv'
])

/**
 * Find the common ancestor directory of multiple file paths
 */
function findCommonAncestor(paths: string[]): string {
  if (paths.length === 0) return ''
  if (paths.length === 1) return dirname(paths[0])

  // Split all paths into segments
  const splitPaths = paths.map(p => dirname(p).split(sep))

  // Find the shortest path length
  const minLength = Math.min(...splitPaths.map(p => p.length))

  // Find common prefix
  const commonParts: string[] = []
  for (let i = 0; i < minLength; i++) {
    const segment = splitPaths[0][i]
    if (splitPaths.every(p => p[i] === segment)) {
      commonParts.push(segment)
    } else {
      break
    }
  }

  return commonParts.join(sep) || sep
}

/**
 * Recursively find all video files in a directory
 */
async function findVideoFilesRecursive(
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

export interface WizardResult {
  cancelled: boolean
  inputPaths: string[]
  outputPath: string
  folderRoot?: string
  relativePaths?: string[]
  options: WizardOptions
}

export interface WizardOptions {
  codec: ArchivalCodec
  preset: ArchivalPreset
  resolution: ArchivalResolution
  container: 'mkv' | 'mp4' | 'webm'
  av1Encoder: Av1Encoder
  av1Preset: number
  av1Crf?: number
  filmGrain: number
  h265Preset: string
  h265Crf?: number
  h265Tune?: string
  audioCopy: boolean
  audioCodec: 'opus' | 'aac' | 'flac'
  audioBitrate: number
  twoPass: boolean
  overwrite: boolean
  fillMode: boolean
  deleteIfLarger: boolean
  deleteOriginal: boolean
  preserveStructure: boolean
  extractThumbnail: boolean
  extractCaptions: boolean
  captionLanguage: string
  threadLimit: 0 | 4 | 6
  simple: boolean
}

function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H')
}

function printSection(title: string): void {
  console.log(`\n${style.cyan}─────────────────────────────────────────${style.reset}`)
  console.log(`${style.bold}${title}${style.reset}`)
  console.log(`${style.cyan}─────────────────────────────────────────${style.reset}\n`)
}

export async function runWizard(): Promise<WizardResult> {
  clearScreen()

  // Welcome
  console.log(`
${style.cyan}╭──────────────────────────────────────────────────╮${style.reset}
${style.cyan}│${style.reset}                                                  ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.bold}Welcome to Drapp Archive${style.reset}                       ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.dim}Video encoding made simple${style.reset}                      ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                  ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  This wizard will help you:                      ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.green}1.${style.reset} Select videos to encode                     ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.green}2.${style.reset} Choose where to save them                   ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.green}3.${style.reset} Pick encoding settings                      ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}                                                  ${style.cyan}│${style.reset}
${style.cyan}╰──────────────────────────────────────────────────╯${style.reset}
`)

  const proceed = await confirm('Ready to begin?')
  if (!proceed) {
    return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
  }

  // Step 1: Select Input
  printSection('Step 1: Select Videos')
  console.log('Choose how to select your videos:\n')

  const inputMethod = await menu('Input method', [
    { label: 'Browse files', value: 'browse', description: 'Navigate and select individual files' },
    { label: 'Select folder', value: 'folder', description: 'Select a folder to encode all videos recursively' },
    { label: 'Enter path', value: 'path', description: 'Type or paste a file/folder path' },
    { label: 'Current folder', value: 'current', description: 'Encode all videos in current directory' }
  ])

  let inputPaths: string[] = []
  let folderRoot: string | undefined
  let relativePaths: string[] | undefined
  let preserveStructure = false

  if (inputMethod === 'browse') {
    const result = await browseForInput()
    if (result.cancelled) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }

    // Check if a folder was selected (user pressed Enter on a folder)
    if (result.paths.length === 1) {
      try {
        const pathStat = await stat(result.paths[0])
        if (pathStat.isDirectory()) {
          // Scan the folder for videos
          clearScreen()
          printSection('Step 1: Select Videos')
          console.log(`${style.dim}Scanning folder for videos...${style.reset}\n`)

          const files = await findVideoFilesRecursive(result.paths[0])

          if (files.length === 0) {
            console.log(`${style.yellow}No video files found in ${result.paths[0]}${style.reset}`)
            const tryAgain = await confirm('Try again?')
            if (tryAgain) {
              return runWizard()
            }
            return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
          }

          inputPaths = files.map(f => f.absolutePath)
          relativePaths = files.map(f => f.relativePath)
          folderRoot = result.paths[0]

          // Check if there are subfolders
          const hasSubfolders = files.some(f => f.relativePath.includes('/') || f.relativePath.includes('\\'))

          console.log(`Found ${style.cyan}${files.length}${style.reset} videos`)
          if (hasSubfolders) {
            console.log(`${style.dim}Including files in subfolders${style.reset}\n`)
            preserveStructure = await confirm('Preserve folder structure in output? (recommended for organized libraries)')
          }
        } else {
          // Single file selected
          inputPaths = result.paths
          relativePaths = result.paths.map(p => basename(p))
        }
      } catch {
        inputPaths = result.paths
        relativePaths = result.paths.map(p => basename(p))
      }
    } else {
      // Multiple files selected - calculate common ancestor for preserve structure
      inputPaths = result.paths
      folderRoot = findCommonAncestor(result.paths)
      relativePaths = result.paths.map(p => relative(folderRoot!, p))

      // Check if files are from different subfolders
      const hasSubfolders = relativePaths.some(p => p.includes(sep) || p.includes('/'))

      if (hasSubfolders) {
        clearScreen()
        printSection('Step 1: Select Videos')
        console.log(`Selected ${style.cyan}${inputPaths.length}${style.reset} videos from multiple folders`)
        console.log(`${style.dim}Common root: ${folderRoot}${style.reset}\n`)
        preserveStructure = await confirm('Preserve folder structure in output? (recommended for organized libraries)')
      }
    }
  } else if (inputMethod === 'folder') {
    const result = await browseForOutput() // Use output browser for folder selection
    if (result.cancelled) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }
    const selectedFolder = result.paths[0]

    clearScreen()
    printSection('Step 1: Select Videos')
    console.log(`${style.dim}Scanning folder for videos...${style.reset}\n`)

    const files = await findVideoFilesRecursive(selectedFolder)

    if (files.length === 0) {
      console.log(`${style.yellow}No video files found in ${selectedFolder}${style.reset}`)
      const tryAgain = await confirm('Try a different folder?')
      if (tryAgain) {
        return runWizard() // Restart wizard
      }
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }

    inputPaths = files.map(f => f.absolutePath)
    relativePaths = files.map(f => f.relativePath)
    folderRoot = selectedFolder

    // Check if there are subfolders
    const hasSubfolders = files.some(f => f.relativePath.includes('/') || f.relativePath.includes('\\'))

    if (hasSubfolders) {
      console.log(`Found ${style.cyan}${files.length}${style.reset} videos in ${style.cyan}${selectedFolder}${style.reset}`)
      console.log(`${style.dim}Including files in subfolders${style.reset}\n`)

      preserveStructure = await confirm('Preserve folder structure in output? (recommended for organized libraries)')
    } else {
      console.log(`Found ${style.cyan}${files.length}${style.reset} videos\n`)
    }
  } else if (inputMethod === 'path') {
    clearScreen()
    printSection('Step 1: Select Videos')
    const inputPath = await prompt('Enter path to video file or folder')
    if (!inputPath) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }

    // Check if it's a directory
    try {
      const pathStat = await stat(inputPath)
      if (pathStat.isDirectory()) {
        console.log(`\n${style.dim}Scanning folder for videos...${style.reset}`)

        const files = await findVideoFilesRecursive(inputPath)
        if (files.length === 0) {
          console.log(`${style.yellow}No video files found${style.reset}`)
          return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
        }

        inputPaths = files.map(f => f.absolutePath)
        relativePaths = files.map(f => f.relativePath)
        folderRoot = inputPath

        const hasSubfolders = files.some(f => f.relativePath.includes('/') || f.relativePath.includes('\\'))
        if (hasSubfolders) {
          console.log(`Found ${style.cyan}${files.length}${style.reset} videos\n`)
          preserveStructure = await confirm('Preserve folder structure in output?')
        }
      } else {
        inputPaths = [inputPath]
      }
    } catch {
      inputPaths = [inputPath]
    }
  } else {
    // Current folder
    const currentDir = process.cwd()
    console.log(`\n${style.dim}Scanning current folder for videos...${style.reset}`)

    const files = await findVideoFilesRecursive(currentDir)
    if (files.length === 0) {
      console.log(`${style.yellow}No video files found in current directory${style.reset}`)
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }

    inputPaths = files.map(f => f.absolutePath)
    relativePaths = files.map(f => f.relativePath)
    folderRoot = currentDir

    const hasSubfolders = files.some(f => f.relativePath.includes('/') || f.relativePath.includes('\\'))
    if (hasSubfolders) {
      console.log(`Found ${style.cyan}${files.length}${style.reset} videos\n`)
      preserveStructure = await confirm('Preserve folder structure in output?')
    }
  }

  clearScreen()
  console.log(`\n${style.green}✓${style.reset} Selected ${inputPaths.length} item(s)`)
  if (inputPaths.length <= 3) {
    for (const p of inputPaths) {
      console.log(`  ${style.dim}${p}${style.reset}`)
    }
  } else {
    console.log(`  ${style.dim}${inputPaths[0]}${style.reset}`)
    console.log(`  ${style.dim}...and ${inputPaths.length - 1} more${style.reset}`)
  }
  if (preserveStructure) {
    console.log(`  ${style.cyan}(preserving folder structure)${style.reset}`)
  }

  // Step 2: Select Output
  printSection('Step 2: Choose Output Location')
  console.log('Where should the encoded videos be saved?\n')

  const outputMethod = await menu('Output location', [
    { label: 'Browse folders', value: 'browse', description: 'Navigate to select a folder' },
    { label: 'Enter path', value: 'path', description: 'Type or paste a folder path' },
    { label: 'Same as input', value: 'same', description: 'Save alongside original files' }
  ])

  let outputPath: string

  if (outputMethod === 'browse') {
    const result = await browseForOutput()
    if (result.cancelled) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }
    outputPath = result.paths[0]
  } else if (outputMethod === 'path') {
    clearScreen()
    printSection('Step 2: Choose Output Location')
    const path = await prompt('Enter output folder path')
    if (!path) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }
    outputPath = path
  } else {
    // Same as input - use the directory of the first input
    outputPath = inputPaths[0]
  }

  clearScreen()
  console.log(`\n${style.green}✓${style.reset} Output: ${outputPath}`)

  // Step 3: Encoding Settings
  printSection('Step 3: Encoding Settings')
  console.log('How would you like to configure encoding?\n')

  const configMode = await menu('Configuration', [
    { label: 'Quick (Recommended)', value: 'quick', description: 'Just choose quality level, we handle the rest' },
    { label: 'Standard', value: 'standard', description: 'Choose codec and basic settings' },
    { label: 'Advanced', value: 'advanced', description: 'Full control over all settings' }
  ])

  // Default options
  const options: WizardOptions = {
    codec: 'av1',
    preset: 'archive',
    resolution: 'source',
    container: 'mkv',
    av1Encoder: 'libsvtav1',
    av1Preset: 6,
    filmGrain: 10,
    h265Preset: 'medium',
    audioCopy: true,
    audioCodec: 'aac',
    audioBitrate: 160,
    twoPass: false,
    overwrite: false,
    fillMode: false,
    deleteIfLarger: true,
    deleteOriginal: false,
    preserveStructure: false,
    extractThumbnail: false,
    extractCaptions: false,
    captionLanguage: 'auto',
    threadLimit: 0,
    simple: false
  }

  if (configMode === 'quick') {
    clearScreen()
    printSection('Quick Setup')

    const quality = await menu('Quality vs Speed', [
      { label: 'Balanced (Recommended)', value: 'balanced', description: 'Good compression, reasonable speed' },
      { label: 'Maximum Compression', value: 'max', description: 'Smallest files, slowest encoding' },
      { label: 'Fast', value: 'fast', description: 'Quick encoding, larger files' }
    ])

    if (quality === 'max') {
      options.preset = 'max-compression'
    } else if (quality === 'fast') {
      options.preset = 'fast'
    }
  } else if (configMode === 'standard') {
    clearScreen()
    printSection('Standard Setup')

    // Codec selection
    options.codec = await menu<ArchivalCodec>('Video Codec', [
      { label: 'AV1 (Recommended)', value: 'av1', description: 'Best compression, modern codec' },
      { label: 'H.265/HEVC', value: 'h265', description: 'Wide compatibility, good compression' }
    ])

    // Quality preset
    options.preset = await menu<ArchivalPreset>('Quality Preset', [
      { label: 'Archive (Recommended)', value: 'archive', description: 'Balanced quality and size' },
      { label: 'Maximum Compression', value: 'max-compression', description: 'Smallest files' },
      { label: 'Fast', value: 'fast', description: 'Quick encoding' }
    ])

    // Resolution
    console.log()
    const changeRes = await confirm('Resize videos? (default: keep original)')
    if (changeRes) {
      options.resolution = await menu<ArchivalResolution>('Target Resolution', [
        { label: 'Keep Original', value: 'source' },
        { label: '4K (2160p)', value: '4k' },
        { label: '1440p', value: '1440p' },
        { label: '1080p', value: '1080p' },
        { label: '720p', value: '720p' }
      ])
    }

    // File organization
    console.log()
    if (folderRoot && inputPaths.length > 1) {
      // Only ask if we have a folder with multiple files
      preserveStructure = await confirm('Preserve folder structure in output?', preserveStructure)
    }

    // Extras (also in standard mode)
    console.log()
    const wantExtras = await confirm('Enable extras? (thumbnails, captions)')
    if (wantExtras) {
      options.extractThumbnail = await confirm('Extract thumbnail from each video?')
      options.extractCaptions = await confirm('Extract captions using AI transcription?')

      if (options.extractCaptions) {
        options.captionLanguage = await menu('Caption language', [
          { label: 'Auto-detect', value: 'auto' },
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' }
        ])
      }
    }
  } else {
    // Advanced mode
    clearScreen()
    printSection('Advanced Setup')

    // Codec
    options.codec = await menu<ArchivalCodec>('Video Codec', [
      { label: 'AV1', value: 'av1' },
      { label: 'H.265/HEVC', value: 'h265' }
    ])

    if (options.codec === 'av1') {
      console.log(`\n${style.bold}AV1 Settings${style.reset}\n`)

      options.av1Encoder = await menu<Av1Encoder>('AV1 Encoder', [
        { label: 'SVT-AV1 (Recommended)', value: 'libsvtav1', description: 'Fast, good quality' },
        { label: 'libaom-av1', value: 'libaom-av1', description: 'Reference encoder, slower' }
      ])

      const presetStr = await prompt('Speed preset (0-13 for SVT, lower=slower/better)', '6')
      options.av1Preset = parseInt(presetStr, 10) || 6

      const crfStr = await prompt('CRF (0-63, lower=better quality, leave empty for preset default)', '')
      if (crfStr) {
        options.av1Crf = parseInt(crfStr, 10)
      }

      const grainStr = await prompt('Film grain synthesis (0-50, 0=off)', '10')
      options.filmGrain = parseInt(grainStr, 10) || 0
    } else {
      console.log(`\n${style.bold}H.265 Settings${style.reset}\n`)

      options.h265Preset = await menu('Speed Preset', [
        { label: 'medium (Recommended)', value: 'medium' },
        { label: 'slow (Better quality)', value: 'slow' },
        { label: 'fast (Quicker)', value: 'fast' },
        { label: 'veryslow (Best quality)', value: 'veryslow' }
      ])

      const crfStr = await prompt('CRF (0-51, lower=better quality, leave empty for default)', '')
      if (crfStr) {
        options.h265Crf = parseInt(crfStr, 10)
      }

      const tune = await menu('Tune (optimize for content type)', [
        { label: 'None (Default)', value: '' },
        { label: 'Film', value: 'film', description: 'For live action content' },
        { label: 'Animation', value: 'animation', description: 'For animated content' },
        { label: 'Grain', value: 'grain', description: 'For grainy/noisy video' }
      ])
      if (tune) {
        options.h265Tune = tune
      }
    }

    // Resolution
    console.log()
    options.resolution = await menu<ArchivalResolution>('Target Resolution', [
      { label: 'Keep Original', value: 'source' },
      { label: '4K (2160p)', value: '4k' },
      { label: '1440p', value: '1440p' },
      { label: '1080p', value: '1080p' },
      { label: '720p', value: '720p' },
      { label: '480p', value: '480p' }
    ])

    // Container
    options.container = await menu('Output Container', [
      { label: 'MKV (Recommended)', value: 'mkv', description: 'Best compatibility with AV1' },
      { label: 'MP4', value: 'mp4', description: 'Wide device support' },
      { label: 'WebM', value: 'webm', description: 'Web optimized' }
    ])

    // Audio
    console.log(`\n${style.bold}Audio Settings${style.reset}\n`)
    options.audioCopy = await confirm('Copy audio without re-encoding? (recommended)')

    if (!options.audioCopy) {
      options.audioCodec = await menu('Audio Codec', [
        { label: 'AAC', value: 'aac' },
        { label: 'Opus', value: 'opus' },
        { label: 'FLAC (Lossless)', value: 'flac' }
      ])

      const bitrateStr = await prompt('Audio bitrate (kbps)', '160')
      options.audioBitrate = parseInt(bitrateStr, 10) || 160
    }

    // Other options
    console.log(`\n${style.bold}Encoding Options${style.reset}\n`)
    options.twoPass = await confirm('Enable two-pass encoding? (better quality, slower)')

    // Thread limit
    const threadChoice = await menu('Thread limit', [
      { label: 'Unlimited (Default)', value: '0', description: 'Use all available CPU cores' },
      { label: '6 threads', value: '6', description: 'Good balance for multi-tasking' },
      { label: '4 threads', value: '4', description: 'Light CPU usage' }
    ])
    options.threadLimit = parseInt(threadChoice, 10) as 0 | 4 | 6

    // Extras
    console.log(`\n${style.bold}Extras${style.reset}\n`)
    options.extractThumbnail = await confirm('Extract thumbnail from each video?')
    options.extractCaptions = await confirm('Extract captions using AI transcription (Whisper)?')

    if (options.extractCaptions) {
      options.captionLanguage = await menu('Caption language', [
        { label: 'Auto-detect', value: 'auto', description: 'Automatically detect spoken language' },
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Chinese', value: 'zh' }
      ])
    }

    // Output behavior
    console.log(`\n${style.bold}Output Behavior${style.reset}\n`)

    // Preserve structure option (only if we have a folder with files)
    if (folderRoot && inputPaths.length > 1) {
      preserveStructure = await confirm('Preserve folder structure in output?', preserveStructure)
    }

    options.overwrite = await confirm('Overwrite existing output files?')

    if (!options.overwrite) {
      options.fillMode = await confirm('Fill mode? (skip files that would conflict with existing outputs)')
    }

    options.deleteIfLarger = await confirm('Delete output if larger than input? (recommended)')
    options.deleteOriginal = await confirm('Delete original files after successful encoding? (DANGEROUS)')

    if (options.deleteOriginal) {
      const confirmDelete = await confirm(`${style.red}WARNING:${style.reset} This will permanently delete original files. Are you sure?`)
      if (!confirmDelete) {
        options.deleteOriginal = false
      }
    }
  }

  // Set preserve structure from folder selection
  options.preserveStructure = preserveStructure

  // Confirmation
  clearScreen()
  printSection('Summary')

  console.log(`${style.bold}Input:${style.reset}`)
  if (inputPaths.length === 1) {
    console.log(`  ${inputPaths[0]}`)
  } else {
    console.log(`  ${inputPaths.length} items selected`)
    if (folderRoot) {
      console.log(`  ${style.dim}from: ${folderRoot}${style.reset}`)
    }
  }

  console.log(`\n${style.bold}Output:${style.reset}`)
  console.log(`  ${outputPath}`)
  if (options.preserveStructure) {
    console.log(`  ${style.cyan}(preserving folder structure)${style.reset}`)
  }

  console.log(`\n${style.bold}Settings:${style.reset}`)
  console.log(`  Codec: ${style.cyan}${options.codec.toUpperCase()}${style.reset}`)
  console.log(`  Quality: ${style.cyan}${options.preset}${style.reset}`)
  console.log(`  Resolution: ${style.cyan}${options.resolution}${style.reset}`)
  console.log(`  Container: ${style.cyan}${options.container}${style.reset}`)
  console.log(`  Audio: ${style.cyan}${options.audioCopy ? 'copy' : options.audioCodec}${style.reset}`)
  if (options.twoPass) {
    console.log(`  Two-pass: ${style.cyan}yes${style.reset}`)
  }
  if (options.threadLimit > 0) {
    console.log(`  Thread limit: ${style.cyan}${options.threadLimit}${style.reset}`)
  }

  // Show extras
  const extras: string[] = []
  if (options.extractThumbnail) extras.push('thumbnails')
  if (options.extractCaptions) extras.push(`captions (${options.captionLanguage})`)
  if (extras.length > 0) {
    console.log(`  Extras: ${style.cyan}${extras.join(', ')}${style.reset}`)
  }

  // Show output behavior
  if (options.overwrite) {
    console.log(`  ${style.yellow}Will overwrite existing files${style.reset}`)
  } else if (options.fillMode) {
    console.log(`  Fill mode: ${style.cyan}skip existing${style.reset}`)
  }
  if (options.deleteOriginal) {
    console.log(`  ${style.red}Will delete original files after encoding${style.reset}`)
  }

  console.log()
  const confirmed = await confirm('Start encoding?')

  if (!confirmed) {
    return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
  }

  return {
    cancelled: false,
    inputPaths,
    outputPath,
    folderRoot,
    relativePaths,
    options
  }
}
