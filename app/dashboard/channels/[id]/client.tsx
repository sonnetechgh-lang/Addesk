'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { deleteSlot } from '@/actions/channels'
import { deleteRateCard } from '@/actions/inventory'
import { SlotForm } from '@/components/dashboard/SlotForm'
import { RateCardForm } from '@/components/dashboard/RateCardForm'
import { SLOT_TYPE_LABELS } from '@/types/channels'
import type { ChannelType, SlotType } from '@/types/channels'

type RateCard = {
  id: string
  name: string
  price: number
  valid_from: string | null
  valid_to: string | null
  is_default: boolean
}

type Slot = {
  id: string
  name: string
  slot_type: string
  base_price: number
  specs: Record<string, unknown>
  max_units_per_period: number | null
  is_active: boolean
  rate_cards: RateCard[]
}

type Channel = {
  id: string
  type: string
  name: string
}

export function ChannelDetailClient({
  channel,
  slots,
}: {
  channel: Channel
  slots: Slot[]
}) {
  const router = useRouter()
  const [expandedSlot, setExpandedSlot] = useState<string | null>(
    slots.length === 1 ? slots[0].id : null
  )

  function refresh() {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">
          Ad Slots ({slots.length})
        </h2>
      </div>

      {/* Existing Slots */}
      {slots.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No ad slots yet. Create your first slot below.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              expanded={expandedSlot === slot.id}
              onToggle={() =>
                setExpandedSlot(expandedSlot === slot.id ? null : slot.id)
              }
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* Add Slot Form */}
      <SlotForm
        channelId={channel.id}
        channelType={channel.type as ChannelType}
        onCreated={refresh}
      />
    </div>
  )
}

function SlotCard({
  slot,
  expanded,
  onToggle,
  onRefresh,
}: {
  slot: Slot
  expanded: boolean
  onToggle: () => void
  onRefresh: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDeleteSlot() {
    startTransition(async () => {
      await deleteSlot(slot.id)
      onRefresh()
    })
  }

  function handleDeleteRateCard(rateCardId: string) {
    startTransition(async () => {
      await deleteRateCard(rateCardId)
      onRefresh()
    })
  }

  const specsEntries = Object.entries(slot.specs).filter(
    ([k]) => k !== 'type'
  )

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Slot Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-zinc-900">{slot.name}</h3>
            <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              slot.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {slot.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {SLOT_TYPE_LABELS[slot.slot_type as SlotType]} &middot;{' '}
            Base: GHS {(slot.base_price / 100).toFixed(2)}
            {slot.max_units_per_period && (
              <> &middot; Max {slot.max_units_per_period}/period</>
            )}
            {slot.rate_cards.length > 0 && (
              <> &middot; {slot.rate_cards.length} rate{slot.rate_cards.length !== 1 ? 's' : ''}</>
            )}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-zinc-100 px-5 py-4 space-y-4">
          {/* Specs */}
          {specsEntries.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Specifications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {specsEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-zinc-50 px-3 py-2"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-medium text-zinc-700 mt-0.5">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Rate Cards
            </h4>
            {slot.rate_cards.length === 0 ? (
              <p className="text-xs text-zinc-400 mb-2">
                No rate cards yet. The base price will be used.
              </p>
            ) : (
              <div className="space-y-1.5 mb-2">
                {slot.rate_cards.map((rc) => (
                  <div
                    key={rc.id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-zinc-800">
                          {rc.name}
                        </span>
                        {rc.is_default && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        GHS {(rc.price / 100).toFixed(2)}
                        {rc.valid_from && (
                          <> &middot; From {rc.valid_from}</>
                        )}
                        {rc.valid_to && (
                          <> to {rc.valid_to}</>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRateCard(rc.id)}
                      disabled={isPending}
                      className="text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete rate card"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <RateCardForm slotId={slot.id} onCreated={onRefresh} />
          </div>

          {/* Danger Zone */}
          <div className="pt-2 border-t border-zinc-100">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Delete Slot
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">
                  Delete this slot and all its rate cards?
                </span>
                <button
                  type="button"
                  onClick={handleDeleteSlot}
                  disabled={isPending}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {isPending ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
