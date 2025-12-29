import type { ReactNode } from 'react'

type HeaderProps = {
  title: string
  subtitle: string
  status?: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
}

export default function Header({ title, subtitle, status, primaryAction }: HeaderProps): JSX.Element {
  return (
    <header className="flex flex-col gap-6 border-b border-slate-200/70 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{subtitle}</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {status ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {status}
            </span>
          ) : null}
          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5"
            >
              {primaryAction.icon ? <span className="text-base">{primaryAction.icon}</span> : null}
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
