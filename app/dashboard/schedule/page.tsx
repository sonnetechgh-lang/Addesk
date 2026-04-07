import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getScheduleEntries } from '@/actions/schedule'
import { getChannels } from '@/actions/channels'
import { ScheduleCalendar } from '@/components/dashboard/ScheduleCalendar'

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{
    channel?: string
    start?: string
    end?: string
    status?: string
  }>
}) {
  const filters = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const entries = await getScheduleEntries({
    channelId: filters.channel,
    startDate: filters.start,
    endDate: filters.end,
    status: filters.status,
  })

  const channels = await getChannels()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Schedule</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Master calendar for all scheduled ad placements.
        </p>
      </div>

      <ScheduleCalendar entries={entries} channels={channels} />
    </div>
  )
}
