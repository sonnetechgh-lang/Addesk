'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createCampaign } from '@/actions/campaigns'

type ClientOption = { id: string; company_name: string; contact_name: string }

const initialState = { error: null as Record<string, string[]> | null }

export default function NewCampaignClient({
  clients,
  orgMembers,
}: {
  clients: ClientOption[]
  orgMembers: { user_id: string; profiles: { full_name: string } }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client_id') ?? ''

  async function handleSubmit(
    _prev: typeof initialState,
    formData: FormData
  ) {
    const result = await createCampaign(formData)
    if ('error' in result && result.error) {
      return { error: result.error as Record<string, string[]> }
    }
    if ('campaignId' in result) {
      router.push(`/dashboard/campaigns/${result.campaignId}`)
    } else {
      router.push('/dashboard/campaigns')
    }
    return { error: null }
  }

  const [state, action, isPending] = useActionState(handleSubmit, initialState)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Campaigns
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">New Campaign</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create a new advertising campaign for a client.
        </p>
      </div>

      <form action={action} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          {/* Client */}
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-zinc-700 mb-1">
              Client *
            </label>
            {clients.length === 0 ? (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No clients yet.{' '}
                <Link href="/dashboard/clients/new" className="font-semibold underline">
                  Add a client first
                </Link>.
              </div>
            ) : (
              <select
                id="client_id"
                name="client_id"
                required
                defaultValue={preselectedClientId}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            )}
            {state.error?.client_id && (
              <p className="mt-1 text-xs text-red-600">{state.error.client_id[0]}</p>
            )}
          </div>

          {/* Campaign Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
              Campaign Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="Q2 Brand Awareness Campaign"
            />
            {state.error?.name && (
              <p className="mt-1 text-xs text-red-600">{state.error.name[0]}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
              placeholder="Campaign objectives and notes..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Start Date */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-zinc-700 mb-1">
                Start Date
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-zinc-700 mb-1">
                End Date
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Budget */}
            <div>
              <label htmlFor="total_budget" className="block text-sm font-medium text-zinc-700 mb-1">
                Total Budget (GHS)
              </label>
              <input
                id="total_budget"
                name="total_budget"
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="0.00"
              />
            </div>

            {/* Assigned To */}
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-zinc-700 mb-1">
                Assigned To
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              >
                <option value="">Unassigned</option>
                {orgMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name ?? 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Error */}
        {state.error?._form && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error._form[0]}
          </p>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || clients.length === 0}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  )
}
