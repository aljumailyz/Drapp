/**
 * Interactive File Browser
 * Terminal-based file explorer for selecting videos
 * Features: multi-select, mouse support, keyboard navigation
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

// Mouse support escape codes
const ENABLE_MOUSE = '\x1b[?1000h\x1b[?1002h\x1b[?1015h\x1b[?1006h'
const DISABLE_MOUSE = '\x1b[?1006l\x1b[?1015l\x1b[?1002l\x1b[?1000l'

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
  lastSelectedIndex?: number // For range selection
  listHeight: number
  headerOffset: number // Row offset where file list starts
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

function countVideos(entries: FileEntry[]): number {
  return entries.filter(e => e.isVideo).length
}

function countSelectedVideos(entries: FileEntry[], selected: Set<string>): number {
  return entries.filter(e => e.isVideo && selected.has(e.path)).length
}

function renderBrowser(state: BrowserState, height: number): void {
  const width = Math.min(process.stdout.columns || 80, 100)
  state.listHeight = height - 10 // Reserve space for header and footer
  state.headerOffset = 6 // Row where file list starts (after header)

  process.stdout.write(MOVE_TO(1, 1))

  // Header
  const modeText = state.mode === 'select-input'
    ? 'Select Videos (multi-select enabled)'
    : 'Select Output Folder'

  console.log(CLEAR_LINE + `${style.cyan}╭${'─'.repeat(width - 2)}╮${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.bold}${modeText}${style.reset}${' '.repeat(Math.max(0, width - 4 - modeText.length))} ${style.cyan}│${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}├${'─'.repeat(width - 2)}┤${style.reset}`)

  // Current path
  const pathDisplay = state.currentPath.length > width - 10
    ? '...' + state.currentPath.slice(-(width - 13))
    : state.currentPath
  console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.dim}${pathDisplay}${style.reset}${' '.repeat(Math.max(0, width - 4 - pathDisplay.length))} ${style.cyan}│${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}├${'─'.repeat(width - 2)}┤${style.reset}`)

  // File list
  const visibleEntries = state.entries.slice(state.scrollOffset, state.scrollOffset + state.listHeight)

  for (let i = 0; i < state.listHeight; i++) {
    const entry = visibleEntries[i]
    const absoluteIndex = state.scrollOffset + i

    if (entry) {
      const isSelected = absoluteIndex === state.selectedIndex
      const isChecked = state.selectedFiles.has(entry.path)

      let icon = '  '
      let nameStyle = ''

      if (entry.isDirectory) {
        icon = `${style.blue}📁${style.reset}`
        nameStyle = style.blue
      } else if (entry.isVideo) {
        icon = `${style.green}🎬${style.reset}`
        nameStyle = style.green
      } else {
        icon = `${style.dim}📄${style.reset}`
        nameStyle = style.dim
      }

      const checkbox = state.mode === 'select-input'
        ? (isChecked ? `${style.green}[✓]${style.reset} ` : `${style.dim}[ ]${style.reset} `)
        : ''

      const cursor = isSelected ? `${style.bgDark}` : ''
      const cursorEnd = isSelected ? `${style.reset}` : ''

      const sizeStr = entry.size ? ` ${style.dim}${formatSize(entry.size)}${style.reset}` : ''
      const maxNameLen = width - 24 - (entry.size ? 10 : 0)
      const displayName = entry.name.length > maxNameLen
        ? entry.name.slice(0, maxNameLen - 3) + '...'
        : entry.name

      const line = `${cursor}${checkbox}${icon} ${nameStyle}${displayName}${style.reset}${sizeStr}${cursorEnd}`
      const visibleLen = displayName.length + (entry.size ? formatSize(entry.size).length + 1 : 0) + 6 + (state.mode === 'select-input' ? 4 : 0)
      const padding = Math.max(0, width - 4 - visibleLen)

      console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${line}${' '.repeat(padding)} ${style.cyan}│${style.reset}`)
    } else {
      console.log(CLEAR_LINE + `${style.cyan}│${style.reset}${' '.repeat(width - 2)}${style.cyan}│${style.reset}`)
    }
  }

  // Footer
  console.log(CLEAR_LINE + `${style.cyan}├${'─'.repeat(width - 2)}┤${style.reset}`)

  // Selection count and video count
  if (state.mode === 'select-input') {
    const videoCount = countVideos(state.entries)
    const selectedCount = state.selectedFiles.size
    const countText = selectedCount > 0
      ? `${style.green}${selectedCount} selected${style.reset} │ ${videoCount} videos in folder`
      : `${videoCount} videos in folder`
    console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${countText}${' '.repeat(Math.max(0, width - 4 - countText.length + (selectedCount > 0 ? 11 : 0)))} ${style.cyan}│${style.reset}`)
  } else {
    console.log(CLEAR_LINE + `${style.cyan}│${style.reset}${' '.repeat(width - 2)}${style.cyan}│${style.reset}`)
  }

  // Controls - show different controls based on mode
  let controls: string
  if (state.mode === 'select-input') {
    controls = '↑↓/jk Navigate │ Space Select │ a All │ d Clear │ Enter Confirm │ Mouse Click │ q Cancel'
  } else {
    controls = '↑↓/jk Navigate │ Enter Select │ n New Folder │ g Home │ q Cancel'
  }

  const controlsDisplay = controls.length > width - 4
    ? controls.slice(0, width - 7) + '...'
    : controls

  console.log(CLEAR_LINE + `${style.cyan}│${style.reset} ${style.dim}${controlsDisplay}${style.reset}${' '.repeat(Math.max(0, width - 4 - controlsDisplay.length))} ${style.cyan}│${style.reset}`)
  console.log(CLEAR_LINE + `${style.cyan}╰${'─'.repeat(width - 2)}╯${style.reset}`)

  // Message
  if (state.message) {
    console.log(CLEAR_LINE + `\n${state.message}`)
  } else {
    console.log(CLEAR_LINE)
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

// Parse mouse events from SGR format (\x1b[<Cb;Cx;CyM or \x1b[<Cb;Cx;Cym)
function parseMouseEvent(data: string): { button: number; x: number; y: number; release: boolean } | null {
  // SGR format: \x1b[<button;x;yM (press) or \x1b[<button;x;ym (release)
  const sgrMatch = data.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/)
  if (sgrMatch) {
    return {
      button: parseInt(sgrMatch[1], 10),
      x: parseInt(sgrMatch[2], 10),
      y: parseInt(sgrMatch[3], 10),
      release: sgrMatch[4] === 'm'
    }
  }
  return null
}

async function browse(startPath: string, mode: 'select-input' | 'select-output'): Promise<BrowserResult> {
  const height = process.stdout.rows || 24

  const state: BrowserState = {
    currentPath: startPath,
    entries: await getEntries(startPath),
    selectedIndex: 0,
    selectedFiles: new Set(),
    scrollOffset: 0,
    mode,
    message: undefined,
    lastSelectedIndex: undefined,
    listHeight: height - 10,
    headerOffset: 6
  }

  // Setup terminal
  process.stdout.write(CLEAR_SCREEN)
  process.stdout.write(HIDE_CURSOR)
  process.stdout.write(ENABLE_MOUSE)

  // Enable raw mode for key input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()

  return new Promise((resolve) => {
    const cleanup = () => {
      process.stdout.write(DISABLE_MOUSE)
      process.stdout.write(SHOW_CURSOR)
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
      }
      process.stdin.removeListener('data', onKeypress)
      process.stdin.pause()
    }

    const selectRange = (from: number, to: number) => {
      const start = Math.min(from, to)
      const end = Math.max(from, to)
      for (let i = start; i <= end; i++) {
        const entry = state.entries[i]
        if (entry && entry.name !== '..' && (entry.isVideo || entry.isDirectory)) {
          state.selectedFiles.add(entry.path)
        }
      }
    }

    const onKeypress = async (key: Buffer) => {
      const keyStr = key.toString()
      const listHeight = state.listHeight

      // Check for mouse events first
      const mouseEvent = parseMouseEvent(keyStr)
      if (mouseEvent && !mouseEvent.release) {
        const { button, y } = mouseEvent

        // Calculate which entry was clicked
        const clickedRow = y - state.headerOffset
        if (clickedRow >= 0 && clickedRow < listHeight) {
          const clickedIndex = state.scrollOffset + clickedRow

          if (clickedIndex < state.entries.length) {
            const entry = state.entries[clickedIndex]

            if (button === 0) {
              // Left click
              if (entry.isDirectory) {
                // Navigate into directory
                state.currentPath = entry.path
                state.entries = await getEntries(entry.path)
                state.selectedIndex = 0
                state.scrollOffset = 0
              } else if (mode === 'select-input' && entry.name !== '..') {
                // Toggle selection
                state.selectedIndex = clickedIndex
                if (state.selectedFiles.has(entry.path)) {
                  state.selectedFiles.delete(entry.path)
                } else {
                  state.selectedFiles.add(entry.path)
                  state.lastSelectedIndex = clickedIndex
                }
              }
            } else if (button === 64) {
              // Scroll up
              if (state.scrollOffset > 0) {
                state.scrollOffset--
                if (state.selectedIndex > state.scrollOffset + listHeight - 1) {
                  state.selectedIndex = state.scrollOffset + listHeight - 1
                }
              }
            } else if (button === 65) {
              // Scroll down
              if (state.scrollOffset < state.entries.length - listHeight) {
                state.scrollOffset++
                if (state.selectedIndex < state.scrollOffset) {
                  state.selectedIndex = state.scrollOffset
                }
              }
            }
          }
        }

        renderBrowser(state, height)
        return
      }

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
      } else if (keyStr === '\x1b[5~') {
        // Page Up
        state.selectedIndex = Math.max(0, state.selectedIndex - listHeight)
        state.scrollOffset = Math.max(0, state.scrollOffset - listHeight)
      } else if (keyStr === '\x1b[6~') {
        // Page Down
        state.selectedIndex = Math.min(state.entries.length - 1, state.selectedIndex + listHeight)
        if (state.selectedIndex >= state.scrollOffset + listHeight) {
          state.scrollOffset = Math.min(state.entries.length - listHeight, state.scrollOffset + listHeight)
        }
      } else if (keyStr === '\x1b[H' || keyStr === '\x1b[1~') {
        // Home
        state.selectedIndex = 0
        state.scrollOffset = 0
      } else if (keyStr === '\x1b[F' || keyStr === '\x1b[4~') {
        // End
        state.selectedIndex = state.entries.length - 1
        state.scrollOffset = Math.max(0, state.entries.length - listHeight)
      } else if (keyStr === ' ' && mode === 'select-input') {
        // Space - toggle selection
        const entry = state.entries[state.selectedIndex]
        if (entry && entry.name !== '..') {
          if (state.selectedFiles.has(entry.path)) {
            state.selectedFiles.delete(entry.path)
          } else {
            state.selectedFiles.add(entry.path)
            state.lastSelectedIndex = state.selectedIndex
          }
        }
        // Move to next item after selection
        if (state.selectedIndex < state.entries.length - 1) {
          state.selectedIndex++
          if (state.selectedIndex >= state.scrollOffset + listHeight) {
            state.scrollOffset = state.selectedIndex - listHeight + 1
          }
        }
      } else if ((keyStr === 'a' || keyStr === 'A') && mode === 'select-input') {
        // Select/deselect all videos in current directory
        const allVideosSelected = state.entries
          .filter(e => e.isVideo)
          .every(e => state.selectedFiles.has(e.path))

        if (allVideosSelected) {
          // Deselect all videos in this folder
          for (const entry of state.entries) {
            if (entry.isVideo) {
              state.selectedFiles.delete(entry.path)
            }
          }
          state.message = `${style.yellow}Deselected all videos in this folder${style.reset}`
        } else {
          // Select all videos
          for (const entry of state.entries) {
            if (entry.isVideo) {
              state.selectedFiles.add(entry.path)
            }
          }
          const count = countVideos(state.entries)
          state.message = `${style.green}Selected ${count} video(s) in this folder${style.reset}`
        }
        setTimeout(() => {
          state.message = undefined
          renderBrowser(state, height)
        }, 1500)
      } else if ((keyStr === 'd' || keyStr === 'D') && mode === 'select-input') {
        // Deselect all
        const count = state.selectedFiles.size
        state.selectedFiles.clear()
        state.message = `${style.yellow}Cleared ${count} selection(s)${style.reset}`
        setTimeout(() => {
          state.message = undefined
          renderBrowser(state, height)
        }, 1500)
      } else if (keyStr === '*' && mode === 'select-input') {
        // Invert selection for videos
        for (const entry of state.entries) {
          if (entry.isVideo) {
            if (state.selectedFiles.has(entry.path)) {
              state.selectedFiles.delete(entry.path)
            } else {
              state.selectedFiles.add(entry.path)
            }
          }
        }
        state.message = `${style.cyan}Inverted selection${style.reset}`
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
          } else {
            state.message = `${style.yellow}Select at least one file (Space to select, a for all videos)${style.reset}`
            setTimeout(() => {
              state.message = undefined
              renderBrowser(state, height)
            }, 2000)
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
      } else if (keyStr === 'g' || keyStr === '~') {
        // Go to home
        state.currentPath = homedir()
        state.entries = await getEntries(state.currentPath)
        state.selectedIndex = 0
        state.scrollOffset = 0
      } else if (keyStr === '-' || keyStr === 'h') {
        // Go to parent directory
        const parentPath = dirname(state.currentPath)
        if (parentPath !== state.currentPath) {
          state.currentPath = parentPath
          state.entries = await getEntries(parentPath)
          state.selectedIndex = 0
          state.scrollOffset = 0
        }
      } else if (keyStr === 'l' || keyStr === '\x1b[C') {
        // Right arrow or l - enter directory
        const entry = state.entries[state.selectedIndex]
        if (entry?.isDirectory) {
          state.currentPath = entry.path
          state.entries = await getEntries(entry.path)
          state.selectedIndex = 0
          state.scrollOffset = 0
        }
      } else if (keyStr === '\x1b[D') {
        // Left arrow - go to parent
        const parentPath = dirname(state.currentPath)
        if (parentPath !== state.currentPath) {
          state.currentPath = parentPath
          state.entries = await getEntries(parentPath)
          state.selectedIndex = 0
          state.scrollOffset = 0
        }
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
 * Menu selection with arrow key support
 */
export interface MenuOption<T> {
  label: string
  value: T
  description?: string
}

export async function menu<T>(title: string, options: MenuOption<T>[]): Promise<T> {
  // Check if we're in a TTY for interactive mode
  if (!process.stdin.isTTY) {
    // Non-interactive: just show options and use first as default
    console.log(`\n${style.bold}${title}${style.reset}\n`)
    for (let i = 0; i < options.length; i++) {
      console.log(`  ${style.cyan}${i + 1}.${style.reset} ${options[i].label}`)
    }
    return options[0].value
  }

  return new Promise((resolve) => {
    let selectedIndex = 0
    const height = options.length

    const render = () => {
      // Move cursor up to re-render
      if (selectedIndex > 0 || options.some(o => o.description)) {
        process.stdout.write(`\x1b[${height + 2}A`)
      }

      console.log(`\n${style.bold}${title}${style.reset}\n`)

      for (let i = 0; i < options.length; i++) {
        const opt = options[i]
        const isSelected = i === selectedIndex
        const prefix = isSelected ? `${style.cyan}▶${style.reset}` : ' '
        const labelStyle = isSelected ? style.cyan : ''
        const labelEnd = isSelected ? style.reset : ''

        console.log(`  ${prefix} ${labelStyle}${opt.label}${labelEnd}`)
        if (opt.description) {
          console.log(`     ${style.dim}${opt.description}${style.reset}`)
        }
      }
    }

    // Initial render
    console.log(`\n${style.bold}${title}${style.reset}\n`)
    for (let i = 0; i < options.length; i++) {
      const opt = options[i]
      const isSelected = i === selectedIndex
      const prefix = isSelected ? `${style.cyan}▶${style.reset}` : ' '
      const labelStyle = isSelected ? style.cyan : ''
      const labelEnd = isSelected ? style.reset : ''

      console.log(`  ${prefix} ${labelStyle}${opt.label}${labelEnd}`)
      if (opt.description) {
        console.log(`     ${style.dim}${opt.description}${style.reset}`)
      }
    }
    console.log(`\n${style.dim}↑↓ Navigate │ Enter Select${style.reset}`)

    // Setup raw mode
    process.stdin.setRawMode(true)
    process.stdin.resume()

    const onKey = (key: Buffer) => {
      const keyStr = key.toString()

      if (keyStr === '\x03' || keyStr === 'q') {
        // Ctrl+C or q - use first option
        process.stdin.setRawMode(false)
        process.stdin.removeListener('data', onKey)
        process.stdin.pause()
        resolve(options[0].value)
        return
      }

      if (keyStr === '\x1b[A' || keyStr === 'k') {
        // Up
        if (selectedIndex > 0) {
          selectedIndex--
          render()
        }
      } else if (keyStr === '\x1b[B' || keyStr === 'j') {
        // Down
        if (selectedIndex < options.length - 1) {
          selectedIndex++
          render()
        }
      } else if (keyStr === '\r' || keyStr === '\n' || keyStr === ' ') {
        // Enter or Space - select
        process.stdin.setRawMode(false)
        process.stdin.removeListener('data', onKey)
        process.stdin.pause()
        console.log() // New line after selection
        resolve(options[selectedIndex].value)
        return
      } else if (keyStr >= '1' && keyStr <= '9') {
        // Number key - direct select
        const index = parseInt(keyStr, 10) - 1
        if (index < options.length) {
          process.stdin.setRawMode(false)
          process.stdin.removeListener('data', onKey)
          process.stdin.pause()
          console.log()
          resolve(options[index].value)
          return
        }
      }
    }

    process.stdin.on('data', onKey)
  })
}
