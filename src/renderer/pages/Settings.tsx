import { useEffect, useRef, useState } from 'react'
import type {
  AuthSession,
  DownloadSettings,
  LlmProvider,
  LlmSettings,
  LlmUpdatePayload,
  PrivacySettings,
  UiSettings,
  WatchFolderSettings
} from '../../preload/api'

const settings = [
  {
    title: 'General',
    description: 'Theme, language, and default workspace locations.'
  },
  {
    title: 'Downloads',
    description: 'Default formats, concurrency, and post-processing.'
  },
  {
    title: 'AI + Tagging',
    description: 'LLM providers, prompts, and confidence thresholds.'
  },
  {
    title: 'Authentication',
    description: 'Cookie sessions for premium or restricted platforms.'
  },
  {
    title: 'Privacy',
    description: 'Sensitive content handling, local-only modes, and logging.'
  }
]

const DEFAULT_LMSTUDIO_URL = 'http://localhost:1234/v1'
const DEFAULT_LMSTUDIO_MODEL = 'auto'
const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet'
const AUTH_PLATFORMS = ['youtube', 'tiktok', 'instagram', 'twitter', 'reddit', 'vimeo', 'other']

type BinaryRow = {
  name: string
  status: 'ok' | 'missing' | 'error'
  detail: string
  path: string
}

export default function Settings(): JSX.Element {
  const [binaries, setBinaries] = useState<BinaryRow[]>([])
  const [binaryError, setBinaryError] = useState<string | null>(null)
  const [binaryStatus, setBinaryStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRepairing, setIsRepairing] = useState(false)
  const [llmSettings, setLlmSettings] = useState<LlmSettings | null>(null)
  const [llmProvider, setLlmProvider] = useState<LlmProvider>('lmstudio')
  const [openrouterModel, setOpenrouterModel] = useState('')
  const [openrouterApiKey, setOpenrouterApiKey] = useState('')
  const [lmstudioBaseUrl, setLmstudioBaseUrl] = useState('')
  const [lmstudioModel, setLmstudioModel] = useState('')
  const [llmStatus, setLlmStatus] = useState<string | null>(null)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [isLlmSaving, setIsLlmSaving] = useState(false)
  const [isLlmTesting, setIsLlmTesting] = useState(false)
  const [authSessions, setAuthSessions] = useState<AuthSession[]>([])
  const [authPlatform, setAuthPlatform] = useState('youtube')
  const [authAccountName, setAuthAccountName] = useState('')
  const [authCookiePath, setAuthCookiePath] = useState('')
  const [authStatus, setAuthStatus] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authWarning, setAuthWarning] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [isAuthSelecting, setIsAuthSelecting] = useState(false)
  const [isAuthImporting, setIsAuthImporting] = useState(false)
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings | null>(null)
  const [downloadProxy, setDownloadProxy] = useState('')
  const [downloadRateLimit, setDownloadRateLimit] = useState('')
  const [downloadRateLimitMs, setDownloadRateLimitMs] = useState('0')
  const [downloadDedupeEnabled, setDownloadDedupeEnabled] = useState(true)
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isDownloadSaving, setIsDownloadSaving] = useState(false)
  const [uiSettings, setUiSettings] = useState<UiSettings | null>(null)
  const [uiTheme, setUiTheme] = useState<'light' | 'dark'>('light')
  const [uiStatus, setUiStatus] = useState<string | null>(null)
  const [uiError, setUiError] = useState<string | null>(null)
  const [isUiSaving, setIsUiSaving] = useState(false)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)
  const [privacyDraft, setPrivacyDraft] = useState<PrivacySettings | null>(null)
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null)
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [isPrivacySaving, setIsPrivacySaving] = useState(false)
  const [privacyPin, setPrivacyPin] = useState('')
  const [privacyPinConfirm, setPrivacyPinConfirm] = useState('')
  const [privacyPinStatus, setPrivacyPinStatus] = useState<string | null>(null)
  const [privacyPinError, setPrivacyPinError] = useState<string | null>(null)
  const [isPrivacyPinSaving, setIsPrivacyPinSaving] = useState(false)
  const [isPrivacyPinClearing, setIsPrivacyPinClearing] = useState(false)
  const [watchFolder, setWatchFolder] = useState<WatchFolderSettings | null>(null)
  const [watchFolderStatus, setWatchFolderStatus] = useState<string | null>(null)
  const [watchFolderError, setWatchFolderError] = useState<string | null>(null)
  // App lock state
  const [appLockEnabled, setAppLockEnabled] = useState(false)
  const [appPasswordSet, setAppPasswordSet] = useState(false)
  const [appLockPassword, setAppLockPassword] = useState('')
  const [appLockConfirmPassword, setAppLockConfirmPassword] = useState('')
  const [appLockCurrentPassword, setAppLockCurrentPassword] = useState('')
  const [appLockStatus, setAppLockStatus] = useState<string | null>(null)
  const [appLockError, setAppLockError] = useState<string | null>(null)
  const [isAppLockSaving, setIsAppLockSaving] = useState(false)
  const [isWatchFolderSaving, setIsWatchFolderSaving] = useState(false)
  const [isWatchFolderSelecting, setIsWatchFolderSelecting] = useState(false)
  const [isWatchFolderScanning, setIsWatchFolderScanning] = useState(false)
  const appearanceRef = useRef<HTMLDivElement | null>(null)
  const downloadRef = useRef<HTMLDivElement | null>(null)
  const llmRef = useRef<HTMLDivElement | null>(null)
  const authRef = useRef<HTMLDivElement | null>(null)
  const privacyRef = useRef<HTMLDivElement | null>(null)

  const formatDateTime = (value: string | null | undefined): string => {
    if (!value) {
      return 'Not available'
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return parsed.toLocaleString()
  }

  const loadBinaries = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const result = await window.api.systemBinaries()
      if (!result.ok) {
        setBinaryError('Unable to check binaries.')
        return
      }

      const rows = result.binaries.map((binary) => {
        if (!binary.exists) {
          return {
            name: binary.name,
            status: 'missing' as const,
            detail: 'Missing binary',
            path: binary.path
          }
        }

        if (!binary.executable) {
          return {
            name: binary.name,
            status: 'error' as const,
            detail: 'Not executable',
            path: binary.path
          }
        }

        return {
          name: binary.name,
          status: binary.version ? 'ok' as const : 'error' as const,
          detail: binary.version ?? (binary.error ?? 'Unknown'),
          path: binary.path
        }
      })

      setBinaries(rows)
      setBinaryError(null)
      setBinaryStatus(null)
    } catch (err) {
      setBinaryError(err instanceof Error ? err.message : 'Unable to check binaries.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepairBinaries = async (): Promise<void> => {
    setIsRepairing(true)
    setBinaryError(null)
    setBinaryStatus(null)
    try {
      const result = await window.api.systemRepairBinaries()
      if (!result.ok) {
        setBinaryError(result.error ?? 'Unable to repair binaries.')
      } else {
        const repaired = result.repaired?.length ?? 0
        const missing = result.missing?.length ?? 0
        const errors = result.errors ?? []
        await loadBinaries()
        setBinaryStatus(`Repaired ${repaired} binaries${missing ? ` · ${missing} missing` : ''}.`)
        if (errors.length > 0) {
          const names = errors.map((entry) => entry.name).join(', ')
          setBinaryError(`Repair completed with ${errors.length} error(s): ${names}`)
        }
      }
    } catch (err) {
      setBinaryError(err instanceof Error ? err.message : 'Unable to repair binaries.')
    } finally {
      setIsRepairing(false)
    }
  }

  const handleOpenBinariesFolder = async (): Promise<void> => {
    try {
      const result = await window.api.systemOpenBinariesFolder()
      if (!result.ok) {
        setBinaryError(result.error ?? 'Unable to open binaries folder.')
      }
    } catch (err) {
      setBinaryError(err instanceof Error ? err.message : 'Unable to open binaries folder.')
    }
  }

  const handleConfigure = (target: { current: HTMLDivElement | null }): void => {
    target.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const syncLlmState = (settings: LlmSettings): void => {
    setLlmSettings(settings)
    setLlmProvider(settings.provider)
    setOpenrouterModel(settings.openrouter.model ?? '')
    setLmstudioBaseUrl(settings.lmstudio.baseUrl)
    setLmstudioModel(settings.lmstudio.model ?? '')
  }

  const loadLlmSettings = async (): Promise<void> => {
    try {
      const result = await window.api.llmGetSettings()
      if (result.ok && result.settings) {
        syncLlmState(result.settings)
        setLlmError(null)
      } else {
        setLlmError(result.error ?? 'Unable to load LLM settings.')
      }
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : 'Unable to load LLM settings.')
    }
  }

  const handleSaveLlmSettings = async (): Promise<void> => {
    setIsLlmSaving(true)
    setLlmStatus(null)
    setLlmError(null)

    const payload: LlmUpdatePayload = {
      provider: llmProvider,
      openrouterModel: openrouterModel.trim() || DEFAULT_OPENROUTER_MODEL,
      lmstudioBaseUrl: lmstudioBaseUrl.trim() || DEFAULT_LMSTUDIO_URL,
      lmstudioModel: lmstudioModel.trim() || DEFAULT_LMSTUDIO_MODEL
    }

    if (openrouterApiKey.trim()) {
      payload.openrouterApiKey = openrouterApiKey.trim()
    }

    try {
      const result = await window.api.llmUpdateSettings(payload)
      if (result.ok && result.settings) {
        syncLlmState(result.settings)
        setOpenrouterApiKey('')
        setLlmStatus('Settings saved.')
      } else {
        setLlmError(result.error ?? 'Unable to save LLM settings.')
      }
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : 'Unable to save LLM settings.')
    } finally {
      setIsLlmSaving(false)
    }
  }

  const handleTestConnection = async (): Promise<void> => {
    setIsLlmTesting(true)
    setLlmStatus(null)
    setLlmError(null)
    try {
      const result = await window.api.llmTestConnection(llmProvider)
      if (!result.ok) {
        setLlmError(result.error ?? 'Unable to test connection.')
      } else if (result.available) {
        setLlmStatus('Connection successful.')
      } else {
        setLlmError(result.error ?? 'Provider unavailable.')
      }
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : 'Unable to test connection.')
    } finally {
      setIsLlmTesting(false)
    }
  }

  const loadAuthSessions = async (): Promise<void> => {
    setIsAuthLoading(true)
    try {
      const result = await window.api.authListSessions()
      if (result.ok && result.sessions) {
        setAuthSessions(result.sessions)
        setAuthError(null)
      } else {
        setAuthError(result.error ?? 'Unable to load sessions.')
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to load sessions.')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleSelectCookieFile = async (): Promise<void> => {
    setIsAuthSelecting(true)
    setAuthStatus(null)
    setAuthError(null)
    setAuthWarning(null)
    try {
      const result = await window.api.authSelectCookieFile()
      if (result.ok && result.path) {
        setAuthCookiePath(result.path)
      } else if (!result.canceled) {
        setAuthError(result.error ?? 'Unable to select cookie file.')
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to select cookie file.')
    } finally {
      setIsAuthSelecting(false)
    }
  }

  const handleImportCookies = async (): Promise<void> => {
    setIsAuthImporting(true)
    setAuthStatus(null)
    setAuthError(null)
    setAuthWarning(null)

    const platform = authPlatform.trim()
    if (!platform) {
      setAuthError('Platform is required.')
      setIsAuthImporting(false)
      return
    }
    if (!authCookiePath) {
      setAuthError('Select a cookie file first.')
      setIsAuthImporting(false)
      return
    }

    try {
      const result = await window.api.authImportCookies({
        platform,
        filePath: authCookiePath,
        accountName: authAccountName.trim() || null
      })
      if (result.ok) {
        setAuthStatus(
          `Imported ${result.cookieCount ?? 0} cookies for ${platform}.`
        )
        if (result.storage === 'plain') {
          setAuthWarning('Secure storage is unavailable. Cookies were saved in plain text.')
        }
        setAuthCookiePath('')
        setAuthAccountName('')
        await loadAuthSessions()
      } else {
        setAuthError(result.error ?? 'Unable to import cookies.')
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to import cookies.')
    } finally {
      setIsAuthImporting(false)
    }
  }

  const handleSetActiveSession = async (sessionId: string): Promise<void> => {
    setAuthStatus(null)
    setAuthError(null)
    setAuthWarning(null)
    try {
      const result = await window.api.authSetActive(sessionId)
      if (result.ok) {
        setAuthStatus('Session activated.')
        await loadAuthSessions()
      } else {
        setAuthError(result.error ?? 'Unable to activate session.')
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to activate session.')
    }
  }

  const handleDeleteSession = async (sessionId: string): Promise<void> => {
    setAuthStatus(null)
    setAuthError(null)
    setAuthWarning(null)
    try {
      const result = await window.api.authDeleteSession(sessionId)
      if (result.ok) {
        setAuthStatus('Session deleted.')
        await loadAuthSessions()
      } else {
        setAuthError(result.error ?? 'Unable to delete session.')
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to delete session.')
    }
  }

  const loadDownloadSettings = async (): Promise<void> => {
    try {
      const result = await window.api.downloadGetSettings()
      if (result.ok && result.settings) {
        setDownloadSettings(result.settings)
        setDownloadProxy(result.settings.proxy ?? '')
        setDownloadRateLimit(result.settings.rateLimit ?? '')
        setDownloadRateLimitMs(result.settings.rateLimitMs ? result.settings.rateLimitMs.toString() : '0')
        setDownloadDedupeEnabled(result.settings.dedupeEnabled)
        setDownloadError(null)
      } else {
        setDownloadError(result.error ?? 'Unable to load download settings.')
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to load download settings.')
    }
  }

  const handleSaveDownloadSettings = async (): Promise<void> => {
    setIsDownloadSaving(true)
    setDownloadStatus(null)
    setDownloadError(null)
    try {
      const nextProxy = downloadProxy.trim()
      const parsedDelay = Number(downloadRateLimitMs)
      const result = await window.api.downloadUpdateSettings({
        proxy: nextProxy ? nextProxy : null,
        rateLimit: downloadRateLimit.trim() ? downloadRateLimit.trim() : null,
        rateLimitMs: Number.isFinite(parsedDelay) ? parsedDelay : 0,
        dedupeEnabled: downloadDedupeEnabled
      })
      if (result.ok && result.settings) {
        setDownloadSettings(result.settings)
        setDownloadProxy(result.settings.proxy ?? '')
        setDownloadRateLimit(result.settings.rateLimit ?? '')
        setDownloadRateLimitMs(result.settings.rateLimitMs ? result.settings.rateLimitMs.toString() : '0')
        setDownloadDedupeEnabled(result.settings.dedupeEnabled)
        setDownloadStatus('Download settings saved.')
      } else {
        setDownloadError(result.error ?? 'Unable to update download settings.')
      }
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Unable to update download settings.')
    } finally {
      setIsDownloadSaving(false)
    }
  }

  const loadUiSettings = async (): Promise<void> => {
    try {
      const result = await window.api.uiGetSettings()
      if (result.ok && result.settings) {
        setUiSettings(result.settings)
        setUiTheme(result.settings.theme)
        setUiError(null)
      } else {
        setUiError(result.error ?? 'Unable to load appearance settings.')
      }
    } catch (err) {
      setUiError(err instanceof Error ? err.message : 'Unable to load appearance settings.')
    }
  }

  const handleSaveUiSettings = async (): Promise<void> => {
    setIsUiSaving(true)
    setUiStatus(null)
    setUiError(null)
    try {
      const result = await window.api.uiUpdateSettings({ theme: uiTheme })
      if (result.ok && result.settings) {
        setUiSettings(result.settings)
        setUiTheme(result.settings.theme)
        document.documentElement.classList.toggle('theme-dark', result.settings.theme === 'dark')
        setUiStatus('Appearance updated.')
      } else {
        setUiError(result.error ?? 'Unable to update appearance settings.')
      }
    } catch (err) {
      setUiError(err instanceof Error ? err.message : 'Unable to update appearance settings.')
    } finally {
      setIsUiSaving(false)
    }
  }

  const loadPrivacySettings = async (): Promise<void> => {
    try {
      const result = await window.api.privacyGetSettings()
      if (result.ok && result.settings) {
        setPrivacySettings(result.settings)
        setPrivacyDraft(result.settings)
        setPrivacyError(null)
      } else {
        setPrivacyError(result.error ?? 'Unable to load privacy settings.')
      }
    } catch (err) {
      setPrivacyError(err instanceof Error ? err.message : 'Unable to load privacy settings.')
    }
  }

  const handleSavePrivacy = async (): Promise<void> => {
    if (!privacyDraft) {
      return
    }
    setIsPrivacySaving(true)
    setPrivacyStatus(null)
    setPrivacyError(null)

    try {
      const { pinSet, ...payload } = privacyDraft
      const result = await window.api.privacyUpdateSettings(payload)
      if (result.ok && result.settings) {
        setPrivacySettings(result.settings)
        setPrivacyDraft(result.settings)
        setPrivacyStatus('Privacy settings saved.')
      } else {
        setPrivacyError(result.error ?? 'Unable to save privacy settings.')
      }
    } catch (err) {
      setPrivacyError(err instanceof Error ? err.message : 'Unable to save privacy settings.')
    } finally {
      setIsPrivacySaving(false)
    }
  }

  const handleSetPrivacyPin = async (): Promise<void> => {
    setPrivacyPinStatus(null)
    setPrivacyPinError(null)
    if (!privacyPin.trim() || !privacyPinConfirm.trim()) {
      setPrivacyPinError('Enter and confirm a PIN.')
      return
    }
    if (privacyPin.trim() !== privacyPinConfirm.trim()) {
      setPrivacyPinError('PIN entries do not match.')
      return
    }

    setIsPrivacyPinSaving(true)
    try {
      const result = await window.api.privacySetPin(privacyPin.trim())
      if (result.ok) {
        setPrivacyPinStatus('PIN saved.')
        setPrivacyPin('')
        setPrivacyPinConfirm('')
        await loadPrivacySettings()
      } else {
        setPrivacyPinError(result.error ?? 'Unable to save PIN.')
      }
    } catch (error) {
      setPrivacyPinError(error instanceof Error ? error.message : 'Unable to save PIN.')
    } finally {
      setIsPrivacyPinSaving(false)
    }
  }

  const handleClearPrivacyPin = async (): Promise<void> => {
    setPrivacyPinStatus(null)
    setPrivacyPinError(null)
    setIsPrivacyPinClearing(true)
    try {
      const result = await window.api.privacyClearPin()
      if (result.ok) {
        setPrivacyPinStatus('PIN cleared.')
        await loadPrivacySettings()
      } else {
        setPrivacyPinError(result.error ?? 'Unable to clear PIN.')
      }
    } catch (error) {
      setPrivacyPinError(error instanceof Error ? error.message : 'Unable to clear PIN.')
    } finally {
      setIsPrivacyPinClearing(false)
    }
  }

  const loadWatchFolderSettings = async (): Promise<void> => {
    try {
      const result = await window.api.watchFolderGetSettings()
      if (result.ok && result.settings) {
        setWatchFolder(result.settings)
        setWatchFolderError(null)
      } else {
        setWatchFolderError(result.error ?? 'Unable to load watch folder settings.')
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : 'Unable to load watch folder settings.')
    }
  }

  const handleSelectWatchFolder = async (): Promise<void> => {
    setIsWatchFolderSelecting(true)
    setWatchFolderStatus(null)
    setWatchFolderError(null)
    try {
      const result = await window.api.watchFolderSelectPath()
      if (result.ok && result.path) {
        await handleUpdateWatchFolder({ path: result.path })
      } else if (!result.canceled) {
        setWatchFolderError(result.error ?? 'Unable to select folder.')
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : 'Unable to select folder.')
    } finally {
      setIsWatchFolderSelecting(false)
    }
  }

  const handleUpdateWatchFolder = async (payload: Partial<WatchFolderSettings>): Promise<void> => {
    setIsWatchFolderSaving(true)
    setWatchFolderStatus(null)
    setWatchFolderError(null)
    try {
      const result = await window.api.watchFolderUpdateSettings(payload)
      if (result.ok && result.settings) {
        setWatchFolder(result.settings)
        setWatchFolderStatus('Watch folder updated.')
      } else {
        setWatchFolderError(result.error ?? 'Unable to update watch folder.')
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : 'Unable to update watch folder.')
    } finally {
      setIsWatchFolderSaving(false)
    }
  }

  const handleScanWatchFolder = async (): Promise<void> => {
    setIsWatchFolderScanning(true)
    setWatchFolderStatus(null)
    setWatchFolderError(null)
    try {
      const result = await window.api.watchFolderScanNow()
      if (result.ok) {
        setWatchFolderStatus('Scan completed.')
      } else {
        setWatchFolderError(result.error ?? 'Unable to scan watch folder.')
      }
    } catch (error) {
      setWatchFolderError(error instanceof Error ? error.message : 'Unable to scan watch folder.')
    } finally {
      setIsWatchFolderScanning(false)
    }
  }

  const loadAppLockSettings = async (): Promise<void> => {
    try {
      const result = await window.api.appCheckPasswordSet()
      if (result.ok) {
        setAppPasswordSet(result.isSet ?? false)
        setAppLockEnabled(result.isEnabled ?? false)
      }
    } catch {
      // Ignore errors
    }
  }

  const handleSetAppPassword = async (): Promise<void> => {
    setAppLockStatus(null)
    setAppLockError(null)

    if (!appLockPassword) {
      setAppLockError('Please enter a password')
      return
    }

    if (appLockPassword.length < 4) {
      setAppLockError('Password must be at least 4 characters')
      return
    }

    if (appLockPassword !== appLockConfirmPassword) {
      setAppLockError('Passwords do not match')
      return
    }

    setIsAppLockSaving(true)
    try {
      const result = await window.api.appSetPassword(appLockPassword)
      if (result.ok) {
        setAppLockStatus('Password set successfully')
        setAppPasswordSet(true)
        setAppLockEnabled(true)
        setAppLockPassword('')
        setAppLockConfirmPassword('')
      } else {
        setAppLockError(result.error ?? 'Failed to set password')
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : 'Failed to set password')
    } finally {
      setIsAppLockSaving(false)
    }
  }

  const handleChangeAppPassword = async (): Promise<void> => {
    setAppLockStatus(null)
    setAppLockError(null)

    if (!appLockCurrentPassword) {
      setAppLockError('Please enter your current password')
      return
    }

    if (!appLockPassword || appLockPassword.length < 4) {
      setAppLockError('New password must be at least 4 characters')
      return
    }

    if (appLockPassword !== appLockConfirmPassword) {
      setAppLockError('New passwords do not match')
      return
    }

    setIsAppLockSaving(true)
    try {
      const result = await window.api.appChangePassword({
        currentPassword: appLockCurrentPassword,
        newPassword: appLockPassword
      })
      if (result.ok) {
        setAppLockStatus('Password changed successfully')
        setAppLockCurrentPassword('')
        setAppLockPassword('')
        setAppLockConfirmPassword('')
      } else {
        setAppLockError(result.error ?? 'Failed to change password')
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setIsAppLockSaving(false)
    }
  }

  const handleRemoveAppPassword = async (): Promise<void> => {
    setAppLockStatus(null)
    setAppLockError(null)

    if (!appLockCurrentPassword) {
      setAppLockError('Please enter your current password')
      return
    }

    setIsAppLockSaving(true)
    try {
      const result = await window.api.appRemovePassword(appLockCurrentPassword)
      if (result.ok) {
        setAppLockStatus('Password removed')
        setAppPasswordSet(false)
        setAppLockEnabled(false)
        setAppLockCurrentPassword('')
        setAppLockPassword('')
        setAppLockConfirmPassword('')
      } else {
        setAppLockError(result.error ?? 'Failed to remove password')
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : 'Failed to remove password')
    } finally {
      setIsAppLockSaving(false)
    }
  }

  const handleToggleAppLock = async (enabled: boolean): Promise<void> => {
    try {
      const result = await window.api.appToggleLock(enabled)
      if (result.ok) {
        setAppLockEnabled(enabled)
        setAppLockStatus(enabled ? 'App lock enabled' : 'App lock disabled')
      } else {
        setAppLockError(result.error ?? 'Failed to toggle app lock')
      }
    } catch (err) {
      setAppLockError(err instanceof Error ? err.message : 'Failed to toggle app lock')
    }
  }

  useEffect(() => {
    void loadBinaries()
    void loadLlmSettings()
    void loadAuthSessions()
    void loadDownloadSettings()
    void loadUiSettings()
    void loadPrivacySettings()
    void loadWatchFolderSettings()
    void loadAppLockSettings()
  }, [])

  useEffect(() => {
    if (!privacyDraft?.hiddenFolderEnabled) {
      setPrivacyPin('')
      setPrivacyPinConfirm('')
      setPrivacyPinStatus(null)
      setPrivacyPinError(null)
    }
  }, [privacyDraft?.hiddenFolderEnabled])

  const activeSession = authSessions.find((session) => session.isActive) ?? null
  const activeSessionCount = authSessions.filter((session) => session.isActive).length

  return (
    <div className="grid gap-6">
      <section ref={appearanceRef} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Settings overview</h3>
        <p className="mt-2 text-sm text-slate-500">
          Configure how Drapp downloads, processes, and classifies your media.
        </p>
      </section>

      <section ref={downloadRef} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Appearance</h3>
            <p className="mt-2 text-sm text-slate-500">Switch between light and dark themes.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveUiSettings()}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            disabled={isUiSaving || !uiSettings}
          >
            {isUiSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {(['light', 'dark'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setUiTheme(mode)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                uiTheme === mode ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        {uiStatus ? <p className="mt-3 text-sm text-emerald-600">{uiStatus}</p> : null}
        {uiError ? <p className="mt-2 text-sm text-rose-600">{uiError}</p> : null}
      </section>

      <section ref={llmRef} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Watch folder</h3>
            <p className="mt-2 text-sm text-slate-500">
              Drop URL lists in a folder to auto-queue downloads.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              void handleUpdateWatchFolder({ enabled: !(watchFolder?.enabled ?? false) })
            }
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              watchFolder?.enabled ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600'
            }`}
            disabled={isWatchFolderSaving || !watchFolder}
          >
            {watchFolder?.enabled ? 'Enabled' : 'Enable'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {watchFolder?.path ?? 'No folder selected'}
          </div>
          <button
            type="button"
            onClick={() => void handleSelectWatchFolder()}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
            disabled={isWatchFolderSelecting}
          >
            {isWatchFolderSelecting ? 'Selecting...' : 'Choose folder'}
          </button>
          <button
            type="button"
            onClick={() => void handleScanWatchFolder()}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
            disabled={isWatchFolderScanning || !watchFolder?.enabled}
          >
            {isWatchFolderScanning ? 'Scanning...' : 'Scan now'}
          </button>
        </div>
        {watchFolderStatus ? <p className="mt-3 text-sm text-emerald-600">{watchFolderStatus}</p> : null}
        {watchFolderError ? <p className="mt-2 text-sm text-rose-600">{watchFolderError}</p> : null}
      </section>

      <section ref={authRef} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Download controls</h3>
            <p className="mt-2 text-sm text-slate-500">
              Tweak proxy routing, rate limiting, and duplicate detection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSaveDownloadSettings()}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            disabled={isDownloadSaving || !downloadSettings}
          >
            {isDownloadSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Proxy URL
              <input
                type="text"
                value={downloadProxy}
                onChange={(event) => setDownloadProxy(event.target.value)}
                placeholder="http://user:pass@host:port"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Bandwidth limit
              <input
                type="text"
                value={downloadRateLimit}
                onChange={(event) => setDownloadRateLimit(event.target.value)}
                placeholder="2M or 500K"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Delay between downloads (ms)
              <input
                type="number"
                min={0}
                value={downloadRateLimitMs}
                onChange={(event) => setDownloadRateLimitMs(event.target.value)}
                placeholder="0"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Duplicate detection
              <button
                type="button"
                onClick={() => setDownloadDedupeEnabled((value) => !value)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                  downloadDedupeEnabled ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600'
                }`}
              >
                {downloadDedupeEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Leave proxy or bandwidth blank to disable. Delay applies between completed downloads.
          </p>
        </div>
        {downloadStatus ? <p className="mt-3 text-sm text-emerald-600">{downloadStatus}</p> : null}
        {downloadError ? <p className="mt-2 text-sm text-rose-600">{downloadError}</p> : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {settings.map((section) => (
          <div key={section.title} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900">{section.title}</h4>
            <p className="mt-2 text-sm text-slate-500">{section.description}</p>
            <button
              type="button"
              onClick={() => {
                if (section.title === 'General') {
                  handleConfigure(appearanceRef)
                } else if (section.title === 'Downloads') {
                  handleConfigure(downloadRef)
                } else if (section.title === 'AI + Tagging') {
                  handleConfigure(llmRef)
                } else if (section.title === 'Authentication') {
                  handleConfigure(authRef)
                } else if (section.title === 'Privacy') {
                  handleConfigure(privacyRef)
                }
              }}
              className="mt-4 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Configure
            </button>
          </div>
        ))}
      </section>

      <section ref={privacyRef} className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Authentication sessions</h3>
            <p className="mt-2 text-sm text-slate-500">
              Import browser cookies to unlock premium or age-gated downloads.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAuthSessions()}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
            disabled={isAuthLoading}
          >
            {isAuthLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <h4 className="text-sm font-semibold text-slate-800">Import cookies</h4>
            <p className="mt-1 text-xs text-slate-500">
              Supports Netscape cookie exports and JSON cookie dumps.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Platform
              <input
                type="text"
                list="auth-platforms"
                value={authPlatform}
                onChange={(event) => setAuthPlatform(event.target.value)}
                placeholder="youtube"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
            <datalist id="auth-platforms">
              {AUTH_PLATFORMS.map((platform) => (
                <option key={platform} value={platform} />
              ))}
            </datalist>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Account label (optional)
              <input
                type="text"
                value={authAccountName}
                onChange={(event) => setAuthAccountName(event.target.value)}
                placeholder="My account"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Cookie file</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={authCookiePath}
                  readOnly
                  placeholder="No file selected"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => void handleSelectCookieFile()}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                  disabled={isAuthSelecting}
                >
                  {isAuthSelecting ? 'Selecting...' : 'Browse'}
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleImportCookies()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                disabled={isAuthImporting}
              >
                {isAuthImporting ? 'Importing...' : 'Import cookies'}
              </button>
              <button
                type="button"
                onClick={() => setAuthCookiePath('')}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                disabled={!authCookiePath}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <h4 className="text-sm font-semibold text-slate-800">Current session</h4>
            <p className="mt-1 text-xs text-slate-500">
              {activeSession
                ? `${activeSession.platform}${activeSession.accountName ? ` - ${activeSession.accountName}` : ''}`
                : 'No active session'}
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Last used</span>
                <span className="ml-2">{formatDateTime(activeSession?.lastUsedAt)}</span>
              </p>
              <p>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Expires</span>
                <span className="ml-2">{formatDateTime(activeSession?.expiresAt)}</span>
              </p>
              <p>
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Active sessions</span>
                <span className="ml-2">{activeSessionCount}</span>
              </p>
            </div>
          </div>
        </div>

        {authStatus ? <p className="mt-4 text-sm text-emerald-600">{authStatus}</p> : null}
        {authError ? <p className="mt-2 text-sm text-rose-600">{authError}</p> : null}
        {authWarning ? <p className="mt-2 text-sm text-amber-600">{authWarning}</p> : null}

        <div className="mt-5 space-y-3">
          {authSessions.map((session) => (
            <div key={session.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {session.platform}
                    {session.accountName ? ` - ${session.accountName}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Created {formatDateTime(session.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      session.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {session.isActive ? 'active' : 'inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleSetActiveSession(session.id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                    disabled={session.isActive}
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteSession(session.id)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Last used: {formatDateTime(session.lastUsedAt)}</span>
                <span>Expires: {formatDateTime(session.expiresAt)}</span>
              </div>
            </div>
          ))}
          {authSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
              {isAuthLoading ? 'Loading sessions...' : 'No sessions yet. Import cookies to get started.'}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Privacy controls</h3>
            <p className="mt-2 text-sm text-slate-500">
              Decide what gets stored locally and how visible your media remains.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSavePrivacy()}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            disabled={isPrivacySaving || !privacyDraft}
          >
            {isPrivacySaving ? 'Saving...' : 'Save privacy'}
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={privacyDraft?.historyEnabled ?? false}
              onChange={() =>
                setPrivacyDraft((current) =>
                  current ? { ...current, historyEnabled: !current.historyEnabled } : current
                )
              }
              disabled={!privacyDraft}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Save watch history</span>
              <span className="mt-1 block text-xs text-slate-500">
                Track resume position and recent activity.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={privacyDraft?.showThumbnails ?? false}
              onChange={() =>
                setPrivacyDraft((current) =>
                  current ? { ...current, showThumbnails: !current.showThumbnails } : current
                )
              }
              disabled={!privacyDraft}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Show thumbnails</span>
              <span className="mt-1 block text-xs text-slate-500">
                Hide previews when working in shared spaces.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={privacyDraft?.hiddenFolderEnabled ?? false}
              onChange={() =>
                setPrivacyDraft((current) =>
                  current ? { ...current, hiddenFolderEnabled: !current.hiddenFolderEnabled } : current
                )
              }
              disabled={!privacyDraft}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Enable hidden folders</span>
              <span className="mt-1 block text-xs text-slate-500">
                Hide selected folders behind a privacy toggle.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={privacyDraft?.secureDeleteEnabled ?? false}
              onChange={() =>
                setPrivacyDraft((current) =>
                  current ? { ...current, secureDeleteEnabled: !current.secureDeleteEnabled } : current
                )
              }
              disabled={!privacyDraft}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-900">Secure delete</span>
              <span className="mt-1 block text-xs text-slate-500">
                Overwrite files before removing them from disk.
              </span>
            </span>
          </label>
        </div>

        {privacyDraft?.hiddenFolderEnabled ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Privacy PIN</p>
                <p className="mt-1 text-xs text-slate-500">
                  {privacySettings?.pinSet ? 'PIN is set.' : 'No PIN set yet.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleClearPrivacyPin()}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                  disabled={isPrivacyPinClearing}
                >
                  {isPrivacyPinClearing ? 'Clearing...' : 'Clear PIN'}
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="password"
                value={privacyPin}
                onChange={(event) => setPrivacyPin(event.target.value)}
                placeholder="Enter new PIN"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
              <input
                type="password"
                value={privacyPinConfirm}
                onChange={(event) => setPrivacyPinConfirm(event.target.value)}
                placeholder="Confirm PIN"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSetPrivacyPin()}
                className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                disabled={isPrivacyPinSaving}
              >
                {isPrivacyPinSaving ? 'Saving...' : 'Set PIN'}
              </button>
            </div>
            {privacyPinStatus ? <p className="mt-2 text-xs text-emerald-600">{privacyPinStatus}</p> : null}
            {privacyPinError ? <p className="mt-2 text-xs text-rose-600">{privacyPinError}</p> : null}
          </div>
        ) : null}

        {privacyStatus ? <p className="mt-4 text-sm text-emerald-600">{privacyStatus}</p> : null}
        {privacyError ? <p className="mt-2 text-sm text-rose-600">{privacyError}</p> : null}
        {!privacyDraft && !privacyError ? (
          <p className="mt-2 text-sm text-slate-500">Loading privacy settings...</p>
        ) : null}
      </section>

      {/* App Lock Section */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">App Lock</h3>
            <p className="mt-2 text-sm text-slate-500">
              Protect your library with a password on app launch.
            </p>
          </div>
          {appPasswordSet && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={appLockEnabled}
                onChange={(e) => void handleToggleAppLock(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-purple-600"
              />
              <span className="text-sm text-slate-600">Enable lock</span>
            </label>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${appPasswordSet ? 'bg-emerald-100' : 'bg-slate-200'}`}>
              <svg className={`h-5 w-5 ${appPasswordSet ? 'text-emerald-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {appPasswordSet ? 'Password is set' : 'No password set'}
              </p>
              <p className="text-xs text-slate-500">
                {appPasswordSet
                  ? appLockEnabled
                    ? 'App will ask for password on launch'
                    : 'Lock is disabled, password stored'
                  : 'Set a password to enable app lock'}
              </p>
            </div>
          </div>

          {!appPasswordSet ? (
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="password"
                  value={appLockPassword}
                  onChange={(e) => setAppLockPassword(e.target.value)}
                  placeholder="Enter password (min 4 chars)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                />
                <input
                  type="password"
                  value={appLockConfirmPassword}
                  onChange={(e) => setAppLockConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void handleSetAppPassword()}
                  disabled={isAppLockSaving}
                  className="rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAppLockSaving ? 'Setting...' : 'Set Password'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="mb-3 text-xs font-medium text-slate-600">Change or remove password</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="password"
                  value={appLockCurrentPassword}
                  onChange={(e) => setAppLockCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                />
                <input
                  type="password"
                  value={appLockPassword}
                  onChange={(e) => setAppLockPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                />
                <input
                  type="password"
                  value={appLockConfirmPassword}
                  onChange={(e) => setAppLockConfirmPassword(e.target.value)}
                  placeholder="Confirm new"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleChangeAppPassword()}
                  disabled={isAppLockSaving}
                  className="rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isAppLockSaving ? 'Saving...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveAppPassword()}
                  disabled={isAppLockSaving}
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  Remove Password
                </button>
              </div>
            </div>
          )}

          {appLockStatus ? <p className="mt-3 text-xs text-emerald-600">{appLockStatus}</p> : null}
          {appLockError ? <p className="mt-3 text-xs text-rose-600">{appLockError}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">LLM provider</h3>
            <p className="mt-2 text-sm text-slate-500">
              Configure OpenRouter or a local LM Studio endpoint for AI features.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleTestConnection()}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
              disabled={isLlmTesting}
            >
              {isLlmTesting ? 'Testing...' : 'Test connection'}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveLlmSettings()}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
              disabled={isLlmSaving}
            >
              {isLlmSaving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Provider
            <select
              value={llmProvider}
              onChange={(event) => setLlmProvider(event.target.value as LlmProvider)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            >
              <option value="lmstudio">LM Studio (local)</option>
              <option value="openrouter">OpenRouter (cloud)</option>
            </select>
          </label>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
            <p className="mt-2 text-sm text-slate-600">
              {llmSettings
                ? `${llmProvider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'} selected`
                : 'Loading settings...'}
            </p>
            {llmProvider === 'openrouter' && llmSettings ? (
              <p className="mt-2 text-xs text-slate-500">
                API key {llmSettings.openrouter.apiKeySet ? 'stored' : 'not set'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <h4 className="text-sm font-semibold text-slate-800">OpenRouter</h4>
            <p className="mt-1 text-xs text-slate-500">
              Cloud models. Your key is stored locally.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Default model
              <input
                type="text"
                value={openrouterModel}
                onChange={(event) => setOpenrouterModel(event.target.value)}
                placeholder="anthropic/claude-3.5-sonnet"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              API key
              <input
                type="password"
                value={openrouterApiKey}
                onChange={(event) => setOpenrouterApiKey(event.target.value)}
                placeholder={llmSettings?.openrouter.apiKeySet ? 'Key stored (enter to replace)' : 'Enter key'}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
            <h4 className="text-sm font-semibold text-slate-800">LM Studio</h4>
            <p className="mt-1 text-xs text-slate-500">
              Local models running on your machine.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Base URL
              <input
                type="text"
                value={lmstudioBaseUrl}
                onChange={(event) => setLmstudioBaseUrl(event.target.value)}
                placeholder="http://localhost:1234/v1"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Model name
              <input
                type="text"
                value={lmstudioModel}
                onChange={(event) => setLmstudioModel(event.target.value)}
                placeholder="auto"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
              />
            </label>
          </div>
        </div>

        {llmStatus ? <p className="mt-4 text-sm text-emerald-600">{llmStatus}</p> : null}
        {llmError ? <p className="mt-2 text-sm text-rose-600">{llmError}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Binary health check</h3>
            <p className="mt-2 text-sm text-slate-500">
              Confirms bundled tools are present and executable.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleOpenBinariesFolder()}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              Open folder
            </button>
            <button
              type="button"
              onClick={() => void handleRepairBinaries()}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
              disabled={isRepairing}
            >
              {isRepairing ? 'Repairing...' : 'Repair'}
            </button>
            <button
              type="button"
              onClick={() => void loadBinaries()}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Refresh'}
            </button>
          </div>
        </div>
        {binaryStatus ? <p className="mt-4 text-sm text-emerald-600">{binaryStatus}</p> : null}
        {binaryError ? <p className="mt-2 text-sm text-rose-600">{binaryError}</p> : null}
        <div className="mt-4 space-y-3">
          {binaries.map((binary) => (
            <div key={binary.name} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{binary.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{binary.path}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    binary.status === 'ok'
                      ? 'bg-emerald-100 text-emerald-700'
                      : binary.status === 'missing'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {binary.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{binary.detail}</p>
            </div>
          ))}
          {binaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
              No data yet. Refresh to check binaries.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
