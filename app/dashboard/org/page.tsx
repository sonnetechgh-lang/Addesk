import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Users, Settings, ExternalLink } from 'lucide-react'

export default async function OrgDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.current_organization_id) {
    redirect('/dashboard')
  }

  const orgId = profile.current_organization_id

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  const { count: memberCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true)

  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  if (!org) redirect('/dashboard')

  const orgTypeLabels: Record<string, string> = {
    influencer: 'Creator / Influencer',
    media_house: 'Media House',
    agency: 'Agency',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Organization</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your organization settings and team.</p>
        </div>
      </div>

      {/* Org Info Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {org.logo_url ? (
            <Image
              src={org.logo_url}
              alt={org.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-xl object-cover border border-zinc-200"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="h-7 w-7" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-zinc-900">{org.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {orgTypeLabels[org.type] || org.type} &middot; /{org.slug}
            </p>
            {org.website && (
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-sm text-emerald-600 hover:text-emerald-700"
              >
                {org.website.replace(/^https?:\/\//, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 capitalize">
              {currentMember?.role || 'member'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/org/members"
          className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">Team Members</h3>
              <p className="text-sm text-zinc-500">{memberCount ?? 0} active member{memberCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Invite team members, assign roles, and manage access.</p>
        </Link>

        {['owner', 'admin'].includes(currentMember?.role ?? '') && (
          <Link
            href="/dashboard/org/settings"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Settings</h3>
                <p className="text-sm text-zinc-500">Organization details & branding</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500">Update name, logo, slug, and other settings.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
