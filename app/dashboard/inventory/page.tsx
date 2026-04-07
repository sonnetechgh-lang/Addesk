import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInventoryOverview } from '@/actions/inventory'
import { InventoryCalendar } from '@/components/dashboard/InventoryCalendar'
import { SLOT_TYPE_LABELS } from '@/types/channels'
import type { SlotType } from '@/types/channels'

type SlotRow = {
  id: string
  name: string
  slot_type: string
  base_price: number
  is_active: boolean
  max_units_per_period: number | null
  channels: { name: string; type: string }
  rate_cards: Record<string, unknown>[]
}

export default async function InventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const slots = await getInventoryOverview()

  // Build calendar data from the slot rows
  const calendarSlots = (slots as SlotRow[]).map((s) => ({
    id: s.id,
    name: s.name,
    base_price: s.base_price,
    is_active: s.is_active,
    max_units_per_period: s.max_units_per_period,
    channels: s.channels,
  }))

  // Summary stats
  const totalSlots = slots.length
  const channelSet = new Set((slots as SlotRow[]).map((s) => s.channels?.name))
  const totalChannels = channelSet.size
  const totalRateCards = (slots as SlotRow[]).reduce(
    (acc: number, s) => acc + (s.rate_cards?.length ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Inventory</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of all active ad slots across your channels.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Active Slots
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{totalSlots}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Channels
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{totalChannels}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Rate Cards
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{totalRateCards}</p>
        </div>
      </div>

      {/* Calendar View */}
      <InventoryCalendar slots={calendarSlots} />

      {/* Slot Table */}
      {slots.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <h3 className="text-base font-bold text-zinc-900">No active slots</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create channels and add ad slots to see inventory here.
          </p>
          <Link
            href="/dashboard/channels"
            className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Go to Channels
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    Slot
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                    Base Price
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                    Rates
                  </th>
                  <th className="px-5 py-3 font-semibold text-zinc-500 text-xs uppercase tracking-wider text-right">
                    Max/Period
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {(slots as SlotRow[]).map((slot) => (
                  <tr
                    key={slot.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/inventory/${slot.id}`}
                        className="font-medium text-zinc-900 hover:text-emerald-700 transition-colors"
                      >
                        {slot.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {slot.channels?.name}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {SLOT_TYPE_LABELS[slot.slot_type as SlotType] ?? slot.slot_type}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-900">
                      GHS {(slot.base_price / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500">
                      {slot.rate_cards?.length ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500">
                      {slot.max_units_per_period ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
