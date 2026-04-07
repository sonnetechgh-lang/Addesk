import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgSettingsForm } from '@/components/dashboard/OrgSettingsForm'

export default async function OrgSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.current_organization_id) redirect('/dashboard')

  // Verify user is admin/owner
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', profile.current_organization_id)
    .eq('user_id', user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    redirect('/dashboard/org')
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.current_organization_id)
    .single()

  if (!org) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Manage your organization details and branding.</p>
      </div>

      <OrgSettingsForm organization={org} />
    </div>
  )
}
