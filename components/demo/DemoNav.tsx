'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package as PackageIcon,
  Settings,
  ShoppingCart,
  LogOut,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_PROFILE, DEMO_NOTIFICATIONS } from "@/lib/demo-data"

const navItems = [
  { href: "/demo",           label: "Overview",  icon: LayoutDashboard },
  { href: "/demo/packages",  label: "Packages",  icon: PackageIcon },
  { href: "/demo/orders",    label: "Orders",    icon: ShoppingCart },
  { href: "/demo/settings",  label: "Settings",  icon: Settings },
]

export function DemoNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/demo"
            ? pathname === "/demo"
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-success/10 text-brand-success"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-light"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
                isActive
                  ? "bg-transparent text-brand-success"
                  : "bg-transparent text-text-tertiary group-hover:text-text-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span>{label}</span>
            {isActive && (
              <div className="ml-auto h-5 flex items-center justify-center -mr-1">
                <div className="px-2 py-0.5 rounded-full bg-[#0f6443] text-white text-[10px] font-bold">12+</div>
              </div>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function DemoMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-stretch justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/demo"
              ? pathname === "/demo"
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors",
                isActive
                  ? "text-[#0f6443]"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-xl transition-all",
                  isActive ? "bg-[#edf5f1]" : ""
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-none",
                isActive ? "text-[#0f6443]" : "text-slate-400"
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function DemoNotificationBell() {
  const unreadCount = DEMO_NOTIFICATIONS.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-card border border-border text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all cursor-default">
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface-card">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

export function DemoShareLink() {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 overflow-hidden">
        <span className="font-mono text-sm font-medium truncate text-white/90 italic">
          addesk.vercel.app/book/{DEMO_PROFILE.username}
        </span>
      </div>
      <div className="grid gap-3 mt-6">
        <button
          className="flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-sm font-bold active:scale-[0.98] cursor-default"
        >
          Copy Your Link
        </button>
      </div>
    </div>
  )
}
