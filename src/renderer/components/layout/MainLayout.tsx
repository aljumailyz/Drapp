import type { ReactNode } from 'react'

type MainLayoutProps = {
  sidebar: ReactNode
  children: ReactNode
}

export default function MainLayout({ sidebar, children }: MainLayoutProps): JSX.Element {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/3 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute left-10 top-1/2 h-40 w-64 -translate-y-1/2 rounded-[40%] bg-emerald-100/70 blur-2xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <div className="h-full">{sidebar}</div>
        <main className="flex h-full flex-col gap-8 rounded-[32px] border border-slate-200/70 bg-white/80 p-8 shadow-xl shadow-slate-200/40 backdrop-blur">
          {children}
        </main>
      </div>
    </div>
  )
}
