import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getApprovalRequests } from '@/actions/approvals'
import { ApprovalCard } from '@/components/dashboard/ApprovalCard'
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUSES,
} from '@/types/approvals'
import type { ApprovalStatus } from '@/types/approvals'
import { ClipboardCheck } from 'lucide-react'

export default async function ApprovalsPage({
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

  const approvals = await getApprovalRequests(status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Approvals</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Track client review requests and approval status.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {['all', ...APPROVAL_STATUSES].map((s) => {
          const isActive = (status ?? 'all') === s
          return (
            <Link
              key={s}
              href={
                s === 'all'
                  ? '/dashboard/approvals'
                  : `/dashboard/approvals?status=${s}`
              }
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {s === 'all'
                ? 'All'
                : APPROVAL_STATUS_LABELS[s as ApprovalStatus]}
            </Link>
          )
        })}
      </div>

      {/* Approval List */}
      {approvals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100">
            <ClipboardCheck className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {status && status !== 'all'
              ? 'No approvals with this status'
              : 'No approval requests yet'}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Send a creative for client review from a brief&apos;s detail page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {approvals.map((approval: any) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  )
}
