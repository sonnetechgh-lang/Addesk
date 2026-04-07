'use client'

import Link from 'next/link'
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
} from '@/types/campaigns'
import type { CampaignStatus } from '@/types/campaigns'

type CampaignCardProps = {
  campaign: {
    id: string
    name: string
    status: string
    total_budget: number | null
    start_date: string | null
    end_date: string | null
    clients?: { company_name: string } | null
    line_items?: { count: number }[]
  }
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const lineItemCount = campaign.line_items?.[0]?.count ?? 0

  return (
    <Link
      href={`/dashboard/campaigns/${campaign.id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-zinc-900 truncate">
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

      {campaign.clients?.company_name && (
        <p className="text-xs text-zinc-500 mb-2">
          {campaign.clients.company_name}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span>
          {campaign.total_budget
            ? `GHS ${(campaign.total_budget / 100).toFixed(2)}`
            : 'No budget'}
        </span>
        <span>{lineItemCount} item{lineItemCount !== 1 ? 's' : ''}</span>
      </div>
    </Link>
  )
}
