'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { updateCampaign, deleteLineItem } from '@/actions/campaigns'
import { LineItemTable } from '@/components/dashboard/LineItemTable'
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUSES,
} from '@/types/campaigns'
import type { CampaignStatus } from '@/types/campaigns'

type ChannelOption = { id: string; name: string; type: string }

type LineItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  start_date: string | null
  end_date: string | null
  channels?: { name: string; type: string } | null
  [key: string]: unknown
}

type Campaign = {
  id: string
  name: string
  status: string
  total_budget: number | null
  description: string | null
  start_date: string | null
  end_date: string | null
  assigned_to: string | null
  clients: {
    id: string
    company_name: string
    contact_name: string
  } | null
  line_items: LineItem[]
  [key: string]: unknown
}

type Props = {
  campaign: Campaign
  channels: ChannelOption[]
  orgMembers?: { user_id: string; profiles: { full_name: string } }[]
}

export function CampaignDetailClient(props: Props) {
  const { campaign, channels } = props
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showAddLineItem, setShowAddLineItem] = useState(false)

  const client = campaign.clients
  const lineItems = campaign.line_items ?? []

  // Compute totals
  const totalSpend = lineItems.reduce(
    (sum: number, li: LineItem) => sum + (li.total_price ?? 0),
    0
  )
  const budgetUsed = campaign.total_budget
    ? Math.min(100, Math.round((totalSpend / campaign.total_budget) * 100))
    : null

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', campaign.id)
      fd.set('status', newStatus)
      await updateCampaign(fd)
      router.refresh()
    })
  }

  function handleDeleteLineItem(lineItemId: string) {
    startTransition(async () => {
      await deleteLineItem(lineItemId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{campaign.name}</h1>
          {client && (
          <p className="mt-1 text-sm text-zinc-500">
            <Link
              href={`/dashboard/clients/${client.id}`}
              className="hover:text-emerald-700 transition-colors"
            >
              {client.company_name}
            </Link>
            {' '}&middot; {client.contact_name}
          </p>
          )}
        </div>

        {/* Status Selector */}
        <select
          value={campaign.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isPending}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide border-0 cursor-pointer disabled:opacity-60 ${
            CAMPAIGN_STATUS_COLORS[campaign.status as CampaignStatus] ?? 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {CAMPAIGN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CAMPAIGN_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Budget
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-900">
            {campaign.total_budget
              ? `GHS ${(campaign.total_budget / 100).toFixed(2)}`
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Total Spend
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-900">
            GHS {(totalSpend / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Line Items
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-900">
            {lineItems.length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Duration
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-700">
            {campaign.start_date && campaign.end_date
              ? `${campaign.start_date} — ${campaign.end_date}`
              : campaign.start_date
              ? `From ${campaign.start_date}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Budget Progress */}
      {budgetUsed !== null && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Budget Usage
            </span>
            <span className="text-sm font-bold text-zinc-900">{budgetUsed}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetUsed > 90
                  ? 'bg-red-500'
                  : budgetUsed > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetUsed}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      {campaign.description && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Description
          </h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">
            {campaign.description}
          </p>
        </div>
      )}

      {/* Line Items */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Line Items
          </h2>
          <button
            type="button"
            onClick={() => setShowAddLineItem(!showAddLineItem)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Line Item
          </button>
        </div>

        <LineItemTable
          lineItems={lineItems}
          campaignId={campaign.id}
          channels={channels}
          showAddForm={showAddLineItem}
          onLineItemAdded={() => {
            setShowAddLineItem(false)
            router.refresh()
          }}
          onDeleteLineItem={handleDeleteLineItem}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
