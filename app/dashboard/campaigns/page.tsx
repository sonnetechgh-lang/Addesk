import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Target } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCampaigns } from '@/actions/campaigns'
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
} from '@/types/campaigns'
import type { CampaignStatus } from '@/types/campaigns'

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const campaigns = await getCampaigns(status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Campaigns</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage advertising campaigns across all channels.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {['all', 'draft', 'active', 'paused', 'completed', 'cancelled'].map(
          (s) => {
            const isActive = (status ?? 'all') === s
            return (
              <Link
                key={s}
                href={s === 'all' ? '/dashboard/campaigns' : `/dashboard/campaigns?status=${s}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {s === 'all' ? 'All' : CAMPAIGN_STATUS_LABELS[s as CampaignStatus]}
              </Link>
            )
          }
        )}
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <Target className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {status && status !== 'all' ? 'No campaigns with this status' : 'No campaigns yet'}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create a campaign to organize your advertising line items.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(campaigns as { id: string; name: string; status: string; start_date: string | null; end_date: string | null; total_budget: number | null; clients: { company_name: string }; line_items: { count: number }[] }[]).map((campaign) => {
            const lineItemCount = campaign.line_items?.[0]?.count ?? 0
            return (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                    {campaign.name}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      CAMPAIGN_STATUS_COLORS[campaign.status as CampaignStatus] ??
                      'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {CAMPAIGN_STATUS_LABELS[campaign.status as CampaignStatus] ?? campaign.status}
                  </span>
                </div>

                <p className="text-sm text-zinc-500 mb-3">
                  {campaign.clients?.company_name}
                </p>

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    {campaign.start_date && campaign.end_date
                      ? `${campaign.start_date} — ${campaign.end_date}`
                      : campaign.start_date
                      ? `From ${campaign.start_date}`
                      : 'No dates set'}
                  </span>
                  <span>{lineItemCount} item{lineItemCount !== 1 ? 's' : ''}</span>
                </div>

                {campaign.total_budget && (
                  <p className="mt-2 text-sm font-bold text-zinc-900">
                    GHS {(campaign.total_budget / 100).toFixed(2)}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
