import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SLOT_TYPE_LABELS, CHANNEL_TYPE_LABELS } from '@/types/channels'
import type { SlotType, ChannelType } from '@/types/channels'

export default async function SlotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: slot } = await supabase
    .from('ad_slots')
    .select('*, channels!inner(id, name, type), rate_cards(*)')
    .eq('id', id)
    .single()

  if (!slot) notFound()

  type SlotWithRelations = { channels: { id: string; name: string; type: string }; rate_cards: { id: string; name: string; price: number; is_default: boolean; valid_from: string | null; valid_to: string | null }[] }
  const channel = (slot as unknown as SlotWithRelations).channels
  const rateCards = (slot as unknown as SlotWithRelations).rate_cards ?? []
  const specsEntries = Object.entries(slot.specs as Record<string, unknown>).filter(
    ([k]) => k !== 'type'
  )

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Inventory
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{slot.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {SLOT_TYPE_LABELS[slot.slot_type as SlotType]} &middot;{' '}
            <Link
              href={`/dashboard/channels/${channel.id}`}
              className="hover:text-emerald-700 transition-colors"
            >
              {channel.name}
            </Link>{' '}
            ({CHANNEL_TYPE_LABELS[channel.type as ChannelType]})
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            slot.is_active
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-zinc-100 text-zinc-500'
          }`}
        >
          {slot.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Base Price
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            GHS {(slot.base_price / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Rate Cards
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {rateCards.length}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Max per Period
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {slot.max_units_per_period ?? '—'}
          </p>
        </div>
      </div>

      {/* Specifications */}
      {specsEntries.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Specifications
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {specsEntries.map(([key, value]) => (
              <div key={key} className="rounded-lg bg-zinc-50 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-sm font-medium text-zinc-700 mt-0.5">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate Cards */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3">
          Rate Cards
        </h2>
        {rateCards.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No rate cards. The base price is used for all bookings.
          </p>
        ) : (
          <div className="space-y-2">
            {rateCards.map((rc) => (
              <div
                key={rc.id}
                className="flex items-center gap-3 rounded-lg bg-zinc-50 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-800">{rc.name}</span>
                    {rc.is_default && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {rc.valid_from && <>From {rc.valid_from}</>}
                    {rc.valid_to && <> to {rc.valid_to}</>}
                    {!rc.valid_from && !rc.valid_to && 'No date restriction'}
                  </p>
                </div>
                <span className="text-lg font-bold text-zinc-900">
                  GHS {(rc.price / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
