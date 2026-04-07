import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getClientById } from '@/actions/clients'
import {
  CREDIT_TERM_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
} from '@/types/campaigns'
import type { CreditTerm, CampaignStatus } from '@/types/campaigns'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const client = await getClientById(id)
  if (!client) notFound()

  type ClientWithCampaigns = { campaigns: { id: string; name: string; status: string; start_date: string | null; end_date: string | null; total_budget: number | null }[] }
  const campaigns = (client as unknown as ClientWithCampaigns).campaigns ?? []
  const billingAddress = client.billing_address as Record<string, string> | null
  const hasAddress = billingAddress && Object.values(billingAddress).some(Boolean)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Clients
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{client.company_name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {client.contact_name} &middot; {client.contact_email}
          {client.contact_phone && <> &middot; {client.contact_phone}</>}
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Credit Terms
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-900">
            {CREDIT_TERM_LABELS[client.credit_terms as CreditTerm] ?? client.credit_terms}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Campaigns
          </p>
          <p className="mt-1 text-lg font-bold text-zinc-900">{campaigns.length}</p>
        </div>
        {hasAddress && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Billing Address
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              {[billingAddress?.line1, billingAddress?.city, billingAddress?.region, billingAddress?.country]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      {client.notes && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Notes
          </h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Campaigns */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Campaigns
          </h2>
          <Link
            href={`/dashboard/campaigns/new?client_id=${client.id}`}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            + New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-sm text-zinc-400">No campaigns yet.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard/campaigns/${c.id}`}
                className="flex items-center gap-3 rounded-lg bg-zinc-50 px-4 py-3 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    {c.start_date && <>From {c.start_date}</>}
                    {c.end_date && <> to {c.end_date}</>}
                    {c.total_budget && (
                      <> &middot; Budget: GHS {(c.total_budget / 100).toFixed(2)}</>
                    )}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    CAMPAIGN_STATUS_COLORS[c.status as CampaignStatus] ?? 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {CAMPAIGN_STATUS_LABELS[c.status as CampaignStatus] ?? c.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
