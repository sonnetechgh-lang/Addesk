import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaignById } from '@/actions/campaigns'
import { getChannels } from '@/actions/channels'
import { getOrgContext } from '@/lib/rbac'
import { CampaignDetailClient } from './client'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campaign = await getCampaignById(id)
  if (!campaign) notFound()

  const channels = await getChannels()

  // Get org members for assignment
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

  return (
    <CampaignDetailClient
      campaign={campaign}
      channels={channels}
      orgMembers={orgMembers}
    />
  )
}
