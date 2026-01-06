/**
 * Interactive Wizard
 * Guided setup for archival encoding
 */

import { browseForInput, browseForOutput, menu, prompt, confirm } from './browser.js'
import { style } from './tui.js'
import type {
  ArchivalCodec,
  ArchivalPreset,
  ArchivalResolution,
  Av1Encoder
} from '../../shared/types/archival.types.js'

export interface WizardResult {
  cancelled: boolean
  inputPaths: string[]
  outputPath: string
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
  deleteIfLarger: boolean
  deleteOriginal: boolean
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
    { label: 'Enter path', value: 'path', description: 'Type or paste a file/folder path' },
    { label: 'Current folder', value: 'current', description: 'Encode all videos in current directory' }
  ])

  let inputPaths: string[] = []

  if (inputMethod === 'browse') {
    const result = await browseForInput()
    if (result.cancelled) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }
    inputPaths = result.paths
  } else if (inputMethod === 'path') {
    clearScreen()
    printSection('Step 1: Select Videos')
    const path = await prompt('Enter path to video file or folder')
    if (!path) {
      return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
    }
    inputPaths = [path]
  } else {
    inputPaths = [process.cwd()]
  }

  clearScreen()
  console.log(`\n${style.green}✓${style.reset} Selected ${inputPaths.length} item(s)`)
  if (inputPaths.length <= 3) {
    for (const p of inputPaths) {
      console.log(`  ${style.dim}${p}${style.reset}`)
    }
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
    deleteIfLarger: true,
    deleteOriginal: false,
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
    console.log(`\n${style.bold}Other Options${style.reset}\n`)
    options.twoPass = await confirm('Enable two-pass encoding? (better quality, slower)')
    options.overwrite = await confirm('Overwrite existing output files?')
    options.deleteIfLarger = await confirm('Delete output if larger than input? (recommended)')
  }

  // Confirmation
  clearScreen()
  printSection('Summary')

  console.log(`${style.bold}Input:${style.reset}`)
  if (inputPaths.length === 1) {
    console.log(`  ${inputPaths[0]}`)
  } else {
    console.log(`  ${inputPaths.length} items selected`)
  }

  console.log(`\n${style.bold}Output:${style.reset}`)
  console.log(`  ${outputPath}`)

  console.log(`\n${style.bold}Settings:${style.reset}`)
  console.log(`  Codec: ${style.cyan}${options.codec.toUpperCase()}${style.reset}`)
  console.log(`  Quality: ${style.cyan}${options.preset}${style.reset}`)
  console.log(`  Resolution: ${style.cyan}${options.resolution}${style.reset}`)
  console.log(`  Container: ${style.cyan}${options.container}${style.reset}`)
  console.log(`  Audio: ${style.cyan}${options.audioCopy ? 'copy' : options.audioCodec}${style.reset}`)

  console.log()
  const confirmed = await confirm('Start encoding?')

  if (!confirmed) {
    return { cancelled: true, inputPaths: [], outputPath: '', options: {} as WizardOptions }
  }

  return {
    cancelled: false,
    inputPaths,
    outputPath,
    options
  }
}
