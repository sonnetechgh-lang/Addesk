'use client'

import { useMemo } from 'react'
import type { ChannelType } from '@/types/channels'
import { CHANNEL_TYPE_LABELS } from '@/types/channels'
import { cn } from '@/lib/utils'

type SlotEntry = {
  id: string
  name: string
  base_price: number
  is_active: boolean
  max_units_per_period: number | null
  channels: {
    name: string
    type: string
  }
}

type Props = {
  slots: SlotEntry[]
  month?: Date
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function InventoryCalendar({ slots, month = new Date() }: Props) {
  const { year, monthIndex, weeks } = useMemo(() => {
    const y = month.getFullYear()
    const m = month.getMonth()
    const dim = new Date(y, m + 1, 0).getDate()
    // getDay() returns 0=Sun, convert to 0=Mon
    const sd = (new Date(y, m, 1).getDay() + 6) % 7

    const wks: (number | null)[][] = []
    let week: (number | null)[] = Array(sd).fill(null)
    for (let d = 1; d <= dim; d++) {
      week.push(d)
      if (week.length === 7) {
        wks.push(week)
        week = []
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      wks.push(week)
    }

    return { year: y, monthIndex: m, weeks: wks }
  }, [month])

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === monthIndex

  const channelTypes = useMemo(() => {
    const types = new Set<string>()
    slots.forEach((s) => types.add(s.channels.type))
    return Array.from(types)
  }, [slots])

  // monthName computed via toLocaleString if needed

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-semibold text-zinc-500">Channels:</span>
        {channelTypes.map((ct) => (
          <span
            key={ct}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600"
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                ct === 'print' && 'bg-amber-400',
                ct === 'digital' && 'bg-blue-400',
                ct === 'broadcast_tv' && 'bg-rose-400',
                ct === 'broadcast_radio' && 'bg-teal-400',
                ct === 'influencer' && 'bg-purple-400'
              )}
            />
            {CHANNEL_TYPE_LABELS[ct as ChannelType] ?? ct}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-zinc-100">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-zinc-50 last:border-b-0">
            {week.map((day, di) => {
              const isToday = isCurrentMonth && day === today.getDate()
              const isPast =
                day !== null &&
                new Date(year, monthIndex, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <div
                  key={di}
                  className={cn(
                    'min-h-18 p-1.5 border-r border-zinc-50 last:border-r-0',
                    day === null && 'bg-zinc-50/50',
                    isPast && 'bg-zinc-50/30',
                  )}
                >
                  {day !== null && (
                    <>
                      <div
                        className={cn(
                          'text-[11px] font-semibold mb-1',
                          isToday
                            ? 'flex items-center justify-center h-5 w-5 rounded-full bg-emerald-600 text-white'
                            : isPast
                              ? 'text-zinc-300'
                              : 'text-zinc-600'
                        )}
                      >
                        {day}
                      </div>
                      {/* Slot availability indicators */}
                      <div className="flex flex-wrap gap-0.5">
                        {slots.slice(0, 3).map((slot) => (
                          <div
                            key={slot.id}
                            className={cn(
                              'h-1.5 rounded-full flex-1 min-w-3 max-w-5',
                              slot.channels.type === 'print' && 'bg-amber-300',
                              slot.channels.type === 'digital' && 'bg-blue-300',
                              slot.channels.type === 'broadcast_tv' && 'bg-rose-300',
                              slot.channels.type === 'broadcast_radio' && 'bg-teal-300',
                              slot.channels.type === 'influencer' && 'bg-purple-300',
                              !slot.is_active && 'opacity-30'
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Slot Summary */}
      <div className="text-xs text-zinc-400">
        {slots.length} active {slots.length === 1 ? 'slot' : 'slots'} across{' '}
        {channelTypes.length} {channelTypes.length === 1 ? 'channel' : 'channels'}
      </div>
    </div>
  )
}
