'use client'

import { CHANNEL_TYPES } from '@/types/channels'
import { BRIEF_STATUSES, BRIEF_STATUS_LABELS } from '@/types/production'

type BriefFormProps = {
  campaigns: { id: string; name: string }[]
  orgMembers: { user_id: string; profiles: { full_name: string } }[]
  defaultValues?: {
    title?: string
    channel_type?: string
    campaign_id?: string
    assigned_to?: string
    due_date?: string
    objective?: string
    target_audience?: string
    key_messages?: string
    brand_guidelines_url?: string
    status?: string
  }
  errors?: Record<string, string[]> | null
  isPending?: boolean
  submitLabel?: string
}

export function BriefForm({
  campaigns,
  orgMembers,
  defaultValues = {},
  errors,
  isPending,
  submitLabel = 'Save Brief',
}: BriefFormProps) {
  return (
    <div className="space-y-6">
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
            defaultValue={defaultValues.title}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            placeholder="Homepage Banner Design"
          />
          {errors?.title && (
            <p className="mt-1 text-xs text-red-600">{errors.title[0]}</p>
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
            defaultValue={defaultValues.channel_type}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
          >
            <option value="">Select channel type...</option>
            {CHANNEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          {errors?.channel_type && (
            <p className="mt-1 text-xs text-red-600">{errors.channel_type[0]}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Campaign */}
          <div>
            <label htmlFor="campaign_id" className="block text-sm font-medium text-zinc-700 mb-1">
              Campaign
            </label>
            <select
              id="campaign_id"
              name="campaign_id"
              defaultValue={defaultValues.campaign_id}
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
              defaultValue={defaultValues.assigned_to}
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
            defaultValue={defaultValues.due_date}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
          />
        </div>

        {defaultValues.status && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={defaultValues.status}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            >
              {BRIEF_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BRIEF_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}
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
            defaultValue={defaultValues.objective}
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
            defaultValue={defaultValues.target_audience}
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
            defaultValue={defaultValues.key_messages}
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
            defaultValue={defaultValues.brand_guidelines_url}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Form Error */}
      {errors?._form && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors._form[0]}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving...' : submitLabel}
      </button>
    </div>
  )
}
