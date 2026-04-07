'use client'

import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
} from '@/types/campaigns'
import type { CampaignStatus } from '@/types/campaigns' // eslint-disable-line @typescript-eslint/no-unused-vars
import { CampaignCard } from './CampaignCard'

type Campaign = {
  id: string
  name: string
  status: string
  total_budget: number | null
  start_date: string | null
  end_date: string | null
  clients?: { id: string; company_name: string; contact_name: string } | null
  line_items?: { count: number }[]
}

export function PipelineBoard({ campaigns }: { campaigns: Campaign[] }) {
  // Group campaigns by status
  const columns = CAMPAIGN_STATUSES.map((status) => ({
    status,
    label: CAMPAIGN_STATUS_LABELS[status],
    color: CAMPAIGN_STATUS_COLORS[status],
    items: campaigns.filter((c) => c.status === status),
  }))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {columns.map((col) => (
        <div
          key={col.status}
          className="shrink-0 w-72 rounded-2xl border border-zinc-200 bg-zinc-50/50"
        >
          {/* Column Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${col.color}`}
            >
              {col.label}
            </span>
            <span className="text-xs font-medium text-zinc-400">
              {col.items.length}
            </span>
          </div>

          {/* Column Body */}
          <div className="p-3 space-y-2.5 min-h-50">
            {col.items.length === 0 ? (
              <p className="text-center text-xs text-zinc-400 py-8">
                No campaigns
              </p>
            ) : (
              col.items.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
