import Link from "next/link"
import { DEMO_PROFILE } from "@/lib/demo-data"
import { DemoNav, DemoMobileNav, DemoNotificationBell } from "@/components/demo/DemoNav"

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const initials = DEMO_PROFILE.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-surface-light font-sans text-text-primary selection:bg-success/30">

      {/* ── Demo banner ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-secondary text-white text-center text-[13px] font-semibold py-2 px-4 flex items-center justify-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          Demo Mode
        </span>
        <span className="text-white/60 hidden sm:inline">—</span>
        <span className="text-white/60 hidden sm:inline">This is sample data. No real account required.</span>
        <Link href="/signup" className="ml-3 px-3 py-1 rounded-full bg-brand-success text-white text-[12px] font-bold hover:bg-brand-success-light transition-colors">
          Sign up free
        </Link>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-65 bg-surface-card shrink-0 flex-col h-screen sticky top-0 border-r border-border shadow-elevation-low pt-10">
        {/* Logo */}
        <div className="flex items-center h-20 px-6 shrink-0">
          <Link
            href="/demo"
            className="flex items-center gap-3 font-bold text-xl tracking-tight text-text-primary group"
          >
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 items-center justify-center group-hover:scale-105 transition-all">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
              <div className="w-2.5 h-2.5 rounded-full bg-brand-secondary" />
            </div>
            <span>AdDesk</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-widest text-text-tertiary select-none">
            Menu
          </p>
          <DemoNav />
        </div>

        {/* User profile */}
        <div className="shrink-0 p-4 bg-surface-card mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-card-secondary border border-border mb-3 hover:bg-surface-light transition-colors cursor-pointer shadow-elevation-low">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-brand-success text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-text-primary truncate leading-tight">
                {DEMO_PROFILE.full_name}
              </p>
              <p className="text-[12px] text-text-secondary truncate mt-0.5 font-medium">
                @{DEMO_PROFILE.username}
              </p>
            </div>
          </div>

          <Link
            href="/signup"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-card px-4 py-2.5 text-[13px] text-text-secondary font-medium hover:text-text-primary hover:bg-surface-light hover:border-border-strong transition-all"
          >
            Sign up for real
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex flex-1 flex-col min-h-screen lg:h-screen lg:overflow-y-auto relative w-full lg:w-[calc(100%-260px)] pt-10">

        {/* Mobile top bar */}
        <div className="sticky top-10 z-30 h-16 flex items-center justify-between px-5 bg-surface-overlay backdrop-blur-xl border-b border-border shrink-0 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-2 gap-0.5 w-5 h-5 items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-brand-primary" />
              <div className="w-2 h-2 rounded-full bg-brand-secondary" />
              <div className="w-2 h-2 rounded-full bg-brand-secondary" />
              <div className="w-2 h-2 rounded-full bg-brand-secondary" />
            </div>
            <span className="font-bold text-[16px] text-slate-900 tracking-tight">AdDesk</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#edf5f1] flex items-center justify-center text-[#0f6443] text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </div>

        {/* Desktop Header area */}
        <div className="hidden lg:flex h-25 items-center justify-between px-10 shrink-0 relative w-full">
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-400 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <span className="flex-1">Search task...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-500 border border-slate-200">
                ⌘ F
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <DemoNotificationBell />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-5 lg:px-10 pb-24 lg:pb-12 relative z-10 w-full overflow-x-hidden">
          <div className="max-w-6xl w-full mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <DemoMobileNav />
    </div>
  )
}
