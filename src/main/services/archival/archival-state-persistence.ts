import { readFile, writeFile, unlink, access, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { Logger } from '../../utils/logger'
import type { PersistedArchivalState } from '../../../shared/types/archival.types'

const STATE_FILE_NAME = 'archival-queue-state.json'
const CURRENT_VERSION = 1

/**
 * Get user data directory - works in both Electron and CLI mode
 */
function getUserDataPath(): string {
  // Check if running in Electron
  try {
    // Dynamic require to avoid bundling issues in CLI mode
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron')
    if (app && typeof app.getPath === 'function') {
      return app.getPath('userData')
    }
  } catch {
    // Not in Electron context
  }

  // CLI mode - use ~/.drapp
  return join(homedir(), '.drapp')
}

/**
 * Handles persistence of archival queue state for crash recovery
 * Saves state to a JSON file in the user data directory
 */
export class ArchivalStatePersistence {
  private readonly logger = new Logger('ArchivalStatePersistence')
  private readonly statePath: string
  private saveDebounceTimer: NodeJS.Timeout | null = null
  private readonly saveDebounceMs = 30000 // 30 seconds for periodic saves during encoding

  constructor() {
    const userDataPath = getUserDataPath()
    this.statePath = join(userDataPath, STATE_FILE_NAME)
  }

  /**
   * Save state to disk immediately
   */
  async saveState(state: PersistedArchivalState): Promise<void> {
    // Cancel any pending debounced save
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer)
      this.saveDebounceTimer = null
    }

    try {
      // Ensure parent directory exists (important for CLI mode)
      const { dirname } = await import('node:path')
      await mkdir(dirname(this.statePath), { recursive: true })

      const stateWithMeta: PersistedArchivalState = {
        ...state,
        version: CURRENT_VERSION,
        savedAt: new Date().toISOString()
      }
      await writeFile(this.statePath, JSON.stringify(stateWithMeta, null, 2), 'utf-8')
      this.logger.debug('State saved', { itemCount: state.job.items.length })
    } catch (error) {
      this.logger.error('Failed to save state', { error })
      throw error
    }
  }

  /**
   * Schedule a debounced save (used during encoding for periodic saves)
   * The save will be executed after saveDebounceMs unless another save is triggered
   */
  scheduleSave(state: PersistedArchivalState): void {
    // Cancel any existing timer
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer)
    }

    this.saveDebounceTimer = setTimeout(() => {
      this.saveDebounceTimer = null
      void this.saveState(state)
    }, this.saveDebounceMs)
  }

  /**
   * Cancel any pending debounced save
   */
  cancelPendingSave(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer)
      this.saveDebounceTimer = null
    }
  }

  /**
   * Load state from disk
   * Returns null if no state file exists or if it's corrupted
   */
  async loadState(): Promise<PersistedArchivalState | null> {
    try {
      const content = await readFile(this.statePath, 'utf-8')
      const state = JSON.parse(content) as PersistedArchivalState

      // Validate version
      if (state.version !== CURRENT_VERSION) {
        this.logger.warn('State file version mismatch, discarding', {
          fileVersion: state.version,
          currentVersion: CURRENT_VERSION
        })
        await this.clearState()
        return null
      }

      // Validate required fields
      if (!state.job || !state.job.id || !Array.isArray(state.job.items)) {
        this.logger.warn('State file is corrupted, discarding')
        await this.clearState()
        return null
      }

      this.logger.info('State loaded', {
        jobId: state.job.id,
        itemCount: state.job.items.length,
        savedAt: state.savedAt
      })

      return state
    } catch (error) {
      // File doesn't exist or can't be read - this is normal on first run
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      this.logger.warn('Failed to load state', { error })
      return null
    }
  }

  /**
   * Clear state file from disk
   */
  async clearState(): Promise<void> {
    // Cancel any pending save
    this.cancelPendingSave()

    try {
      await unlink(this.statePath)
      this.logger.debug('State file cleared')
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Failed to clear state', { error })
      }
    }
  }

  /**
   * Check if a persisted state file exists
   */
  async hasPersistedState(): Promise<boolean> {
    try {
      await access(this.statePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the path to the state file (for debugging/logging)
   */
  getStatePath(): string {
    return this.statePath
  }
}
