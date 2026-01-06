/**
 * Terminal UI Components
 * Friendly, visual interface for terminal-averse users
 */

// ANSI escape codes
const ESC = '\x1b['
const HIDE_CURSOR = `${ESC}?25l`
const SHOW_CURSOR = `${ESC}?25h`
const CLEAR_SCREEN = `${ESC}2J${ESC}H`
const MOVE_TO = (row: number, col: number) => `${ESC}${row};${col}H`
const CLEAR_LINE = `${ESC}2K`

// Colors
export const style = {
  reset: `${ESC}0m`,
  bold: `${ESC}1m`,
  dim: `${ESC}2m`,
  // Colors
  green: `${ESC}38;5;114m`,
  blue: `${ESC}38;5;75m`,
  cyan: `${ESC}38;5;80m`,
  yellow: `${ESC}38;5;221m`,
  red: `${ESC}38;5;203m`,
  gray: `${ESC}38;5;245m`,
  white: `${ESC}38;5;255m`,
  // Backgrounds
  bgDark: `${ESC}48;5;236m`,
  bgGreen: `${ESC}48;5;114m`,
  bgBlue: `${ESC}48;5;75m`
}

// Box drawing characters
const box = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  teeRight: '├',
  teeLeft: '┤'
}

// Progress bar characters
const progressChars = {
  filled: '█',
  partial: ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉'],
  empty: '░'
}

export interface TUIState {
  title: string
  subtitle?: string
  currentFile: string
  currentFileIndex: number
  totalFiles: number
  fileProgress: number
  batchProgress: number
  speed: string
  fileEta: string
  batchEta: string
  completed: number
  skipped: number
  failed: number
  savedBytes: number
  status: 'idle' | 'scanning' | 'encoding' | 'analyzing' | 'complete' | 'error'
  statusMessage?: string
  codec: string
  preset: string
}

export class TUI {
  private state: TUIState
  private width: number
  private lastRender = 0
  private renderThrottle = 50 // ms
  private isRendering = false
  private resizeHandler: (() => void) | null = null
  private cleanupBound: (() => void) | null = null

  constructor() {
    this.width = Math.min(process.stdout.columns || 60, 70)
    this.state = {
      title: 'Drapp Archive',
      currentFile: '',
      currentFileIndex: 0,
      totalFiles: 0,
      fileProgress: 0,
      batchProgress: 0,
      speed: '--',
      fileEta: '--',
      batchEta: '--',
      completed: 0,
      skipped: 0,
      failed: 0,
      savedBytes: 0,
      status: 'idle',
      codec: 'AV1',
      preset: 'archive'
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str
    return '...' + str.slice(-(maxLen - 3))
  }

  private progressBar(percent: number, width: number): string {
    const filledWidth = (percent / 100) * width
    const fullBlocks = Math.floor(filledWidth)
    const partialIndex = Math.floor((filledWidth - fullBlocks) * 8)
    const emptyBlocks = width - fullBlocks - (partialIndex > 0 ? 1 : 0)

    return (
      `${style.green}${progressChars.filled.repeat(fullBlocks)}` +
      `${partialIndex > 0 ? progressChars.partial[partialIndex] : ''}` +
      `${style.gray}${progressChars.empty.repeat(Math.max(0, emptyBlocks))}${style.reset}`
    )
  }

  private boxTop(width: number): string {
    return `${style.cyan}${box.topLeft}${box.horizontal.repeat(width - 2)}${box.topRight}${style.reset}`
  }

  private boxBottom(width: number): string {
    return `${style.cyan}${box.bottomLeft}${box.horizontal.repeat(width - 2)}${box.bottomRight}${style.reset}`
  }

  private boxLine(content: string, width: number): string {
    const visibleLen = this.visibleLength(content)
    const padding = Math.max(0, width - 4 - visibleLen)
    return `${style.cyan}${box.vertical}${style.reset} ${content}${' '.repeat(padding)} ${style.cyan}${box.vertical}${style.reset}`
  }

  private boxDivider(width: number): string {
    return `${style.cyan}${box.teeRight}${box.horizontal.repeat(width - 2)}${box.teeLeft}${style.reset}`
  }

  private visibleLength(str: string): number {
    // Remove ANSI escape codes to get visible length
    return str.replace(/\x1b\[[0-9;]*m/g, '').length
  }

  private centerText(text: string, width: number): string {
    const visibleLen = this.visibleLength(text)
    const padding = Math.max(0, Math.floor((width - 4 - visibleLen) / 2))
    return ' '.repeat(padding) + text
  }

  private getStatusIcon(): string {
    switch (this.state.status) {
      case 'scanning': return `${style.blue}◉${style.reset}`
      case 'analyzing': return `${style.yellow}◉${style.reset}`
      case 'encoding': return `${style.green}◉${style.reset}`
      case 'complete': return `${style.green}✓${style.reset}`
      case 'error': return `${style.red}✗${style.reset}`
      default: return `${style.gray}○${style.reset}`
    }
  }

  private getStatusText(): string {
    switch (this.state.status) {
      case 'scanning': return `${style.blue}Scanning for videos...${style.reset}`
      case 'analyzing': return `${style.yellow}Analyzing video...${style.reset}`
      case 'encoding': return `${style.green}Encoding${style.reset}`
      case 'complete': return `${style.green}${style.bold}All done!${style.reset}`
      case 'error': return `${style.red}Error occurred${style.reset}`
      default: return `${style.gray}Ready${style.reset}`
    }
  }

  render(): void {
    // Throttle rendering
    const now = Date.now()
    if (now - this.lastRender < this.renderThrottle) return
    if (this.isRendering) return
    this.isRendering = true
    this.lastRender = now

    const w = this.width
    const lines: string[] = []

    // Header
    lines.push('')
    lines.push(this.boxTop(w))

    // Title with codec badge
    const badge = `${style.bgBlue}${style.white}${style.bold} ${this.state.codec} ${style.reset}`
    const title = `${style.bold}${style.white}${this.state.title}${style.reset}`
    lines.push(this.boxLine(`${title}  ${badge}`, w))

    if (this.state.subtitle) {
      lines.push(this.boxLine(`${style.dim}${this.state.subtitle}${style.reset}`, w))
    }

    lines.push(this.boxDivider(w))

    // Status
    lines.push(this.boxLine(`${this.getStatusIcon()} ${this.getStatusText()}`, w))

    if (this.state.status === 'encoding' || this.state.status === 'analyzing') {
      lines.push(this.boxLine('', w))

      // Current file
      const fileNum = `[${this.state.currentFileIndex}/${this.state.totalFiles}]`
      const fileName = this.truncate(this.state.currentFile, w - 20)
      lines.push(this.boxLine(`${style.dim}File:${style.reset} ${fileName} ${style.gray}${fileNum}${style.reset}`, w))

      // File progress bar
      const barWidth = w - 24
      const fileBar = this.progressBar(this.state.fileProgress, barWidth)
      const filePct = `${this.state.fileProgress.toString().padStart(3)}%`
      lines.push(this.boxLine(`     ${fileBar} ${filePct}`, w))

      // Speed and ETA
      lines.push(this.boxLine(
        `     ${style.dim}Speed:${style.reset} ${this.state.speed}  ${style.dim}ETA:${style.reset} ${this.state.fileEta}`,
        w
      ))

      lines.push(this.boxLine('', w))

      // Batch progress
      lines.push(this.boxLine(`${style.dim}Overall Progress${style.reset}`, w))
      const batchBar = this.progressBar(this.state.batchProgress, barWidth)
      const batchPct = `${this.state.batchProgress.toString().padStart(3)}%`
      lines.push(this.boxLine(`     ${batchBar} ${batchPct}`, w))
      lines.push(this.boxLine(`     ${style.dim}Remaining:${style.reset} ${this.state.batchEta}`, w))
    }

    lines.push(this.boxDivider(w))

    // Stats row
    const statsLine =
      `${style.green}✓ ${this.state.completed}${style.reset}  ` +
      `${style.yellow}○ ${this.state.skipped}${style.reset}  ` +
      `${style.red}✗ ${this.state.failed}${style.reset}  ` +
      `${style.dim}│${style.reset}  ` +
      `${style.cyan}Saved: ${this.formatBytes(this.state.savedBytes)}${style.reset}`
    lines.push(this.boxLine(statsLine, w))

    lines.push(this.boxBottom(w))
    lines.push('')

    // Render
    process.stdout.write(HIDE_CURSOR)
    process.stdout.write(MOVE_TO(1, 1))
    for (const line of lines) {
      process.stdout.write(CLEAR_LINE + line + '\n')
    }

    this.isRendering = false
  }

  update(partial: Partial<TUIState>): void {
    this.state = { ...this.state, ...partial }
    this.render()
  }

  start(): void {
    process.stdout.write(CLEAR_SCREEN)
    process.stdout.write(HIDE_CURSOR)
    this.render()

    // Handle terminal resize
    this.resizeHandler = () => {
      this.width = Math.min(process.stdout.columns || 60, 70)
      process.stdout.write(CLEAR_SCREEN)
      this.render()
    }
    process.stdout.on('resize', this.resizeHandler)

    // Handle Ctrl+C and other exit signals to restore cursor
    this.cleanupBound = () => this.cleanup()
    process.on('SIGINT', this.cleanupBound)
    process.on('SIGTERM', this.cleanupBound)
    process.on('exit', this.cleanupBound)
  }

  private cleanup(): void {
    // Restore cursor - this is idempotent so safe to call multiple times
    process.stdout.write(SHOW_CURSOR)
  }

  stop(): void {
    // Restore cursor
    this.cleanup()

    // Remove event listeners to prevent memory leaks
    if (this.resizeHandler) {
      process.stdout.removeListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }

    if (this.cleanupBound) {
      process.removeListener('SIGINT', this.cleanupBound)
      process.removeListener('SIGTERM', this.cleanupBound)
      process.removeListener('exit', this.cleanupBound)
      this.cleanupBound = null
    }
  }

  // Print a message below the TUI
  log(message: string): void {
    // Move below the TUI and print
    console.log(message)
  }
}

/**
 * Simple welcome banner for non-TUI mode
 */
export function printWelcome(codec: string, preset: string): void {
  console.log(`
${style.cyan}╭──────────────────────────────────────────╮${style.reset}
${style.cyan}│${style.reset}  ${style.bold}${style.white}Drapp Archive${style.reset}                         ${style.cyan}│${style.reset}
${style.cyan}│${style.reset}  ${style.dim}Video encoding made simple${style.reset}              ${style.cyan}│${style.reset}
${style.cyan}├──────────────────────────────────────────┤${style.reset}
${style.cyan}│${style.reset}  Codec: ${style.green}${codec.toUpperCase().padEnd(8)}${style.reset}  Preset: ${style.green}${preset.padEnd(8)}${style.reset}  ${style.cyan}│${style.reset}
${style.cyan}╰──────────────────────────────────────────╯${style.reset}
`)
}

/**
 * Print a friendly error message
 */
export function printError(message: string, hint?: string): void {
  console.log(`
${style.red}╭──────────────────────────────────────────╮${style.reset}
${style.red}│${style.reset}  ${style.red}${style.bold}Oops! Something went wrong${style.reset}              ${style.red}│${style.reset}
${style.red}├──────────────────────────────────────────┤${style.reset}
${style.red}│${style.reset}  ${message.slice(0, 40).padEnd(40)} ${style.red}│${style.reset}
${hint ? `${style.red}│${style.reset}  ${style.dim}${hint.slice(0, 40).padEnd(40)}${style.reset} ${style.red}│${style.reset}\n` : ''}${style.red}╰──────────────────────────────────────────╯${style.reset}
`)
}

/**
 * Print completion summary
 */
export function printSummary(completed: number, skipped: number, failed: number, savedBytes: number): void {
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const total = completed + skipped + failed
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0

  console.log(`
${style.green}╭──────────────────────────────────────────╮${style.reset}
${style.green}│${style.reset}  ${style.green}${style.bold}✓ Encoding Complete!${style.reset}                    ${style.green}│${style.reset}
${style.green}├──────────────────────────────────────────┤${style.reset}
${style.green}│${style.reset}  ${style.green}Completed:${style.reset}  ${completed.toString().padEnd(6)}  ${style.dim}(${successRate}% success)${style.reset}     ${style.green}│${style.reset}
${style.green}│${style.reset}  ${style.yellow}Skipped:${style.reset}    ${skipped.toString().padEnd(6)}                      ${style.green}│${style.reset}
${style.green}│${style.reset}  ${style.red}Failed:${style.reset}     ${failed.toString().padEnd(6)}                      ${style.green}│${style.reset}
${style.green}├──────────────────────────────────────────┤${style.reset}
${style.green}│${style.reset}  ${style.cyan}Space Saved:${style.reset} ${formatBytes(savedBytes).padEnd(27)} ${style.green}│${style.reset}
${style.green}╰──────────────────────────────────────────╯${style.reset}
`)
}
