import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getBriefs } from '@/actions/briefs'
import {
  BRIEF_STATUS_LABELS,
  BRIEF_STATUS_COLORS,
  BRIEF_STATUSES,
} from '@/types/production'
import type { BriefStatus } from '@/types/production'

export default async function BriefsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const briefs = await getBriefs(status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Creative Briefs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage creative briefs and track production progress.
          </p>
        </div>
        <Link
          href="/dashboard/briefs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Brief
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 overflow-x-auto">
        {['all', ...BRIEF_STATUSES].map((s) => {
          const isActive = (status ?? 'all') === s
          return (
            <Link
              key={s}
              href={
                s === 'all'
                  ? '/dashboard/briefs'
                  : `/dashboard/briefs?status=${s}`
              }
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {s === 'all'
                ? 'All'
                : BRIEF_STATUS_LABELS[s as BriefStatus]}
            </Link>
          )
        })}
      </div>

      {/* Brief List */}
      {briefs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <FileText className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {status && status !== 'all'
              ? 'No briefs with this status'
              : 'No briefs yet'}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create a creative brief to kick off production.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefs.map((brief: Record<string, unknown> & { id: string; title: string; status: string; channel_type: string; due_date?: string; production_tasks?: { count: number }[]; campaigns?: { name: string }; profiles?: { full_name: string } }) => {
            const taskCount = brief.production_tasks?.[0]?.count ?? 0
            return (
              <Link
                key={brief.id}
                href={`/dashboard/briefs/${brief.id}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                    {brief.title}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      BRIEF_STATUS_COLORS[brief.status as BriefStatus] ??
                      'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {BRIEF_STATUS_LABELS[brief.status as BriefStatus] ??
                      brief.status}
                  </span>
                </div>

                {brief.campaigns?.name && (
                  <p className="text-sm text-zinc-500 mb-2">
                    {brief.campaigns.name}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="capitalize">{brief.channel_type}</span>
                  <span>
                    {taskCount} task{taskCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {brief.profiles?.full_name && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Assigned to{' '}
                    <span className="text-zinc-600 font-medium">
                      {brief.profiles.full_name}
                    </span>
                  </p>
                )}

                {brief.due_date && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Due: {new Date(brief.due_date).toLocaleDateString()}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
