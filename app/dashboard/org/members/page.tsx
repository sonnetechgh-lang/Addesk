import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrgMembersList } from '@/components/dashboard/OrgMembersList'

type MemberData = {
  id: string
  role: string
  is_active: boolean
  invited_email: string | null
  invited_at: string | null
  accepted_at: string | null
  created_at: string
  profiles: {
    full_name: string
    username: string
    email: string
    profile_photo_url: string | null
  } | null
}

export default async function OrgMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('current_organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.current_organization_id) redirect('/dashboard')

  const orgId = profile.current_organization_id

  // Get current user's role
  const { data: currentMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single()

  // Get all members with profile info
  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      is_active,
      invited_email,
      invited_at,
      accepted_at,
      created_at,
      profiles (
        full_name,
        username,
        email,
        profile_photo_url
      )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true })

  // Get org name for display
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  const isAdmin = ['owner', 'admin'].includes(currentMember?.role ?? '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Team Members</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage the members of {org?.name ?? 'your organization'}.
        </p>
      </div>

      <OrgMembersList
        members={(members as unknown as MemberData[]) ?? []}
        orgId={orgId}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  )
}
