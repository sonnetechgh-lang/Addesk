'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { createSlot } from '@/actions/channels'
import { SlotSpecsForm } from '@/components/dashboard/SlotSpecsForm'
import type { ChannelType } from '@/types/channels'
import { CHANNEL_SLOT_MAP, SLOT_TYPE_LABELS } from '@/types/channels'

type Props = {
  channelId: string
  channelType: ChannelType
  onCreated?: () => void
}

export function SlotForm({ channelId, channelType, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [specs, setSpecs] = useState<Record<string, unknown>>({})

  const defaultSlotType = CHANNEL_SLOT_MAP[channelType]

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setErrors({})
      formData.set('channel_id', channelId)
      formData.set('slot_type', defaultSlotType)
      formData.set('specs', JSON.stringify(specs))

      const result = await createSlot(formData)

      if (result?.error && typeof result.error === 'object') {
        setErrors(result.error as Record<string, string[]>)
        return
      }

      setOpen(false)
      setSpecs({})
      onCreated?.()
    })
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors'
  const labelClass = 'block text-xs font-semibold text-zinc-500 mb-1.5'

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors w-full justify-center"
      >
        <Plus className="h-4 w-4" />
        Add Ad Slot
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-900">New Ad Slot</h4>
        <button
          type="button"
          onClick={() => { setOpen(false); setErrors({}) }}
          className="text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Slot Name</label>
          <input
            name="name"
            type="text"
            required
            placeholder={`e.g., ${channelType === 'print' ? 'Full Page Color' : channelType === 'digital' ? 'Homepage Banner' : '30-sec Prime Time'}`}
            className={inputClass}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Base Price (GHS)</label>
          <input
            name="base_price"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className={inputClass}
          />
          {errors.base_price && <p className="mt-1 text-xs text-red-600">{errors.base_price[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Max Units Per Period</label>
          <input
            name="max_units_per_period"
            type="number"
            min="1"
            placeholder="Unlimited"
            className={inputClass}
          />
          <p className="mt-1 text-[10px] text-zinc-400">Leave empty for unlimited availability</p>
        </div>
      </div>

      {/* Channel-specific specs */}
      <SlotSpecsForm
        channelType={channelType}
        initialSpecs={{}}
        onChange={setSpecs}
      />

      <div className="text-xs text-zinc-500">
        Slot Type: <span className="font-medium text-zinc-700">{SLOT_TYPE_LABELS[defaultSlotType]}</span>
      </div>

      {errors._form && (
        <p className="text-sm text-red-600">{errors._form[0]}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setOpen(false); setErrors({}) }}
          className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Creating...' : 'Create Slot'}
        </button>
      </div>
    </form>
  )
}
