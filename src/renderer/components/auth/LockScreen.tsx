import { useState, useEffect, useRef } from 'react'

type LockScreenProps = {
  onUnlock: () => void
  isSetup?: boolean
  onSetupComplete?: (password: string) => void
}

export default function LockScreen({ onUnlock, isSetup, onSetupComplete }: LockScreenProps): JSX.Element {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await window.api.appVerifyPassword(password)
      if (result.ok && result.valid) {
        onUnlock()
      } else {
        setError('Incorrect password')
        setPassword('')
      }
    } catch (err) {
      setError('Failed to verify password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetup = async () => {
    if (!password) {
      setError('Please enter a password')
      return
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await window.api.appSetPassword(password)
      if (result.ok) {
        onSetupComplete?.(password)
        onUnlock()
      } else {
        setError(result.error ?? 'Failed to set password')
      }
    } catch (err) {
      setError('Failed to set password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isSetup) {
        void handleSetup()
      } else {
        void handleUnlock()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm px-6">
        {/* Logo/Icon */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Drapp</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isSetup ? 'Set up a password to protect your library' : 'Enter your password to continue'}
          </p>
        </div>

        {/* Password Form */}
        <div className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isSetup ? 'Create password' : 'Enter password'}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 pr-12 text-white placeholder-slate-500 backdrop-blur focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              autoComplete="off"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {isSetup && (
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 backdrop-blur focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              autoComplete="off"
              disabled={isLoading}
            />
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={isSetup ? handleSetup : handleUnlock}
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 font-semibold text-white transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isSetup ? 'Setting up...' : 'Unlocking...'}
              </span>
            ) : (
              isSetup ? 'Set Password' : 'Unlock'
            )}
          </button>
        </div>

        {/* Skip setup option */}
        {isSetup && (
          <button
            type="button"
            onClick={onUnlock}
            className="mt-4 w-full text-center text-sm text-slate-500 transition hover:text-slate-300"
          >
            Skip for now
          </button>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">
          Your password is stored securely on this device
        </p>
      </div>
    </div>
  )
}
