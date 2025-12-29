import { app, BrowserWindow, protocol, net } from 'electron'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { appendFile, copyFile, access, constants, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { getDatabase } from './database'
import { registerIpcHandlers } from './ipc'
import { DownloadWorker } from './queue/workers/download.worker'
import { TranscodeWorker } from './queue/workers/transcode.worker'
import { TranscriptionWorker } from './queue/workers/transcription.worker'
import { YtDlpService } from './services/downloader'
import { FfmpegService } from './services/transcoder'
import { WhisperService } from './services/transcription'
import { MetadataService } from './services/library/metadata.service'
import { SmartTaggingService } from './services/smart-tagging'
import { KeychainService } from './services/auth/keychain.service'
import { SessionService } from './services/auth/session.service'
import { WatchFolderService } from './services/watch-folder.service'
import { getSetting } from './utils/settings'
import { Logger } from './utils/logger'
import { autoUpdater } from 'electron-updater'
import { binaryDownloaderService } from './services/binary-downloader.service'

const __dirname = dirname(fileURLToPath(import.meta.url))
let mainWindow: BrowserWindow | null = null
let downloadWorker: DownloadWorker | null = null
let transcodeWorker: TranscodeWorker | null = null
let transcriptionWorker: TranscriptionWorker | null = null
let smartTagging: SmartTaggingService | null = null
let watchFolderService: WatchFolderService | null = null
let mainLogPath: string | null = null
const appLogger = new Logger('App')
const updaterLogger = new Logger('AutoUpdater')

function createWindow(): void {
  const preloadJs = join(__dirname, '../preload/index.js')
  const preloadMjs = join(__dirname, '../preload/index.mjs')
  const preloadPath = existsSync(preloadJs) ? preloadJs : preloadMjs

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  const logWebContents = (event: string, details?: Record<string, unknown>): void => {
    const entry = {
      event,
      details: details ?? null,
      timestamp: new Date().toISOString()
    }
    appLogger.info(`WebContents ${event}`, details)
    void appendMainLog({ type: 'webcontents', ...entry })
  }

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    logWebContents('did-fail-load', { code, description, url })
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logWebContents('render-process-gone', details as unknown as Record<string, unknown>)
  })

  mainWindow.webContents.on('unresponsive', () => {
    logWebContents('unresponsive')
  })

  if (process.env.DRAPP_DEBUG_RENDERER === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function appendMainLog(entry: Record<string, unknown>): Promise<void> {
  if (!mainLogPath) {
    return
  }
  try {
    await appendFile(mainLogPath, `${JSON.stringify(entry)}\n`, 'utf-8')
  } catch {
    // Ignore log file errors.
  }
}

async function ensureBinaries(): Promise<void> {
  const binaryLogger = new Logger('Binaries')
  const missing = await binaryDownloaderService.checkMissingBinaries()

  if (missing.length === 0) {
    binaryLogger.info('All binaries present')
    return
  }

  binaryLogger.info(`Missing binaries: ${missing.join(', ')}. Downloading...`)

  const results = await binaryDownloaderService.downloadMissingBinaries((progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('binary-download/progress', progress)
    }
    if (progress.stage === 'downloading') {
      binaryLogger.info(`Downloading ${progress.binary}: ${progress.progress ?? 0}%`)
    } else if (progress.stage === 'done') {
      binaryLogger.info(`Downloaded ${progress.binary}`)
    } else if (progress.stage === 'error') {
      binaryLogger.error(`Failed to download ${progress.binary}: ${progress.error}`)
    }
  })

  const downloaded = results.filter((r) => r.success).map((r) => r.binary)
  const failed = results.filter((r) => !r.success)

  if (downloaded.length > 0) {
    binaryLogger.info(`Successfully downloaded: ${downloaded.join(', ')}`)
  }

  if (failed.length > 0) {
    binaryLogger.warn(
      `Failed to download: ${failed.map((f) => `${f.binary} (${f.error})`).join(', ')}`
    )
  }
}

function initializeAutoUpdater(): void {
  if (!app.isPackaged) {
    updaterLogger.info('Auto-updater disabled in dev')
    return
  }

  const feedUrl = process.env.DRAPP_UPDATE_URL
  if (feedUrl) {
    autoUpdater.setFeedURL({ provider: 'generic', url: feedUrl })
  } else {
    updaterLogger.warn('No update feed URL configured')
    return
  }

  autoUpdater.on('checking-for-update', () => {
    updaterLogger.info('Checking for updates')
  })
  autoUpdater.on('update-available', () => {
    updaterLogger.info('Update available')
  })
  autoUpdater.on('update-not-available', () => {
    updaterLogger.info('No updates available')
  })
  autoUpdater.on('error', (error) => {
    updaterLogger.error('Update error', { message: error?.message ?? 'unknown' })
  })
  autoUpdater.on('download-progress', (progress) => {
    updaterLogger.info('Update progress', { percent: Math.round(progress.percent) })
  })
  autoUpdater.on('update-downloaded', () => {
    updaterLogger.info('Update downloaded, will install on quit')
  })

  void autoUpdater.checkForUpdatesAndNotify()
}

async function ensureTaxonomyFile(): Promise<string> {
  const userDataPath = app.getPath('userData')
  const taxonomyPath = join(userDataPath, 'tags.txt')

  try {
    // Check if taxonomy file exists in user data
    await access(taxonomyPath, constants.F_OK)
  } catch {
    // Copy default taxonomy from resources or create minimal one
    const defaultTaxonomyPath = join(__dirname, '../../resources/tags.txt')
    try {
      await access(defaultTaxonomyPath, constants.F_OK)
      await copyFile(defaultTaxonomyPath, taxonomyPath)
      console.log('Copied default tags.txt to user data')
    } catch {
      // Create minimal taxonomy if no default exists
      const minimalTaxonomy = `# Drapp Tag Taxonomy
@default_min_conf = 0.65
@low_confidence_policy = suggest

[General]
@min_conf = 0.60
favorite
watch-later
archived
`
      await writeFile(taxonomyPath, minimalTaxonomy)
      console.log('Created minimal tags.txt')
    }
  }

  return taxonomyPath
}

async function initializeServices(): Promise<void> {
  const db = getDatabase()
  const lmstudioUrl = getSetting(db, 'lmstudio_url')
  const lmstudioModel = getSetting(db, 'lmstudio_model')
  const metadataService = new MetadataService()
  const sessionService = new SessionService(db)
  const keychainService = new KeychainService()
  watchFolderService = new WatchFolderService(db)
  await watchFolderService.startFromSettings()

  // Initialize download worker
  downloadWorker = new DownloadWorker(db, new YtDlpService(), (event) => {
    if (mainWindow) {
      mainWindow.webContents.send('download/event', event)
    }
  }, { sessionService, keychain: keychainService })
  const emitProcessingEvent = (event: unknown) => {
    if (mainWindow) {
      mainWindow.webContents.send('processing/event', event)
    }
  }
  transcodeWorker = new TranscodeWorker(db, new FfmpegService(), metadataService, emitProcessingEvent)
  transcriptionWorker = new TranscriptionWorker(db, new WhisperService(), metadataService, emitProcessingEvent)

  // Initialize smart tagging service
  const taxonomyPath = await ensureTaxonomyFile()
  const smartTaggingConfig: { taxonomyPath: string; lmStudioUrl?: string; lmStudioModel?: string } = { taxonomyPath }
  if (lmstudioUrl) {
    smartTaggingConfig.lmStudioUrl = lmstudioUrl
  }
  if (lmstudioModel) {
    smartTaggingConfig.lmStudioModel = lmstudioModel
  }

  smartTagging = new SmartTaggingService(db, smartTaggingConfig)

  try {
    await smartTagging.initialize()
    console.log('Smart tagging service initialized')
  } catch (error) {
    console.warn('Smart tagging initialization failed:', error)
  }

  // Register IPC handlers
  registerIpcHandlers({
    downloadWorker,
    smartTagging,
    transcodeWorker,
    transcriptionWorker,
    watchFolderService
  })

  // Start download worker
  downloadWorker.start()
  transcodeWorker.start()
  transcriptionWorker.start()
}

// Register custom protocol for serving local media files
// This is needed because file:// URLs have cross-origin issues in dev mode
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true
    }
  }
])

app.whenReady().then(async () => {
  // Register media protocol handler for local file access
  protocol.handle('media', (request) => {
    // Extract the path from media://path/to/file.mp4
    // On macOS: media:///Users/path/file.mp4 -> /Users/path/file.mp4
    // On Windows: media://C:/path/file.mp4 -> C:/path/file.mp4
    let filePath = decodeURIComponent(request.url.replace('media://', ''))
    // Handle URL-encoded characters and ensure proper file URL
    const fileUrl = pathToFileURL(filePath).href
    return net.fetch(fileUrl)
  })

  mainLogPath = join(app.getPath('userData'), 'main-errors.log')
  process.on('uncaughtException', (error) => {
    const entry = {
      type: 'uncaughtException',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
    appLogger.error('Uncaught exception', { message: error.message })
    void appendMainLog(entry)
  })
  process.on('unhandledRejection', (reason) => {
    const entry = {
      type: 'unhandledRejection',
      message: reason instanceof Error ? reason.message : 'unhandled rejection',
      stack: reason instanceof Error ? reason.stack : undefined,
      timestamp: new Date().toISOString()
    }
    appLogger.error('Unhandled rejection', { message: entry.message })
    void appendMainLog(entry)
  })

  await initializeServices()
  createWindow()
  initializeAutoUpdater()

  // Auto-download missing binaries after window is ready
  void ensureBinaries()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  downloadWorker?.stop()
  transcodeWorker?.stop()
  transcriptionWorker?.stop()
  void watchFolderService?.stop()
})
