'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { createLineItem } from '@/actions/campaigns'
import {
  LINE_ITEM_STATUS_LABELS,
  LINE_ITEM_STATUS_COLORS,
} from '@/types/campaigns'
import type { LineItemStatus } from '@/types/campaigns'

type Channel = { id: string; name: string; type: string }

type LineItemRow = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  status: string
  start_date: string | null
  end_date: string | null
  channels?: { name: string; type: string } | null
}

type Props = {
  lineItems: LineItemRow[]
  campaignId: string
  channels: Channel[]
  showAddForm: boolean
  onLineItemAdded: () => void
  onDeleteLineItem: (id: string) => void
  isPending: boolean
}

export function LineItemTable({
  lineItems,
  campaignId,
  channels,
  showAddForm,
  onLineItemAdded,
  onDeleteLineItem,
  isPending,
}: Props) {
  const [isAdding, startTransition] = useTransition()

  function handleAdd(formData: FormData) {
    formData.set('campaign_id', campaignId)

    // total_price computed server-side

    startTransition(async () => {
      const result = await createLineItem(formData)
      if (result.success) {
        onLineItemAdded()
      }
    })
  }

  return (
    <div>
      {lineItems.length === 0 && !showAddForm ? (
        <p className="text-sm text-zinc-400 py-4 text-center">
          No line items yet. Click &ldquo;Add Line Item&rdquo; to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="pb-2 pr-4 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                  Description
                </th>
                <th className="pb-2 pr-4 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                  Channel
                </th>
                <th className="pb-2 pr-4 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                  Qty
                </th>
                <th className="pb-2 pr-4 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                  Unit Price
                </th>
                <th className="pb-2 pr-4 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="pb-2 pr-4 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-2 font-semibold text-zinc-500 text-xs uppercase tracking-wider w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {lineItems.map((li) => (
                <tr key={li.id} className="hover:bg-zinc-50/50">
                  <td className="py-2.5 pr-4 font-medium text-zinc-900">
                    {li.description}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-500">
                    {li.channels?.name ?? '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-700">
                    {li.quantity}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-zinc-700">
                    GHS {(li.unit_price / 100).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-medium text-zinc-900">
                    GHS {(li.total_price / 100).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        LINE_ITEM_STATUS_COLORS[li.status as LineItemStatus] ??
                        'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {LINE_ITEM_STATUS_LABELS[li.status as LineItemStatus] ?? li.status}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <button
                      type="button"
                      onClick={() => onDeleteLineItem(li.id)}
                      disabled={isPending}
                      className="text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete line item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {lineItems.length > 0 && (
              <tfoot>
                <tr className="border-t border-zinc-200">
                  <td colSpan={4} className="py-2.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Total
                  </td>
                  <td className="py-2.5 pr-4 text-right font-bold text-zinc-900">
                    GHS{' '}
                    {(
                      lineItems.reduce((sum, li) => sum + li.total_price, 0) / 100
                    ).toFixed(2)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Add Line Item Form */}
      {showAddForm && (
        <form
          action={handleAdd}
          className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Channel *
              </label>
              <select
                name="channel_id"
                required
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select channel...</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Description *
              </label>
              <input
                name="description"
                type="text"
                required
                placeholder="Full-page ad in Sunday edition"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Qty
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Unit Price (GHS)
              </label>
              <input
                name="unit_price"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                Start Date
              </label>
              <input
                name="start_date"
                type="date"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">
                End Date
              </label>
              <input
                name="end_date"
                type="date"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add Line Item'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
