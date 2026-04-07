// =============================================================
// Schedule Entry Type Definitions
// =============================================================

export const SCHEDULE_STATUSES = [
  'scheduled',
  'live',
  'completed',
  'cancelled',
  'missed',
] as const
export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number]

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  scheduled: 'Scheduled',
  live: 'Live',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
}

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  scheduled: 'bg-blue-50 text-blue-700',
  live: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-zinc-100 text-zinc-500',
  missed: 'bg-red-50 text-red-600',
}

// -------------------------------------------------------
// Database Row Type
// -------------------------------------------------------

export type ScheduleEntry = {
  id: string
  organization_id: string
  line_item_id: string | null
  order_id: string | null
  ad_slot_id: string
  channel_id: string
  scheduled_date: string
  scheduled_time: string | null
  end_date: string | null
  status: ScheduleStatus
  proof_of_run_urls: string[]
  confirmed_by: string | null
  confirmed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// -------------------------------------------------------
// Composite Types
// -------------------------------------------------------

export type ScheduleWithDetails = ScheduleEntry & {
  channels: {
    name: string
    channel_type: string
  }
  ad_slots: {
    label: string
    slot_type: string
  }
  line_items?: {
    description: string
    campaigns: {
      name: string
    } | null
  } | null
}
