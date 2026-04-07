'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createChannel } from '@/actions/channels'
import { CHANNEL_TYPES, CHANNEL_TYPE_LABELS } from '@/types/channels'
import { ChannelTypeIcon } from '@/components/dashboard/ChannelTypeIcon'
import type { ChannelType } from '@/types/channels'

export default function NewChannelPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setErrors({})

    if (selectedType) {
      formData.set('type', selectedType)
    }

    const result = await createChannel(formData)

    if (result?.error && typeof result.error === 'object') {
      setErrors(result.error as Record<string, string[]>)
      setLoading(false)
      return
    }

    router.push('/dashboard/channels')
    router.refresh()
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors'
  const labelClass = 'block text-sm font-semibold text-zinc-700 mb-1.5'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/channels"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">New Channel</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Add a new advertising channel to your organization.
          </p>
        </div>
      </div>

      {/* Step 1: Select type */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-zinc-900">1. Select Channel Type</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CHANNEL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                selectedType === type
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
              }`}
            >
              <ChannelTypeIcon type={type} size="sm" />
              <span className="text-sm font-semibold text-zinc-900">
                {CHANNEL_TYPE_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="text-sm text-red-600">{errors.type[0]}</p>
        )}
      </div>

      {/* Step 2: Channel details */}
      {selectedType && (
        <form action={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-zinc-900">2. Channel Details</h2>

          <div>
            <label htmlFor="name" className={labelClass}>
              Channel Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClass}
              placeholder={`e.g., ${selectedType === 'print' ? 'Daily Graphic' : selectedType === 'broadcast_tv' ? 'GTV Prime' : selectedType === 'broadcast_radio' ? 'Joy FM' : selectedType === 'digital' ? 'Website Display' : 'TikTok'}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={inputClass}
              placeholder="Brief description of this channel..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
            )}
          </div>

          {(errors as Record<string, string[]>)._form && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {(errors as Record<string, string[]>)._form[0]}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create Channel'}
            </button>
            <Link
              href="/dashboard/channels"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
