'use client'

import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
} from '@/types/production'
import { TaskCard } from './TaskCard'

type Task = {
  id: string
  title: string
  task_type: string
  status: string
  priority: string
  brief_id: string
  assigned_to: string | null
  profiles: { full_name: string; profile_photo_url: string | null } | null
  creative_briefs: { title: string; channel_type: string }
}

export function ProductionBoard({ tasks }: { tasks: Task[] }) {
  const columns = TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    color: TASK_STATUS_COLORS[status],
    items: tasks.filter((t) => t.status === status),
  }))

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {columns.map((col) => (
        <div
          key={col.status}
          className="shrink-0 w-72 rounded-2xl border border-zinc-200 bg-zinc-50/50"
        >
          {/* Column Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${col.color}`}
            >
              {col.label}
            </span>
            <span className="text-xs font-medium text-zinc-400">
              {col.items.length}
            </span>
          </div>

          {/* Column Body */}
          <div className="p-3 space-y-2.5 min-h-50">
            {col.items.length === 0 ? (
              <p className="text-center text-xs text-zinc-400 py-8">
                No tasks
              </p>
            ) : (
              col.items.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
