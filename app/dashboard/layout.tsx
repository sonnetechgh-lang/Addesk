import Link from "next/link"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav, MobileNav } from "@/components/dashboard/DashboardNav"
import { NotificationBell } from "@/components/dashboard/NotificationBell"
import { LogoMark } from "@/components/ui/logo"
import { PushPermissionPrompt } from "@/components/dashboard/PushPermissionPrompt"
import { OrgSwitcher } from "@/components/dashboard/OrgSwitcher"
import { CURRENT_TERMS_VERSION } from "@/lib/constants"
import { redirect } from "next/navigation"
import type { OrganizationType } from "@/types/roles"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single()

  // Check if influencer has accepted the latest terms
  const { data: consent } = await supabase
    .from("consent_logs")
    .select("terms_version")
    .eq("user_id", user?.id)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .single()

  if (!consent || consent.terms_version !== CURRENT_TERMS_VERSION) {
    redirect("/accept-terms")
  }

  // Fetch user's organizations for the switcher and nav context
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, slug, type, logo_url)")
    .eq("user_id", user?.id)
    .eq("is_active", true)

  if (!memberships || memberships.length === 0) {
    // If not onboarded or no orgs, send to onboarding
    if (!profile?.is_onboarded) {
      redirect("/onboarding")
    }
    // Logic for users who are onboarded but somehow have no orgs (shouldn't happen with the trigger/backfill)
    // could show a "Create Organization" screen or similar.
  }

  const currentOrgId = profile?.current_organization_id ?? null
  const currentMembership = memberships?.find(
    (m: any) => m.organizations?.id === currentOrgId
  ) || memberships?.[0] // Fallback to first membership if current_organization_id is not set correctly

  const orgType: OrganizationType =
    (currentMembership?.organizations as any)?.type as OrganizationType ?? "influencer"

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U"

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-surface-light font-sans text-text-primary selection:bg-success/30">

      {/* Skip to main content (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-brand-success focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex w-65 bg-surface-card shrink-0 flex-col h-screen sticky top-0 border-r border-border shadow-elevation-low">

        {/* Logo */}
        <div className="flex items-center h-20 px-6 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 font-bold text-xl tracking-tight text-text-primary group"
          >
            <LogoMark className="group-hover:scale-105 transition-all" />
            <span>AdDesk</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          {/* Org Switcher (hidden for solo influencers with 1 org) */}
          {memberships && memberships.length > 0 && (
            <div className="px-1 mb-5">
              <OrgSwitcher
                organizations={memberships as any}
                currentOrgId={currentOrgId}
              />
            </div>
          )}

          <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-widest text-text-tertiary select-none">
            Menu
          </p>
          <DashboardNav orgType={orgType} />
        </div>

        {/* User profile + Logout */}
        <div className="shrink-0 p-4 bg-surface-card mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-card-secondary border border-border mb-3 hover:bg-surface-light transition-colors cursor-pointer shadow-elevation-low">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt={`${profile?.full_name || "User"}'s profile photo`} className="h-10 w-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center text-brand-success text-sm font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-text-primary truncate leading-tight">
                {profile?.full_name || "Creator"}
              </p>
              <p className="text-[12px] text-text-secondary truncate mt-0.5 font-medium">
                @{profile?.username}
              </p>
            </div>
          </div>

          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-card px-4 py-2.5 text-[13px] text-text-secondary font-medium hover:text-text-primary hover:bg-surface-light hover:border-border-strong transition-all">
              <LogOut className="h-4 w-4 text-text-tertiary" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex flex-1 flex-col min-h-screen lg:h-screen lg:overflow-y-auto relative w-full lg:w-[calc(100%-260px)]">
        
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 h-16 flex items-center justify-between px-5 bg-surface-overlay backdrop-blur-xl border-b border-border shrink-0 lg:hidden">
          <div className="flex items-center gap-3">
            <LogoMark size="sm" />
            <span className="font-bold text-[16px] text-slate-900 tracking-tight">AdDesk</span>
          </div>
          
          <div className="flex items-center gap-3">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt={`${profile?.full_name || "User"}'s profile photo`} className="h-8 w-8 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#edf5f1] flex items-center justify-center text-[#0f6443] text-xs font-bold shadow-sm">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Header area */}
        <div className="hidden lg:flex h-25 items-center justify-between px-10 shrink-0 relative w-full">
           {/* Search Placeholder */}
           <div className="flex-1 max-w-md">
             <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-400 shadow-sm opacity-60 cursor-not-allowed" aria-label="Search (coming soon)">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               <span className="flex-1">Search (Coming Soon)</span>
             </div>
           </div>
           
           <div className="flex items-center gap-4 ml-auto">
             <NotificationBell />
           </div>
        </div>

        {/* Page content */}
        <div id="main-content" className="flex-1 p-5 lg:px-10 pb-24 lg:pb-12 relative z-10 w-full overflow-x-hidden">
          <div className="max-w-6xl w-full mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <MobileNav orgType={orgType} />

      <PushPermissionPrompt />
    </div>
  )
}

