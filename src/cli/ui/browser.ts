/**
 * Interactive File Browser
 * Terminal-based file explorer for selecting videos
 */

import { readdir, stat } from 'node:fs/promises'
import { join, dirname, basename, extname } from 'node:path'
import { homedir } from 'node:os'
import { createInterface } from 'node:readline'
import { style } from './tui.js'

// Video extensions
const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.mov', '.webm', '.avi',
  '.m4v', '.ts', '.mts', '.m2ts', '.flv', '.wmv'
])

// ANSI escape codes
const ESC = '\x1b['
const CLEAR_SCREEN = `${ESC}2J${ESC}H`
const HIDE_CURSOR = `${ESC}?25l`
const SHOW_CURSOR = `${ESC}?25h`
const MOVE_TO = (row: number, col: number) => `${ESC}${row};${col}H`
const CLEAR_LINE = `${ESC}2K`

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  isVideo: boolean
  size?: number
}

interface BrowserState {
  currentPath: string
  entries: FileEntry[]
  selectedIndex: number
  selectedFiles: Set<string>
  scrollOffset: number
  mode: 'browse' | 'select-input' | 'select-output'
  message?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function getEntries(dirPath: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = []

  try {
    const items = await readdir(dirPath, { withFileTypes: true })

    // Add parent directory option (unless at root)
    if (dirPath !== '/') {
      entries.push({
        name: '..',
        path: dirname(dirPath),
        isDirectory: true,
        isVideo: false
      })
    }

    // Sort: directories first, then files
    const dirs: FileEntry[] = []
    const files: FileEntry[] = []

    for (const item of items) {
      // Skip hidden files
      if (item.name.startsWith('.')) continue

      const fullPath = join(dirPath, item.name)

      if (item.isDirectory()) {
        dirs.push({
          name: item.name,
          path: fullPath,
          isDirectory: true,
          isVideo: false
        })
      } else {
        const ext = extname(item.name).toLowerCase()
        const isVideo = VIDEO_EXTENSIONS.has(ext)

        try {
          const stats = await stat(fullPath)
          files.push({
            name: item.name,
            path: fullPath,
            isDirectory: false,
            isVideo,
            size: stats.size
          })
        } catch {
          // Skip files we can't stat
        }
      }
    }

    // Sort alphabetically
    dirs.sort((a, b) => a.name.localeCompare(b.name))
    files.sort((a, b) => a.name.localeCompare(b.name))

    entries.push(...dirs, ...files)
  } catch {
    // If we can't read directory, just show parent
    if (dirPath !== '/') {
      entries.push({
        name: '..',
        path: dirname(dirPath),
        isDirectory: true,
        isVideo: false
      })
    }
  }

  return entries
}

function renderBrowser(state: BrowserState, height: number): void {
  const width = Math.min(process.stdout.columns || 80, 100)
  const listHeight = height - 10 // Reserve space for header and footer

  process.stdout.write(MOVE_TO(1, 1))

  // Header
  const modeText = state.mode === 'select-input'
    ? 'Select Input (files or folder)'
    : 'Select Output Folder'

  console.log(CLEAR_LINE + `${style.cyan}╭${'─'.repeat(width - 2)}╮${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.bold}${modeText}${style.reset}${' '.repeat(width - 4 - modeText.length)} ${style.cyan}│${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}├${'─'.repeat(width - 2)}┤${style.reset}`)

  // Current path
  const pathDisplay = state.currentPath.length > width - 10
    ? '...' + state.currentPath.slice(-(width - 13))
    : state.currentPath
  console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.dim}${pathDisplay}${style.reset}${' '.repeat(Math.max(0, width - 4 - pathDisplay.length))} ${style.cyan}│${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}├${'─'.repeat(width - 2)}┤${style.reset}`)

  // File list
  const visibleEntries = state.entries.slice(state.scrollOffset, state.scrollOffset + listHeight)

  for (let i = 0; i < listHeight; i++) {
    const entry = visibleEntries[i]
    const absoluteIndex = state.scrollOffset + i

    if (entry) {
      const isSelected = absoluteIndex === state.selectedIndex
      const isChecked = state.selectedFiles.has(entry.path)

      let icon = '  '
      let nameStyle = ''

      if (entry.isDirectory) {
        icon = `${style.blue}/${style.reset} `
        nameStyle = style.blue
      } else if (entry.isVideo) {
        icon = `${style.green}>${style.reset} `
        nameStyle = style.green
      } else {
        icon = '  '
        nameStyle = style.dim
      }

      const checkbox = state.mode === 'select-input'
        ? (isChecked ? `${style.green}[x]${style.reset} ` : `${style.dim}[ ]${style.reset} `)
        : ''

      const cursor = isSelected ? `${style.bgDark}` : ''
      const cursorEnd = isSelected ? `${style.reset}` : ''

      const sizeStr = entry.size ? ` ${style.dim}${formatSize(entry.size)}${style.reset}` : ''
      const maxNameLen = width - 20 - (entry.size ? 10 : 0)
      const displayName = entry.name.length > maxNameLen
        ? entry.name.slice(0, maxNameLen - 3) + '...'
        : entry.name

      const line = `${cursor}${checkbox}${icon}${nameStyle}${displayName}${style.reset}${sizeStr}${cursorEnd}`
      const visibleLen = displayName.length + (entry.size ? formatSize(entry.size).length + 1 : 0) + 4 + (state.mode === 'select-input' ? 4 : 0)
      const padding = Math.max(0, width - 4 - visibleLen)

      console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${line}${' '.repeat(padding)} ${style.cyan}│${style.reset}`)
    } else {
      console.log(CLEAR_LINE + `${style.cyan}│${style.reset}${' '.repeat(width - 2)}${style.cyan}│${style.reset}`)
    }
  }

  // Footer
  console.log(CLEAR_LINE + `${style.cyan}├${'─'.repeat(width - 2)}┤${style.reset}`)

  // Selection count
  if (state.mode === 'select-input' && state.selectedFiles.size > 0) {
    const countText = `${state.selectedFiles.size} item(s) selected`
    console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.green}${countText}${style.reset}${' '.repeat(width - 4 - countText.length)} ${style.cyan}│${style.reset}`)
  } else {
    console.log(CLEAR_LINE + `${style.cyan}│${style.reset}${' '.repeat(width - 2)}${style.cyan}│${style.reset}`)
  }

  // Controls
  const controls = state.mode === 'select-input'
    ? '[↑↓] Navigate  [Space] Select  [Enter] Confirm  [a] Select All Videos  [q] Cancel'
    : '[↑↓] Navigate  [Enter] Select Folder  [n] New Folder  [q] Cancel'

  const controlsDisplay = controls.length > width - 4
    ? controls.slice(0, width - 7) + '...'
    : controls

  console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.dim}${controlsDisplay}${style.reset}${' '.repeat(Math.max(0, width - 4 - controlsDisplay.length))} ${style.cyan}│${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}╰${'─'.repeat(width - 2)}╯${style.reset}`)

  // Message
  if (state.message) {
    console.log(CLEAR_LINE + `\n${state.message}`)
  }
}

export interface BrowserResult {
  cancelled: boolean
  paths: string[]
}

export async function browseForInput(startPath?: string): Promise<BrowserResult> {
  return browse(startPath || homedir(), 'select-input')
}

export async function browseForOutput(startPath?: string): Promise<BrowserResult> {
  return browse(startPath || homedir(), 'select-output')
}

async function browse(startPath: string, mode: 'select-input' | 'select-output'): Promise<BrowserResult> {
  const state: BrowserState = {
    currentPath: startPath,
    entries: await getEntries(startPath),
    selectedIndex: 0,
    selectedFiles: new Set(),
    scrollOffset: 0,
    mode,
    message: undefined
  }

  const height = process.stdout.rows || 24

  // Setup terminal
  process.stdout.write(CLEAR_SCREEN)
  process.stdout.write(HIDE_CURSOR)

  // Enable raw mode for key input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()

  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdout.write(SHOW_CURSOR)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
      process.stdin.removeListener('data', onKeypress)
      process.stdin.pause()
    }

    const onKeypress = async (key: Buffer) => {
      const keyStr = key.toString()
      const listHeight = height - 10

      // Handle special keys
      if (keyStr === '\x03' || keyStr === 'q') {
        // Ctrl+C or q - cancel
        cleanup()
        resolve({ cancelled: true, paths: [] })
        return
      }

      if (keyStr === '\x1b[A' || keyStr === 'k') {
        // Up arrow or k
        if (state.selectedIndex > 0) {
          state.selectedIndex--
          if (state.selectedIndex < state.scrollOffset) {
            state.scrollOffset = state.selectedIndex
          }
        }
      } else if (keyStr === '\x1b[B' || keyStr === 'j') {
        // Down arrow or j
        if (state.selectedIndex < state.entries.length - 1) {
          state.selectedIndex++
          if (state.selectedIndex >= state.scrollOffset + listHeight) {
            state.scrollOffset = state.selectedIndex - listHeight + 1
          }
        }
      } else if (keyStr === ' ' && mode === 'select-input') {
        // Space - toggle selection
        const entry = state.entries[state.selectedIndex]
        if (entry && entry.name !== '..') {
          if (state.selectedFiles.has(entry.path)) {
            state.selectedFiles.delete(entry.path)
          } else {
            state.selectedFiles.add(entry.path)
          }
        }
      } else if (keyStr === 'a' && mode === 'select-input') {
        // Select all videos in current directory
        for (const entry of state.entries) {
          if (entry.isVideo) {
            state.selectedFiles.add(entry.path)
          }
        }
        state.message = `${style.green}Selected all videos in this folder${style.reset}`
        setTimeout(() => {
          state.message = undefined
          renderBrowser(state, height)
        }, 1500)
      } else if (keyStr === '\r' || keyStr === '\n') {
        // Enter
        const entry = state.entries[state.selectedIndex]

        if (entry?.isDirectory) {
          // Navigate into directory
          state.currentPath = entry.path
          state.entries = await getEntries(entry.path)
          state.selectedIndex = 0
          state.scrollOffset = 0
        } else if (mode === 'select-input') {
          // Confirm selection
          if (state.selectedFiles.size > 0) {
            cleanup()
            resolve({ cancelled: false, paths: Array.from(state.selectedFiles) })
            return
          } else if (entry && !entry.isDirectory) {
            // Select current file if nothing selected
            cleanup()
            resolve({ cancelled: false, paths: [entry.path] })
            return
          }
        }

        if (mode === 'select-output') {
          // Select current directory as output
          cleanup()
          resolve({ cancelled: false, paths: [state.currentPath] })
          return
        }
      } else if (keyStr === 'n' && mode === 'select-output') {
        // Create new folder
        cleanup()

        const rl = createInterface({
          input: process.stdin,
          output: process.stdout
        })

        rl.question('New folder name: ', async (name) => {
          rl.close()
          if (name && name.trim()) {
            const newPath = join(state.currentPath, name.trim())
            resolve({ cancelled: false, paths: [newPath] })
          } else {
            // Re-open browser
            const result = await browse(state.currentPath, mode)
            resolve(result)
          }
        })
        return
      } else if (keyStr === 'g') {
        // Go to home
        state.currentPath = homedir()
        state.entries = await getEntries(state.currentPath)
        state.selectedIndex = 0
        state.scrollOffset = 0
      }

      renderBrowser(state, height)
    }

    process.stdin.on('data', onKeypress)
    renderBrowser(state, height)
  })
}

/**
 * Simple prompt for confirmation
 */
export function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Simple prompt for text input
 */
export function prompt(message: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const displayDefault = defaultValue ? ` [${defaultValue}]` : ''

  return new Promise((resolve) => {
    rl.question(`${message}${displayDefault}: `, (answer) => {
      rl.close()
      resolve(answer.trim() || defaultValue || '')
    })
  })
}

/**
 * Menu selection
 */
export interface MenuOption<T> {
  label: string
  value: T
  description?: string
}

export async function menu<T>(title: string, options: MenuOption<T>[]): Promise<T> {
  console.log(`\n${style.bold}${title}${style.reset}\n`)

  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    console.log(`  ${style.cyan}${i + 1}.${style.reset} ${opt.label}`)
    if (opt.description) {
      console.log(`     ${style.dim}${opt.description}${style.reset}`)
    }
  }

  console.log()

  const answer = await prompt('Select option', '1')
  const index = parseInt(answer, 10) - 1

  if (index >= 0 && index < options.length) {
    return options[index].value
  }

  return options[0].value
}
