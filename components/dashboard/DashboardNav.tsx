'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarDays,
  Clapperboard,
  ClipboardCheck,
  ClipboardList,
  Kanban,
  LayoutDashboard,
  Menu,
  Package as PackageIcon,
  Radio,
  Receipt,
  Settings,
  ShoppingCart,
  Target,
  Users,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { OrganizationType } from "@/types/roles"
import { getLabel } from "@/types/roles"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

function getNavItems(orgType: OrganizationType): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard",           label: "Overview",                            icon: LayoutDashboard },
    { href: "/dashboard/packages",  label: getLabel("packages", orgType),         icon: PackageIcon },
    { href: "/dashboard/orders",    label: getLabel("orders", orgType),           icon: ShoppingCart },
  ]

  // Org management — only for non-solo-influencer orgs
  if (orgType !== "influencer") {
    items.push({ href: "/dashboard/clients",    label: "Clients",       icon: Users })
    items.push({ href: "/dashboard/campaigns",  label: "Campaigns",     icon: Target })
    items.push({ href: "/dashboard/deals",      label: "Pipeline",      icon: Kanban })
    items.push({ href: "/dashboard/briefs",     label: "Briefs",        icon: ClipboardList })
    items.push({ href: "/dashboard/production", label: "Production",    icon: Clapperboard })
    items.push({ href: "/dashboard/approvals",  label: "Approvals",     icon: ClipboardCheck })
    items.push({ href: "/dashboard/schedule",   label: "Schedule",      icon: CalendarDays })
    items.push({ href: "/dashboard/channels",   label: "Channels",      icon: Radio })
    items.push({ href: "/dashboard/inventory",  label: "Inventory",     icon: Boxes })
    items.push({ href: "/dashboard/billing",    label: "Billing",       icon: Receipt })
    items.push({ href: "/dashboard/reports",    label: "Reports",       icon: BarChart3 })
    items.push({ href: "/dashboard/org",        label: "Organization",  icon: Building2 })
  }

  items.push({ href: "/dashboard/settings",  label: "Settings",  icon: Settings })

  return items
}

export function DashboardNav({ orgType = "influencer" }: { orgType?: OrganizationType }) {
  const pathname = usePathname()
  const navItems = getNavItems(orgType)

  return (
    <nav className="space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-success focus-visible:ring-offset-2",
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
          </Link>
        )
      })}
    </nav>
  )
}

/** Fixed bottom tab bar for mobile screens */
export function MobileNav({ orgType = "influencer" }: { orgType?: OrganizationType }) {
  const pathname = usePathname()
  const navItems = getNavItems(orgType)
  const [moreOpen, setMoreOpen] = useState(false)

  // Show max 4 items in the bottom bar; rest go into "More" sheet
  const MAX_VISIBLE = 4
  const visibleItems = navItems.length > MAX_VISIBLE + 1 ? navItems.slice(0, MAX_VISIBLE) : navItems
  const overflowItems = navItems.length > MAX_VISIBLE + 1 ? navItems.slice(MAX_VISIBLE) : []

  return (
    <>
      {/* Overflow "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-60 lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl safe-area-bottom animate-slide-in-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-sm font-bold text-text-primary">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-success"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-text-secondary" />
              </button>
            </div>
            <nav className="p-3 grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
              {overflowItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-success",
                      isActive
                        ? "bg-brand-success/10 text-brand-success"
                        : "text-text-secondary hover:bg-surface-light"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-semibold leading-none text-center">{label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-stretch justify-around h-16 px-2">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-success focus-visible:ring-inset",
                  isActive
                    ? "text-brand-success"
                    : "text-text-tertiary active:text-text-secondary"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-xl transition-all",
                    isActive ? "bg-brand-success/10" : ""
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className={cn(
                  "text-[10px] font-semibold leading-none",
                  isActive ? "text-brand-success" : "text-text-tertiary"
                )}>
                  {label}
                </span>
              </Link>
            )
          })}
          {overflowItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-success focus-visible:ring-inset",
                "text-text-tertiary active:text-text-secondary"
              )}
              aria-label="More navigation items"
            >
              <div className="flex items-center justify-center h-7 w-7 rounded-xl">
                <Menu className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] font-semibold leading-none text-text-tertiary">More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
