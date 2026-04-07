import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClientsForSelect } from '@/actions/clients'
import { getOrgContext } from '@/lib/rbac'
import NewCampaignClient from './client'

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clients = await getClientsForSelect()

  // Get org members for the assigned_to dropdown
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

  return <NewCampaignClient clients={clients} orgMembers={orgMembers} />
}
