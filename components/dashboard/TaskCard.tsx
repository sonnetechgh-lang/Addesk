'use client'

import Link from 'next/link'
import {
  TASK_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/production'
import type { TaskType, Priority } from '@/types/production'

type TaskCardProps = {
  task: {
    id: string
    title: string
    task_type: string
    priority: string
    brief_id: string
    profiles: { full_name: string; profile_photo_url: string | null } | null
    creative_briefs: { title: string; channel_type: string }
  }
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link
      href={`/dashboard/briefs/${task.brief_id}`}
      className="block rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2">
          {task.title}
        </h4>
        <span
          className={`shrink-0 text-[10px] font-bold ${
            PRIORITY_COLORS[task.priority as Priority]
          }`}
        >
          {PRIORITY_LABELS[task.priority as Priority]}
        </span>
      </div>

      <p className="text-[11px] text-zinc-400 mb-2 truncate">
        {task.creative_briefs.title}
      </p>

      <div className="flex items-center justify-between">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
          {TASK_TYPE_LABELS[task.task_type as TaskType]}
        </span>
        {task.profiles?.full_name && (
          <span className="text-[11px] text-zinc-400 truncate max-w-25">
            {task.profiles.full_name}
          </span>
        )}
      </div>
    </Link>
  )
}
