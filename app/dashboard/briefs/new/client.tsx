'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createBrief } from '@/actions/briefs'
import { CHANNEL_TYPES } from '@/types/channels'

type CampaignOption = { id: string; name: string }

const initialState = { error: null as Record<string, string[]> | null }

export function NewBriefClient({
  campaigns,
  orgMembers,
}: {
  campaigns: CampaignOption[]
  orgMembers: { user_id: string; profiles: { full_name: string } }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCampaignId = searchParams.get('campaign_id') ?? ''

  async function handleSubmit(
    _prev: typeof initialState,
    formData: FormData
  ) {
    const result = await createBrief(formData)
    if ('error' in result && result.error) {
      return { error: result.error as Record<string, string[]> }
    }
    if ('briefId' in result) {
      router.push(`/dashboard/briefs/${result.briefId}`)
    } else {
      router.push('/dashboard/briefs')
    }
    return { error: null }
  }

  const [state, action, isPending] = useActionState(handleSubmit, initialState)

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/briefs"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Briefs
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900">New Creative Brief</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Define the creative requirements for a production task.
        </p>
      </div>

      <form action={action} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-1">
              Brief Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="Homepage Banner Design"
            />
            {state.error?.title && (
              <p className="mt-1 text-xs text-red-600">{state.error.title[0]}</p>
            )}
          </div>

          {/* Channel Type */}
          <div>
            <label htmlFor="channel_type" className="block text-sm font-medium text-zinc-700 mb-1">
              Channel Type *
            </label>
            <select
              id="channel_type"
              name="channel_type"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            >
              <option value="">Select channel type...</option>
              {CHANNEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            {state.error?.channel_type && (
              <p className="mt-1 text-xs text-red-600">{state.error.channel_type[0]}</p>
            )}
          </div>

          {/* Campaign (optional) */}
          <div>
            <label htmlFor="campaign_id" className="block text-sm font-medium text-zinc-700 mb-1">
              Campaign (optional)
            </label>
            <select
              id="campaign_id"
              name="campaign_id"
              defaultValue={preselectedCampaignId}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            >
              <option value="">No campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-zinc-700 mb-1">
              Assign To
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            >
              <option value="">Unassigned</option>
              {orgMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profiles.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-zinc-700 mb-1">
              Due Date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Brief Details */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-zinc-900">Brief Details</h2>

          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-zinc-700 mb-1">
              Objective
            </label>
            <textarea
              id="objective"
              name="objective"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
              placeholder="What is the goal of this creative?"
            />
          </div>

          <div>
            <label htmlFor="target_audience" className="block text-sm font-medium text-zinc-700 mb-1">
              Target Audience
            </label>
            <textarea
              id="target_audience"
              name="target_audience"
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
              placeholder="Demographics, interests, behaviors..."
            />
          </div>

          <div>
            <label htmlFor="key_messages" className="block text-sm font-medium text-zinc-700 mb-1">
              Key Messages
            </label>
            <textarea
              id="key_messages"
              name="key_messages"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
              placeholder="Core messages to communicate..."
            />
          </div>

          <div>
            <label htmlFor="brand_guidelines_url" className="block text-sm font-medium text-zinc-700 mb-1">
              Brand Guidelines URL
            </label>
            <input
              id="brand_guidelines_url"
              name="brand_guidelines_url"
              type="url"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Form Error */}
        {state.error?._form && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error._form[0]}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Creating...' : 'Create Brief'}
          </button>
          <Link
            href="/dashboard/briefs"
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
