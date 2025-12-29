import type { ReactNode } from 'react'

export type NavItem = {
  id: string
  label: string
  icon: ReactNode
  hint?: string
}

type SidebarProps = {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

export default function Sidebar({ items, activeId, onSelect }: SidebarProps): JSX.Element {
  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-slate-200/70 bg-white/70 px-6 py-8 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Drapp</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Control Studio</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`group flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                active
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`text-lg ${active ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              </span>
              {item.hint ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {item.hint}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Focus mode</p>
        <p className="mt-2">Queue tasks, schedule AI passes, and keep your library tidy.</p>
        <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-400">Shortcuts: Cmd/Ctrl + 1-6</p>
      </div>
    </aside>
  )
}
