'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import {
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
} from '@/types/schedule'
import type { ScheduleStatus } from '@/types/schedule'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns'

type Entry = {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: string
  notes: string | null
  proof_of_run_urls: string[]
  channels: { name: string; channel_type: string }
  ad_slots: { label: string; slot_type: string }
  line_items?: {
    description: string
    campaigns: { name: string } | null
  } | null
}

type Channel = {
  id: string
  name: string
  channel_type: string
}

export function ScheduleCalendar({
  entries,
  channels,
}: {
  entries: Entry[]
  channels: Channel[]
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedChannel, setSelectedChannel] = useState<string>('all')

  const filteredEntries = useMemo(() => {
    if (selectedChannel === 'all') return entries
    return entries.filter((e) => e.channels.name === selectedChannel)
  }, [entries, selectedChannel])

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  function getEntriesForDay(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return filteredEntries.filter((e) => e.scheduled_date === dateStr)
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-base font-bold text-zinc-900 min-w-40 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Channel Filter */}
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        >
          <option value="all">All Channels</option>
          {channels.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-zinc-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-zinc-100 last:border-b-0">
            {week.map((date) => {
              const dayEntries = getEntriesForDay(date)
              const inMonth = isSameMonth(date, currentMonth)
              const today = isToday(date)

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-25 border-r border-zinc-100 last:border-r-0 p-1.5 ${
                    !inMonth ? 'bg-zinc-50/50' : ''
                  }`}
                >
                  <div
                    className={`mb-1 text-right text-xs font-medium ${
                      today
                        ? 'text-emerald-600'
                        : inMonth
                        ? 'text-zinc-700'
                        : 'text-zinc-300'
                    }`}
                  >
                    {today ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                        {format(date, 'd')}
                      </span>
                    ) : (
                      format(date, 'd')
                    )}
                  </div>

                  {/* Entry pills */}
                  <div className="space-y-0.5">
                    {dayEntries.slice(0, 3).map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium truncate ${
                          SCHEDULE_STATUS_COLORS[
                            entry.status as ScheduleStatus
                          ] ?? 'bg-zinc-100 text-zinc-600'
                        }`}
                        title={`${entry.channels.name} — ${entry.ad_slots.label}${
                          entry.scheduled_time ? ` @ ${entry.scheduled_time}` : ''
                        }`}
                      >
                        {entry.channels.name}
                        {entry.scheduled_time &&
                          ` ${entry.scheduled_time.slice(0, 5)}`}
                        {entry.proof_of_run_urls.length > 0 && (
                          <ImageIcon className="inline h-2.5 w-2.5 ml-0.5" />
                        )}
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <p className="text-[10px] text-zinc-400 pl-1">
                        +{dayEntries.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Entry List (below calendar) */}
      {filteredEntries.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="px-5 py-3 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900">
              Scheduled Entries ({filteredEntries.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-zinc-900">
                      {entry.channels.name}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {entry.ad_slots.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {entry.scheduled_date}
                    {entry.scheduled_time && ` at ${entry.scheduled_time}`}
                    {entry.line_items?.campaigns?.name &&
                      ` · ${entry.line_items.campaigns.name}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    SCHEDULE_STATUS_COLORS[entry.status as ScheduleStatus] ??
                    'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {SCHEDULE_STATUS_LABELS[entry.status as ScheduleStatus] ??
                    entry.status}
                </span>
                {entry.proof_of_run_urls.length > 0 && (
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {entry.proof_of_run_urls.length} proof{entry.proof_of_run_urls.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
