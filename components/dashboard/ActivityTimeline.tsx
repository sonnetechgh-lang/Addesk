'use client'

import { formatDistanceToNow } from 'date-fns'

type ActivityEntry = {
  id: string
  entity_type: string
  entity_id: string
  action: string
  details: Record<string, unknown>
  created_at: string
  profiles?: {
    full_name: string
    profile_photo_url: string | null
  } | null
}

const ACTION_LABELS: Record<string, string> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  status_changed: 'changed status of',
  assigned: 'assigned',
  commented: 'commented on',
}

const ENTITY_LABELS: Record<string, string> = {
  client: 'client',
  campaign: 'campaign',
  line_item: 'line item',
  channel: 'channel',
  ad_slot: 'ad slot',
  invoice: 'invoice',
  brief: 'brief',
  approval: 'approval',
  schedule: 'schedule entry',
}

export function ActivityTimeline({
  activities,
}: {
  activities: ActivityEntry[]
}) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-zinc-400 py-4 text-center">
        No activity yet.
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((entry, i) => {
        const actorName = entry.profiles?.full_name ?? 'System'
        const actionLabel = ACTION_LABELS[entry.action] ?? entry.action
        const entityLabel = ENTITY_LABELS[entry.entity_type] ?? entry.entity_type
        const isLast = i === activities.length - 1

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-zinc-300 mt-2 shrink-0" />
              {!isLast && (
                <div className="w-px flex-1 bg-zinc-200" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <p className="text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">{actorName}</span>{' '}
                {actionLabel}{' '}
                <span className="font-medium">{entityLabel}</span>
                {entry.details?.name != null && (
                  <> &ldquo;{String(entry.details.name)}&rdquo;</>
                )}
                {entry.details?.from != null && entry.details?.to != null && (
                  <span className="text-zinc-500">
                    {' '}from {String(entry.details.from)} to {String(entry.details.to)}
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {formatDistanceToNow(new Date(entry.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
