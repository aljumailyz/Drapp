import { useEffect, useMemo, useState } from 'react'
import Header from './components/layout/Header'
import MainLayout from './components/layout/MainLayout'
import Sidebar, { type NavItem } from './components/layout/Sidebar'
import LockScreen from './components/auth/LockScreen'
import { useSmartTaggingInit } from './hooks/useSmartTagging'
import Archive from './pages/Archive'
import Downloads from './pages/Downloads'
import Library from './pages/Library'
import Processing from './pages/Processing'
import Settings from './pages/Settings'
import Watch from './pages/Watch'

type PageId = 'watch' | 'library' | 'downloads' | 'processing' | 'archive' | 'settings'

const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
  watch: {
    title: 'Watch',
    subtitle: 'Video player'
  },
  library: {
    title: 'Library overview',
    subtitle: 'Media intelligence'
  },
  downloads: {
    title: 'Downloads command',
    subtitle: 'Acquire + queue'
  },
  processing: {
    title: 'Processing studio',
    subtitle: 'Transcode + AI'
  },
  archive: {
    title: 'Archive vault',
    subtitle: 'AV1 encoding'
  },
  settings: {
    title: 'System settings',
    subtitle: 'Preferences'
  }
}

export default function App(): JSX.Element {
  const [status, setStatus] = useState('connecting')
  const [activePage, setActivePage] = useState<PageId>('watch')
  const [isLocked, setIsLocked] = useState(true)
  const [lockCheckComplete, setLockCheckComplete] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useSmartTaggingInit()

  // Check if app lock is enabled on startup
  useEffect(() => {
    let active = true

    window.api
      .appCheckPasswordSet()
      .then((result) => {
        if (active) {
          if (result.ok) {
            // If password is set and enabled, stay locked
            // If no password set, unlock and optionally show setup
            if (result.isSet && result.isEnabled) {
              setIsLocked(true)
            } else if (!result.isSet) {
              // First time - could show setup prompt
              setIsLocked(false)
              // Uncomment to show setup on first launch:
              // setShowSetup(true)
            } else {
              setIsLocked(false)
            }
          } else {
            // On error, unlock to prevent lockout
            setIsLocked(false)
          }
          setLockCheckComplete(true)
        }
      })
      .catch(() => {
        if (active) {
          setIsLocked(false)
          setLockCheckComplete(true)
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    window.api
      .ping()
      .then((response) => {
        if (active) {
          setStatus(response === 'pong' ? 'online' : 'degraded')
        }
      })
      .catch(() => {
        if (active) {
          setStatus('offline')
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleError = (event: ErrorEvent): void => {
      void window.api.reportError({
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        source: event.filename
      })
    }

    const handleRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason
      void window.api.reportError({
        message: reason instanceof Error ? reason.message : 'Unhandled promise rejection',
        stack: reason instanceof Error ? reason.stack : undefined,
        source: 'unhandledrejection'
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  useEffect(() => {
    let active = true
    window.api
      .uiGetSettings()
      .then((result) => {
        if (!active || !result.ok || !result.settings) {
          return
        }
        const theme = result.settings.theme === 'dark' ? 'dark' : 'light'
        document.documentElement.classList.toggle('theme-dark', theme === 'dark')
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent): void => {
      if (!event.metaKey && !event.ctrlKey) {
        return
      }
      const key = event.key
      const nextPage: PageId | null =
        key === '1'
          ? 'watch'
          : key === '2'
            ? 'library'
            : key === '3'
              ? 'downloads'
              : key === '4'
                ? 'processing'
                : key === '5'
                  ? 'archive'
                  : key === '6'
                    ? 'settings'
                    : null
      if (!nextPage) {
        return
      }
      event.preventDefault()
      setActivePage(nextPage)
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: 'watch', label: 'Watch', icon: '▶', hint: 'play' },
      { id: 'library', label: 'Library', icon: 'LIB', hint: 'scan' },
      { id: 'downloads', label: 'Downloads', icon: 'DL', hint: 'queue' },
      { id: 'processing', label: 'Processing', icon: 'AI', hint: 'jobs' },
      { id: 'archive', label: 'Archive', icon: 'AV1', hint: 'vault' },
      { id: 'settings', label: 'Settings', icon: 'SET' }
    ],
    []
  )

  const current = pageTitles[activePage]

  // Show nothing while checking lock status
  if (!lockCheckComplete) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    )
  }

  // Show lock screen if locked
  if (isLocked) {
    return (
      <LockScreen
        onUnlock={() => setIsLocked(false)}
        isSetup={showSetup}
        onSetupComplete={() => setShowSetup(false)}
      />
    )
  }

  return (
    <MainLayout
      sidebar={<Sidebar items={navItems} activeId={activePage} onSelect={(id) => setActivePage(id as PageId)} />}
    >
      <Header
        title={current.title}
        subtitle={current.subtitle}
        status={status}
        primaryAction={{
          label: activePage === 'downloads' ? 'New download' : 'Run action',
          onClick: () => {}
        }}
      />
      {activePage === 'watch' ? <Watch /> : null}
      {activePage === 'library' ? <Library /> : null}
      {activePage === 'downloads' ? <Downloads /> : null}
      {activePage === 'processing' ? <Processing /> : null}
      {activePage === 'archive' ? <Archive /> : null}
      {activePage === 'settings' ? <Settings /> : null}
    </MainLayout>
  )
}
