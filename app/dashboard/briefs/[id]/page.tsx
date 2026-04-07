import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBriefById } from '@/actions/briefs'
import { getOrgContext } from '@/lib/rbac'
import { BriefDetailClient } from './client'

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const brief = await getBriefById(id)
  if (!brief) notFound()

  // Get org members for task assignment
  const ctx = await getOrgContext(user.id)
  let orgMembers: { user_id: string; profiles: { full_name: string } }[] = []
  if (ctx?.orgId) {
    const { data } = await supabase
      .from('organization_members')
      .select('user_id, profiles(full_name)')
      .eq('organization_id', ctx.orgId)
      .eq('is_active', true)

    orgMembers = (data as unknown as typeof orgMembers) ?? []
  }

  return <BriefDetailClient brief={brief} orgMembers={orgMembers} />
}
