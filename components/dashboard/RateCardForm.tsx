'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Star } from 'lucide-react'
import { createRateCard } from '@/actions/inventory'

type Props = {
  slotId: string
  onCreated?: () => void
}

export function RateCardForm({ slotId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setErrors({})
      formData.set('ad_slot_id', slotId)

      const result = await createRateCard(formData)

      if (result?.error && typeof result.error === 'object') {
        setErrors(result.error as Record<string, string[]>)
        return
      }

      setOpen(false)
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add Rate
      </button>
    )
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 mt-2"
    >
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-zinc-700">New Rate Card</h5>
        <button
          type="button"
          onClick={() => { setOpen(false); setErrors({}) }}
          className="text-zinc-400 hover:text-zinc-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Rate Name</label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g., Standard Rate, Agency Discount"
            className={inputClass}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
        </div>

        <div>
          <label className={labelClass}>Price (GHS)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className={inputClass}
          />
          {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price[0]}</p>}
        </div>

        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              name="is_default"
              type="checkbox"
              value="true"
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="flex items-center gap-1 text-xs font-medium text-zinc-600">
              <Star className="h-3 w-3" />
              Default rate
            </span>
          </label>
        </div>

        <div>
          <label className={labelClass}>Valid From</label>
          <input
            name="valid_from"
            type="date"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Valid To</label>
          <input
            name="valid_to"
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      {errors._form && (
        <p className="text-sm text-red-600">{errors._form[0]}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => { setOpen(false); setErrors({}) }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Adding...' : 'Add Rate'}
        </button>
      </div>
    </form>
  )
}
