import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCampaigns } from '@/actions/campaigns'
import { PipelineBoard } from '@/components/dashboard/PipelineBoard'

export default async function DealsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campaigns = await getCampaigns()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drag-free Kanban view of campaigns by status.
        </p>
      </div>

      <PipelineBoard campaigns={campaigns} />
    </div>
  )
}
